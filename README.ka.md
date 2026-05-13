# Redeem Widget - ქართული დოკუმენტაცია

ეს დოკუმენტი არის ინსტრუქცია, რომ `@redeem/widget` გამოიყენო საკუთარ პროექტში, განსაკუთრებით PHP + `ajax()` + `handler.php` სცენარისთვის.

---

## 1) რა არის ეს პაკეტი

`@redeem/widget` არის მზად არქიტექტურა redeem ფუნქციონალისთვის:

- ბანკის მონაცემების წამოღება (bank endpoint)
- თამაშების/პროვაიდერების ჩვენება
- არჩევანი + redeem მოთხოვნა
- შედეგის შემდეგ ავტომატური refresh


## 2) როგორ დავაყენო

რეპო public არის. პროექტში გაუშვი:

```bash
npm i git+https://github.com/ShakoZvi/redeem-widget.git
```

შემდეგ host-ის `package.json`-ში დაამატე ერთხელ:

```json
{
  "scripts": {
    "postinstall": "redeem-widget-install static/assets/redeem-widget"
  }
}
```

ეს ბრძანება ყოველი `npm install`-ის შემდეგ ავტომატურად აკოპირებს ვიჯეტის გამზადებულ ფაილებს (`redeem-widget.umd.js`, `redeem-widget.css`) ფოლდერში `static/assets/redeem-widget/`.


## 3) მინიმალური სამუშაო ინტეგრაცია (PHP + ajax)

`static/assets/redeem-widget/` უკვე ივსება ავტომატურად, ამიტომ HTML-ში მხოლოდ ეს გჭირდება:

