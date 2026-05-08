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

რადგან რეპო არის public, შეგიძლია პირდაპირ GitHub-დან დააყენო:

```bash
npm i git+https://github.com/ShakoZvi/redeem-widget.git
```

იმპორტი იქნება:

```ts
import { createRedeemWidget } from "@redeem/widget";
```


## 3) მინიმალური სამუშაო ინტეგრაცია (PHP + ajax)

ეს არის მთავარი მაგალითი შენი არქიტექტურისთვის:

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
    bank: "goalscorer_fs_bank.php",
    redeem: "user_redeem.php",
  },
  getContext: () => ({
    userHash: $("body").data("user-hash"),
    user_id: $("body").data("user-id"),
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

საჭირო HTML:

```html
<button id="open-redeem" type="button">გაანაღდე</button>
<div id="redeem-widget-root"></div>
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
- `transport` - network layer (`createAjaxTransport` ან custom)
- `hooks` - lifecycle callbacks

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
- PHP ინტეგრაცია: `docs/INTEGRATION_PHP.md`
- React ინტეგრაცია: `docs/INTEGRATION_REACT.md`
- უსაფრთხოება: `docs/SECURITY.md`

