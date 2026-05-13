# PHP Host Integration

## Use Case

Integrating widget into server-rendered pages where user/session metadata comes from backend templates and requests flow through `ajax()` + `WebServices/handler.php`.

## Recommended Setup

1. Install package from git.
2. Add `redeem-widget-install` to host `postinstall` so assets land in `static/assets/redeem-widget/`.
3. Expose runtime user context on page (`data-user-id`, `data-user-hash`, etc).
4. Reference assets and initialize the widget.

## Step 1 - Install

```bash
npm i git+https://github.com/ShakoZvi/redeem-widget.git
```

In host `package.json`:

```json
{
  "scripts": {
    "postinstall": "redeem-widget-install static/assets/redeem-widget"
  }
}
```

## Step 2 - Page Integration

```html
<button id="open-redeem" type="button">Redeem</button>
<div id="redeem-widget-root"></div>

<link rel="stylesheet" href="static/assets/redeem-widget/redeem-widget.css">
<script src="static/assets/redeem-widget/redeem-widget.umd.js"></script>

<script>
  (function () {
    var rw = window.RedeemWidget;

    var widget = rw.createRedeemWidget({
      endpoints: {
        bank: "redeem_bank.php",
        redeem: "user_redeem.php",
      },
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
    });

    widget.mount("#redeem-widget-root");

    var openBtn = document.querySelector("#open-redeem");
    if (openBtn) {
      openBtn.addEventListener("click", function () { widget.open(); });
    }
  })();
</script>
```

## Important Notes

- `endpoints.bank` and `endpoints.redeem` must be bare WebService file names (for example `redeem_bank.php`), not URL paths. `handler.php` resolves them inside its own directory and rejects path-like values with `Web service wrapper error: the ws file path is not valid!`.
- Keep server-side validation mandatory for `userHash` and redeem permissions; widget client checks are UX only.
- If backend response differs from the legacy `{ data, total_freespins }` shape, supply a custom `normalize` adapter.
- Use `createAjaxTransport` so requests keep flowing through `ajax()` + `handler.php` exactly as your platform expects.
