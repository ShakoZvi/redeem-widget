export type ProviderType = "freespin" | "tableGames" | "cashPrize";

export interface ProviderDefinition {
  id: string;
  name: string;
  type: ProviderType;
  active?: boolean;
  sortOrder?: number;
}

export interface GameDefinition {
  id: string;
  typeId: number;
  providerId: string;
  imgClass: string;
  value: number;
  label?: string;
}

export interface GameBankInfo {
  amount: number;
  em: number;
  eligibleFrsp: number;
  massPrizeValue: number;
  descrpt?: string;
  vendor?: string;
}

export interface CanonicalBankPayload {
  totalFreespins: number;
  games: Record<number, GameBankInfo>;
}

export interface RulesConfig {
  selectableMassPrizeValue: number | null;
  minAmountToEnable: number;
  requireAffordableBalance: boolean;
  requireEligibleFrsp: boolean;
}

export interface FiltersConfig {
  hideGamesWithoutApi: boolean;
  hideZeroAmountGames: boolean;
  hideProvidersWithoutGames: boolean;
}

export interface BankConfig {
  totalFreespinsMode: "response" | "sumAll" | "sumByMassPrizeValue";
  unitValue: number;
  precision: number;
}

export interface UIConfig {
  popularSlice: number;
  preserveActiveTab: boolean;
  clearSelectedGameOnProviderChange: boolean;
  autoSelectFirstActiveGame: boolean;
  closeOnOverlayClick: boolean;
  closeOnEscape: boolean;
  trapFocus: boolean;
  labels: {
    title: string;
    popular: string;
    redeem: string;
    close: string;
    emptyValue: string;
  };
}

export interface ThemeConfig {
  classPrefix: string;
  tokens: Partial<ThemeTokens>;
  providerBackgrounds: Record<string, string>;
  providerActiveBackgrounds: Record<string, string>;
  gameBackgrounds: Record<string, string>;
  gameBackgroundsByClass: Record<string, string>;
  providerBackgroundList: Array<{
    providerId: string;
    background: string;
    activeBackground?: string;
  }>;
  gameBackgroundList: Array<{
    gameId?: string;
    imgClass?: string;
    background: string;
  }>;
}

export interface ThemeTokens {
  overlayBackground: string;
  modalBackground: string;
  modalBorderColor: string;
  textColor: string;
  fontFamily: string;
  providerBackground: string;
  providerActiveBackground: string;
  gameBackground: string;
  gameSelectedBackground: string;
  footerBackground: string;
  selectionBackground: string;
  actionPrimaryBackground: string;
  actionPrimaryHoverBackground: string;
  borderRadiusSm: string;
  borderRadiusMd: string;
  borderRadiusLg: string;
}

export interface RedeemWidgetConfig {
  endpoints: {
    bank: string;
    redeem: string;
  };
  getContext: () => Record<string, unknown> | Promise<Record<string, unknown>>;
  normalize: (rawBankResponse: unknown) => CanonicalBankPayload;
  providers: ProviderDefinition[];
  games: GameDefinition[];
  rules?: Partial<RulesConfig>;
  filters?: Partial<FiltersConfig>;
  bank?: Partial<BankConfig>;
  ui?: Partial<UIConfig>;
  theme?: Partial<ThemeConfig>;
  transport?: Transport;
  hooks?: {
    onOpen?: () => void;
    onClose?: () => void;
    onSelect?: (game: RenderGame) => void;
    onDataLoaded?: (payload: CanonicalBankPayload) => void;
    onRedeemSuccess?: (response: unknown, game: RenderGame) => void;
    onRedeemError?: (error: unknown, game: RenderGame) => void;
  };
}

export interface TransportRequest {
  url: string;
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
}

export type Transport = (request: TransportRequest) => Promise<unknown>;

export interface WidgetState {
  totalFreespins: number;
  totalAmount: number;
  selectedGameId: string | null;
  selectedProviderId: string | null;
  gamesByTypeId: Record<number, GameBankInfo>;
}

export interface RenderGame extends GameDefinition {
  amount: number;
  active: boolean;
  eligibleFrsp: number;
  massPrizeValue: number;
  providerType: ProviderType;
}

export interface RenderProvider {
  provider: ProviderDefinition;
  games: RenderGame[];
}

export interface RedeemConfigAppConfig extends Omit<RedeemWidgetConfig, "endpoints"> {
  endpoint?: string;
  redeemEndpoint?: string;
  endpoints?: {
    bank: string;
    redeem: string;
  };
  mountTo?: string | HTMLElement;
  openButtonSelector?: string;
  autoMount?: boolean;
  openOnInit?: boolean;
}
