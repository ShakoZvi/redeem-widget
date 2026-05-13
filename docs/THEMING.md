# Theming & CSS Customization

This guide covers styling the redeem widget from a host project:

- the full list of CSS classes the widget emits at runtime
- how to override styles from a host project without forking the package
- how to rename the class prefix

---

## 1. Full CSS Class Reference

All classes use a configurable prefix (default `rw-`). State modifiers use `.is-*`.

### Root / shell

| Class            | Element                                | Purpose                                    |
| ---------------- | -------------------------------------- | ------------------------------------------ |
| `.rw-shell`      | container element you `mount()` to    | wraps the widget; gets `is-open` toggled   |
| `.rw-shell.is-open` | shell when widget is visible        | controls visibility of `.rw-root`          |
| `.rw-root`       | fixed-positioned overlay layer        | full-screen layer hosting overlay + modal  |
| `.rw-overlay`    | semi-transparent backdrop             | click-to-close target (`data-role="overlay"`) |

### Modal frame

| Class            | Element                                | Purpose                                    |
| ---------------- | -------------------------------------- | ------------------------------------------ |
| `.rw-modal`      | centered dialog container             | actual visible modal box                   |
| `.rw-header`     | top bar of the modal                  | title + close button                       |
| `.rw-body`       | middle area of the modal              | providers and games                        |
| `.rw-footer`     | bottom bar of the modal               | selected amount + redeem button            |

### Providers

| Class                       | Element                          | Purpose                                |
| --------------------------- | -------------------------------- | -------------------------------------- |
| `.rw-providers`             | container of provider buttons   | flex row, wraps                        |
| `.rw-provider`              | single provider button          | `data-role="provider"`                 |
| `.rw-provider.is-active`    | currently selected provider     | visual selected state                  |

### Games

| Class                       | Element                          | Purpose                                |
| --------------------------- | -------------------------------- | -------------------------------------- |
| `.rw-games`                 | grid container                  | auto-fill grid                         |
| `.rw-game`                  | single game card                | `data-role="game"`                     |
| `.rw-game.is-selected`      | active game card                | visual selected state                  |
| `.rw-game.is-disabled`      | ineligible game card            | also has native `disabled` attribute   |
| `.rw-game-image`            | game icon span                  | also receives `imgClass` from catalog  |
| `.rw-game-value`            | nominal value (`{value}₾`)      | textual                                |
| `.rw-game-amount`           | available amount/freespin count | textual                                |
| `.rw-empty`                 | placeholder when no games       | shows "No games"                       |

### Footer / actions

| Class                       | Element                          | Purpose                                |
| --------------------------- | -------------------------------- | -------------------------------------- |
| `.rw-selection`             | "{amount} x {value}" summary    | textual                                |
| `.rw-redeem`                | primary action button           | `data-role="redeem"`                   |
| `.rw-redeem[disabled]`      | redeem button when blocked      | when no game selected or loading       |
| `.rw-close`                 | top-right dismiss button        | `data-role="close"`                    |

### data-* hooks (useful for testing and JS targeting)

- `data-role="overlay"`
- `data-role="provider"` + `data-provider-id="..."`
- `data-role="game"` + `data-game-id="..."`
- `data-role="redeem"`
- `data-role="close"`

### Renaming the prefix

If `rw-` collides with existing host CSS, override it via config:

```js
createRedeemWidget({
  // ...
  theme: { classPrefix: "redeem" },
});
```

Now every class becomes `redeem-*` (e.g. `.redeem-modal`, `.redeem-game.is-selected`). State suffixes (`is-open`, `is-active`, `is-selected`, `is-disabled`) are not prefixed.

---

## 2. Overriding Styles From The Host

You do not need to fork the package. Two options:

### Option A - Skip packaged CSS and write your own

Do not include `redeem-widget.css` on the page; write a host-side stylesheet that targets the same classes (`.rw-modal`, `.rw-game`, etc). The widget only adds classes; it does not inline styles.

### Option B - Load packaged CSS, then override

Load `redeem-widget.css` first, then load your own stylesheet later. Because both stylesheets target the same selectors, host rules win by virtue of source order (and, if needed, higher specificity).

```html
<link rel="stylesheet" href="static/assets/redeem-widget/redeem-widget.css">
<link rel="stylesheet" href="static/assets/css/redeem-overrides.css">
```

Example override (`redeem-overrides.css`):

```css
.rw-modal {
  background: #0e1424;
  border-color: #3b82f6;
  border-radius: 16px;
}

.rw-redeem {
  background: #f59e0b;
  color: #1f2937;
}

.rw-game.is-selected {
  border-color: #f59e0b;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.25);
}
```

> Tip: avoid `!important` unless absolutely necessary. Source order + specificity is enough in 99% of cases because the package CSS uses single-class selectors.
