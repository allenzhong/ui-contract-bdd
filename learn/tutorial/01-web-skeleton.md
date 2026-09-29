# 01 · Web project skeleton

**Goal:** an empty React + TypeScript app that webpack builds and serves on `http://localhost:8080`.

**You'll create:** `web/package.json`, `web/tsconfig.json`, `web/webpack.config.js`, `web/src/index.html`, `web/src/global.d.ts`, `web/src/main.tsx`, `web/src/App.tsx`, and `.gitignore`.

## 1.1 Where you run commands

Open a terminal at the repository root (the folder that contains `learn/` and `sample/`) and go to the workspace **once**:

```bash
cd learn/workspace
```

**Stay in `learn/workspace` for the whole tutorial.** All file paths are relative to it, and every command is written to run from it. A command that must run inside `web/` or `tests/` is wrapped in a subshell, like `(cd web && npm install)`. The parentheses run the `cd` in a copy of the shell, so you're back in `learn/workspace` afterwards. If you open a new terminal (chapter 10 needs two), `cd` into `learn/workspace` there too.

Create the first folder:

```bash
mkdir -p web/src
```

## 1.2 `package.json`

Write this file by hand instead of running `npm init`. That way the versions are **exact** (no `^`), so your results match the tutorial.

**File:** `web/package.json`
```json
{
  "name": "practice-web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "start": "webpack serve --mode development",
    "build": "webpack --mode production",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "19.3.0",
    "react-dom": "19.3.0"
  },
  "devDependencies": {
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "css-loader": "7.1.5",
    "html-webpack-plugin": "5.6.8",
    "style-loader": "4.0.0",
    "ts-loader": "9.6.2",
    "typescript": "5.9.3",
    "webpack": "5.111.1",
    "webpack-cli": "6.0.1",
    "webpack-dev-server": "5.2.6"
  }
}
```

What each part does:

| Entry | Purpose |
|---|---|
| `"type": "module"` | `.js` files use `import`/`export` (ES modules). That's why `webpack.config.js` below uses `import`. |
| `"private": true` | Stops you from publishing this to npm by accident. |
| `start` | Runs the development server with live reload on port 8080. The E2E tests run against it. |
| `build` | Writes a production bundle to `dist/`. Not needed for the tests, but useful to prove the app compiles. |
| `typecheck` | Runs the TypeScript compiler without writing files. It catches type errors that webpack might not stop on. |
| `react`, `react-dom` | The UI library, and its renderer for the browser. |
| `@types/*` | TypeScript type definitions for React. |
| `ts-loader` | Lets webpack compile `.ts`/`.tsx` with TypeScript. |
| `style-loader` + `css-loader` | Lets you write `import './styles.css'`. css-loader reads the file and style-loader injects a `<style>` tag. |
| `html-webpack-plugin` | Generates `index.html` with the bundle's `<script>` tag inserted. |
| `webpack-dev-server` | The dev server behind `npm start`. |

Install:

```bash
(cd web && npm install)
```

npm may print audit warnings. They're fine for a local learning project.

## 1.3 `tsconfig.json`

**File:** `web/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"]
}
```

| Option | Why |
|---|---|
| `jsx: "react-jsx"` | Uses the modern JSX transform, so you don't need `import React` in every file. |
| `moduleResolution: "Bundler"` | Resolves imports the way webpack and Vite do. |
| `strict` | Turns on all strict type checks. |
| `isolatedModules` | Every file must compile on its own. Vite (used by Vitest later) requires this. |
| `paths: { "@/*": ["src/*"] }` | Lets you write `import … from '@/api/seed'` instead of `'../../api/seed'`. **webpack and Vitest must be told about the same alias.** You'll see it again in both configs. |

## 1.4 `webpack.config.js`

**File:** `web/webpack.config.js`
```js
// The app is built and served by webpack. Vitest (Vite) is used only to run the
// browser-mode component tests that emit UI contracts; it never builds the app.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  entry: './src/main.tsx',
  output: { path: path.resolve(__dirname, 'dist'), filename: 'bundle.[contenthash].js', clean: true },
  resolve: { extensions: ['.tsx', '.ts', '.js'], alias: { '@': path.resolve(__dirname, 'src') } },
  module: {
    rules: [
      { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    ],
  },
  plugins: [new HtmlWebpackPlugin({ template: './src/index.html' })],
  devServer: { port: 8080, historyApiFallback: true },
  devtool: 'source-map',
};
```

- `__dirname` doesn't exist in ES modules, so it's rebuilt from `import.meta.url`.
- `entry` is where webpack starts following `import`s.
- `resolve.alias['@']` matches the `paths` entry in `tsconfig.json`.
- `devServer.port: 8080` is the URL the E2E tests will open.
- `historyApiFallback` serves `index.html` for any path. This only matters for apps with client-side routing.

## 1.5 HTML page and type declaration

**File:** `web/src/index.html`
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Customer Portal</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

React will render into `<div id="root">`.

**File:** `web/src/global.d.ts`
```ts
declare module '*.css';
```

Without this line, TypeScript would complain that `import './styles.css'` has no type.

## 1.6 A "hello" app

These two files are temporary. Chapter 02 replaces both.

**File:** `web/src/App.tsx`
```tsx
export function App() {
  return <h1>Hello, practice app</h1>;
}
```

**File:** `web/src/main.tsx`
```tsx
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<App />);
```

The `!` tells TypeScript "I know `#root` exists", because `getElementById` can return `null`.

## 1.7 `.gitignore`

At the **workspace root** (`learn/workspace/.gitignore`), not inside `web/`:

**File:** `.gitignore`
```gitignore
node_modules/
dist/
bin/
obj/
TestResults/
web/src/**/__screenshots__/
.DS_Store
.vitest-attachments/
*.feature.cs
```

Note that `web/contracts/` is **not** ignored. Contracts are committed on purpose, because they're the hand-off between developer and tester. `*.feature.cs` is ignored because Reqnroll regenerates it on every build (chapter 06).

## ✅ Checkpoint

```bash
(cd web && npm run typecheck)   # only npm's "> tsc --noEmit" header, no errors
(cd web && npm run build)       # ends with "webpack 5.111.1 compiled successfully"
(cd web && npm start)           # then open http://localhost:8080
```

The browser shows **Hello, practice app**. Press `Ctrl+C` to stop the server.

Next: [02 · The web app](02-web-app.md)
