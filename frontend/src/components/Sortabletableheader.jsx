import React from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

function SortIcon({ colKey, sortConfig }) {
  if (sortConfig.key !== colKey)
    return <ArrowUpDown className="inline ml-1 h-3 w-3 text-teal-400" />;
  return sortConfig.dir === "asc"
    ? <ArrowUp   className="inline ml-1 h-3 w-3 text-teal-700" />
    : <ArrowDown className="inline ml-1 h-3 w-3 text-teal-700" />;
}

/**
 * SortableTableHeader
 * -------------------
 * Renders the sticky column header row for a list page.
 *
 * @param {Array}    columns      - [{ key, label, width }]
 * @param {object}   sortConfig   - { key, dir }
 * @param {Function} onSort       - (key) => void
 * @param {string}   mobileTitle  - heading shown on mobile
 * @param {boolean}  showAction   - show the Action column (default true)
 */
export function SortableTableHeader({
  columns,
  sortConfig,
  onSort,
  mobileTitle = "Items",
  showAction = true,
}) {
  return (
    <div className="bg-theme-200 border-b border-theme-200">
      {/* Desktop */}
      <div className="hidden md:grid grid-cols-10 gap-2 p-4 font-semibold text-teal-800 text-sm">
        <div className="text-center col-span-1">S.No</div>

        {columns.map((col) => (
          <button
            key={col.key}
            onClick={() => onSort(col.key)}
            className={`${col.width} text-left hover:text-teal-600 flex items-center gap-1 transition-colors select-none`}
          >
            {col.label}
            <SortIcon colKey={col.key} sortConfig={sortConfig} />
          </button>
        ))}

        {showAction && (
          <div className="text-center col-span-1">Action</div>
        )}
      </div>

      {/* Mobile */}
      <div className="md:hidden p-4 font-semibold text-teal-800 text-center">
        {mobileTitle}
      </div>
    </div>
  );
}