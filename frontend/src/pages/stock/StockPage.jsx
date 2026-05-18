import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ItemDetailsDialog } from "./ItemDetailsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X, Search, ChevronLeft, ChevronRight, ArrowLeft,
  FileSpreadsheet, ArrowUp, ArrowDown, ArrowUpDown,
} from "lucide-react";
import { downloadAsExcel } from "@/lib/download-utils";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

// ─── Column definitions ───────────────────────────────────────────────────────
const COLUMNS = [
  { key: "name", label: "Name", type: "text", width: "col-span-2" },
  { key: "brand", label: "Brand", type: "text", width: "col-span-1" },
  { key: "subcategory", label: "Subcategory", type: "text", width: "col-span-1" },
  { key: "quantity", label: "Qty", type: "number", width: "col-span-1" },
  { key: "total sold", label: "Qty sold", type: "number", width: "col-span-1" },
  { key: "warranty_months", label: "Warranty", type: "number", width: "col-span-1" },
  { key: "mrp", label: "MRP", type: "number", width: "col-span-1" },
];

// ─── Sort icon helper ─────────────────────────────────────────────────────────
function SortIcon({ colKey, sortConfig }) {
  if (sortConfig.key !== colKey)
    return <ArrowUpDown className="inline ml-1 h-3 w-3 text-teal-400" />;
  return sortConfig.dir === "asc"
    ? <ArrowUp className="inline ml-1 h-3 w-3 text-teal-700" />
    : <ArrowDown className="inline ml-1 h-3 w-3 text-teal-700" />;
}

