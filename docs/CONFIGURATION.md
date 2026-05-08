# Configuration Reference

## createRedeemWidget(config)

### Required fields

- `endpoints.bank: string`
- `endpoints.redeem: string`
- `getContext: () => Record<string, unknown> | Promise<Record<string, unknown>>`
- `normalize: (raw) => CanonicalBankPayload`
- `providers: ProviderDefinition[]`
- `games: GameDefinition[]`

### Optional fields

- `rules`
- `filters`
- `bank`
- `ui`
- `theme`
- `transport`
- `hooks`

## Rules (`config.rules`)

- `selectableMassPrizeValue: number | null`
- `minAmountToEnable: number`
- `requireAffordableBalance: boolean`
- `requireEligibleFrsp: boolean`

## Filters (`config.filters`)

- `hideGamesWithoutApi: boolean`
- `hideZeroAmountGames: boolean`
- `hideProvidersWithoutGames: boolean`

## Bank (`config.bank`)

- `totalFreespinsMode: "response" | "sumAll" | "sumByMassPrizeValue"`
- `unitValue: number`
- `precision: number`

## UI (`config.ui`)

- `popularSlice: number`
- `labels.title: string`
- `labels.popular: string`
- `labels.redeem: string`
- `labels.close: string`
- `labels.emptyValue: string`

## Theme (`config.theme`)

- `classPrefix: string`

## Transport (`config.transport`)

Custom transport can replace `fetch`:

```ts
transport: async ({ url, method = "POST", body = {} }) => {
  return legacyClient(url, method, body);
};
```

## Hooks (`config.hooks`)

- `onOpen()`
- `onClose()`
- `onSelect(game)`
- `onDataLoaded(payload)`
- `onRedeemSuccess(response, game)`
- `onRedeemError(error, game)`
