import { defaultGames, defaultProviders } from "./defaultCatalog";
import type {
  BankConfig,
  FiltersConfig,
  GameDefinition,
  ProviderDefinition,
  RenderProvider,
  RulesConfig,
  ThemeConfig,
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
  preserveActiveTab: true,
  clearSelectedGameOnProviderChange: true,
  autoSelectFirstActiveGame: false,
  closeOnOverlayClick: true,
  closeOnEscape: true,
  trapFocus: true,
  labels: {
    title: "Redeem",
    popular: "Popular Games",
    redeem: "Redeem",
    close: "Close",
    emptyValue: "--",
  },
};

export const defaultThemeConfig: ThemeConfig = {
  classPrefix: "rw",
  tokens: {
    overlayBackground: "rgba(10, 13, 28, 0.6)",
    modalBackground: "#0e1325",
    modalBorderColor: "#253159",
    textColor: "#ffffff",
    fontFamily: '"AdjaraSemiBold", "Helvetica Neue", Arial, sans-serif',
    providerBackground: "linear-gradient(159.58deg, #343748 12.59%, #161721 75.9%)",
    providerActiveBackground: "linear-gradient(180deg, #54578d 0%, #4f4181 49.16%, #2f1b4f 100%)",
    gameBackground: "#383a49",
    gameSelectedBackground: "linear-gradient(180deg, #039855 -105.26%, #01321c 100%)",
    footerBackground: "linear-gradient(269.27deg, #161722 23.78%, #383a49 99.5%)",
    selectionBackground: "linear-gradient(174.6deg, #1b1c2c 14.9%, #036036 120.33%)",
    actionPrimaryBackground: "#039855",
    actionPrimaryHoverBackground: "#047a47",
    borderRadiusSm: "6px",
    borderRadiusMd: "8px",
    borderRadiusLg: "12px",
  },
  providerBackgrounds: {},
  providerActiveBackgrounds: {},
  providerIconBackgrounds: {},
  providerIconBackgroundsByClass: {},
  gameBackgrounds: {},
  gameBackgroundsByClass: {},
  providerBackgroundList: [],
  providerIconBackgroundList: [],
  gameBackgroundList: [],
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
