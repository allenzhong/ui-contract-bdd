#!/usr/bin/env python3
"""Local inventory, focused runner, diagnosis validator, and conservative patch guard."""
import argparse
import datetime
import fnmatch
import json
import re
import subprocess
import sys
from pathlib import Path

LOCATOR = re.compile(r'By\.(?:XPath|CssSelector|Id|Name|ClassName|LinkText|PartialLinkText)\s*\(\s*"([^"\n]+)"')
TESTID = re.compile(r'(?:data-testid|data-test-id|data-dataid)\s*=\s*["\']([^"\']+)["\']')
SCENARIO = re.compile(r'^\s*(?:Scenario|Scenario Outline):\s*(.+)', re.M)
BYPASS = re.compile(r'\b(?:Assert\.Ignore|Assert\.Inconclusive|Skip\s*=|Ignore\s*=|Thread\.Sleep)\b|\[Ignore\]|\[Explicit\]', re.I)


def config(path):
    p = Path(path).resolve()
    c = json.loads(p.read_text())
    c['_root'] = p.parent
    for k in ('test_repo', 'react_repo', 'output_dir'):
        c[k] = (p.parent / c[k]).resolve()
    return c


def files(root, patterns):
    if not root.exists():
        raise FileNotFoundError(f'Missing configured path: {root}')
    for p in root.rglob('*'):
        if p.is_file() and not any(x in p.parts for x in ('.git', 'node_modules', 'bin', 'obj', 'dist', 'build')) and p.suffix.lower() in patterns:
            yield p


def inventory(c):
    data = {'generated_at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'scenarios': [], 'locators': [], 'test_ids': []}
    for p in files(c['test_repo'], {'.feature', '.cs'}):
        s = p.read_text(errors='replace')
        if p.suffix == '.feature':
            data['scenarios'].extend({'file': str(p), 'name': m.group(1)} for m in SCENARIO.finditer(s))
        else:
            data['locators'].extend({'file': str(p), 'value': m.group(1), 'line': s.count('\n', 0, m.start()) + 1} for m in LOCATOR.finditer(s))
    for p in files(c['react_repo'], {'.tsx', '.jsx', '.ts', '.js', '.html'}):
        s = p.read_text(errors='replace')
        data['test_ids'].extend({'file': str(p), 'value': m.group(1), 'line': s.count('\n', 0, m.start()) + 1} for m in TESTID.finditer(s))
    output = c['output_dir'] / 'inventory.json'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(data, indent=2) + '\n')
    print(f'{output}: {len(data["scenarios"])} scenarios, {len(data["locators"])} locators, {len(data["test_ids"])} test ids')


def baseline(c, filter_text):
    if not filter_text:
        raise ValueError('A focused --filter is required')
    cmd = [str(part).replace('{test_repo}', str(c['test_repo'])).replace('{filter}', filter_text) for part in c['run_command']]
    out = c['output_dir'] / datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    out.mkdir(parents=True, exist_ok=True)
    proc = subprocess.run(cmd, cwd=c['test_repo'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, errors='replace')
    (out / 'runner.log').write_text(proc.stdout)
    (out / 'metadata.json').write_text(json.dumps({'command': cmd, 'exit_code': proc.returncode, 'filter': filter_text}, indent=2) + '\n')
    print(f'exit={proc.returncode}; evidence={out}')
    return proc.returncode


def diagnose(c, path):
    d = json.loads(Path(path).read_text())
    required = ('scenario', 'goal', 'classification', 'confidence', 'evidence', 'trace', 'status')
    missing = [k for k in required if k not in d]
    if missing:
        raise ValueError('Missing: ' + ', '.join(missing))
    if d['classification'] not in ('TEST_IMPLEMENTATION', 'APPLICATION', 'BACKEND_DATA', 'ENVIRONMENT', 'UNKNOWN'):
        raise ValueError('Invalid classification')
    if d['status'] not in ('PROPOSED', 'PATCHED', 'VERIFIED', 'BLOCKED'):
        raise ValueError('Invalid status')
    if not 0 <= d['confidence'] <= 1 or not d['evidence'] or not d['goal'] or not d['trace']:
        raise ValueError('Invalid confidence, evidence, goal or trace')
    if d['status'] == 'VERIFIED' and not all(x in d.get('verification', {}) for x in ('focused', 'feature', 'regression')):
        raise ValueError('VERIFIED requires focused, feature, regression results')
    c['output_dir'].mkdir(parents=True, exist_ok=True)
    target = c['output_dir'] / 'diagnosis.json'
    target.write_text(json.dumps(d, indent=2) + '\n')
    print(f'Validated: {target}')


def git(repo, *args):
    p = subprocess.run(['git', '-C', str(repo), *args], capture_output=True, text=True)
    if p.returncode:
        raise RuntimeError(p.stderr.strip())
    return p.stdout


def guard(c, base):
    problems = []
    for repo in (c['test_repo'], c['react_repo']):
        # Compares committed base, index and working tree, including untracked files.
        paths = set(git(repo, 'diff', '--name-only', base).splitlines()) | set(git(repo, 'ls-files', '--others', '--exclude-standard').splitlines())
        for rel in sorted(paths):
            p = repo / rel
            if repo == c['test_repo'] and any(fnmatch.fnmatch(rel, glob) or p.suffix == '.feature' for glob in c['protected_globs']):
                problems.append(f'Protected feature changed: {p}')
            if p.is_file() and p.suffix in ('.cs', '.tsx', '.jsx', '.ts', '.js') and BYPASS.search(p.read_text(errors='replace')):
                problems.append(f'Review possible skip/sleep bypass: {p}')
        if repo == c['test_repo']:
            diff = git(repo, 'diff', '--unified=0', base, '--', '*.cs')
            if re.search(r'^-.*\b(?:Assert\.|Should\(|Should\.|\.Should\(|FluentAssertions|throw new)', diff, re.M):
                problems.append('Removed assertion/failure code in test diff; manual semantic review required')
    if problems:
        print('\n'.join(problems))
        return 2
    print('Static guard passed. Manual review of assertion semantics is still required.')
    return 0


def main():
    p = argparse.ArgumentParser()
    p.add_argument('command', choices=('inventory', 'baseline', 'diagnose', 'guard'))
    p.add_argument('--config', default='project.json')
    p.add_argument('--filter')
    p.add_argument('--input')
    p.add_argument('--base', default='HEAD')
    a = p.parse_args()
    try:
        c = config(a.config)
        if a.command == 'inventory': inventory(c)
        elif a.command == 'baseline': return baseline(c, a.filter)
        elif a.command == 'diagnose': diagnose(c, a.input)
        else: return guard(c, a.base)
        return 0
    except (OSError, ValueError, RuntimeError, KeyError) as e:
        print(f'Error: {e}', file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main())
