# PHP Host Integration

## Use Case

Integrating widget into server-rendered pages where user/session metadata comes from backend templates.

## Recommended Setup

1. Install package from git.
2. Bundle/import widget JS + CSS in your frontend entry.
3. Expose runtime user context on page (dataset or JS config object).
4. Initialize widget and bind open button.

## Example

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
    ajax: window.ajax, // keep existing handler.php security/request pipeline
    requestType: "post",
    async: true,
    custom: true,
  }),
});

widget.mount("#redeem-widget-root");
document.querySelector("#open-redeem")?.addEventListener("click", () => widget.open());
```

## Important Notes

- Do not hardcode secrets inside frontend code.
- Keep server-side validation mandatory for `userHash` and redeem permissions.
- If backend response differs, provide custom adapter via `normalize`.
- If your platform requires requests through existing `ajax()` + `handler.php` flow, use `createAjaxTransport` and keep transport as `post`.
