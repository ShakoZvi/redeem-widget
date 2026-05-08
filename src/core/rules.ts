import type {
  BankConfig,
  CanonicalBankPayload,
  FiltersConfig,
  GameDefinition,
  GameBankInfo,
  ProviderDefinition,
  RenderGame,
  RenderProvider,
  RulesConfig,
} from "../types";

export function calculateTotalFreespins(payload: CanonicalBankPayload, rules: RulesConfig, bankConfig: BankConfig): number {
  if (bankConfig.totalFreespinsMode === "response") {
    return payload.totalFreespins || 0;
  }

  let total = 0;
  Object.values(payload.games).forEach((info) => {
    if (bankConfig.totalFreespinsMode === "sumByMassPrizeValue" && rules.selectableMassPrizeValue !== null) {
      if (Math.abs(info.massPrizeValue - rules.selectableMassPrizeValue) > 0.000001) {
        return;
      }
    }
    total += info.amount || 0;
  });

  return total;
}

function toRenderGame(
  game: GameDefinition,
  provider: ProviderDefinition,
  gameInfo: GameBankInfo | undefined,
  totalAmount: number,
  rules: RulesConfig,
): RenderGame | null {
  if (!gameInfo) {
    return null;
  }

  const amount = gameInfo.amount || 0;
  const withinAmountRule = amount >= rules.minAmountToEnable;
  const withinAffordability = !rules.requireAffordableBalance || game.value <= totalAmount + 0.000001;
  const withinEligibility = !rules.requireEligibleFrsp || gameInfo.eligibleFrsp === 1;
  const withinMassPrize =
    rules.selectableMassPrizeValue === null ||
    Math.abs((gameInfo.massPrizeValue || 0) - rules.selectableMassPrizeValue) < 0.000001;

  return {
    ...game,
    amount,
    active: gameInfo.em === 1 && withinAmountRule && withinAffordability && withinEligibility && withinMassPrize,
    eligibleFrsp: gameInfo.eligibleFrsp || 0,
    massPrizeValue: gameInfo.massPrizeValue || 0,
    providerType: provider.type,
  };
}

export function buildRenderProviders(
  providers: ProviderDefinition[],
  games: GameDefinition[],
  payload: CanonicalBankPayload,
  totalAmount: number,
  rules: RulesConfig,
  filters: FiltersConfig,
  popularSlice: number,
): RenderProvider[] {
  const byProviderId = new Map<string, ProviderDefinition>();
  providers.forEach((provider) => {
    if (provider.id !== "popular") {
      byProviderId.set(provider.id, provider);
    }
  });

  const providerGames = new Map<string, RenderGame[]>();
  byProviderId.forEach((_, providerId) => {
    providerGames.set(providerId, []);
  });

  const allRenderGames: RenderGame[] = [];
  games.forEach((game) => {
    const provider = byProviderId.get(game.providerId);
    if (!provider) return;
    const info = payload.games[game.typeId];
    if (!info && filters.hideGamesWithoutApi) return;
    const renderGame = toRenderGame(game, provider, info, totalAmount, rules);
    if (!renderGame) return;
    if (filters.hideZeroAmountGames && renderGame.amount <= 0) return;
    providerGames.get(game.providerId)?.push(renderGame);
    allRenderGames.push(renderGame);
  });

  const sortedProviders = [...providers]
    .filter((provider) => provider.id !== "popular")
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const result: RenderProvider[] = [];
  sortedProviders.forEach((provider) => {
    const items = providerGames.get(provider.id) || [];
    if (filters.hideProvidersWithoutGames && items.length === 0) return;
    result.push({ provider, games: items });
  });

  const popularProvider = providers.find((provider) => provider.id === "popular");
  if (popularProvider) {
    const popularGames = allRenderGames.slice(0, popularSlice);
    result.unshift({ provider: popularProvider, games: popularGames });
  }

  return result;
}
