# Architecture

## Overview

`@redeem/widget` is split into modular layers:

- `core`: rules engine, state defaults, and data shaping
- `ui`: self-rendered modal template and event interactions
- `adapters`: backend-response normalization
- `transports`: request abstraction (`fetch` by default)
- `react`: optional React wrapper

## Runtime Data Flow

1. Host initializes widget with config.
2. Widget loads bank data from `endpoints.bank`.
3. Adapter normalizes raw payload into canonical model.
4. Core rules compute active/disabled games and totals.
5. UI renders providers, games, and selection state.
6. User redeem action hits `endpoints.redeem`.
7. Widget reloads bank state after successful redeem.

## Design Principles

- Backend-agnostic: normalization layer isolates API shape differences.
- Host-agnostic: can run in plain JS, PHP-hosted pages, or React apps.
- Side-effect boundaries: network and hooks are explicit config fields.
- Safe defaults: all optional config sections have defaults in `core/state.ts`.

## Canonical Model

The canonical model is the contract between adapters and core logic:

- `totalFreespins`
- `gamesByTypeId` with amount/eligibility/activation metadata

All business rules run only on canonical data.

## Extension Strategy

To support a new backend contract:

1. Add a new adapter in `src/adapters`.
2. Map raw fields into canonical model.
3. Add fixture + tests in `tests/`.
4. Pass the adapter via `config.normalize`.
