# React & Node.js Compatibility Report

A detailed analysis of how `@redeem/widget` behaves across runtimes, frameworks, and bundlers, plus the constraints you should be aware of when integrating it.

> Verdict (TL;DR): the package is **production-ready for browser hosts (vanilla, PHP, Vite/webpack)** and **production-ready for React when used as a client component**. SSR frameworks (Next.js App Router, Remix) require a `client-only` boundary because the widget renders DOM imperatively. Pure Node.js (server-side) usage is **not supported** — this is a browser UI widget by design.

---

## 1. Runtime matrix

| Environment                          | Status              | Notes                                                                                     |
| ------------------------------------ | ------------------- | ----------------------------------------------------------------------------------------- |
| Vanilla browser via UMD (`<script>`) | ✅ Fully supported  | Loads as `window.RedeemWidget`. Recommended for PHP/legacy stacks.                        |
| Vanilla browser via ESM (bundler)    | ✅ Fully supported  | `import { createRedeemWidget } from "@redeem/widget"`.                                    |
| React 18 / 19 (client component)     | ✅ Fully supported  | `import { RedeemWidget } from "@redeem/widget/react"`.                                    |
| Next.js App Router (client)          | ✅ Fully supported  | Use `"use client"` or `dynamic(... { ssr: false })`.                                       |
| Next.js Pages Router (client)        | ✅ Fully supported  | Same as above; use `dynamic(... { ssr: false })`.                                          |
| Remix (client)                       | ✅ Fully supported  | Render inside a client-only boundary.                                                      |
| Astro / SvelteKit (client island)    | ✅ Fully supported  | Use `client:only` / equivalent.                                                            |
| Pure Node.js (server entry)          | ❌ Not supported    | Uses `document`/`window`. No browser globals available.                                    |
| Cloudflare Workers / Deno (no DOM)   | ❌ Not supported    | Same reason — DOM is required.                                                             |
| React Native                         | ❌ Not supported    | DOM-only renderer; no React Native bindings.                                              |

---

## 2. Node.js considerations

### 2.1 What works in Node

These pieces are environment-agnostic and **can be imported into Node without error**:

- `defaultBankNormalizer`, `canonicalBankNormalizer` — pure data mappers
- `defaultProviders`, `defaultGames` — static catalog
- All TypeScript type exports (`RedeemWidgetConfig`, `CanonicalBankPayload`, etc.)
- `createAjaxTransport` — factory that returns a transport (calling its result in Node would need a polyfilled `ajax()`)

You can use these in Node for:

- Unit testing your custom adapters/normalizers
- Server-side validation of the canonical payload shape
- Generating fixtures or seed data
- TypeScript type sharing between server and client

### 2.2 What does NOT work in Node

- `createRedeemWidget(...).mount(...)` — calls `document.createElement`
- `createRedeemWidget(...).open()` — touches `document.activeElement`
- `RedeemConfigApp.init` — same DOM dependencies
- React wrapper `<RedeemWidget />` — runs the imperative widget inside `useEffect`

Calling any of these in pure Node throws `ReferenceError: document is not defined`.

### 2.3 Node version

The package targets **ES2020** output and uses `node:fs/promises` only in the bin script and build script. Required:

- **Node ≥ 18** (uses native `fetch`, `node:` protocol imports, top-level await in build script)
- **npm ≥ 8** (handles `prepare` script and git installs)

Verified scripts:

- `prepare` — runs `npm run build` automatically when consumed from git
- `bin/redeem-widget-install.mjs` — uses `node:fs/promises`, `node:path`, `node:url`
- `scripts/build.mjs` — uses top-level await and `esbuild`

### 2.4 Native-fetch transport

`defaultFetchTransport` calls global `fetch`. Browsers have it; **Node 18+** has it globally too. Older Node will need a `node-fetch` polyfill **if** you ever construct the widget instance in Node (which you should not — see 2.2).

---

## 3. React considerations

### 3.1 What the package ships

`exports["./react"]` resolves to a small wrapper at `dist/react/RedeemWidget.js`:

- bundled with the widget engine
- externalizes `react`, `react-dom`, and `react/jsx-runtime`
- uses automatic JSX runtime
- ~25 KB minified, no third-party deps

Types live at `dist/react/RedeemWidget.d.ts`.

### 3.2 Peer dependencies

```json
"peerDependencies": { "react": ">=18.0.0" }
```

React 18 and 19 are both validated. React 17 and older will not work (no `jsx-runtime` automatic mode).

### 3.3 SSR / RSC behavior

