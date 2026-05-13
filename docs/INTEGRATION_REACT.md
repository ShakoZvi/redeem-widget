# React Integration

`@redeem/widget` ships a small React wrapper that mounts the imperative widget safely inside React's lifecycle.

---

## What you get

- `RedeemWidget` component at `@redeem/widget/react`
- Stable mount/unmount via `useEffect`
- Reactive `isOpen` prop (parent state controls visibility)
- Full access to the same config object documented in [Configuration Reference](./CONFIGURATION.md)

The wrapper is intentionally thin: it does not impose state shape on the host, does not manage data fetching, and does not duplicate config. It delegates to `createRedeemWidget(config)` internally.

---

## Installation

```bash
npm i git+https://github.com/ShakoZvi/redeem-widget.git
```

Peer dependency: **React 18+**.

You also need to load the package CSS once in your app entry:

```ts
import "@redeem/widget/styles.css";
```

(Bundlers like Vite/webpack/Next.js handle this import automatically.)

---

## Basic example

```tsx
import { useMemo, useState } from "react";
import { RedeemWidget } from "@redeem/widget/react";
import {
  defaultBankNormalizer,
  defaultGames,
  defaultProviders,
} from "@redeem/widget";
import "@redeem/widget/styles.css";

export function RedeemContainer() {
  const [isOpen, setIsOpen] = useState(false);

  const config = useMemo(
    () => ({
      endpoints: {
        bank: "/api/redeem/bank",
        redeem: "/api/redeem/submit",
      },
      getContext: () => ({
        user_id: window.currentUserId,
        token: window.csrfToken,
      }),
      normalize: defaultBankNormalizer,
      providers: defaultProviders,
      games: defaultGames,
      hooks: {
        onRedeemSuccess: (res, game) => console.log("ok", res, game),
        onRedeemError: (err) => console.error("redeem failed", err),
      },
    }),
    [],
  );

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open Redeem
      </button>
      <RedeemWidget config={config} isOpen={isOpen} />
    </>
  );
}
```

---

## Component API

```ts
interface RedeemWidgetProps {
  config: RedeemWidgetConfig; // same config you'd pass to createRedeemWidget
  isOpen?: boolean;           // parent-controlled visibility
  className?: string;         // optional class on the mount container div
}
```

Behavior:

- Creates and mounts the widget on first render (and again whenever `config` reference changes).
- Destroys the previous widget instance on unmount or before re-creating.
- Calls `widget.open()` / `widget.close()` whenever `isOpen` changes.

> Wrap `config` in `useMemo` (or define it outside the component) to avoid re-creating the widget on every render.

---

## Patterns

### Controlled visibility

```tsx
const [isOpen, setIsOpen] = useState(false);
// open from anywhere
setIsOpen(true);
// close
setIsOpen(false);
<RedeemWidget config={config} isOpen={isOpen} />
```

### Imperative access to widget instance

The wrapper does not expose a ref, but you can build a thin one by reusing `createRedeemWidget` directly inside a custom hook:

```tsx
import { useEffect, useRef } from "react";
import { createRedeemWidget } from "@redeem/widget";
import type { RedeemWidgetConfig } from "@redeem/widget";

export function useRedeemWidget(config: RedeemWidgetConfig) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<ReturnType<typeof createRedeemWidget> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    widgetRef.current = createRedeemWidget(config);
    widgetRef.current.mount(containerRef.current);
    return () => {
      widgetRef.current?.destroy();
      widgetRef.current = null;
    };
  }, [config]);

  return { containerRef, widget: widgetRef };
}
```

This gives you `widget.current.open()`, `widget.current.close()`, `widget.current.reload()`.

### Theming with React state

```tsx
const theme = useMemo(
  () => ({
    tokens: {
      modalBackground: darkMode ? "#0e1325" : "#ffffff",
      textColor: darkMode ? "#f5f7ff" : "#111827",
    },
  }),
  [darkMode],
);

const config = useMemo(
  () => ({ /* ... */, theme }),
  [theme],
);
```

Changing `theme` triggers a fresh widget instance because `config` reference changes.

---

## Server-Side Rendering (Next.js, Remix, Astro)

The widget interacts with `document` and `window` at runtime, so it must run on the client.

### Next.js (App Router)

```tsx
"use client";

import dynamic from "next/dynamic";

const RedeemContainer = dynamic(
  () => import("./RedeemContainer").then((mod) => mod.RedeemContainer),
  { ssr: false },
);

export default function Page() {
  return <RedeemContainer />;
}
```

### Next.js (Pages Router)

```tsx
import dynamic from "next/dynamic";

const RedeemWidget = dynamic(
  () => import("@redeem/widget/react").then((mod) => mod.RedeemWidget),
  { ssr: false },
);
```

### Remix / Astro / generic SSR

- Render the widget only after hydration (use `useEffect` to detect mount, or framework-specific "client-only" wrappers).
- Don't read `document.body.dataset` during SSR; move it into `getContext()` which only runs at request time on the client.

---

## TypeScript

All public types are exported from `@redeem/widget`:

```ts
import type {
  RedeemWidgetConfig,
  CanonicalBankPayload,
  RenderGame,
  ThemeTokens,
} from "@redeem/widget";
```

The React component is also fully typed.

---

## Caveats

- **One config = one widget instance.** Changing `config` reference recreates the widget; this is intentional (config can change rules/endpoints).
- **No transitions / animations** managed by the wrapper. Adjust via your own CSS or extend `theme.tokens`.
- **Multiple instances on one page** — render multiple `<RedeemWidget />` with different configs. Each has its own mount node.
- **React 19+ Server Components** — render the widget only inside a Client Component (`"use client"`).

---

## Testing in React projects

A minimal sanity test with React Testing Library:

```tsx
import { render, fireEvent } from "@testing-library/react";
import { RedeemWidget } from "@redeem/widget/react";

it("mounts and toggles visibility", () => {
  const config = { /* minimal config with mocked transport */ };
  const { rerender, container } = render(
    <RedeemWidget config={config} isOpen={false} />,
  );
  rerender(<RedeemWidget config={config} isOpen={true} />);
  // assert on container DOM
});
```

For deeper coverage, mock `transport` to avoid real network calls.
