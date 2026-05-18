import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useSearch }         from "@/hooks/useSearch";
import { usePaginatedFetch } from "@/hooks/usepaginatedFetch";
import { useClientSort }     from "@/hooks/useclientSort";
import { useTableKeyboard }  from "@/hooks/useTableKeyboard";

import { SearchBar }           from "@/components/SearchBar";
import { SortableTableHeader } from "@/components/SortableTableHeader";
import { Pagination }          from "@/components/Pagination";

/**
 * StandardListPage
 * ================
 * The ONE layout shell for every admin list page.
 *
 * Required props
 * --------------
 * @param {string}   title             - Page heading e.g. "General Stock"
 * @param {string}   fetchEndpoint     - e.g. "/v1/api/admin/items/search"
 * @param {string}   suggestEndpoint   - e.g. "/v1/api/admin/items/suggestions"
 * @param {Array}    columns           - [{ key, label, type, width }]
 * @param {Function} renderRow         - (item, index, absoluteIndex, openItem) => JSX
 * @param {Function} renderMobileRow   - (item, openItem) => JSX
 *
 * Optional props
 * --------------
 * @param {string}   backPath          - navigate target for back button (default "/dashboard")
 * @param {string}   exportTable       - table name for Excel export
 * @param {Function} onExport          - custom export handler (overrides default)
 * @param {string}   mobileTitle       - mobile header label
 * @param {React.ComponentType} DetailDialog
 *                                     - dialog component receiving { isOpen, onOpenChange, itemId }
 * @param {number}   perPage           - items per page (default 10)
 *
 * API shape adapters (use when your API doesn't return the default shape)
 * -----------------------------------------------------------------------
 * @param {Function} dataExtractor     - (responseData) => Array
 *                                       default: (res) => res.data ?? res
 *                                       e.g. wholesalers: (res) => res.data?.wholesalers ?? []
 * @param {Function} totalExtractor    - (responseData) => number
 *                                       default: (res) => res.total ?? 0
 *                                       e.g. wholesalers: (res) => res.count ?? 0
 */
export default function StandardListPage({
  title,
  fetchEndpoint,
  suggestEndpoint,
  columns,
  renderRow,
  renderMobileRow,
  backPath       = "/report",
  exportTable,
  onExport,
  mobileTitle,
  DetailDialog,
  perPage        = 10,
  dataExtractor  = (res) => res.data ?? res,
  totalExtractor = (res) => res.total ?? 0,
  mapSuggestion,
  searchPlaceholder,
}) {
  const navigate = useNavigate();

  // ── Refs ────────────────────────────────────────────────────────────────────
  const searchInputRef = useRef(null);
  const listRef        = useRef(null);

  // ── Hooks ───────────────────────────────────────────────────────────────────
  const search = useSearch(suggestEndpoint, 250, mapSuggestion);

  const { items, currentPage, setCurrentPage, totalPages, totalItems, loading } =
    usePaginatedFetch(
      fetchEndpoint,
      search.activeQuery,
      perPage,
      dataExtractor,
      totalExtractor,
    );

  const { sortedItems, sortConfig, handleSort } = useClientSort(items, columns);

  // ── Local state ─────────────────────────────────────────────────────────────
  const [highlightedRow, setHighlightedRow] = useState(-1);
  const [selectedId,     setSelectedId]     = useState(null);
  const [isDialogOpen,   setIsDialogOpen]   = useState(false);

  const openItem = (id) => {
    setSelectedId(id);
    setIsDialogOpen(true);
  };

  // ── Export ───────────────────────────────────────────────────────────────────
  const handleExport = onExport ?? (async () => {
    if (!exportTable) return;
    try {
      const { default: axios }  = await import("axios");
      const { downloadAsExcel } = await import("@/lib/download-utils");
      const BASE_URL = import.meta.env.VITE_BACKEND_URL;
      const token    = localStorage.getItem("token");
      const res = await axios.get(
        `${BASE_URL}/admin/export/excel?table=${exportTable}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      downloadAsExcel(res.data.data, `${exportTable}_report`);
    } catch (err) {
      console.error("Excel export error", err);
    }
  });

  // ── Keyboard ─────────────────────────────────────────────────────────────────
  useTableKeyboard({
    ...search,
    searchInputRef,
    listRef,
    currentPage,
    totalPages,
    setCurrentPage,
    highlightedRow,
    setHighlightedRow,
    sortedItems,
    onOpenItem: openItem,
    onExport:   handleExport,
  });

  const startIndex = (currentPage - 1) * perPage;

  return (
    <>
      <div className="flex flex-1 flex-col bg-theme-50 gap-6 p-0 max-w-7xl mx-auto w-full">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex items-center bg-theme-50 gap-4 p-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(backPath)}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>

          <div className="flex justify-end w-full">
            <Button
              onClick={handleExport}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              title="Export Excel (Ctrl+E)"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* ── Sticky search + table header ──────────────────────────────────── */}
        <div className="sticky top-0 z-20 bg-theme-50">
          <SearchBar
            {...search}
            searchInputRef={searchInputRef}
            placeholder={searchPlaceholder}
          />

          <SortableTableHeader
            columns={columns}
            sortConfig={sortConfig}
            onSort={handleSort}
            mobileTitle={mobileTitle ?? title}
          />
        </div>

        {/* ── Scrollable list ───────────────────────────────────────────────── */}
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
                className={`border-b border-gray-100 transition-colors cursor-pointer ${
                  highlightedRow === index
                    ? "bg-theme-100 ring-1 ring-inset ring-theme-300"
                    : "hover:bg-theme-100"
                }`}
                onClick={() => setHighlightedRow(index)}
                onDoubleClick={() => openItem(item.id)}
              >
                {/* Desktop row — provided by page */}
                <div className="hidden md:block">
                  {renderRow(item, index, startIndex + index, openItem)}
                </div>

                {/* Mobile card — provided by page */}
                <div className="md:hidden">
                  {renderMobileRow(item, openItem)}
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              No items found.
            </div>
          )}
        </div>

        {/* ── Pagination ────────────────────────────────────────────────────── */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onChange={setCurrentPage}
        />
      </div>

      {/* ── Detail dialog — provided by page ────────────────────────────────── */}
      {DetailDialog && (
        <DetailDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          itemId={selectedId}
        />
      )}
    </>
  );
}