The wrapper component renders an empty `<div ref={containerRef} />` on first render and mounts the imperative widget inside `useEffect`. This means:

- **No DOM work happens during SSR** — server rendering yields an empty `div`.
- After hydration, the widget mounts itself client-side.
- `useEffect` does not run during RSC streaming, so importing the widget from a React Server Component still triggers an error (the wrapper uses `useRef` and `useEffect`, which are client-only hooks).

Conclusion: the wrapper must always render inside a Client Component. Use the patterns from [INTEGRATION_REACT.md](./INTEGRATION_REACT.md#server-side-rendering-nextjs-remix-astro).

### 3.4 Re-render behavior

`config` is captured in a `useEffect` dependency list. Changing the `config` reference triggers:

1. Destroy of the previous widget instance.
2. Re-creation with the new config.

This is **correct** but expensive — wrap `config` in `useMemo` (or define it outside the component) to avoid unnecessary remounts.

### 3.5 Strict mode

React 18+ Strict Mode runs effects twice in development. The wrapper handles this correctly: the cleanup function calls `destroy()` before each re-mount. You may see two mount/destroy cycles in dev, which is expected.

### 3.6 CSS in React projects

You must import the stylesheet once at your app entry:

```ts
import "@redeem/widget/styles.css";
```

`exports["./styles.css"]` resolves to `dist/redeem-widget.css`. Modern bundlers (Vite, webpack, esbuild, Next.js, Remix, Turbopack) handle this correctly.

---

## 4. Bundler-specific notes

| Bundler              | Status | Notes                                                                              |
| -------------------- | ------ | ---------------------------------------------------------------------------------- |
| Vite                 | ✅     | Pre-bundles `@redeem/widget`; CSS import works out of the box.                     |
| webpack 5            | ✅     | Honors `exports` map; CSS extracted via `css-loader` / `MiniCssExtractPlugin`.     |
| esbuild              | ✅     | Honors `exports` map; CSS imports require `--loader:.css=...` config.              |
| Rollup               | ✅     | Use `@rollup/plugin-node-resolve` with `exportConditions: ["import"]`.             |
| Parcel               | ✅     | Default config handles `exports` and CSS imports.                                  |
| Next.js (Turbopack)  | ✅     | Use the App Router `"use client"` directive or `dynamic(..., { ssr: false })`.     |
| Snowpack             | ✅     | ESM entry works; CSS via manual `<link>` tag.                                       |

---

## 5. Known limitations

1. **Browser-only execution.** The widget is a DOM UI; pure server-side execution is out of scope.
2. **React Native unsupported.** No `Pressable` / `View` / native renderer.
3. **No animation library.** Open/close transitions are CSS-only.
4. **Single facade instance.** `RedeemConfigApp.init` keeps one global widget; for multi-instance use, switch to `createRedeemWidget` directly.
5. **No built-in i18n loader.** Strings are passed via `ui.labels`; integrate with i18next/Lingui at the host level.

---

## 6. Recommended runtime versions

| Tool        | Minimum | Notes                                          |
| ----------- | ------- | ---------------------------------------------- |
| Node.js     | 18 LTS  | Required for build, install, and fetch global. |
| npm         | 8       | Earlier may misbehave with `prepare`.          |
| React       | 18.0    | 19 is supported.                               |
| TypeScript  | 5.0     | Required to consume `.d.ts` files (ESM imports). |
| Browsers    | Last 2 Chrome / Edge / Firefox / Safari | ES2020 target. |

---

## 7. Sanity-check commands

After installing in a React project:

```bash
# verify the React entry exists and exports RedeemWidget
node -e "console.log(Object.keys(require.resolve('@redeem/widget/react')))"

# verify CSS subpath resolves
node -e "console.log(require.resolve('@redeem/widget/styles.css'))"

# verify type exports
npx tsc --noEmit --strict
```

Quick smoke test in the host project:

```tsx
import { RedeemWidget } from "@redeem/widget/react";
import "@redeem/widget/styles.css";

console.log(RedeemWidget); // function (does not throw)
```

If any of these fail, re-run `npm install` to trigger the `prepare` script and ensure `dist/` is rebuilt.

---

## 8. Future improvements (non-blocking)

- Ship a dedicated `@redeem/widget/server` subpath for SSR-safe data utilities (normalizers, type guards) — already importable today, just not formally documented as a server entry.
- Provide a React-Native-style headless API (state + callbacks, no DOM) for non-DOM hosts.
- Provide ergonomic React hooks (`useRedeem()`) on top of the imperative engine.
- Add Playwright-based end-to-end tests covering React + UMD + ajax transport scenarios.
