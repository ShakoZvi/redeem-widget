import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { canonicalBankNormalizer, defaultBankNormalizer } from "../src/adapters/defaultBankNormalizer";

function readJsonFixture<T>(fileName: string): T {
  const file = resolve(process.cwd(), "tests/fixtures", fileName);
  return JSON.parse(readFileSync(file, "utf-8")) as T;
}

describe("defaultBankNormalizer", () => {
  it("maps legacy response into canonical payload", () => {
    const fixture = readJsonFixture<unknown>("legacy-bank-success.json");
    const result = defaultBankNormalizer(fixture);

    expect(result.totalFreespins).toBe(8);
    expect(result.games[1]?.amount).toBe(5);
    expect(result.games[20]?.massPrizeValue).toBe(0.4);
  });

  it("canonicalBankNormalizer keeps canonical payload", () => {
    const fixture = readJsonFixture<unknown>("canonical-bank-success.json");
    const result = canonicalBankNormalizer(fixture);

    expect(result.totalFreespins).toBe(12);
    expect(result.games[1]?.eligibleFrsp).toBe(1);
  });
});
