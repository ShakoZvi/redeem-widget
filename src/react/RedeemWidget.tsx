import { useEffect, useRef } from "react";
import { createRedeemWidget } from "../widget";
import type { RedeemWidgetConfig } from "../types";

interface RedeemWidgetProps {
  config: RedeemWidgetConfig;
  isOpen?: boolean;
  className?: string;
}

export function RedeemWidget({ config, isOpen = false, className }: RedeemWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<ReturnType<typeof createRedeemWidget> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    widgetRef.current = createRedeemWidget(config);
    widgetRef.current.mount(containerRef.current);

    return () => {
      widgetRef.current?.destroy();
      widgetRef.current = null;
    };
  }, [config]);

  useEffect(() => {
    if (!widgetRef.current) return;
    if (isOpen) widgetRef.current.open();
    else widgetRef.current.close();
  }, [isOpen]);

  return <div ref={containerRef} className={className} />;
}
