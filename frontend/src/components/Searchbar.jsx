import React, { useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * SearchBar
 * ---------
 * Controlled search input with autocomplete dropdown and keyboard tips.
 *
 * Props mirror the state from useSearch() — just spread the hook result:
 *   <SearchBar {...search} searchInputRef={ref} onCommit={commitSearch} />
 */
export function SearchBar({
  searchTerm,
  suggestions,
  showSuggestions,
  setShowSuggestions,
  suggIndex,
  setSuggIndex,
  setSearchFocused,
  handleInputChange,
  commitSearch,
  clearSearch,
  setSearchTerm,
  searchInputRef,
  placeholder = "Search... (Enter to search, Shift+Enter to focus)",
}) {
  return (
    <div className="border-b border-gray-200 p-4">
      <div className="relative max-w-md w-full">
        {/* Search icon */}
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 z-10 pointer-events-none" />

        <Input
          ref={searchInputRef}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            setSearchFocused(true);
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setSearchFocused(false);
              setShowSuggestions(false);
            }, 150);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (showSuggestions && suggIndex >= 0) {
                const selected = suggestions[suggIndex];
                setSearchTerm(selected?.value ?? selected?.label ?? "");
                setShowSuggestions(false);
                setSuggIndex(-1);
              } else {
                commitSearch();
              }
            }
          }}
          placeholder={placeholder}
          className="pl-10 pr-10 w-full border-cyan-200 focus:border-cyan-500"
        />

        {/* Clear button */}
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-cyan-200 rounded-md shadow-lg z-50 max-h-[200px] overflow-y-auto">
            {suggestions.map((suggestion, idx) => (
              <li
                key={suggestion?.id ?? `${suggestion?.value ?? "suggestion"}-${idx}`}
                onMouseDown={() => {
                  const selectedText = suggestion?.value ?? suggestion?.label ?? "";
                  setSearchTerm(selectedText);
                  setShowSuggestions(false);
                  setSuggIndex(-1);
                  commitSearch(selectedText);
                }}
                className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                  idx === suggIndex
                    ? "bg-cyan-100 text-cyan-900"
                    : "hover:bg-gray-50 text-gray-800"
                }`}
              >
                <div className="leading-tight">
                  <p className="font-medium">{suggestion?.label ?? suggestion?.value ?? ""}</p>
                  {suggestion?.secondary ? (
                    <p className="text-xs text-gray-500 mt-0.5">{suggestion.secondary}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Keyboard shortcut hints */}
      <p className="text-xs text-gray-400 mt-2">
        Tip:{" "}
        <kbd className="px-1 bg-gray-100 rounded">Shift+Enter</kbd> focus search &nbsp;
        <kbd className="px-1 bg-gray-100 rounded">Esc</kbd> back to list &nbsp;
        <kbd className="px-1 bg-gray-100 rounded">← →</kbd> pages &nbsp;
        <kbd className="px-1 bg-gray-100 rounded">↑ ↓</kbd> navigate rows &nbsp;
        <kbd className="px-1 bg-gray-100 rounded">Ctrl+E</kbd> export
      </p>
    </div>
  );
}