```html
<button id="open-redeem" type="button">გაანაღდე</button>
<div id="redeem-widget-root"></div>

<link rel="stylesheet" href="static/assets/redeem-widget/redeem-widget.css">
<script src="static/assets/redeem-widget/redeem-widget.umd.js"></script>

<script>
  (function () {
    var rw = window.RedeemWidget;

    var widget = rw.createRedeemWidget({
      endpoints: {
        // handler.php აღიქვამს მხოლოდ ფაილის სახელს (არა გზას).
        // თუ მისცემ "/WebServices/redeem_bank.php"-ს, დააბრუნებს
        // "Web service wrapper error: the ws file path is not valid!"
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

თუ პროექტი იყენებს Vite/webpack-ს (bundler), იგივე შეიძლება გაკეთდეს import-ებითაც:

```ts
import {
  createRedeemWidget,
  createAjaxTransport,
  defaultBankNormalizer,
  defaultGames,
  defaultProviders,
} from "@redeem/widget";
import "@redeem/widget/styles.css";
```

---

## 4) რატომ არის აქ `createAjaxTransport`

პროექტში დაცვა/ჰენდლერი მიბმულია `ajax()` გზაზე.

ამიტომ default `fetch` შენთვის იდეალური არ არის.  
`createAjaxTransport` ინარჩუნებს იგივე request pipeline-ს:

- `ajax()` -> `handler.php` -> WebService
- იგივე ვალიდაციები/ლოგიკა რაც დევს პროექტში

---

## 5) PHP-დან დაბრუნებული დატა

ყველაზე ხშირად გამოიყენება ეს 3 წერტილი:

### A) `normalize(raw)`

აქ იღებ bank endpoint-ის raw პასუხს პირდაპირ.

### B) `hooks.onDataLoaded(payload)`

აქ იღებ უკვე canonical (ნორმალიზებულ) დატას.  
UI-ის გარეთ საკუთარი ელემენტების განახლებისთვის.

### C) `hooks.onRedeemSuccess(response, game)`

აქ იღებ redeem endpoint-ის პასუხს.

მაგალითი:

```ts
const widget = createRedeemWidget({
  // ... სხვა კონფიგი
  normalize: (raw) => {
    console.log("RAW:", raw);
    return defaultBankNormalizer(raw);
  },
  hooks: {
    onDataLoaded: (payload) => {
      console.log("CANONICAL:", payload);
      const totalEl = document.querySelector(".totalFreespins");
      if (totalEl) totalEl.textContent = String(payload.totalFreespins);
    },
    onRedeemSuccess: (response, game) => {
      console.log("REDEEM:", response, game);
    },
  },
});
```

---

## 6) კონფიგის მთავარი ნაწილები მარტივად

`createRedeemWidget({ ... })`-ში:

- `endpoints.bank` - ბანკის მონაცემის endpoint
- `endpoints.redeem` - redeem action endpoint
- `getContext()` - თითო request-ზე დინამიური მონაცემი (`user_id`, `userHash`, სხვა)
- `normalize(raw)` - შენი backend ფორმატის გარდაქმნა widget-ის ფორმატში
- `providers`, `games` - კატალოგი
- `rules` - ბიზნეს წესები (ვინ შეიძლება შეარჩიოს თამაში)
- `filters` - ფილტრები (რას ვუჩვენებთ მომხმარებელს)
- `bank` - ჯამური თანხის გამოთვლის რეჟიმი
- `ui.labels` - ტექსტური ლეიბლები (`title`, `redeem`, `close`, ...)
- `theme.classPrefix` - CSS კლასის პრეფიქსი (default `rw`)
- `theme.providerBackgrounds` / `theme.providerActiveBackgrounds` - ვენდორის ბექგრაუნდები
- `theme.gameBackgrounds` / `theme.gameBackgroundsByClass` - თამაშის ბექგრაუნდები
- `theme.providerBackgroundList` / `theme.gameBackgroundList` - იგივე array ფორმატში
- `theme.tokens` - ფერები/რადიუსები/ძირითადი UI ტოკენები (CSS variables)
- `transport` - network layer (`createAjaxTransport` ან custom)
- `hooks` - lifecycle callbacks

ყველა ველი, default-ი და ქცევა — `docs/CONFIGURATION.md`.

---

## 6.5) როგორ შევცვალო CSS სტილი (host პროექტში)

ვიჯეტს თვითონვე მოაქვს მზადი CSS — `dist/redeem-widget.css`. host-ში 2 ვარიანტი გაქვს fork-ის გარეშე.

### A) override-ი host პროექტიდან

ჯერ ჩავტვირთოთ პაკეტის CSS, შემდეგ პროექტის საკუთარი override CSS:

```html
<link rel="stylesheet" href="static/assets/redeem-widget/redeem-widget.css">
<link rel="stylesheet" href="static/assets/css/redeem-overrides.css">
```

`redeem-overrides.css`:

```css
.rw-modal     { background: #0e1424; border-radius: 16px; }
.rw-redeem    { background: #f59e0b; color: #1f2937; }
.rw-game.is-selected { border-color: #f59e0b; }
```

წყაროების რიგი + selector specificity საკმარისია — `!important` არ გჭირდება.

### B) class პრეფიქსის გადარქმევა

თუ `rw-` სხვა CSS-თან კონფლიქტობს:

```js
rw.createRedeemWidget({
  // ...
  theme: { classPrefix: "redeem" },
});
```

ახლა ყველა კლასი იქცევა `redeem-*` ფორმატში.

> CSS კლასების სრული სია, state modifier-ები (`is-open`, `is-active`, `is-selected`, `is-disabled`), `data-role` ატრიბუტები და override მაგალითები — `docs/THEMING.md`.

---

## 6.6) ვენდორის/თამაშის ბექგრაუნდები პირდაპირ კონფიგიდან

ცალკე CSS selector-ების გარეშე შეგიძლია theme-ში პირდაპირ გადასცე.

### Map ფორმატი

```js
rw.createRedeemWidget({
  // ...
  theme: {
    classPrefix: "rw",
    providerBackgrounds: {
      pragmatic: "url('/static/assets/redeem/providers/pragmatic.webp') center / cover no-repeat",
      egt: "url('/static/assets/redeem/providers/egt.webp') center / cover no-repeat",
    },
    providerActiveBackgrounds: {
      pragmatic: "linear-gradient(180deg, #8c5ca3 4.73%, #2c1731 89.51%)",
    },
    gameBackgrounds: {
      gatesOfOlympus: "url('/static/assets/redeem/games/gates.webp') center / cover no-repeat",
    },
    gameBackgroundsByClass: {
      burningHot: "url('/static/assets/redeem/games/burning-hot.webp') center / cover no-repeat",
    },
  },
});
```

### Array ფორმატი (დინამიკური გენერაციისთვის მოსახერხებელია)

```js
rw.createRedeemWidget({
  // ...
  theme: {
    classPrefix: "rw",
    providerBackgroundList: [
      {
        providerId: "pragmatic",
        background: "url('/static/assets/redeem/providers/pragmatic.webp') center / cover no-repeat",
        activeBackground: "linear-gradient(180deg, #8c5ca3 4.73%, #2c1731 89.51%)",
      },
      {
        providerId: "egt",
        background: "url('/static/assets/redeem/providers/egt.webp') center / cover no-repeat",
      },
    ],
    gameBackgroundList: [
      {
        gameId: "gatesOfOlympus",
        background: "url('/static/assets/redeem/games/gates.webp') center / cover no-repeat",
      },
      {
        imgClass: "burningHot",
        background: "url('/static/assets/redeem/games/burning-hot.webp') center / cover no-repeat",
      },
    ],
  },
});
```

თამაშის ბექგრაუნდის პრიორიტეტი:

1. `theme.gameBackgrounds[game.id]`
2. `theme.gameBackgroundList` (`gameId`-ით)
3. `theme.gameBackgroundsByClass[game.imgClass]`
4. `theme.gameBackgroundList` (`imgClass`-ით)
5. default CSS

---

## 6.7) RedeemConfigApp.init - უფრო მარტივი facade API

თუ გინდა უფრო მოკლე და ერთიანი init (legacy/PHP სცენარში), გამოიყენე:

```js
window.RedeemWidget.RedeemConfigApp.init({
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
  normalize: window.RedeemWidget.defaultBankNormalizer,
  providers: window.RedeemWidget.defaultProviders,
  games: window.RedeemWidget.defaultGames,
  transport: window.RedeemWidget.createAjaxTransport({
    ajax: window.ajax,
    requestType: "post",
    async: true,
    custom: true,
  }),
});
```

`endpoint`/`redeemEndpoint` არის shorthand (`endpoints.bank`/`endpoints.redeem`).

---

## 6.8) theme.tokens - სწრაფი ბრენდინგი selector-ების გარეშე

```js
theme: {
  tokens: {
    modalBackground: "#101a33",
    modalBorderColor: "#2b3f75",
    textColor: "#f5f7ff",
    providerBackground: "linear-gradient(180deg, #2f364d 0%, #1c2130 100%)",
    providerActiveBackground: "linear-gradient(180deg, #6d52b5 0%, #2f1b4f 100%)",
    actionPrimaryBackground: "#16a34a",
    actionPrimaryHoverBackground: "#15803d",
    borderRadiusSm: "6px",
    borderRadiusMd: "10px",
    borderRadiusLg: "14px",
  },
}
```

ეს ტოკენები გადადის CSS variables-ად და მთლიან ვიჯეტზე ბრენდინგი ერთ კონფიგით იცვლება.

---

## 7) რეკომენდაციები სწორი მუშოაბისთვის

1. **არასწორი endpoint სახელები**  
   დარწმუნდი რომ `bank`/`redeem` ფაილები ზუსტად სწორია.

2. **`getContext()`-ში ცარიელი `user_id` ან `userHash`**  
   ამ შემთხვევაში backend სავარაუდოდ დაგიბრუნებს error-ს.

3. **`ajax` არ არის გლობალში**  
   თუ `window.ajax` არ არსებობს, `createAjaxTransport` ვერ იმუშავებს.

4. **`normalize` არ აბრუნებს სწორ ფორმატს**  
   გამოიყენე `defaultBankNormalizer` ან დაწერე custom ნორმალიზერი.

---

## 8) როგორ დავტესტო სწრაფად

1. გახსენი გვერდი
2. `#open-redeem` ღილაკზე დააკლიკე
3. ნახე იხსნება თუ არა widget
4. DevTools-ში შეამოწმე request მიდის თუ არა `ajax()` გზით
5. `console.log`-ებით გადაამოწმე `normalize`/`hooks` მონაცემები

---

## 9) უსაფრთხოების მინიმალური წესები

- არასდროს ჩასვა რეალური secret/frontend კოდში.
- `userHash`/authorization ყოველთვის backend-ზე გადაამოწმე.
- widget-ის client-side checks არის UX, არა საბოლოო უსაფრთხოება.

---

## 10) დამატებითი დოკუმენტები

- ინგლისური მთავარი დოკი: `README.md`
- არქიტექტურა: `docs/ARCHITECTURE.md`
- სრული კონფიგი: `docs/CONFIGURATION.md`
- სტილი/თემინგი: `docs/THEMING.md`
- PHP ინტეგრაცია: `docs/INTEGRATION_PHP.md`
- React ინტეგრაცია: `docs/INTEGRATION_REACT.md`
- უსაფრთხოება: `docs/SECURITY.md`

