# React Integration

## Wrapper Component

Package exposes a React wrapper at:

- `@redeem/widget/react`

This wrapper mounts/unmounts the widget safely via React lifecycle hooks.

## Example

```tsx
import { useMemo, useState } from "react";
import { RedeemWidget } from "@redeem/widget/react";
import { defaultBankNormalizer, defaultGames, defaultProviders } from "@redeem/widget";
import "@redeem/widget/styles.css";

export function RedeemContainer() {
  const [isOpen, setIsOpen] = useState(false);

  const config = useMemo(
    () => ({
      endpoints: {
        bank: "/api/redeem/bank",
        redeem: "/api/redeem/submit",
      },
      getContext: () => ({
        user_id: window.currentUserId,
        token: window.csrfToken,
      }),
      normalize: defaultBankNormalizer,
      providers: defaultProviders,
      games: defaultGames,
    }),
    [],
  );

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open Redeem
      </button>
      <RedeemWidget config={config} isOpen={isOpen} />
    </>
  );
}
```

## SSR Guidance

- Create/mount widget only on client side.
- Avoid direct `window/document` usage in config during SSR render.
