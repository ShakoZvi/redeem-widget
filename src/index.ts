import "./styles/redeem-widget.css";

export { createRedeemWidget } from "./widget";
export { defaultBankNormalizer, canonicalBankNormalizer } from "./adapters/defaultBankNormalizer";
export { defaultGames, defaultProviders } from "./core/defaultCatalog";
export { createAjaxTransport } from "./transports/ajaxTransport";

export type {
  BankConfig,
  CanonicalBankPayload,
  FiltersConfig,
  GameBankInfo,
  GameDefinition,
  ProviderDefinition,
  RedeemWidgetConfig,
  RenderGame,
  RenderProvider,
  RulesConfig,
  ThemeConfig,
  Transport,
  TransportRequest,
  UIConfig,
  WidgetState,
} from "./types";
export type { LegacyAjaxFn } from "./transports/ajaxTransport";
