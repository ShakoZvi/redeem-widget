# PHP Host Integration

A complete guide for integrating `@redeem/widget` into server-rendered PHP pages that route AJAX through `ajax()` + `WebServices/handler.php`.

---

## Why this guide exists

Most legacy PHP stacks share three characteristics:

- a global `ajax()` helper handles all requests
- `WebServices/handler.php` validates incoming WebService filenames
- user identity is rendered into the page (for example `data-user-id`, `data-user-hash`)

`@redeem/widget` integrates cleanly with this setup through `createAjaxTransport`, but only if endpoint values and DOM context are configured correctly. This document covers every detail.

---

## Quick map of what you need

| Where | What | Why |
| ----- | ---- | --- |
| `package.json` | `npm i git+https://github.com/ShakoZvi/redeem-widget.git` | Install the package. |
| `package.json` `scripts` | `"postinstall": "redeem-widget-install static/assets/redeem-widget"` | Auto-copy built CSS/JS into host assets. |
| HTML head/body | `<link>` + `<script>` for `redeem-widget.css` / `redeem-widget.umd.js` | Make the global `window.RedeemWidget` available. |
| HTML body | open button + mount container | Anchor points for the widget. |
| HTML body | init script (`RedeemConfigApp.init` or `createRedeemWidget`) | Provide config and wire the open button. |
| `<body>` data attributes | `data-user-id`, `data-user-hash`, … | Runtime context source for `getContext`. |
| WebServices | `redeem_bank.php`, `user_redeem.php` (or your filenames) | Backend bank + redeem endpoints. |

---

## Step 1 — Install and auto-copy assets

```bash
npm i git+https://github.com/ShakoZvi/redeem-widget.git
```

Add to host `package.json`:

```json
{
  "scripts": {
    "postinstall": "redeem-widget-install static/assets/redeem-widget --ensure-gitignore"
  }
}
```

Every `npm install` afterwards copies three files into `static/assets/redeem-widget/`:

- `redeem-widget.css`
- `redeem-widget.umd.js`
- `redeem-widget.umd.js.map`

If you ever need a one-off copy without modifying scripts:

```bash
npx redeem-widget-install static/assets/redeem-widget
```

### Git workflow for PHP hosts

PHP production servers rarely have Node available. The recommended file layout is:

| Path                              | Commit? | Reason                                              |
| --------------------------------- | :-----: | --------------------------------------------------- |
| `node_modules/`                   |   ❌    | Re-built by `npm install`.                          |
| `package.json` + lockfile         |   ✅    | Reproducible installs.                              |
| `static/assets/redeem-widget/`    |   ✅    | PHP serves these files directly; production needs them. |

The `--ensure-gitignore` flag added above lets the CLI maintain a managed block in your `.gitignore` so `node_modules/` and friends are never committed by accident. The block is idempotent — re-running the script does not duplicate entries.

Full deployment guide (including the alternative "ignore the asset folder too" pattern): see [`DEPLOYMENT.md`](./DEPLOYMENT.md).

---

## Step 2 — Render the runtime context

In your main PHP layout/template, expose user/session metadata on `<body>`:

```php
<body
  data-user-id="<?php echo $User->ID; ?>"
  data-user-hash="<?php echo $userHash; ?>"
  data-locale="<?php echo $Promo->lang; ?>"
>
```

These attributes are read at runtime by `getContext`. Avoid embedding secrets here — only what the backend already trusts to receive on every request.

---

## Step 3 — Load CSS and JS

```html
<link rel="stylesheet" href="static/assets/redeem-widget/redeem-widget.css">
<script src="static/assets/redeem-widget/redeem-widget.umd.js"></script>
```

The UMD bundle exposes everything under `window.RedeemWidget`:

- `RedeemWidget.createRedeemWidget`
- `RedeemWidget.RedeemConfigApp`
- `RedeemWidget.defaultBankNormalizer`
- `RedeemWidget.defaultProviders`
- `RedeemWidget.defaultGames`
- `RedeemWidget.createAjaxTransport`

Make sure your global `window.ajax` is loaded **before** this init script runs.

---

## Step 4 — Place open button and mount container

```html
<button id="open-redeem" type="button">Redeem</button>
<div id="redeem-widget-root"></div>
```

The mount container can live anywhere in the DOM; the widget renders inside it. The open button only triggers `widget.open()`.

