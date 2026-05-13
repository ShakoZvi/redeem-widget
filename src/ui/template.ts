import type { RenderGame, RenderProvider, UIConfig } from "../types";

interface TemplateOptions {
  classPrefix: string;
  ui: UIConfig;
  providers: RenderProvider[];
  selectedProviderId: string | null;
  selectedGameId: string | null;
  isLoading: boolean;
}

function gameValueLabel(game: RenderGame): string {
  return `${game.value}₾`;
}

export function renderTemplate(options: TemplateOptions): string {
  const { classPrefix, ui, providers, selectedProviderId, selectedGameId, isLoading } = options;
  const activeProviderId = selectedProviderId || "popular";
  const activeProvider = providers.find((item) => item.provider.id === activeProviderId) || providers[0];
  const activeGames = activeProvider?.games || [];
  const selected = activeGames.find((item) => item.id === selectedGameId) || null;

  const providerButtons = providers
    .map((item) => {
      const isActive = item.provider.id === activeProviderId;
      return `<button type="button" class="${classPrefix}-provider ${isActive ? "is-active" : ""}" data-role="provider" data-provider-id="${item.provider.id}">${item.provider.name}</button>`;
    })
    .join("");

  const gameCards = activeGames
    .map((game) => {
      const disabled = !game.active;
      const selectedClass = game.id === selectedGameId ? "is-selected" : "";
      return `<button type="button" class="${classPrefix}-game ${selectedClass} ${disabled ? "is-disabled" : ""}" data-role="game" data-game-id="${game.id}" ${disabled ? "disabled" : ""}>
        <span class="${classPrefix}-game-image ${game.imgClass}" data-role="game-image" data-game-id="${game.id}" data-img-class="${game.imgClass}"></span>
        <span class="${classPrefix}-game-value">${gameValueLabel(game)}</span>
        <span class="${classPrefix}-game-amount">${game.amount}</span>
      </button>`;
    })
    .join("");

  const selectedAmount = selected ? selected.amount : ui.labels.emptyValue;
  const selectedValue = selected ? gameValueLabel(selected) : ui.labels.emptyValue;
  const titleId = `${classPrefix}-dialog-title`;

  return `
    <div class="${classPrefix}-overlay" data-role="overlay"></div>
    <div class="${classPrefix}-modal" data-role="dialog" role="dialog" aria-modal="true" aria-labelledby="${titleId}" tabindex="-1">
      <div class="${classPrefix}-header">
        <strong id="${titleId}">${ui.labels.title}</strong>
        <button type="button" data-role="close" class="${classPrefix}-close">${ui.labels.close}</button>
      </div>
      <div class="${classPrefix}-body">
        <div class="${classPrefix}-providers">${providerButtons}</div>
        <div class="${classPrefix}-games">${gameCards || `<div class="${classPrefix}-empty">No games</div>`}</div>
      </div>
      <div class="${classPrefix}-footer">
        <div class="${classPrefix}-selection">${selectedAmount} x ${selectedValue}</div>
        <button type="button" data-role="redeem" class="${classPrefix}-redeem" ${!selected || isLoading ? "disabled" : ""}>
          ${isLoading ? "..." : ui.labels.redeem}
        </button>
      </div>
    </div>
  `;
}
