# Redeem Widget — ქართული დოკუმენტაცია

ერთხელ აწყობილი, ბევრჯერ გამოყენებადი — `redeem` ფუნქციონალი, რომელიც აღარასდროს მოგიწევს ნოლიდან.

`@redeem/widget` არის სრული `redeem` მოდულის პაკეტი: ბანკის წამოღება, წესების მოწმობა, თამაშების კატალოგი, თვითრენდერული UI, თემინგი და დარეფრეშება — ერთად, ერთ პაკეტში. host პროექტი მხოლოდ აღწერს თავის backend-სა და ბრენდს — დანარჩენს ვიჯეტი თვითონ აკეთებს.

**მთავარი უპირატესობები**

- ჯდება ნებისმიერ host-ში — vanilla HTML, legacy PHP, თანამედროვე bundler-ი ან React.
- ერთი კონფიგი მართავს endpoints, rules, filters, totals, UX, theme და hooks.
- Backend-agnostic: pluggable transport-ები (`fetch`, `ajax()` + `handler.php`, custom) და custom normalizer-ები.
- მზად accessible modal: focus trap, `Esc`-ით დახურვა, overlay-ით dismiss.
- თანამედროვე თემინგი CSS variables-ით (`theme.tokens`) და per-vendor/per-game background config-ით.
- ინსტალაცია პირდაპირ git-დან — `redeem-widget-install` CLI ყოველ `npm install`-ზე ანახლებს host-ის ასეტებს.

---

## სარჩევი

