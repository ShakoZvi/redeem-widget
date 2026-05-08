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

export function createRedeemWidget(config: RedeemWidgetConfig): RedeemWidgetInstance {
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
  const theme = { ...defaultThemeConfig, ...(config.theme || {}) };

  const normalize = config.normalize || defaultBankNormalizer;
  const transport = config.transport || defaultFetchTransport;
  const state = createInitialState();

  let root: HTMLElement | null = null;
  let shell: HTMLElement | null = null;
  let renderProviders: RenderProvider[] = [];
  let isOpen = false;
  let isLoading = false;

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
    bindRootEvents();
  }

  function getSelectedGame() {
    return selectGame(renderProviders, state.selectedGameId);
  }

  function bindRootEvents() {
    if (!root) return;

    const closeElement = root.querySelector<HTMLElement>('[data-role="close"]');
    const overlayElement = root.querySelector<HTMLElement>('[data-role="overlay"]');
    const redeemElement = root.querySelector<HTMLElement>('[data-role="redeem"]');

    closeElement?.addEventListener("click", close);
    overlayElement?.addEventListener("click", close);
    redeemElement?.addEventListener("click", () => {
      void redeemSelection();
    });

    root.querySelectorAll<HTMLElement>('[data-role="provider"]').forEach((providerButton) => {
      providerButton.addEventListener("click", () => {
        const providerId = providerButton.dataset.providerId;
        if (!providerId) return;
        state.selectedProviderId = providerId;
        state.selectedGameId = null;
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
    if (!state.selectedProviderId) {
      state.selectedProviderId = renderProviders[0]?.provider.id || "popular";
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
    isOpen = true;
    applyShellState();
    config.hooks?.onOpen?.();
  }

  function close() {
    isOpen = false;
    applyShellState();
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

    void loadBank();
    applyShellState();
  }

  function destroy() {
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
