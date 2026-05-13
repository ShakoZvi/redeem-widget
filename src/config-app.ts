import { createRedeemWidget } from "./widget";
import type { RedeemConfigAppConfig, RedeemWidgetConfig } from "./types";

interface RedeemWidgetInstance {
  mount: (container: string | HTMLElement) => void;
  open: () => void;
  close: () => void;
  reload: () => Promise<void>;
  destroy: () => void;
}

let activeInstance: RedeemWidgetInstance | null = null;
let openButtonCleanup: (() => void) | null = null;

function resolveWidgetConfig(input: RedeemConfigAppConfig): RedeemWidgetConfig {
  const bank = input.endpoints?.bank || input.endpoint;
  const redeem = input.endpoints?.redeem || input.redeemEndpoint;
  if (!bank || !redeem) {
    throw new Error("RedeemConfigApp.init error: provide endpoints.bank/endpoints.redeem or endpoint/redeemEndpoint.");
  }

  return {
    endpoints: { bank, redeem },
    getContext: input.getContext,
    normalize: input.normalize,
    providers: input.providers,
    games: input.games,
    rules: input.rules,
    filters: input.filters,
    bank: input.bank,
    ui: input.ui,
    theme: input.theme,
    transport: input.transport,
    hooks: input.hooks,
  };
}

function resolveMountTarget(input: RedeemConfigAppConfig): string | HTMLElement {
  return input.mountTo || "#redeem-widget-root";
}

function bindOpenButton(instance: RedeemWidgetInstance, selector?: string) {
  if (!selector) return;
  const button = document.querySelector<HTMLElement>(selector);
  if (!button) return;
  const onClick = () => instance.open();
  button.addEventListener("click", onClick);
  openButtonCleanup = () => button.removeEventListener("click", onClick);
}

export const RedeemConfigApp = {
  init(config: RedeemConfigAppConfig): RedeemWidgetInstance {
    if (activeInstance) {
      this.destroy();
    }

    const widgetConfig = resolveWidgetConfig(config);
    const instance = createRedeemWidget(widgetConfig);
    activeInstance = instance;

    if (config.autoMount !== false) {
      instance.mount(resolveMountTarget(config));
    }
    bindOpenButton(instance, config.openButtonSelector);

    if (config.openOnInit) {
      instance.open();
    }

    return instance;
  },
  getInstance(): RedeemWidgetInstance | null {
    return activeInstance;
  },
  destroy() {
    openButtonCleanup?.();
    openButtonCleanup = null;
    activeInstance?.destroy();
    activeInstance = null;
  },
};