---

## Step 5 — Initialize (recommended: `RedeemConfigApp.init`)

```html
<script>
  (function () {
    var rw = window.RedeemWidget;

    rw.RedeemConfigApp.init({
      endpoint: "redeem_bank.php",
      redeemEndpoint: "user_redeem.php",
      mountTo: "#redeem-widget-root",
      openButtonSelector: "#open-redeem",
      getContext: function () {
        return {
          user_id: document.body.dataset.userId,
          userHash: document.body.dataset.userHash,
        };
      },
      normalize: rw.defaultBankNormalizer,
      providers: rw.defaultProviders,
      games: rw.defaultGames,
      transport: rw.createAjaxTransport({
        ajax: window.ajax,
        requestType: "post",
        async: true,
        custom: true,
      }),
      rules: {
        selectableMassPrizeValue: null,
        minAmountToEnable: 1,
        requireAffordableBalance: true,
        requireEligibleFrsp: false,
      },
      filters: {
        hideGamesWithoutApi: true,
        hideZeroAmountGames: false,
        hideProvidersWithoutGames: true,
      },
      bank: {
        totalFreespinsMode: "response",
        unitValue: 0.15,
        precision: 2,
      },
      ui: {
        popularSlice: 7,
        preserveActiveTab: true,
        closeOnEscape: true,
        trapFocus: true,
      },
      hooks: {
        onDataLoaded: function (payload) {
          var el = document.querySelector(".totalFreespins");
          if (el) el.textContent = String(payload.totalFreespins);
        },
        onRedeemSuccess: function (response, game) {
          console.log("redeem ok:", response, game);
        },
        onRedeemError: function (error) {
          console.error("redeem error:", error);
        },
      },
    });
  })();
</script>
```

If you prefer the lower-level API:

```js
var widget = rw.createRedeemWidget({ /* same config without facade fields */ });
widget.mount("#redeem-widget-root");
document.querySelector("#open-redeem")
  .addEventListener("click", function () { widget.open(); });
```

---

## Step 6 — Backend contract

### Bank endpoint (`redeem_bank.php`)

Should return JSON consumable by your `normalize` function. With `defaultBankNormalizer`, the expected shape is roughly:

```json
{
  "total_freespins": 15,
  "data": {
    "games": [
      { "type_id": 1, "amount": 5, "em": 1, "eligibleFrsp": 1, "massPrizeValue": 0.15 }
    ]
  }
}
```

If your shape differs, write a custom `normalize`.

### Redeem endpoint (`user_redeem.php`)

Receives `getContext()` payload plus `prize_type_id` (the selected game). Should return success/error JSON that you can inspect via `hooks.onRedeemSuccess` / `onRedeemError`.

Always enforce on backend:

- userHash validation
- redeem entitlement
- anti-replay / rate limits
- amount/value sanity

---

## Common pitfalls

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| `Web service wrapper error: the ws file path is not valid!` | Endpoint passed as path (for example `/WebServices/redeem_bank.php`). | Use **only the filename**: `redeem_bank.php`. |
| Button clicks do nothing | `openButtonSelector` not provided / button rendered after init. | Use facade `openButtonSelector` or bind click after DOM is ready. |
| `Uncaught SyntaxError: Cannot use import statement` | Trying to use ESM in a regular `<script>`. | Use the UMD bundle (`redeem-widget.umd.js`) for vanilla PHP pages. |
| `window.ajax is undefined` | ajax helper loaded after the init script. | Move `<script src="…/ajax.js">` above the widget init. |
| Bank request 401 / empty | `data-user-id` / `data-user-hash` missing on `<body>`. | Render them in the PHP template, fall back gracefully. |
| Widget visible but blank | normalize returned an empty `games` object. | Log raw payload inside `normalize` to inspect. |

---

## Updating the package

```bash
npm update @redeem/widget
```

`postinstall` automatically refreshes assets. Hard refresh the page (`Cmd+Shift+R`) to bypass browser cache.

Verify the installed version:

```bash
node -p "require('./node_modules/@redeem/widget/package.json').version"
```

---

## Multiple widgets on one page

`RedeemConfigApp.init` keeps a single active instance (calling `init` again destroys the previous one). If you need multiple coexisting modals on the same page, use `createRedeemWidget` directly per instance, with distinct mount containers and open buttons.
