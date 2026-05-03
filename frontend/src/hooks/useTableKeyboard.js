import { useEffect } from "react";

/**
 * useTableKeyboard
 * ----------------
 * Wires up all keyboard shortcuts for a list page:
 *   Shift+Enter  → focus search
 *   Esc          → blur search
 *   ↑ / ↓        → navigate rows (when search not focused)
 *   ← / →        → prev / next page (when search not focused)
 *   Enter        → open item at highlighted row
 *   ↑ / ↓        → navigate suggestions (when search focused)
 *   Enter        → commit search or pick suggestion (when search focused)
 *   Ctrl+E       → trigger export
 */
export function useTableKeyboard({
  searchFocused,
  showSuggestions,
  suggestions,
  suggIndex,
  setSuggIndex,
  searchTerm,
  setSearchTerm,
  setShowSuggestions,
  commitSearch,
  currentPage,
  totalPages,
  setCurrentPage,
  highlightedRow,
  setHighlightedRow,
  sortedItems,
  searchInputRef,
  listRef,
  onOpenItem,
  onExport,
}) {
  useEffect(() => {
    const scrollRowIntoView = (index) => {
      if (!listRef?.current) return;
      const rows = listRef.current.querySelectorAll("[data-row]");
      rows[index]?.scrollIntoView({ block: "nearest" });
    };

    const handler = (e) => {
      // ── Global shortcuts ──────────────────────────────────────────────────
      if (e.ctrlKey && e.key === "e") {
        e.preventDefault();
        onExport?.();
        return;
      }
      if (e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        searchInputRef?.current?.focus();
        return;
      }

      // ── Search focused ────────────────────────────────────────────────────
      if (searchFocused) {
        if (e.key === "Escape") {
          searchInputRef?.current?.blur();
          setShowSuggestions(false);
          return;
        }
        if (e.key === "ArrowDown" && showSuggestions) {
          e.preventDefault();
          setSuggIndex((i) => Math.min(i + 1, suggestions.length - 1));
          return;
        }
        if (e.key === "ArrowUp" && showSuggestions) {
          e.preventDefault();
          setSuggIndex((i) => Math.max(i - 1, -1));
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          if (showSuggestions && suggIndex >= 0) {
            const chosen = suggestions[suggIndex];
            setSearchTerm(chosen?.value ?? chosen?.label ?? "");
            setShowSuggestions(false);
            setSuggIndex(-1);
          } else {
            commitSearch();
          }
          return;
        }
        return; // let other keys type normally
      }

      // ── List focused ──────────────────────────────────────────────────────
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (currentPage < totalPages) setCurrentPage((p) => p + 1);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentPage > 1) setCurrentPage((p) => p - 1);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedRow((r) => {
          const next = Math.min(r + 1, sortedItems.length - 1);
          scrollRowIntoView(next);
          return next;
        });
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedRow((r) => {
          const next = Math.max(r - 1, 0);
          scrollRowIntoView(next);
          return next;
        });
        return;
      }
      if (e.key === "Enter" && highlightedRow >= 0) {
        e.preventDefault();
        onOpenItem?.(sortedItems[highlightedRow]?.id);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    searchFocused, showSuggestions, suggestions, suggIndex,
    searchTerm, currentPage, totalPages, highlightedRow, sortedItems,
  ]);
}