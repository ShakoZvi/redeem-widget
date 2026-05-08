# Redeem Widget

Framework-agnostic redeem widget package for promotions and reward redemption flows.

The package is designed to be:

- reusable across multiple projects
- configurable for different backend payload shapes
- installable directly from git
- compatible with plain JavaScript hosts and React apps

## Table Of Contents

- [Why This Package](#why-this-package)
- [Installation](#installation)
- [Quick Start (Vanilla/PHP Host)](#quick-start-vanillaphp-host)
- [Quick Start (React Host)](#quick-start-react-host)
- [How It Works](#how-it-works)
- [Configuration Reference](#configuration-reference)
- [Adapters And Normalization](#adapters-and-normalization)
- [Custom Transport](#custom-transport)
- [Development](#development)
- [Testing](#testing)
- [Security Notes](#security-notes)
- [Roadmap](#roadmap)
- [License](#license)

## Why This Package

Most redeem implementations repeat the same logic:

- bank data fetch
- business rules (eligibility, affordability, min amount)
- provider/game rendering
- redemption request
- post-redeem refresh

This package centralizes that flow while keeping backend and UI integration configurable.

## Installation

Install directly from your git repository:

```bash
npm i git+https://github.com/ShakoZvi/redeem-widget.git
```

This repository is public and can be installed directly from GitHub.
The package import name is:

```bash
@redeem/widget
```

Note: `@redeem/widget` is the package name used in imports.  
If you have not published to npm, installation should use the GitHub URL shown above.

## Quick Start (Vanilla/PHP Host)

```ts
import {
  createRedeemWidget,
  createAjaxTransport,
  defaultBankNormalizer,
  defaultGames,
  defaultProviders,
} from "@redeem/widget";
import "@redeem/widget/styles.css";

const widget = createRedeemWidget({
  endpoints: {
    bank: "/WebServices/redeem_bank.php",
    redeem: "/WebServices/user_redeem.php",
  },
  getContext: () => ({
    user_id: document.body.dataset.userId,
    userHash: document.body.dataset.userHash,
  }),
  normalize: defaultBankNormalizer,
  providers: defaultProviders,
  games: defaultGames,
  transport: createAjaxTransport({
    ajax: window.ajax,
    requestType: "post",
    async: true,
    custom: true,
  }),
});

widget.mount("#redeem-widget-root");
document.querySelector("#open-redeem")?.addEventListener("click", () => widget.open());
```

Required host HTML:

```html
<button id="open-redeem" type="button">Redeem</button>
<div id="redeem-widget-root"></div>
```

## Quick Start (React Host)

```tsx
import { RedeemWidget } from "@redeem/widget/react";
import "@redeem/widget/styles.css";

export function RedeemModal({ isOpen, config }) {
  return <RedeemWidget config={config} isOpen={isOpen} />;
}
```

## How It Works

1. Host calls `createRedeemWidget(config)`.
2. Widget mounts into container and self-renders UI.
3. Widget calls `endpoints.bank` with payload from `getContext()`.
4. `normalize()` maps response to canonical model.
5. Rules engine computes active/disabled games and totals.
6. User selects game and clicks redeem.
7. Widget calls `endpoints.redeem` and reloads bank state.

## Configuration Reference

`createRedeemWidget(config)` accepts:

- `endpoints.bank`: bank endpoint URL
- `endpoints.redeem`: redeem endpoint URL
- `getContext()`: returns payload merged into requests (user/session/hash/etc.)
- `normalize(raw)`: maps backend payload into canonical format
- `providers`: provider catalog
- `games`: game catalog
- `rules`: business rules (`minAmountToEnable`, eligibility/affordability, etc.)
- `filters`: provider/game visibility filters
- `bank`: amount calculation settings (`unitValue`, precision, total mode)
- `ui`: labels and UI behavior
- `theme`: class prefix and future style extension
- `transport`: override default `fetch` transport
- `hooks`: lifecycle hooks (open, close, select, data loaded, redeem success/error)

Detailed docs:

- `docs/CONFIGURATION.md`
- `docs/ARCHITECTURE.md`
- `docs/INTEGRATION_PHP.md`
- `docs/INTEGRATION_REACT.md`

## Adapters And Normalization

The package separates backend shape from widget logic:

- `defaultBankNormalizer`: maps legacy `data + total_freespins` style responses
- `canonicalBankNormalizer`: accepts already-canonical payloads

Canonical payload shape:

```ts
{
  totalFreespins: number;
  games: Record<number, {
    amount: number;
    em: number;
    eligibleFrsp: number;
    massPrizeValue: number;
  }>
}
```

## Custom Transport

By default the widget uses `fetch`, but examples below are ordered by practical usage.

### 1) ajax() + handler.php flow (recommended for legacy PHP stacks)

```ts
import { createAjaxTransport } from "@redeem/widget";

transport: createAjaxTransport({
  ajax: window.ajax,
  requestType: "post",
  async: true,
  custom: true,
});
```

### 2) Fully custom transport function

```ts
transport: async ({ url, method, body }) => {
  const response = await legacyAjaxClient(url, method, body);
  return response;
};
```

## Development

```bash
npm install
npm run build
```

Build output:

- `dist/redeem-widget.esm.js`
- `dist/redeem-widget.umd.js`
- `dist/redeem-widget.css`
- Type declarations (`dist/**/*.d.ts`)

## Testing

```bash
npm test
```

Current test coverage includes:

- normalization behavior
- core rules engine behavior

## Security Notes

- Do not commit secrets, keys, tokens, or personal user data in examples/tests.
- Keep `getContext()` values runtime-driven from host app, not hardcoded.
- Validate server-side authorization for redeem actions (widget-side checks are UX only).

Additional notes in `docs/SECURITY.md`.

## Roadmap

- richer theming API
- optional external trigger binding utility
- expanded fixtures for multiple backend contracts
- broader integration examples

## License

MIT
