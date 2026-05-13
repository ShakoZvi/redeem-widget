# Configuration Reference

This is the complete reference for `createRedeemWidget(config)`. Every section lists field name, type, default value, behavior, and an example.

> Tip: only `endpoints`, `getContext`, `normalize`, `providers`, and `games` are required. Everything else has sensible defaults.

---

## Table Of Contents

- [Top-Level Shape](#top-level-shape)
- [endpoints](#endpoints)
- [getContext](#getcontext)
- [normalize](#normalize)
- [providers](#providers)
- [games](#games)
- [rules](#rules)
- [filters](#filters)
- [bank](#bank)
- [ui](#ui)
- [theme](#theme)
- [transport](#transport)
- [hooks](#hooks)
- [RedeemConfigApp Facade](#redeemconfigapp-facade)
- [Widget Instance API](#widget-instance-api)

---

## Top-Level Shape

```ts
createRedeemWidget({
  endpoints:   { bank, redeem },
  getContext:  () => ({ ... }),
  normalize:   (raw) => canonical,
  providers:   ProviderDefinition[],
  games:       GameDefinition[],

  rules?:      Partial<RulesConfig>,
  filters?:    Partial<FiltersConfig>,
  bank?:       Partial<BankConfig>,
  ui?:         Partial<UIConfig>,
  theme?:      Partial<ThemeConfig>,
  transport?:  Transport,
  hooks?:      { onOpen, onClose, onSelect, onDataLoaded, onRedeemSuccess, onRedeemError },
});
```

---

## endpoints

```ts
endpoints: {
  bank:   string;   // REQUIRED - URL or file name for the bank data endpoint
  redeem: string;   // REQUIRED - URL or file name for the redeem action endpoint
}
```

Default: none, must be supplied.

- For `fetch`-based transport these are full URLs (`/api/redeem/bank`).
- For `createAjaxTransport` (legacy PHP + `handler.php`) these must be **bare file names** (`redeem_bank.php`), because `handler.php` rejects path-like values with `Web service wrapper error: the ws file path is not valid!`.

---

## getContext

```ts
getContext: () => Record<string, unknown> | Promise<Record<string, unknown>>
```

Default: none, must be supplied.

Returns a plain object merged into every outgoing request body. Use it for user/session metadata that the backend requires.

```js
getContext: () => ({
  user_id:  document.body.dataset.userId,
  userHash: document.body.dataset.userHash,
  lang:     document.documentElement.lang,
})
```

Async is allowed:

```js
getContext: async () => {
  const session = await fetchSession();
  return { user_id: session.userId, userHash: session.hash };
}
```

---

## normalize

```ts
normalize: (raw: unknown) => CanonicalBankPayload
```

Default: none, must be supplied (use one of the built-ins).

Transforms whatever your backend returns into the canonical shape the widget understands:

```ts
interface CanonicalBankPayload {
  totalFreespins: number;
  games: Record<number, {        // keyed by GameDefinition.typeId
    amount: number;              // available spins/units
    em: number;                  // eligible mass prize value
    eligibleFrsp: number;        // 1 means user has the freespin currency to use it
    massPrizeValue: number;
    descrpt?: string;
    vendor?: string;
  }>;
}
```

Built-in adapters:

- `defaultBankNormalizer` - maps legacy `{ data: { games: [...] }, total_freespins }` shapes.
- `canonicalBankNormalizer` - identity function for backends already returning canonical data.

Custom example:

```js
normalize: (raw) => ({
  totalFreespins: raw.totals.freespins,
  games: Object.fromEntries(
    raw.items.map((g) => [g.type_id, {
      amount: g.spins,
      em: g.eligibility,
      eligibleFrsp: g.has_currency ? 1 : 0,
      massPrizeValue: g.prize,
    }]),
  ),
})
```

---

## providers

```ts
providers: ProviderDefinition[]
```

Default: `defaultProviders` (when omitted or empty).

```ts
interface ProviderDefinition {
  id: string;                                  // unique id
  name: string;                                // label shown in provider tab
  type: "freespin" | "tableGames" | "cashPrize";
  active?: boolean;                            // default true
  sortOrder?: number;                          // default 0
  icon?: string;                               // CSS class added to the provider-icon span; used for theme.providerIconBackgroundsByClass lookup
}
```

A virtual "popular" provider is auto-injected at the front if you do not include one. To opt out, include a provider with `id: "popular"` yourself.

The provider tab renders as `[icon][name]`. The icon span is hidden by default — it becomes visible only when a `background` is resolved for it via `theme.providerIconBackgrounds`, `theme.providerIconBackgroundsByClass`, or `theme.providerIconBackgroundList`.

---

## games

```ts
games: GameDefinition[]
```

Default: `defaultGames` (when omitted or empty).

```ts
interface GameDefinition {
  id: string;          // unique id (used for selection state)
  typeId: number;      // links to CanonicalBankPayload.games[typeId]
  providerId: string;  // must match a ProviderDefinition.id
  imgClass: string;    // CSS class applied to the icon span (use your sprite/img classes)
  value: number;       // nominal value shown as "{value}₾"
  label?: string;
}
```

The widget renders only games that:

1. have a matching `typeId` in the bank response (when `filters.hideGamesWithoutApi` is true), and
2. pass `filters.hideZeroAmountGames` if enabled.

---

## rules

```ts
rules?: Partial<RulesConfig>
```

Default:

```ts
{
  selectableMassPrizeValue: null,
  minAmountToEnable: 1,
  requireAffordableBalance: true,
  requireEligibleFrsp: false,
}
```

| Field                          | Default | Behavior                                                                |
| ------------------------------ | ------- | ----------------------------------------------------------------------- |
| `selectableMassPrizeValue`     | `null`  | If set, only games with this exact `massPrizeValue` become selectable.  |
| `minAmountToEnable`            | `1`     | A game is disabled when `amount < minAmountToEnable`.                   |
| `requireAffordableBalance`     | `true`  | Disables games where `em` indicates the user cannot afford the prize.   |
| `requireEligibleFrsp`          | `false` | If true, also requires `eligibleFrsp === 1` to enable a game.           |

Example: allow only 0.20₾ tier prizes, ignore balance check:

```js
rules: { selectableMassPrizeValue: 0.2, requireAffordableBalance: false }
```

---

## filters

```ts
filters?: Partial<FiltersConfig>
```

Default:

```ts
{
  hideGamesWithoutApi: true,
  hideZeroAmountGames: false,
  hideProvidersWithoutGames: true,
}
```

| Field                         | Default | Behavior                                                                        |
| ----------------------------- | ------- | ------------------------------------------------------------------------------- |
| `hideGamesWithoutApi`         | `true`  | Hide catalog entries that have no matching `typeId` in the bank response.        |
| `hideZeroAmountGames`         | `false` | Hide games with `amount === 0`.                                                  |
| `hideProvidersWithoutGames`   | `true`  | Hide provider tabs that end up empty after filtering.                            |

---

## bank

```ts
bank?: Partial<BankConfig>
```

Default:

```ts
{
  totalFreespinsMode: "response",
  unitValue: 0.15,
  precision: 2,
}
```

| Field                      | Default       | Behavior                                                                              |
| -------------------------- | ------------- | ------------------------------------------------------------------------------------- |
| `totalFreespinsMode`       | `"response"`  | How to compute the headline "total freespins" number.                                 |
| `unitValue`                | `0.15`        | Currency value of one freespin unit, used by `sumByMassPrizeValue` mode.              |
| `precision`                | `2`           | Decimal places for any computed currency total.                                       |

`totalFreespinsMode` options:

- `"response"` - use `payload.totalFreespins` as-is from the normalized response.
- `"sumAll"` - sum `amount` across all games.
- `"sumByMassPrizeValue"` - sum `amount * massPrizeValue` (then `precision` is applied).

---

## ui

```ts
ui?: Partial<UIConfig>
```

Default:

```ts
{
  popularSlice: 7,
  preserveActiveTab: true,
  clearSelectedGameOnProviderChange: true,
  autoSelectFirstActiveGame: false,
  closeOnOverlayClick: true,
  closeOnEscape: true,
  trapFocus: true,
  labels: {
    title: "Redeem",
    popular: "Popular Games",
    redeem: "Redeem",
    close: "Close",
    emptyValue: "--",
  },
}
```

| Field                | Default               | Behavior                                                  |
| -------------------- | --------------------- | --------------------------------------------------------- |
| `popularSlice`       | `7`                   | Max number of items shown in the auto "popular" tab.       |
| `preserveActiveTab`  | `true`                | Keeps the active provider tab after reload if still available. |
| `clearSelectedGameOnProviderChange` | `true` | Clears selected game when user switches provider tabs. |
| `autoSelectFirstActiveGame` | `false`         | Auto-selects first active game in current tab after data load. |
| `closeOnOverlayClick` | `true`               | Clicking overlay closes modal. |
| `closeOnEscape`      | `true`                | Pressing `Esc` closes modal. |
| `trapFocus`          | `true`                | Keeps keyboard focus trapped inside modal while open. |
| `labels.title`       | `"Redeem"`            | Modal heading.                                            |
| `labels.popular`     | `"Popular Games"`     | Name of the auto-injected popular provider tab.            |
| `labels.redeem`      | `"Redeem"`            | Primary action button text.                                |
| `labels.close`       | `"Close"`             | Close button text.                                        |
| `labels.emptyValue` | `"--"`                | Footer text shown alone while no game is selected. After selection the footer becomes `"{amount} x {value}"`. |

Localization example:

```js
ui: {
  labels: {
    title: "გადახდა",
    popular: "პოპულარული თამაშები",
    redeem: "გაანაღდე",
    close: "დახურვა",
    emptyValue: "--",
  },
}
```

---

## theme

```ts
theme?: Partial<ThemeConfig>
```

Default:

```ts
{
  classPrefix: "rw",
  tokens: {
    overlayBackground: "rgba(10, 13, 28, 0.6)",
    modalBackground: "#0e1325",
    modalBorderColor: "#253159",
    textColor: "#ffffff",
    fontFamily: "\"AdjaraSemiBold\", \"Helvetica Neue\", Arial, sans-serif",
    providerBackground: "linear-gradient(159.58deg, #343748 12.59%, #161721 75.9%)",
    providerActiveBackground: "linear-gradient(180deg, #54578d 0%, #4f4181 49.16%, #2f1b4f 100%)",
    gameBackground: "#383a49",
    gameSelectedBackground: "linear-gradient(180deg, #039855 -105.26%, #01321c 100%)",
    footerBackground: "linear-gradient(269.27deg, #161722 23.78%, #383a49 99.5%)",
    selectionBackground: "linear-gradient(174.6deg, #1b1c2c 14.9%, #036036 120.33%)",
    actionPrimaryBackground: "#039855",
    actionPrimaryHoverBackground: "#047a47",
    borderRadiusSm: "6px",
    borderRadiusMd: "8px",
    borderRadiusLg: "12px",
  },
  providerBackgrounds: {},
  providerActiveBackgrounds: {},
  providerIconBackgrounds: {},
  providerIconBackgroundsByClass: {},
  gameBackgrounds: {},
  gameBackgroundsByClass: {},
  providerBackgroundList: [],
  providerIconBackgroundList: [],
  gameBackgroundList: [],
}
```

`theme.classPrefix` changes the prefix of every emitted class (`rw-modal` -> `redeem-modal` etc). State modifiers (`is-open`, `is-active`, `is-selected`, `is-disabled`) are not prefixed.

You can also configure runtime backgrounds without writing custom selectors:

- `tokens` - high-level palette/shape variables applied as CSS custom properties

- `providerBackgrounds[provider.id]` - default provider tab background (CSS background value)
- `providerActiveBackgrounds[provider.id]` - active-state provider tab background
- `providerIconBackgrounds[provider.id]` - icon next to the provider name (per provider id)
- `providerIconBackgroundsByClass[provider.icon]` - icon background looked up by `ProviderDefinition.icon` class
- `gameBackgrounds[game.id]` - game image background by `GameDefinition.id` (highest priority)
- `gameBackgroundsByClass[game.imgClass]` - fallback game image background by `imgClass`
- `providerBackgroundList[]` - array alternative for provider backgrounds
- `providerIconBackgroundList[]` - array alternative for provider icons (`providerId` or `iconClass`)
- `gameBackgroundList[]` - array alternative for game backgrounds

Example:

```ts
theme: {
  classPrefix: "rw",
  providerBackgrounds: {
    pragmatic: "url('/static/assets/redeem/providers/pragmatic.webp') center / cover no-repeat",
  },
  providerActiveBackgrounds: {
    pragmatic: "linear-gradient(180deg, #8c5ca3 4.73%, #2c1731 89.51%)",
  },
  providerIconBackgrounds: {
    pragmatic: "url('/static/assets/redeem/providers/icons/pragmatic.svg') center / contain no-repeat",
    egt:       "url('/static/assets/redeem/providers/icons/egt.svg') center / contain no-repeat",
  },
  gameBackgrounds: {
    gatesOfOlympus: "url('/static/assets/redeem/games/gates.webp') center / cover no-repeat",
  },
  gameBackgroundsByClass: {
    burningHot: "url('/static/assets/redeem/games/burning-hot.webp') center / cover no-repeat",
  },
}
```

Token keys:

- `overlayBackground`
- `modalBackground`
- `modalBorderColor`
- `textColor`
- `fontFamily`
- `providerBackground`
- `providerActiveBackground`
- `gameBackground`
- `gameSelectedBackground`
- `footerBackground`
- `selectionBackground`
- `actionPrimaryBackground`
- `actionPrimaryHoverBackground`
- `borderRadiusSm`
- `borderRadiusMd`
- `borderRadiusLg`

---

## transport

```ts
transport?: (request: { url, method?, body? }) => Promise<unknown>
```

Default: `defaultFetchTransport` (uses native `fetch`, `POST`, JSON body).

Built-in alternative: `createAjaxTransport({ ajax, requestType, async, custom })` - wraps an existing global `ajax()` helper so requests go through your project's `handler.php` flow.

Custom example:

```js
transport: async ({ url, method = "POST", body = {} }) => {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "X-CSRF": getCsrfToken() },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return res.json();
}
```

---

## hooks

```ts
hooks?: {
  onOpen?:           () => void;
  onClose?:          () => void;
  onSelect?:         (game: RenderGame) => void;
  onDataLoaded?:     (payload: CanonicalBankPayload) => void;
  onRedeemSuccess?:  (response: unknown, game: RenderGame) => void;
  onRedeemError?:    (error: unknown,    game: RenderGame) => void;
}
```

All hooks are optional. Use them to bridge the widget with external UI (KPI counters, toasts, analytics) without forking the package.

```js
hooks: {
  onDataLoaded: (payload) => {
    document.querySelector(".totalFreespins").textContent = String(payload.totalFreespins);
  },
  onRedeemSuccess: (response, game) => {
    toast.success(`Redeemed ${game.label}`);
    analytics.track("redeem_success", { gameId: game.id });
  },
  onRedeemError: (error) => toast.error(String(error)),
}
```

---

## RedeemConfigApp Facade

`RedeemConfigApp` is a convenience API for legacy/vanilla hosts:

```ts
RedeemConfigApp.init({
  endpoint: "redeem_bank.php",           // alias for endpoints.bank
  redeemEndpoint: "user_redeem.php",     // alias for endpoints.redeem
  mountTo: "#redeem-widget-root",
  openButtonSelector: "#open-redeem",
  autoMount: true,                        // default true
  openOnInit: false,                      // default false
  // ...all regular RedeemWidgetConfig fields
})
```

Methods:

- `RedeemConfigApp.init(config)` - creates and optionally mounts/binds open button
- `RedeemConfigApp.getInstance()` - returns current widget instance
- `RedeemConfigApp.destroy()` - removes listeners and destroys active instance

---

## Widget Instance API

`createRedeemWidget(config)` returns an instance with these methods:

| Method        | Description                                                                |
| ------------- | -------------------------------------------------------------------------- |
| `mount(selOrEl)` | Attaches the widget to a DOM container.                                |
| `open()`      | Opens the modal and triggers a fresh data load.                            |
| `close()`     | Closes the modal.                                                          |
| `reload()`    | Re-fetches bank data without closing.                                      |
| `destroy()`   | Detaches event listeners and clears the container.                         |
| `getState()`  | Returns a shallow snapshot of internal state (totals, selection).           |

Typical lifecycle:

```js
const widget = rw.createRedeemWidget(config);
widget.mount("#redeem-widget-root");
openBtn.addEventListener("click", () => widget.open());
// ...later
widget.destroy();
```