export default function GeneralStockPage() {
  const navigate = useNavigate();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  // ── Search state ────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [activeQuery, setActiveQuery] = useState("");   // committed query
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggIndex, setSuggIndex] = useState(-1);   // highlighted suggestion

  // ── Sort state (client-side) ────────────────────────────────────────────────
  const [sortConfig, setSortConfig] = useState({ key: null, dir: "asc" });

  // ── Keyboard navigation ─────────────────────────────────────────────────────
  const [highlightedRow, setHighlightedRow] = useState(-1);   // -1 = none
  const [searchFocused, setSearchFocused] = useState(false);

  // ── Dialog state ────────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const searchInputRef = useRef(null);
  const suggDebounceRef = useRef(null);
  const listRef = useRef(null);

  // ── Fetch items ─────────────────────────────────────────────────────────────
  const fetchItems = useCallback(async (page = 1, q = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = { page, limit: itemsPerPage };
      if (q.trim()) params.q = q.trim();

      const res = await axios.get(`${BASE_URL}/v1/api/admin/items/search`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setItems(res.data.data ?? res.data);
      setTotalPages(Math.ceil((res.data.total ?? 0) / itemsPerPage));
      setTotalItems(res.data.total ?? 0);
      setHighlightedRow(-1);
    } catch (err) {
      console.error("Error fetching items", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchItems(currentPage, activeQuery);
  }, [currentPage, activeQuery, fetchItems]);

  // ── Fetch suggestions (debounced 250ms) ─────────────────────────────────────
  const fetchSuggestions = (value) => {
    if (suggDebounceRef.current) clearTimeout(suggDebounceRef.current);
    if (!value.trim()) { setSuggestions([]); setShowSuggestions(false); return; }

    suggDebounceRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/v1/api/admin/items/suggestions`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { q: value.trim() },
        });
        // API returns array of strings or objects; normalise to string[]
        const raw = res.data.data ?? res.data ?? [];
        const names = raw.map((s) => (typeof s === "string" ? s : s.name)).slice(0, 10);

        setSuggestions(names);
        setShowSuggestions(names.length > 0);
        setSuggIndex(-1);
      } catch (err) {
        console.error("Suggestion fetch error", err);
      }
    }, 250);
  };

  // ── Client-side sort ─────────────────────────────────────────────────────────
  const sortedItems = React.useMemo(() => {
    if (!sortConfig.key) return items;
    return [...items].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      const col = COLUMNS.find((c) => c.key === sortConfig.key);
      let cmp = 0;
      if (col?.type === "number") {
        cmp = parseFloat(aVal) - parseFloat(bVal);
      } else {
        cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""));
      }
      return sortConfig.dir === "asc" ? cmp : -cmp;
    });
  }, [items, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

  // ── Search input change ──────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    fetchSuggestions(val);
  };

  // ── Commit search ────────────────────────────────────────────────────────────
  const commitSearch = (term) => {
    const q = term ?? searchTerm;
    setActiveQuery(q);
    setCurrentPage(1);
    setShowSuggestions(false);
    setSuggIndex(-1);
  };

  // ── Excel export ─────────────────────────────────────────────────────────────
  const handleExcelReport = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${BASE_URL}/admin/export/excel?table=general_stock`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      downloadAsExcel(res.data.data, "general_stock_report");
    } catch (err) {
      console.error("Excel export error", err);
    }
  };

  // ── Open dialog ──────────────────────────────────────────────────────────────
  const openDialog = (id) => {
    setSelectedId(id);
    setIsDialogOpen(true);
  };

  // ── Global keyboard handler ──────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      // Ctrl+E → Excel export (anywhere)
      if (e.ctrlKey && e.key === "e") {
        e.preventDefault();
        handleExcelReport();
        return;
      }

      // Shift+Enter → focus search bar
      if (e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // ── When search bar is focused ──────────────────────────────────────────
      if (searchFocused) {
        if (e.key === "Escape") {
          // blur, stay on current page, keep text
          searchInputRef.current?.blur();
          setShowSuggestions(false);
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          if (showSuggestions)
            setSuggIndex((i) => Math.min(i + 1, suggestions.length - 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          if (showSuggestions)
            setSuggIndex((i) => Math.max(i - 1, -1));
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          if (showSuggestions && suggIndex >= 0) {
            // select highlighted suggestion
            const chosen = suggestions[suggIndex];
            setSearchTerm(chosen);
            setShowSuggestions(false);
            setSuggIndex(-1);
          } else {
            commitSearch();
          }
          return;
        }
        // Let other keys type normally
        return;
      }

      // ── When search bar is NOT focused ──────────────────────────────────────
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
        openDialog(sortedItems[highlightedRow]?.id);
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    searchFocused, showSuggestions, suggestions, suggIndex,
    searchTerm, currentPage, totalPages, highlightedRow, sortedItems,
  ]);

  const scrollRowIntoView = (index) => {
    if (!listRef.current) return;
    const rows = listRef.current.querySelectorAll("[data-row]");
    rows[index]?.scrollIntoView({ block: "nearest" });
  };

  const startIndex = (currentPage - 1) * itemsPerPage;

  return (
    <>
      <div className="flex flex-1 flex-col bg-theme-50 gap-6 p-0 max-w-7xl mx-auto w-full">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center bg-theme-50 gap-4 p-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">General Stock</h1>
          <div className="flex justify-end w-full">
            <Button
              onClick={handleExcelReport}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              title="Export Excel (Ctrl+E)"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        <div className="sticky top-0 z-20 bg-theme-50">

          {/* ── Search bar ────────────────────────────────────────────────── */}
          <div className="border-b border-gray-200 p-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
              <Input
                ref={searchInputRef}
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={() => {
                  setSearchFocused(true);
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  // slight delay so click on suggestion registers first
                  setTimeout(() => {
                    setSearchFocused(false);
                    setShowSuggestions(false);
                  }, 150);
                }}
                placeholder="Search items... (Enter to search, Shift+Enter to focus)"
                className="pl-10 pr-10 w-full border-cyan-200 focus:border-cyan-500"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSuggestions([]);
                    setShowSuggestions(false);
                    setActiveQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Suggestion Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-cyan-200 rounded-md shadow-lg z-50 max-h-[200px] overflow-y-auto">
                  {suggestions.map((name, idx) => (
                    <li
                      key={idx}
                      onMouseDown={() => {
                        setSearchTerm(name);
                        setShowSuggestions(false);
                        setSuggIndex(-1);
                      }}
                      className={`px-4 py-2 text-sm cursor-pointer transition-colors ${idx === suggIndex
                        ? "bg-cyan-100 text-cyan-900"
                        : "hover:bg-gray-50 text-gray-800"
                        }`}
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-2">
              Tip: <kbd className="px-1 bg-gray-100 rounded">Shift+Enter</kbd> focus search &nbsp;
              <kbd className="px-1 bg-gray-100 rounded">Esc</kbd> back to list &nbsp;
              <kbd className="px-1 bg-gray-100 rounded">← →</kbd> pages &nbsp;
              <kbd className="px-1 bg-gray-100 rounded">↑ ↓</kbd> navigate rows &nbsp;
              <kbd className="px-1 bg-gray-100 rounded">Ctrl+E</kbd> export
            </p>
          </div>

          {/* ── Table Header ──────────────────────────────────────────────── */}
          <div className="bg-theme-200 border-b border-theme-200">
            <div className="hidden md:grid grid-cols-10 gap-2 p-4 font-semibold text-teal-800 text-sm">
              <div className="text-center col-span-1">S.No</div>

              {COLUMNS.map((col) => (
                <button
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`${col.width} text-left hover:text-teal-600 flex items-center gap-1 transition-colors select-none`}
                >
                  {col.label}
                  <SortIcon colKey={col.key} sortConfig={sortConfig} />
                </button>
              ))}

              <div className="text-center col-span-1">Action</div>
            </div>

            <div className="md:hidden p-4 font-semibold text-teal-800 text-center">
              General Stock
            </div>
          </div>
        </div>

        {/* ── Scrollable List ──────────────────────────────────────────────── */}
        <div ref={listRef} className="flex-1 max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-400">
              Loading...
            </div>
          ) : sortedItems.length > 0 ? (
            sortedItems.map((item, index) => (
              <div
                key={item.id}
                data-row
                className={`border-b border-gray-100 transition-colors cursor-pointer ${highlightedRow === index
                  ? "bg-theme-100 ring-1 ring-inset ring-theme-300"
                  : "hover:bg-theme-100"
                  }`}
                onClick={() => setHighlightedRow(index)}
                onDoubleClick={() => openDialog(item.id)}
              >
                {/* Desktop */}
                <div className="hidden md:grid grid-cols-10 gap-2 p-4 items-center text-sm">
                  <div className="col-span-1 text-center text-gray-500">
                    {startIndex + index + 1}
                  </div>
                  <div className="col-span-2 font-medium text-gray-800 truncate">
                    {item.name}
                  </div>
                  <div className="col-span-1 text-gray-600 truncate">{item.brand}</div>
                  <div className="col-span-1 text-gray-600 truncate">{item.subcategory}</div>
                  <div className="col-span-1 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.quantity < 10
                      ? "bg-red-100 text-red-800"
                      : item.quantity < 30
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                      }`}>
                      {item.quantity}
                    </span>
                  </div>
                  <div className="col-span-1 text-center text-gray-600">
                    {item.total_items_sold}
                  </div>
                  <div className="col-span-1 text-center text-gray-600">
                    {item.warranty_months} mo
                  </div>
                  <div className="col-span-1 text-center font-semibold text-gray-800">
                    ₹{item.mrp}
                  </div>
                  <div className="col-span-1 text-center">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs rounded"
                      onClick={(e) => { e.stopPropagation(); openDialog(item.id); }}
                    >
                      View
                    </Button>
                  </div>
                </div>

                {/* Mobile */}
                <div className="md:hidden p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-800 text-sm">{item.name}</h3>
                      <p className="text-xs text-gray-500">{item.brand} · {item.subcategory}</p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs rounded ml-2"
                      onClick={(e) => { e.stopPropagation(); openDialog(item.id); }}
                    >
                      View
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div><span className="text-gray-500">Qty:</span> <span className="font-medium">{item.quantity}</span></div>
                    <div><span className="text-gray-500">Sold:</span> {item.total_items_sold}</div>
                    <div><span className="text-gray-500">Warranty:</span> {item.warranty_months} mo</div>
                    <div><span className="text-gray-500">MRP:</span> <span className="font-semibold">₹{item.mrp}</span></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              No items found.
            </div>
          )}
        </div>

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        <div className="sticky bottom-0 bg-theme-100 border-t border-gray-200 p-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} ({totalItems} items)
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="flex items-center gap-2 bg-transparent"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ItemDetailsDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        itemId={selectedId}
      />
    </>
  );
}