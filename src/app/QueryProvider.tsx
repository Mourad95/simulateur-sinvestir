"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PRICE_CACHE_TTL_MS } from "@/config/prices";

/**
 * Provider TanStack Query. Le QueryClient est créé une seule fois par montage
 * (via useState) pour éviter de le recréer à chaque rendu.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: PRICE_CACHE_TTL_MS, // l'historique journalier ne bouge pas en intra-day
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
