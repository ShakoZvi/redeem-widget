import { defaultGames, defaultProviders } from "./defaultCatalog";
import type {
  BankConfig,
  FiltersConfig,
  GameDefinition,
  ProviderDefinition,
  RenderProvider,
  RulesConfig,
  UIConfig,
  WidgetState,
} from "../types";

export const defaultRules: RulesConfig = {
  selectableMassPrizeValue: null,
  minAmountToEnable: 1,
  requireAffordableBalance: true,
  requireEligibleFrsp: false,
};

export const defaultFilters: FiltersConfig = {
  hideGamesWithoutApi: true,
  hideZeroAmountGames: false,
  hideProvidersWithoutGames: true,
};

export const defaultBankConfig: BankConfig = {
  totalFreespinsMode: "response",
  unitValue: 0.15,
  precision: 2,
};

export const defaultUIConfig: UIConfig = {
  popularSlice: 7,
  labels: {
    title: "Redeem",
    popular: "Popular Games",
    redeem: "Redeem",
    close: "Close",
    emptyValue: "--",
  },
};

export const defaultThemeConfig = {
  classPrefix: "rw",
};

export function createInitialState(): WidgetState {
  return {
    totalFreespins: 0,
    totalAmount: 0,
    selectedGameId: null,
    selectedProviderId: "popular",
    gamesByTypeId: {},
  };
}

export function resolveProviders(customProviders?: ProviderDefinition[]): ProviderDefinition[] {
  if (!customProviders || customProviders.length === 0) return defaultProviders;
  const hasPopular = customProviders.some((provider) => provider.id === "popular");
  return hasPopular
    ? customProviders
    : [{ id: "popular", name: "Popular Games", type: "freespin", active: true, sortOrder: 0 }, ...customProviders];
}

export function resolveGames(customGames?: GameDefinition[]): GameDefinition[] {
  return customGames && customGames.length > 0 ? customGames : defaultGames;
}

export function selectGame(renderProviders: RenderProvider[], selectedGameId: string | null) {
  if (!selectedGameId) return null;
  for (const providerData of renderProviders) {
    const game = providerData.games.find((item) => item.id === selectedGameId);
    if (game) return game;
  }
  return null;
}
