import "./styles/redeem-widget.css";

export { createRedeemWidget } from "./widget";
export { RedeemConfigApp } from "./config-app";
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
  ThemeTokens,
  Transport,
  TransportRequest,
  UIConfig,
  WidgetState,
  RedeemConfigAppConfig,
} from "./types";
export type { LegacyAjaxFn } from "./transports/ajaxTransport";
