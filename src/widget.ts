import { defaultBankNormalizer } from "./adapters/defaultBankNormalizer";
import { buildRenderProviders, calculateTotalFreespins } from "./core/rules";
import {
  createInitialState,
  defaultBankConfig,
  defaultFilters,
  defaultRules,
  defaultThemeConfig,
  defaultUIConfig,
  resolveGames,
  resolveProviders,
  selectGame,
} from "./core/state";
import { defaultFetchTransport } from "./transports/defaultFetchTransport";
import type { CanonicalBankPayload, RedeemWidgetConfig, RenderProvider } from "./types";
import { renderTemplate } from "./ui/template";

interface RedeemWidgetInstance {
  mount: (container: string | HTMLElement) => void;
  open: () => void;
  close: () => void;
  reload: () => Promise<void>;
  destroy: () => void;
}

function validateConfig(config: RedeemWidgetConfig) {
  if (!config?.endpoints?.bank || !config?.endpoints?.redeem) {
    throw new Error("RedeemWidget config error: endpoints.bank and endpoints.redeem are required.");
  }
  if (typeof config.getContext !== "function") {
    throw new Error("RedeemWidget config error: getContext must be a function.");
  }
  if (typeof config.normalize !== "function") {
    throw new Error("RedeemWidget config error: normalize must be a function.");
  }
  if (!Array.isArray(config.providers) || !Array.isArray(config.games)) {
    throw new Error("RedeemWidget config error: providers and games must be arrays.");
  }
}

