import { useState, useMemo } from "react";

/**
 * useClientSort
 * -------------
 * Client-side sort over a list of items.
 *
 * @param {Array}  items    - array to sort
 * @param {Array}  columns  - column definitions [{ key, type: "text"|"number" }]
 *
 * Returns { sortedItems, sortConfig, handleSort }
 */
export function useClientSort(items = [], columns = []) {
  const [sortConfig, setSortConfig] = useState({ key: null, dir: "asc" });

  const sortedItems = useMemo(() => {
    if (!sortConfig.key) return items;
    const col = columns.find((c) => c.key === sortConfig.key);
    return [...items].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      const cmp  = col?.type === "number"
        ? parseFloat(aVal ?? 0) - parseFloat(bVal ?? 0)
        : String(aVal ?? "").localeCompare(String(bVal ?? ""));
      return sortConfig.dir === "asc" ? cmp : -cmp;
    });
  }, [items, sortConfig, columns]);

  const handleSort = (key) =>
    setSortConfig((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );

  return { sortedItems, sortConfig, handleSort };
}