# Theming & CSS Customization

This guide covers every way to style the redeem widget from a host project. There are three layers, each more invasive than the previous:

1. `theme.tokens` — modern, CSS-variable-driven theming (recommended).
2. Config-driven backgrounds — per-provider and per-game image/gradient configuration.
3. Custom CSS overrides — full visual takeover by targeting the widget's CSS classes.

You can combine all three. None of them require forking the package.

---

## 1. Modern Theming With `theme.tokens`

The widget exposes a small palette of CSS custom properties on the shell element. Set them via `theme.tokens` and they cascade everywhere the package CSS uses them.

### Available tokens

| Token                           | CSS variable                       | Default                                                                    | Notes                              |
| ------------------------------- | ---------------------------------- | -------------------------------------------------------------------------- | ---------------------------------- |
| `overlayBackground`             | `--rw-overlay-bg`                  | `rgba(10, 13, 28, 0.6)`                                                    | Backdrop color/gradient            |
| `modalBackground`               | `--rw-modal-bg`                    | `#0e1325`                                                                  | Main dialog background             |
| `modalBorderColor`              | `--rw-modal-border`                | `#253159`                                                                  | Dialog 1px border color            |
| `textColor`                     | `--rw-text-color`                  | `#ffffff`                                                                  | Default text color                 |
| `fontFamily`                    | `--rw-font-family`                 | `"AdjaraSemiBold", "Helvetica Neue", Arial, sans-serif`                    | Modal font stack                   |
| `providerBackground`            | `--rw-provider-bg`                 | `linear-gradient(159.58deg, #343748 12.59%, #161721 75.9%)`                | Provider tab default               |
| `providerActiveBackground`      | `--rw-provider-active-bg`          | `linear-gradient(180deg, #54578d 0%, #4f4181 49.16%, #2f1b4f 100%)`        | Provider tab active state          |
| `gameBackground`                | `--rw-game-bg`                     | `#383a49`                                                                  | Default game card background       |
| `gameSelectedBackground`        | `--rw-game-selected-bg`            | `linear-gradient(180deg, #039855 -105.26%, #01321c 100%)`                  | Selected game card                 |
| `footerBackground`              | `--rw-footer-bg`                   | `linear-gradient(269.27deg, #161722 23.78%, #383a49 99.5%)`                | Footer bar                         |
| `selectionBackground`           | `--rw-selection-bg`                | `linear-gradient(174.6deg, #1b1c2c 14.9%, #036036 120.33%)`                | "{amount} x {value}" label         |
| `actionPrimaryBackground`       | `--rw-action-bg`                   | `#039855`                                                                  | Redeem button default              |
| `actionPrimaryHoverBackground`  | `--rw-action-hover-bg`             | `#047a47`                                                                  | Redeem button hover                |
| `borderRadiusSm`                | `--rw-radius-sm`                   | `6px`                                                                      | Small corner radius                |
| `borderRadiusMd`                | `--rw-radius-md`                   | `8px`                                                                      | Medium corner radius               |
| `borderRadiusLg`                | `--rw-radius-lg`                   | `12px`                                                                     | Large corner radius                |

### Example: brand palette

```js
createRedeemWidget({
  // ...
  theme: {
    tokens: {
      modalBackground: "#0b1a2e",
      modalBorderColor: "#1e4a8a",
      textColor: "#f5f7ff",
      actionPrimaryBackground: "#f59e0b",
      actionPrimaryHoverBackground: "#d97706",
      gameSelectedBackground: "linear-gradient(180deg, #f59e0b, #b45309)",
      borderRadiusLg: "16px",
    },
  },
});
```

### Example: light theme

```js
theme: {
  tokens: {
    overlayBackground: "rgba(0, 0, 0, 0.35)",
    modalBackground: "#ffffff",
    modalBorderColor: "#e5e7eb",
    textColor: "#111827",
    providerBackground: "#f3f4f6",
    providerActiveBackground: "#2563eb",
    gameBackground: "#f9fafb",
    gameSelectedBackground: "linear-gradient(180deg, #2563eb, #1e3a8a)",
    footerBackground: "#f3f4f6",
    selectionBackground: "#e5e7eb",
    actionPrimaryBackground: "#16a34a",
    actionPrimaryHoverBackground: "#15803d",
  },
}
```

> Tokens are applied at `mount()` time and re-applied if you re-create the widget with a new config. They live on the widget shell element, so they do not leak into the rest of your page.

---

## 2. Config-Driven Backgrounds

If you want per-provider or per-game artwork without writing CSS, configure backgrounds directly:

### Object (map) form

```js
theme: {
  providerBackgrounds: {
    pragmatic: "url('/static/assets/redeem/providers/pragmatic.webp') center / cover no-repeat",
    egt:       "linear-gradient(180deg, #ff7a18 0%, #af002d 100%)",
  },
  providerActiveBackgrounds: {
    pragmatic: "linear-gradient(180deg, #8c5ca3 4.73%, #2c1731 89.51%)",
  },
  // Provider icons rendered to the LEFT of the provider name.
  providerIconBackgrounds: {
    pragmatic: "url('/static/assets/redeem/providers/icons/pragmatic.svg') center / contain no-repeat",
    egt:       "url('/static/assets/redeem/providers/icons/egt.svg') center / contain no-repeat",
  },
  // Or by ProviderDefinition.icon class:
  providerIconBackgroundsByClass: {
    iconPragmatic: "url('/static/assets/redeem/providers/icons/pragmatic.svg') center / contain no-repeat",
  },
  gameBackgrounds: {
    gatesOfOlympus: "url('/static/assets/redeem/games/gates.webp') center / cover no-repeat",
  },
  gameBackgroundsByClass: {
    burningHot: "url('/static/assets/redeem/games/burning-hot.webp') center / cover no-repeat",
  },
}
```

