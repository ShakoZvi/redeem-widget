import type { GameDefinition, ProviderDefinition } from "../types";

export const defaultProviders: ProviderDefinition[] = [
  { id: "popular", name: "Popular Games", type: "freespin", active: true, sortOrder: 0 },
  { id: "pragmatic", name: "Pragmatic", type: "freespin", active: true, sortOrder: 1 },
  { id: "egt", name: "EGT", type: "freespin", active: true, sortOrder: 2 },
  { id: "png", name: "PNG", type: "freespin", active: true, sortOrder: 3 },
  { id: "amatic", name: "Amatic", type: "freespin", active: true, sortOrder: 4 },
  { id: "tableGames", name: "P2P Games", type: "tableGames", active: true, sortOrder: 5 },
];

export const defaultGames: GameDefinition[] = [
  { id: "pem1", typeId: 1, providerId: "egt", imgClass: "burningHot", value: 0.15 },
  { id: "pem2", typeId: 2, providerId: "egt", imgClass: "burningHeart", value: 0.5 },
  { id: "pem3", typeId: 3, providerId: "egt", imgClass: "burningHot20", value: 1 },
  { id: "pem4", typeId: 4, providerId: "egt", imgClass: "shiningCrown", value: 2 },
  { id: "pem19", typeId: 19, providerId: "pragmatic", imgClass: "gatesOfOlympus", value: 0.2 },
  { id: "pem20", typeId: 20, providerId: "pragmatic", imgClass: "sweetBonanza", value: 0.4 },
  { id: "pem28", typeId: 28, providerId: "pragmatic", imgClass: "gatesOfOlympus", value: 1 },
  { id: "pem29", typeId: 29, providerId: "pragmatic", imgClass: "gatesOfOlympus", value: 2 },
  { id: "pem26", typeId: 26, providerId: "png", imgClass: "bookOfDead", value: 0.3 },
  { id: "pem21", typeId: 21, providerId: "png", imgClass: "reactoonz", value: 0.6 },
  { id: "pem30", typeId: 30, providerId: "amatic", imgClass: "wildDragon", value: 0.1 },
  { id: "pem31", typeId: 31, providerId: "amatic", imgClass: "wildDragon", value: 0.2 },
  { id: "pem32", typeId: 32, providerId: "amatic", imgClass: "allWaysCandy", value: 0.4 },
  { id: "pem49", typeId: 49, providerId: "tableGames", imgClass: "tableGames", value: 1 },
];
