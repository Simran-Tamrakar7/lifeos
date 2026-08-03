"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { useLifeOSStore } from "@/stores/use-lifeos-store";

function StoreHydration({ children }: { children: React.ReactNode }) {
  const hydrated = useLifeOSStore((s) => s.hydrated);
  const setHydrated = useLifeOSStore((s) => s.setHydrated);
  const accent = useLifeOSStore((s) => s.settings.accent);

  useEffect(() => {
    if (useLifeOSStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useLifeOSStore.persist.onFinishHydration(() => setHydrated(true));
    const t = setTimeout(() => setHydrated(true), 300);
    return () => {
      unsub();
      clearTimeout(t);
    };
  }, [setHydrated]);

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
  }, [accent]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          <p className="text-sm text-[var(--fg-muted)]">Booting LifeOS…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={client}>
        <StoreHydration>{children}</StoreHydration>
        <Toaster theme="system" position="bottom-right" richColors closeButton />
      </QueryClientProvider>
    </NextThemesProvider>
  );
}
