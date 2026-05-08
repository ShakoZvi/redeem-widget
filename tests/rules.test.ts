import { describe, expect, it } from "vitest";
import { buildRenderProviders, calculateTotalFreespins } from "../src/core/rules";
import { defaultGames, defaultProviders } from "../src/core/defaultCatalog";
import { defaultBankConfig, defaultFilters, defaultRules } from "../src/core/state";

describe("rules engine", () => {
  it("calculates total from response mode", () => {
    const total = calculateTotalFreespins(
      {
        totalFreespins: 10,
        games: {},
      },
      defaultRules,
      defaultBankConfig,
    );
    expect(total).toBe(10);
  });

  it("builds render providers with active game", () => {
    const providers = buildRenderProviders(
      defaultProviders,
      defaultGames,
      {
        totalFreespins: 10,
        games: {
          1: { amount: 5, em: 1, eligibleFrsp: 1, massPrizeValue: 0.15 },
        },
      },
      10 * defaultBankConfig.unitValue,
      defaultRules,
      defaultFilters,
      7,
    );

    const popular = providers[0];
    expect(popular.provider.id).toBe("popular");
    expect(popular.games.length).toBeGreaterThan(0);
    expect(popular.games[0].active).toBe(true);
  });
});