Resolution order for game backgrounds: `gameBackgrounds[game.id]` → `gameBackgroundsByClass[game.imgClass]` → default `--rw-game-bg` token.

### Array form (flexible, programmatic)

When the list comes from a CMS, database, or feature flag, use the array form:

```js
theme: {
  providerBackgroundList: [
    {
      providerId: "pragmatic",
      background: "url('/static/assets/redeem/providers/pragmatic.webp') center / cover no-repeat",
      activeBackground: "linear-gradient(180deg, #8c5ca3 4.73%, #2c1731 89.51%)",
    },
    {
      providerId: "egt",
      background: "linear-gradient(180deg, #ff7a18, #af002d)",
    },
  ],
  providerIconBackgroundList: [
    { providerId: "pragmatic", background: "url('/static/assets/redeem/providers/icons/pragmatic.svg') center / contain no-repeat" },
    { iconClass:  "iconEgt",   background: "url('/static/assets/redeem/providers/icons/egt.svg') center / contain no-repeat" },
  ],
  gameBackgroundList: [
    { gameId: "gatesOfOlympus", background: "url('/static/assets/redeem/games/gates.webp') center / cover no-repeat" },
    { imgClass: "burningHot",   background: "url('/static/assets/redeem/games/burning-hot.webp') center / cover no-repeat" },
  ],
}
```

> The array form merges with the map form; map-form entries win on conflict (`providerBackgrounds[id]` overrides `providerBackgroundList`).

---

## 3. Full CSS Class Reference

When you need finer control, target the actual classes the widget emits. All classes use a configurable prefix (default `rw-`). State modifiers use `.is-*` and are not prefixed.

### Root / shell

| Class                 | Element                                | Purpose                                       |
| --------------------- | -------------------------------------- | --------------------------------------------- |
| `.rw-shell`           | container element you `mount()` to     | wraps the widget; gets `is-open` toggled      |
| `.rw-shell.is-open`   | shell when widget is visible           | controls visibility of `.rw-root`             |
| `.rw-root`            | fixed-positioned overlay layer         | full-screen layer hosting overlay + modal     |
| `.rw-overlay`         | semi-transparent backdrop              | click-to-close target (`data-role="overlay"`) |

### Modal frame

| Class           | Element                                | Purpose                                |
| --------------- | -------------------------------------- | -------------------------------------- |
| `.rw-modal`     | centered dialog container              | actual visible modal box               |
| `.rw-header`    | top bar of the modal                   | title + close button                   |
| `.rw-body`      | middle area of the modal               | providers and games                    |
| `.rw-footer`    | bottom bar of the modal                | selected amount + redeem button        |

### Providers

| Class                              | Element                                 | Purpose                                                                  |
| ---------------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| `.rw-providers`                    | container of provider buttons           | flex row, wraps                                                          |
| `.rw-provider`                     | single provider button                  | `data-role="provider"` — flex layout `[icon][name]`                      |
| `.rw-provider.is-active`           | currently selected provider             | visual selected state                                                    |
| `.rw-provider-icon`                | icon span before the provider name      | `data-role="provider-icon"`; hidden by default, visible when bg resolved |
| `.rw-provider-icon.is-visible`     | icon when a background is applied       | toggled automatically by the widget                                      |
| `.rw-provider-name`                | span wrapping the provider's text label | useful for typography overrides                                          |

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
- `data-role="provider-icon"` + `data-provider-id="..."` + `data-icon-class="..."`
- `data-role="game"` + `data-game-id="..."`
- `data-role="game-image"` + `data-game-id="..."` + `data-img-class="..."`
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

## 4. Overriding Styles From The Host

You do not need to fork the package. Two options:

### Option A — Skip packaged CSS and write your own

Do not include `redeem-widget.css` on the page; write a host-side stylesheet that targets the same classes (`.rw-modal`, `.rw-game`, etc). The widget only adds classes; it does not inline styles (apart from CSS variables on the shell).

### Option B — Load packaged CSS, then override

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

---

## 5. Choosing the right approach

| Need                                                  | Use                              |
| ----------------------------------------------------- | -------------------------------- |
| Tweak a few colors / radii for brand                  | `theme.tokens`                   |
| Per-provider artwork (logos, gradients)               | `providerBackgrounds` / `List`   |
| Per-game artwork without changing CSS                 | `gameBackgrounds` / `List`       |
| Per-game artwork driven by sprite/img class           | `gameBackgroundsByClass`         |
| Light/dark theme switch                               | swap `theme.tokens` and re-init  |
| Full visual rework (custom layout, hover states, etc) | Host CSS overrides (Option B)    |
| Avoid class collisions with host CSS                  | `theme.classPrefix`              |