export function createRedeemWidget(config: RedeemWidgetConfig): RedeemWidgetInstance {
  validateConfig(config);
  const providers = resolveProviders(config.providers);
  const games = resolveGames(config.games);

  const rules = { ...defaultRules, ...(config.rules || {}) };
  const filters = { ...defaultFilters, ...(config.filters || {}) };
  const bank = { ...defaultBankConfig, ...(config.bank || {}) };
  const ui = {
    ...defaultUIConfig,
    ...(config.ui || {}),
    labels: {
      ...defaultUIConfig.labels,
      ...((config.ui || {}).labels || {}),
    },
  };
  const theme = {
    ...defaultThemeConfig,
    ...(config.theme || {}),
    tokens: {
      ...defaultThemeConfig.tokens,
      ...((config.theme || {}).tokens || {}),
    },
  };

  const normalize = config.normalize || defaultBankNormalizer;
  const transport = config.transport || defaultFetchTransport;
  const state = createInitialState();

  let root: HTMLElement | null = null;
  let shell: HTMLElement | null = null;
  let renderProviders: RenderProvider[] = [];
  let isOpen = false;
  let isLoading = false;
  let lastFocusedElement: HTMLElement | null = null;

  const classPrefix = theme.classPrefix;

  function getContainer(input: string | HTMLElement): HTMLElement {
    if (typeof input === "string") {
      const el = document.querySelector<HTMLElement>(input);
      if (!el) throw new Error(`RedeemWidget container not found: ${input}`);
      return el;
    }
    return input;
  }

  function applyShellState() {
    if (!shell) return;
    shell.classList.toggle("is-open", isOpen);
  }

  function applyThemeTokens() {
    if (!shell) return;
    const shellEl = shell;
    const tokens = theme.tokens;
    const cssVars: Array<[string, string | undefined]> = [
      ["--rw-overlay-bg", tokens.overlayBackground],
      ["--rw-modal-bg", tokens.modalBackground],
      ["--rw-modal-border", tokens.modalBorderColor],
      ["--rw-text-color", tokens.textColor],
      ["--rw-font-family", tokens.fontFamily],
      ["--rw-provider-bg", tokens.providerBackground],
      ["--rw-provider-active-bg", tokens.providerActiveBackground],
      ["--rw-game-bg", tokens.gameBackground],
      ["--rw-game-selected-bg", tokens.gameSelectedBackground],
      ["--rw-footer-bg", tokens.footerBackground],
      ["--rw-selection-bg", tokens.selectionBackground],
      ["--rw-action-primary-bg", tokens.actionPrimaryBackground],
      ["--rw-action-primary-hover-bg", tokens.actionPrimaryHoverBackground],
      ["--rw-radius-sm", tokens.borderRadiusSm],
      ["--rw-radius-md", tokens.borderRadiusMd],
      ["--rw-radius-lg", tokens.borderRadiusLg],
    ];

    cssVars.forEach(([name, value]) => {
      if (value) shellEl.style.setProperty(name, value);
    });
  }

  function getActiveProviderData() {
    const activeProviderId = state.selectedProviderId || "popular";
    return renderProviders.find((item) => item.provider.id === activeProviderId) || renderProviders[0] || null;
  }

  function redraw() {
    if (!root) return;
    root.innerHTML = renderTemplate({
      classPrefix,
      ui,
      providers: renderProviders,
      selectedProviderId: state.selectedProviderId,
      selectedGameId: state.selectedGameId,
      isLoading,
    });
    applyThemeStyles();
    bindRootEvents();
  }

  function applyThemeStyles() {
    if (!root) return;

    const providerBackgroundsFromList = new Map<string, string>();
    const providerActiveBackgroundsFromList = new Map<string, string>();
    for (const item of theme.providerBackgroundList) {
      providerBackgroundsFromList.set(item.providerId, item.background);
      if (item.activeBackground) {
        providerActiveBackgroundsFromList.set(item.providerId, item.activeBackground);
      }
    }

    const gameBackgroundsFromList = new Map<string, string>();
    const gameBackgroundsByClassFromList = new Map<string, string>();
    for (const item of theme.gameBackgroundList) {
      if (item.gameId) gameBackgroundsFromList.set(item.gameId, item.background);
      if (item.imgClass) gameBackgroundsByClassFromList.set(item.imgClass, item.background);
    }

    root.querySelectorAll<HTMLElement>('[data-role="provider"]').forEach((providerButton) => {
      const providerId = providerButton.dataset.providerId;
      if (!providerId) return;

      const isActive = providerButton.classList.contains("is-active");
      const activeBackground = theme.providerActiveBackgrounds[providerId] || providerActiveBackgroundsFromList.get(providerId);
      const defaultBackground = theme.providerBackgrounds[providerId] || providerBackgroundsFromList.get(providerId);
      const resolvedBackground = isActive ? activeBackground || defaultBackground : defaultBackground;

      if (resolvedBackground) {
        providerButton.style.background = resolvedBackground;
      } else {
        providerButton.style.removeProperty("background");
      }
    });

    root.querySelectorAll<HTMLElement>('[data-role="game-image"]').forEach((gameImage) => {
      const gameId = gameImage.dataset.gameId;
      const imgClass = gameImage.dataset.imgClass;
      const backgroundFromId = gameId ? theme.gameBackgrounds[gameId] || gameBackgroundsFromList.get(gameId) : undefined;
      const backgroundFromClass = imgClass
        ? theme.gameBackgroundsByClass[imgClass] || gameBackgroundsByClassFromList.get(imgClass)
        : undefined;
      const resolvedBackground = backgroundFromId || backgroundFromClass;

      if (resolvedBackground) {
        gameImage.style.background = resolvedBackground;
      } else {
        gameImage.style.removeProperty("background");
      }
    });
  }

  function getSelectedGame() {
    return selectGame(renderProviders, state.selectedGameId);
  }

  function getFocusableElements(): HTMLElement[] {
    if (!root) return [];
    const selector = [
      "button:not([disabled])",
      "[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");
    return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((el) => el.offsetParent !== null);
  }

  function focusModalStart() {
    if (!root) return;
    const closeButton = root.querySelector<HTMLElement>('[data-role="close"]');
    closeButton?.focus();
  }

  function handleGlobalKeyDown(event: KeyboardEvent) {
    if (!isOpen || !root) return;

    if (event.key === "Escape" && ui.closeOnEscape) {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== "Tab" || !ui.trapFocus) return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (!active || active === first || !root.contains(active)) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (!active || active === last || !root.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }

  function bindRootEvents() {
    if (!root) return;

    const closeElement = root.querySelector<HTMLElement>('[data-role="close"]');
    const overlayElement = root.querySelector<HTMLElement>('[data-role="overlay"]');
    const redeemElement = root.querySelector<HTMLElement>('[data-role="redeem"]');

    closeElement?.addEventListener("click", close);
    if (ui.closeOnOverlayClick) {
      overlayElement?.addEventListener("click", close);
    }
    redeemElement?.addEventListener("click", () => {
      void redeemSelection();
    });

    root.querySelectorAll<HTMLElement>('[data-role="provider"]').forEach((providerButton) => {
      providerButton.addEventListener("click", () => {
        const providerId = providerButton.dataset.providerId;
        if (!providerId) return;
        state.selectedProviderId = providerId;
        if (ui.clearSelectedGameOnProviderChange) {
          state.selectedGameId = null;
        }
        redraw();
      });
    });

    root.querySelectorAll<HTMLElement>('[data-role="game"]').forEach((gameButton) => {
      gameButton.addEventListener("click", () => {
        const gameId = gameButton.dataset.gameId;
        if (!gameId) return;
        state.selectedGameId = gameId;
        const selectedGame = getSelectedGame();
        if (selectedGame) config.hooks?.onSelect?.(selectedGame);
        redraw();
      });
    });
  }

  async function loadBank() {
    const previousProviderId = state.selectedProviderId;
    const previousGameId = state.selectedGameId;

    const context = await config.getContext();
    const raw = await transport({
      url: config.endpoints.bank,
      method: "POST",
      body: context,
    });
    const payload: CanonicalBankPayload = normalize(raw);
    config.hooks?.onDataLoaded?.(payload);

    state.gamesByTypeId = payload.games;
    state.totalFreespins = calculateTotalFreespins(payload, rules, bank);
    state.totalAmount = Number((state.totalFreespins * bank.unitValue).toFixed(bank.precision));

    renderProviders = buildRenderProviders(providers, games, payload, state.totalAmount, rules, filters, ui.popularSlice);

    const activeProviderStillExists = previousProviderId
      ? renderProviders.some((item) => item.provider.id === previousProviderId)
      : false;

    if (ui.preserveActiveTab && activeProviderStillExists) {
      state.selectedProviderId = previousProviderId;
    } else {
      state.selectedProviderId = renderProviders[0]?.provider.id || "popular";
    }

    const activeProvider = getActiveProviderData();
    const selectedStillExists =
      !!previousGameId && !!activeProvider?.games.some((game) => game.id === previousGameId && game.active);

    if (selectedStillExists) {
      state.selectedGameId = previousGameId;
    } else if (ui.autoSelectFirstActiveGame) {
      state.selectedGameId = activeProvider?.games.find((game) => game.active)?.id || null;
    } else {
      state.selectedGameId = null;
    }
    redraw();
  }

  async function redeemSelection() {
    const selectedGame = getSelectedGame();
    if (!selectedGame) return;

    try {
      isLoading = true;
      redraw();
      const context = await config.getContext();
      const response = await transport({
        url: config.endpoints.redeem,
        method: "POST",
        body: {
          ...context,
          prize_type_id: selectedGame.typeId,
        },
      });
      config.hooks?.onRedeemSuccess?.(response, selectedGame);
      await loadBank();
      close();
    } catch (error) {
      config.hooks?.onRedeemError?.(error, selectedGame);
    } finally {
      isLoading = false;
      redraw();
    }
  }

  function open() {
    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    isOpen = true;
    applyShellState();
    focusModalStart();
    config.hooks?.onOpen?.();
  }

  function close() {
    isOpen = false;
    applyShellState();
    lastFocusedElement?.focus();
    config.hooks?.onClose?.();
  }

  async function reload() {
    await loadBank();
  }

  function mount(container: string | HTMLElement) {
    const host = getContainer(container);
    shell = document.createElement("div");
    shell.className = `${classPrefix}-shell`;

    root = document.createElement("div");
    root.className = `${classPrefix}-root`;
    shell.appendChild(root);
    host.appendChild(shell);
    applyThemeTokens();

    document.addEventListener("keydown", handleGlobalKeyDown);

    void loadBank();
    applyShellState();
  }

  function destroy() {
    document.removeEventListener("keydown", handleGlobalKeyDown);
    if (shell?.parentElement) {
      shell.parentElement.removeChild(shell);
    }
    root = null;
    shell = null;
  }

  return {
    mount,
    open,
    close,
    reload,
    destroy,
  };
}
