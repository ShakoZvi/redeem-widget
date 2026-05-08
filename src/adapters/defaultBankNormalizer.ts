import type { CanonicalBankPayload, GameBankInfo } from "../types";

interface LegacyBankResponse {
  status?: string;
  total_freespins?: number;
  data?: Record<string, Record<string, unknown>>;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toGameBankInfo(item: Record<string, unknown>): GameBankInfo {
  return {
    amount: toNumber(item.AMOUNT),
    em: toNumber(item.EM),
    eligibleFrsp: toNumber(item.ELIGIBLE_FRSP),
    massPrizeValue: toNumber(item.MASS_PRIZE_VALUE),
    descrpt: typeof item.DESCRPT === "string" ? item.DESCRPT : "",
    vendor: typeof item.VENDOR === "string" ? item.VENDOR : "",
  };
}

export function defaultBankNormalizer(raw: unknown): CanonicalBankPayload {
  const response = (raw || {}) as LegacyBankResponse;
  const rawData = response.data && typeof response.data === "object" ? response.data : {};
  const games: Record<number, GameBankInfo> = {};

  Object.entries(rawData).forEach(([typeId, item]) => {
    const parsedTypeId = Number(typeId);
    if (!Number.isFinite(parsedTypeId) || !item || typeof item !== "object") return;
    games[parsedTypeId] = toGameBankInfo(item);
  });

  return {
    totalFreespins: toNumber(response.total_freespins),
    games,
  };
}

export function canonicalBankNormalizer(raw: unknown): CanonicalBankPayload {
  const payload = (raw || {}) as CanonicalBankPayload;
  if (!payload.games || typeof payload.games !== "object") {
    return { totalFreespins: 0, games: {} };
  }
  return {
    totalFreespins: toNumber(payload.totalFreespins),
    games: payload.games,
  };
}