- [1) რა არის ეს პაკეტი](#1-რა-არის-ეს-პაკეტი)
- [2) ინსტალაცია](#2-ინსტალაცია)
- [3) მინიმალური ინტეგრაცია (PHP + ajax)](#3-მინიმალური-ინტეგრაცია-php--ajax)
- [4) `createAjaxTransport` რატომ გვჭირდება](#4-createajaxtransport-რატომ-გვჭირდება)
- [5) backend-დან დაბრუნებული დატის წვდომა](#5-backend-დან-დაბრუნებული-დატის-წვდომა)
- [6) კონფიგის აწყობა ნაბიჯ-ნაბიჯ (სრული გზამკვლევი)](#6-კონფიგის-აწყობა-ნაბიჯ-ნაბიჯ-სრული-გზამკვლევი)
- [7) CSS სტილის შეცვლა host პროექტში](#7-css-სტილის-შეცვლა-host-პროექტში)
- [8) ვენდორის/თამაშის ბექგრაუნდები პირდაპირ კონფიგიდან](#8-ვენდორისთამაშის-ბექგრაუნდები-პირდაპირ-კონფიგიდან)
- [9) `RedeemConfigApp.init` — facade API](#9-redeemconfigappinit--facade-api)
- [10) `theme.tokens` — სწრაფი ბრენდინგი](#10-themetokens--სწრაფი-ბრენდინგი)
- [11) რეკომენდაციები სწორი მუშაობისთვის](#11-რეკომენდაციები-სწორი-მუშაობისთვის)
- [12) როგორ დავტესტო სწრაფად](#12-როგორ-დავტესტო-სწრაფად)
- [13) უსაფრთხოების მინიმალური წესები](#13-უსაფრთხოების-მინიმალური-წესები)
- [14) დამატებითი დოკუმენტები](#14-დამატებითი-დოკუმენტები)

---

## 1) რა არის ეს პაკეტი

`@redeem/widget` უზრუნველყოფს redeem ფუნქციონალის სრულ pipeline-ს:

- ბანკის მონაცემების წამოღება (`bank` endpoint)
- თამაშების/პროვაიდერების ჩვენება
- მომხმარებლის არჩევანი + redeem მოთხოვნა
- წარმატებული redeem-ის შემდეგ ავტომატური refresh
- accessibility, თემინგი, custom hooks

---

## 2) ინსტალაცია

```bash
npm i git+https://github.com/ShakoZvi/redeem-widget.git
```

host-ის `package.json`-ში ერთხელ დაამატე:

```json
{
  "scripts": {
    "postinstall": "redeem-widget-install static/assets/redeem-widget"
  }
}
```

ეს ბრძანება ყოველი `npm install`-ის შემდეგ ავტომატურად დააკოპირებს:

- `redeem-widget.css`
- `redeem-widget.umd.js`
- `redeem-widget.umd.js.map`

ფოლდერში `static/assets/redeem-widget/`.

### 2.1) Git / `.gitignore` სწორი მოწყობა (PHP host-ისთვის)

რეკომენდირებული წესი როცა project PHP-ით deploy-დება (Node production-ზე არ გვაქვს):

- **`node_modules/`** → gitignore (არასოდეს დააკომიტო)
- **`package.json` + `package-lock.json`** → დააკომიტე (reproducible install-ისთვის)
- **`static/assets/redeem-widget/`** → დააკომიტე (production PHP სერვერი თვითონ ემსახურება ამ ფაილებს)

CLI-ს შეუძლია `.gitignore`-იც თვითონ მართოს. დაამატე `--ensure-gitignore` (ან `-g`):

```json
{
  "scripts": {
    "postinstall": "redeem-widget-install static/assets/redeem-widget --ensure-gitignore"
  }
}
```

რა მოხდება:

- `.gitignore` შეიქმნება თუ არ არსებობს.
- დაემატება **idempotent managed-block**:

```text
# >>> @redeem/widget managed-block (do not edit by hand) >>>
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.npm/
# <<< @redeem/widget managed-block <<<
```

- ხელახალი გაშვება უსაფრთხოა — block-ი არ დუბლირდება.
- შენი სხვა `.gitignore` ჩანაწერები ხელუხლებელი რჩება.

flag-ის გარეშე CLI მხოლოდ მოკლე hint-ს დაბეჭდავს copy-ის შემდეგ. CI-სთვის დაამატე `--silent` (`-s`).

> სრული workflow + ალტერნატივა (როცა Node production-ზე გვაქვს): იხილე `docs/DEPLOYMENT.md`.

---

## 3) მინიმალური ინტეგრაცია (PHP + ajax)

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
        // handler.php აღიქვამს მხოლოდ ფაილის სახელს (გზას არა).
        // არასწორი მაგ.: "/WebServices/redeem_bank.php"
        // → "Web service wrapper error: the ws file path is not valid!"
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

bundler-ისთვის (Vite/webpack) იგივე import-ებითაც მუშაობს:

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

## 4) `createAjaxTransport` რატომ გვჭირდება

ბევრ legacy PHP პროექტში request pipeline ასე გადის:

```
ajax() → handler.php → WebService
```

`handler.php` ვალიდაციით ცდის რომელი ფაილი მოითხოვს კლიენტი და მხოლოდ უსაფრთხო WebService-ებს უშვებს. default `fetch` transport ამ pipeline-ს გვერდს უვლის — ამიტომ ვიყენებთ `createAjaxTransport`-ს, რომელიც იგივე `ajax()` ფუნქციით ატარებს მოთხოვნებს.

> მნიშვნელოვანი: ამ შემთხვევაში `endpoints.bank` და `endpoints.redeem` უნდა იყოს **მხოლოდ ფაილის სახელი** (`redeem_bank.php`), არა გზა.

---

## 5) backend-დან დაბრუნებული დატის წვდომა

3 მთავარი წერტილი:

### A) `normalize(raw)`

backend-ის raw პასუხი — სანამ widget გადააქცევს canonical მოდელად.

### B) `hooks.onDataLoaded(payload)`

უკვე ნორმალიზებული canonical დატა — UI-ის გარეთ ელემენტების სანახაობით განახლებისთვის (მაგ. ჯამური freespin counter ვებგვერდის სხვა ნაწილში).

### C) `hooks.onRedeemSuccess(response, game)`

`redeem` endpoint-ის სრული პასუხი + არჩეული თამაშის ობიექტი.

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

## 6) კონფიგის აწყობა ნაბიჯ-ნაბიჯ (სრული გზამკვლევი)

ეს თავი არის პრაქტიკული გზამკვლევი: როგორ ავაწყოთ მუშა კონფიგი ნოლიდან, რა თანმიმდევრობით და რას აკეთებს თითოეული ველი. სრული reference — `docs/CONFIGURATION.md`.

### init-ის ორი გზა

| მიდგომა | როდის გამოვიყენოთ |
| ------- | ----------------- |
| `createRedeemWidget(config)` | სრული კონტროლი: mount კონტეინერი, ღილაკების მიბმა, `open()`/`close()` ხელით. |
| `RedeemConfigApp.init(config)` | legacy/vanilla გვერდები: shorthand endpoints, auto-mount, `openButtonSelector`. |

ორივე იღებს ერთსა და იმავე ლოგიკურ ოპციებს. `RedeemConfigApp.init` ამატებს მოხერხებულ ველებს (`endpoint`, `redeemEndpoint`, `mountTo`, `openButtonSelector`, `autoMount`, `openOnInit`) და შიგნით თვითონ აყენებს `createRedeemWidget`-ს.

---

### Step 0 — წინასწარი მზადება host-ის გვერდზე

სანამ კონფიგს ეპიქრობ:

1. **CSS და JS ჩატვირთული გქონდეს** (UMD ვარიანტი):

   ```html
   <link rel="stylesheet" href="static/assets/redeem-widget/redeem-widget.css">
   <script src="static/assets/redeem-widget/redeem-widget.umd.js"></script>
   ```

2. **mount კონტეინერი არსებობდეს** DOM-ში (მაგ. `<div id="redeem-widget-root"></div>`). widget რენდერდება ამის შიგნით.

3. **backend კონტრაქტი იცოდე**: რომელი PHP/API აბრუნებს ბანკის დატას, რომელი ასრულებს redeem-ს, რა JSON ფორმატით.

4. **თუ იყენებ `ajax()` + `handler.php`-ს**: init-ის მომენტში `window.ajax` უკვე უნდა იყოს, ხოლო endpoint-ები **მხოლოდ ფაილის სახელით** (`redeem_bank.php`), არა `/WebServices/redeem_bank.php`.

---

### Step 1 — სავალდებო ველები (მინიმუმ მუშა კონფიგი)

ნებისმიერი მუშა კონფიგი მოიცავს:

| ველი | რას აკეთებს |
| ---- | ----------- |
| `endpoints.bank` | სად მოვითხოვოთ ბანკის მონაცემები (ან `endpoint`, თუ facade-ით ვიყენებთ). |
| `endpoints.redeem` | სად დავაგზავნოთ redeem (ან `redeemEndpoint`). |
| `getContext` | ფუნქცია, რომელიც აბრუნებს ობიექტს — ეს merge-დება **ყოველი** request-ის body-ში (user_id, userHash, locale, ...). |
| `normalize` | ფუნქცია, რომელიც შენი backend-ის პასუხს ფარდულობს canonical მოდელში. |
| `providers` | provider-ების მასივი (ტაბები). შეგიძლია დაიწყო `defaultProviders`-ით. |
| `games` | თამაშების კატალოგი. შეგიძლია დაიწყო `defaultGames`-ით. |

PHP stack-ში ხშირად საჭიროა:

| ველი | რას აკეთებს |
| ---- | ----------- |
| `transport` | `createAjaxTransport({ ajax: window.ajax, ... })` default `fetch`-ის ნაცვლად. |

დანარჩენი (`rules`, `filters`, `bank`, `ui`, `theme`, `hooks`) ემატება ქცევის და UX-ის გასაკონტროლებლად.

---

### Step 2 — endpoint-ები (`endpoints` ან facade aliases)

**`endpoints.bank`** (string)

- **default `fetch`-ით**: სრული URL (`/api/redeem/bank`).
- **`createAjaxTransport` + `handler.php`-ით**: მხოლოდ WebService-ის **ფაილის სახელი** (`redeem_bank.php`).

**`endpoints.redeem`** (string) — იგივე წესები რაც `bank`-ისთვის.

**facade shorthand** (`RedeemConfigApp.init`):

- `endpoint` → `endpoints.bank`
- `redeemEndpoint` → `endpoints.redeem`

`endpoints: { bank, redeem }`-ის გადაცემაც შესაძლებელია, თუ ეგ მოგერჩივნოს.

---

### Step 3 — Context (`getContext`)

**ტიპი:** `() => Record<string, unknown> | Promise<Record<string, unknown>>`

**რას აკეთებს:** დაბრუნებული ობიექტი იძირება bank და redeem მოთხოვნების body-ში.

**PHP host-ის ტიპიური მაგალითი:**

```js
getContext: function () {
  return {
    user_id: document.body.dataset.userId,
    userHash: document.body.dataset.userHash,
  };
},
```

**წესები:**

- არასდროს ჩასვა secret-ი `getContext`-ში hard-coded-ად.
- key-ები ემთხვეოდეს backend-ის მოლოდინს (`user_id`, `userHash`...).
- async session lookup-ისთვის `getContext` შეიძლება დააბრუნოს `Promise`.

---

### Step 4 — ნორმალიზაცია (`normalize`)

**ტიპი:** `(raw: unknown) => CanonicalBankPayload`

**რას აკეთებს:** backend ნებისმიერ JSON-ს დააბრუნებს, widget კი ენდობა canonical მოდელს:

```ts
{
  totalFreespins: number;
  games: Record<number, {
    amount: number;
    em: number;
    eligibleFrsp: number;
    massPrizeValue: number;
    descrpt?: string;
    vendor?: string;
  }>;
}
```

**მზადი ვარიანტები:**

- `defaultBankNormalizer` — legacy `{ data, total_freespins }` ფორმატი.
- `canonicalBankNormalizer` — უკვე canonical payload.

**custom** — დაწერე საკუთარი ფუნქცია, შეგიძლია default-იც გადაატარო:

```js
normalize: function (raw) {
  if (raw && raw.customFlag) {
    return myCustomMapper(raw);
  }
  return rw.defaultBankNormalizer(raw);
},
```

---

### Step 5 — კატალოგი (`providers` და `games`)

**`providers: ProviderDefinition[]`** — თითო provider არის ერთი ტაბი.

| ველი | სავალდებულო | რას ნიშნავს |
| ---- | ----------- | ----------- |
| `id` | კი | სტაბილური string id; games მას მიუთითებს `providerId`-ით. |
| `name` | კი | ტაბის ლეიბლი. |
| `type` | კი | `"freespin"` \| `"tableGames"` \| `"cashPrize"` — შინაგანი ტიპი. |
| `active` | არა | კატალოგში ხილვადობის flag. |
| `sortOrder` | არა | მცირე რიცხვი — წინ ჩანს non-popular ტაბებში. |

თუ `popular` id-ით provider-ს არ ჩამოაგდებ, პაკეტი თვითონ ამატებს synthetic Popular ტაბს.

**`games: GameDefinition[]`** — თითო თამაში ერთი მწკრივია არჩეულ ტაბში.

| ველი | სავალდებულო | რას ნიშნავს |
| ---- | ----------- | ----------- |
| `id` | კი | უნიკალური id; გამოიყენება selection-სა და `theme.gameBackgrounds`-ში. |
| `typeId` | კი | **უნდა ემთხვეოდეს** ბანკის პასუხის `games[]` key-ს. |
| `providerId` | კი | `ProviderDefinition.id`-ის შესაბამისი. |
| `imgClass` | კი | image span-ის CSS კლასი; `theme.gameBackgroundsByClass`-ი მას ეფუძნება. |
| `value` | კი | ნომინალური ფასი — გამოჩნდება როგორც `{value}₾`. |
| `label` | არა | display-ის override. |

---

### Step 6 — Transport (`transport`)

**Default:** browser-ის `fetch` POST + JSON body.

**PHP legacy:** `createAjaxTransport({ ajax: window.ajax, requestType: "post", async: true, custom: true })` — შენი `ajax()` → `handler.php` → WebService pipeline-ი ხელუხლებლად რჩება.

**Custom:** ნებისმიერი async ფუნქცია `(request) => unknown`, სადაც `request` არის `{ url, method?, body? }`.

---

### Step 7 — Rules (`rules`, არჩევითია, აქვს default-ები)

დასაშვებია partial — გადაცემული ველები გადაეფარება default-ებს. განსაზღვრავს, **რომელი თამაშებია არჩევადი** (`active`).

| ველი | Default | ახსნა |
| ---- | ------- | ----- |
| `selectableMassPrizeValue` | `null` | თუ რიცხვია, მხოლოდ ის თამაშებია არჩევადი, ვისი `massPrizeValue`-ც ემთხვევა (float ტოლერანსით). |
| `minAmountToEnable` | `1` | თუ `amount < minAmountToEnable`, თამაში გათიშულია. |
| `requireAffordableBalance` | `true` | თუ `true`, `game.value > totalAmount` შემთხვევაში თამაში გათიშულია. `totalAmount` = `totalFreespins * bank.unitValue`. |
| `requireEligibleFrsp` | `false` | თუ `true`, საჭიროა `eligibleFrsp === 1`. |

**`active` უმარტივესად:** თამაში აქტიურია, თუ ბანკიდან `em === 1` და ყველა ჩართული წესი გადის.

---

### Step 8 — Filters (`filters`, არჩევითია)

განსაზღვრავს, **რა ჩანს** ეკრანზე rules-ის შემდეგ.

| ველი | Default | ახსნა |
| ---- | ------- | ----- |
| `hideGamesWithoutApi` | `true` | მალავს კატალოგის თამაშებს, რომელთათვისაც ბანკში `typeId` არ მოვიდა. |
| `hideZeroAmountGames` | `false` | მალავს `amount === 0` თამაშებს. |
| `hideProvidersWithoutGames` | `true` | მალავს provider-ის ტაბს, თუ მასში არ რჩება ხილული თამაში. |

---

### Step 9 — Bank totals (`bank`, არჩევითია)

| ველი | Default | ახსნა |
| ---- | ------- | ----- |
| `totalFreespinsMode` | `"response"` | `"response"` — `payload.totalFreespins`-ის გამოყენება. `"sumAll"` — ყველა `amount`-ის ჯამი. `"sumByMassPrizeValue"` — ჯამდება მხოლოდ `rules.selectableMassPrizeValue`-ის შესაბამისი. |
| `unitValue` | `0.15` | ერთი freespin-ის ფასი; გამოიყენება `totalAmount`-ის გამოსათვლელად. |
| `precision` | `2` | derived ჯამის ათობითი ციფრების რაოდენობა. |

---

### Step 10 — UI ქცევა და ლეიბლები (`ui`, არჩევითია)

**Behavior flags**

| ველი | Default | ახსნა |
| ---- | ------- | ----- |
| `popularSlice` | `7` | Popular ტაბის მაქსიმუმი თამაშების რაოდენობა. |
| `preserveActiveTab` | `true` | reload-ის შემდეგ ცდილობს იგივე provider tab გააქტიუროს. |
| `clearSelectedGameOnProviderChange` | `true` | provider tab-ის შეცვლისას ხსნის არჩეულ თამაშს. |
| `autoSelectFirstActiveGame` | `false` | load-ის შემდეგ ავტომატურად აარჩევს მიმდინარე ტაბის პირველ აქტიურ თამაშს. |
| `closeOnOverlayClick` | `true` | overlay-ზე კლიკი ხურავს modal-ს. |
| `closeOnEscape` | `true` | `Escape`-ის ჩამოჭერა ხურავს modal-ს. |
| `trapFocus` | `true` | open მდგომარეობაში keyboard focus რჩება modal-ის შიგნით. |

**`labels`**

| key | Default | სად ჩანს |
| --- | ------- | -------- |
| `title` | `"Redeem"` | dialog-ის ჰედერი/accessible სახელი. |
| `popular` | `"Popular Games"` | Popular ტაბის სახელი. |
| `redeem` | `"Redeem"` | მთავარი ღილაკი. |
| `close` | `"Close"` | close ღილაკი. |
| `emptyValue` | `"--"` | footer-ი, როცა თამაში არ არის არჩეული. ამ დროს ჩანს მხოლოდ ეს ლეიბლი; თამაშის არჩევის შემდეგ footer იცვლება `"{amount} x {value}"`-ად. |

---

### Step 11 — Theme (`theme`, არჩევითია)

**`classPrefix`** (default `"rw"`)

- ყველა widget CSS კლასის prefix-ი (`rw-modal`, `rw-game`...). state კლასები (`is-open`, `is-active`...) prefix-ის გარეშეა.

**`tokens`** (`Partial<ThemeTokens>`)

- დიზაინის ტოკენების map (color/radius/background/font), რომელიც გადადის widget-ის shell-ზე CSS custom properties-ად (`--rw-modal-bg`, `--rw-radius-md` და ა.შ.). იყენე ბრენდინგისთვის package CSS-ის შეცვლის გარეშე.

**Provider / game backgrounds კონფიგიდან**

- `providerBackgrounds`, `providerActiveBackgrounds` — `providerId` → ნებისმიერი CSS `background` მნიშვნელობა.
- `providerIconBackgrounds`, `providerIconBackgroundsByClass` — პატარა icon სახელის წინ; პროვაიდერის სიის `[icon][name]` ლეიაუტისთვის. resolve-დება `providerId`-ით ან `ProviderDefinition.icon` კლასით.
- `gameBackgrounds`, `gameBackgroundsByClass` — `game.id` ან `imgClass` → CSS `background`.
- `providerBackgroundList`, `providerIconBackgroundList`, `gameBackgroundList` — array ფორმატი (დინამიკური გენერაციისთვის მოსახერხებელია).

**თამაშის background resolve თანმიმდევრობა**

1. `theme.gameBackgrounds[game.id]`
2. `theme.gameBackgroundList` (`gameId`-ით)
3. `theme.gameBackgroundsByClass[game.imgClass]`
4. `theme.gameBackgroundList` (`imgClass`-ით)
5. ჩაშენებული CSS / host override

---

### Step 12 — Hooks (`hooks`, არჩევითია)

| hook | როდის ეშვება |
| ---- | ------------ |
| `onOpen` | modal გაიხსნა (`open()`). |
| `onClose` | modal დაიხურა (`close()` / overlay / Esc). |
| `onSelect` | მომხმარებელმა აირჩია თამაში. |
| `onDataLoaded` | ბანკის canonical payload მზადაა. |
| `onRedeemSuccess` | redeem წარმატებული. |
| `onRedeemError` | redeem ჩავარდა. |

hooks გამოიყენე გვერდის სხვა ნაწილების სინქრონიზაციისთვის (counter-ები, toast-ები, analytics).

---

### Step 13 — instance API (`createRedeemWidget`-ის შემდეგ)

| მეთოდი | რას აკეთებს |
| ------ | ----------- |
| `mount(selectorOrElement)` | აერთებს widget DOM-ს. |
| `open()` | აჩვენებს modal-ს. |
| `close()` | მალავს modal-ს. |
| `reload()` | ხელახლა მოითხოვს ბანკის მონაცემებს. |
| `destroy()` | წაშლა + listener-ების მოხსნა. |

**`RedeemConfigApp` დამატებითი ოპციები**

| მეთოდი / ოპცია | ახსნა |
| --------------- | ----- |
| `init(config)` | ქმნის widget-ს, mount-ავს (გარდა `autoMount: false`-ისა), აბამს `openButtonSelector`-ს. |
| `getInstance()` | აბრუნებს მიმდინარე instance-ს ან `null`. |
| `destroy()` | ანადგურებს instance-ს + open-button listener-ს. |
| `mountTo` | mount-ის სელექტორი/ელემენტი (default `#redeem-widget-root`). |
| `openButtonSelector` | CSS selector — კლიკი იძახებს `open()`. |
| `autoMount` | default `true`. `false`, თუ `mount()`-ს ხელით იძახებ. |
| `openOnInit` | `true` — init-ის შემდეგ მაშინვე გახსნა. |

---

### Step 14 — runtime ვალიდაცია

`createRedeemWidget` startup-ზე ამოწმებს მინიმუმ:

- `endpoints.bank` / `endpoints.redeem` უნდა იყოს
- `getContext`, `normalize` უნდა იყოს ფუნქცია
- `providers` / `games` უნდა იყოს მასივი

ცდომილების შემთხვევაში წერს მკაფიო error-ს — გაასწორე ზუსტად ის ველი, რომელიც error-ში წერია.

---

### Step 15 — Go-live შემოწმების სია

1. DevTools **Network**: ბანკის request აბრუნებს 200-ს და სწორ JSON-ს.
2. **Console**: `init` / `mount` დროს არ არის exception-ი.
3. **Redeem** ღილაკი (ან `open()`): modal იხსნება, focus გადადის შიგნით.
4. თამაშის არჩევა: footer იცვლება, **Redeem** ღილაკი ენთება rules-ის შესაბამისად.
5. Redeem-ის გაშვება: success hook მუშაობს, bank refresh-ხდება.

---

### რეკომენდებული თანმიმდევრობა სხვა პროექტიდან კონფიგის გადატანისას

1. გადააკოპირე `endpoints` (ან facade-ის `endpoint` / `redeemEndpoint`).
2. `getContext`-ის key-ები გაასწორე შენი backend-ის შესაბამისად.
3. დარწმუნდი, რომ `normalize` ემთხვევა შენი ბანკის JSON-ს (ერთხელ ჩართე `hooks.onDataLoaded` და დალოგე).
4. `games[].typeId` მიუსადაგე ბანკის key-ებს.
5. `rules` / `filters` / `bank` მიამთხვიე promo წესებს.
6. ბრენდინგისთვის დაამატე `theme.tokens` და/ან background map-ი.
7. დაამატე `hooks` ანალიტიკისთვის და UI sync-ისთვის.

---

## 7) CSS სტილის შეცვლა host პროექტში

ვიჯეტს მოაქვს მზადი CSS — `dist/redeem-widget.css`. host-ში 2 ვარიანტი გაქვს fork-ის გარეშე.

### A) override host პროექტიდან

ჯერ პაკეტის CSS, შემდეგ პროექტის override:

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

### B) class prefix-ის გადარქმევა

თუ `rw-` სხვა CSS-თან კონფლიქტობს:

```js
rw.createRedeemWidget({
  // ...
  theme: { classPrefix: "redeem" },
});
```

ახლა ყველა კლასი ხდება `redeem-*`.

> კლასების სრული სია, state modifier-ები (`is-open`, `is-active`, `is-selected`, `is-disabled`), `data-role` ატრიბუტები — `docs/THEMING.md`.

---

## 8) ვენდორის/თამაშის ბექგრაუნდები პირდაპირ კონფიგიდან

ცალკე CSS selector-ების გარეშე შეგიძლია `theme`-ში პირდაპირ მიუთითო.

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

თამაშის background resolve-ის პრიორიტეტი:

1. `theme.gameBackgrounds[game.id]`
2. `theme.gameBackgroundList` (`gameId`-ით)
3. `theme.gameBackgroundsByClass[game.imgClass]`
4. `theme.gameBackgroundList` (`imgClass`-ით)
5. default CSS

---

## 9) `RedeemConfigApp.init` — facade API

თუ გინდა უფრო მოკლე და ერთიანი init (legacy/PHP სცენარში):

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

`endpoint`/`redeemEndpoint` არის shorthand `endpoints.bank`/`endpoints.redeem`-ისთვის.  
`mountTo` — mount კონტეინერი (default `#redeem-widget-root`).  
`openButtonSelector` — CSS selector, click → `widget.open()`.  
`autoMount: false` — თუ mount-ი ხელით გინდა.  
`openOnInit: true` — init-ის შემდეგ მაშინვე გახსნა.

---

## 10) `theme.tokens` — სწრაფი ბრენდინგი

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

## 11) რეკომენდაციები სწორი მუშაობისთვის

1. **არასწორი endpoint სახელები** — დარწმუნდი, რომ `bank`/`redeem` ფაილები ზუსტად სწორია.
2. **ცარიელი `user_id` / `userHash`** — backend სავარაუდოდ დაგიბრუნებს error-ს.
3. **`window.ajax` არ არის** — `createAjaxTransport` ვერ იმუშავებს. ჩატვირთე ajax helper init-ამდე.
4. **`normalize` არასწორ ფორმატს აბრუნებს** — გამოიყენე `defaultBankNormalizer` ან გადაამოწმე custom mapper.
5. **`endpoints` შემცველი გზებით handler.php-ში** — გადატანე მხოლოდ ფაილის სახელი.
6. **CSS კონფლიქტი host-თან** — გადაარქვი `theme.classPrefix`.

---

## 12) როგორ დავტესტო სწრაფად

1. გახსენი გვერდი.
2. `#open-redeem` ღილაკზე დააკლიკე.
3. ნახე, იხსნება თუ არა modal.
4. DevTools Network: bank/redeem request `ajax()` გზით მიდის თუ არა.
5. `hooks.onDataLoaded` და `console.log`-ით გადაამოწმე normalize-ის გამოსავალი.
6. დააჭირე `Esc`-ს — modal უნდა დაიხუროს.

---

## 13) უსაფრთხოების მინიმალური წესები

- არასდროს ჩასვა რეალური secret-ი frontend კოდში.
- `userHash` / authorization ყოველთვის backend-ზე გადაამოწმე.
- widget-ის client-side შემოწმებები — UX, არა საბოლოო უსაფრთხოება.

---

## 14) დამატებითი დოკუმენტები

- ინგლისური მთავარი დოკი: `README.md`
- არქიტექტურა: `docs/ARCHITECTURE.md`
- სრული კონფიგი: `docs/CONFIGURATION.md`
- სტილი / თემინგი: `docs/THEMING.md`
- PHP ინტეგრაცია: `docs/INTEGRATION_PHP.md`
- React ინტეგრაცია: `docs/INTEGRATION_REACT.md`
- Git/deploy workflow: `docs/DEPLOYMENT.md`
- React/Node თავსებადობა: `docs/COMPATIBILITY.md`
- უსაფრთხოება: `docs/SECURITY.md`
- რელიზის ჩექლისტი: `docs/RELEASE.md`
