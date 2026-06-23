"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Coin, CoinId } from "@/core/types";

/** Nombre max de résultats affichés (le reste s'atteint en affinant la recherche). */
const MAX_VISIBLE = 50;

/**
 * Combobox de recherche de crypto : input filtrable + liste des résultats.
 * Accessible au clavier, sans dépendance externe. Gère 2000+ paires via filtrage.
 */
export function CoinCombobox({
  coins,
  value,
  onChange,
  disabled,
}: {
  coins: readonly Coin[];
  value: CoinId;
  onChange: (id: CoinId) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = coins.find((coin) => coin.id === value);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = needle
      ? coins.filter(
          (coin) =>
            coin.symbol.toLowerCase().includes(needle) ||
            coin.name.toLowerCase().includes(needle),
        )
      : coins;
    return matches.slice(0, MAX_VISIBLE);
  }, [coins, query]);

  // Ferme la liste au clic en dehors du composant.
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const select = (coin: Coin) => {
    onChange(coin.id);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && open && results[activeIndex]) {
      event.preventDefault();
      select(results[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5 text-left text-text outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>
          {selected ? (
            <>
              <span className="font-medium">{selected.symbol}</span>
              <span className="ml-2 text-sm text-text-muted">{selected.name}</span>
            </>
          ) : (
            value
          )}
        </span>
        <span className="text-text-muted">▾</span>
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-full rounded-lg border border-border bg-surface-elevated shadow-xl">
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Rechercher (BTC, Bitcoin…)"
            className="w-full rounded-t-lg border-b border-border bg-transparent px-4 py-2.5 text-text outline-none placeholder:text-text-muted"
          />
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {results.length === 0 ? (
              <li className="px-4 py-3 text-sm text-text-muted">Aucun résultat.</li>
            ) : (
              results.map((coin, index) => (
                <li key={coin.id} role="option" aria-selected={coin.id === value}>
                  <button
                    type="button"
                    onClick={() => select(coin)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={
                      "flex w-full items-center justify-between px-4 py-2 text-left transition " +
                      (index === activeIndex ? "bg-brand/15" : "hover:bg-brand/10")
                    }
                  >
                    <span className="font-medium">{coin.symbol}</span>
                    <span className="text-sm text-text-muted">{coin.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
