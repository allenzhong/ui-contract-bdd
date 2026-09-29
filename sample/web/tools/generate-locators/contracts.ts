// Reads web/contracts/*.contract.json. The types come from the recorder itself
// (src/testing/uiContract.ts), so the recorder and the generator can't drift apart.
import fs from 'node:fs';
import path from 'node:path';
import type { Contract } from '../../src/testing/uiContract';

// A type-only import is erased at runtime, so the schema id is repeated here;
// the type annotation still fails the typecheck if the recorder's id changes.
export const SUPPORTED_SCHEMA: Contract['schema'] = 'ui-contract/v1';

/** A "stop with this message" error; main.ts prints it and exits with code 1. */
export class GeneratorError extends Error {}

/** Every *.contract.json in the folder, sorted by file name so the output is stable. */
export function loadContracts(dir: string): Contract[] {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.contract.json')).sort() : [];
  if (files.length === 0) throw new GeneratorError(`No contracts found in ${dir}. Run \`npm run contracts\` first.`);
  return files.map((file) => {
    const contract = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')) as Contract;
    if (contract.schema !== SUPPORTED_SCHEMA)
      throw new GeneratorError(`${file}: unsupported schema '${contract.schema}', expected ${SUPPORTED_SCHEMA}`);
    return contract;
  });
}
