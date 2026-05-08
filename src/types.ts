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
