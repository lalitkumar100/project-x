import { useState, useRef } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

/**
 * useSearch
 * ---------
 * Manages search term, autocomplete suggestions, and committing a query.
 *
 * @param {string} suggestionsEndpoint  - e.g. "/v1/api/admin/items/suggestions"
 * @param {number} debounceMs           - debounce delay (default 250)
 *
 * Returns all state + handlers needed to wire up a SearchBar.
 */
export function useSearch(suggestionsEndpoint, debounceMs = 250, mapSuggestion) {
  const [searchTerm,      setSearchTerm]      = useState("");
  const [activeQuery,     setActiveQuery]      = useState("");
  const [suggestions,     setSuggestions]      = useState([]);
  const [showSuggestions, setShowSuggestions]  = useState(false);
  const [suggIndex,       setSuggIndex]        = useState(-1);
  const [searchFocused,   setSearchFocused]    = useState(false);
  const debounceRef = useRef(null);

  const fetchSuggestions = (value) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const res   = await axios.get(`${BASE_URL}${suggestionsEndpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
          params:  { q: value.trim() },
        });
        const raw = res.data.data ?? res.data ?? [];
        const normalized = raw
          .map((s) => {
            if (mapSuggestion) return mapSuggestion(s);
            if (typeof s === "string") {
              return { value: s, label: s, secondary: "" };
            }
            const name = s?.name ?? "";
            return { value: name, label: name, secondary: "" };
          })
          .filter(Boolean)
          .slice(0, 10);
        setSuggestions(normalized);
        setShowSuggestions(normalized.length > 0);
        setSuggIndex(-1);
      } catch (err) {
        console.error("[useSearch] Suggestion fetch error", err);
      }
    }, debounceMs);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    fetchSuggestions(val);
  };

  const commitSearch = (term) => {
    const q = term ?? searchTerm;
    setActiveQuery(q);
    setShowSuggestions(false);
    setSuggIndex(-1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveQuery("");
    setSuggIndex(-1);
  };

  return {
    searchTerm,
    setSearchTerm,
    activeQuery,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    suggIndex,
    setSuggIndex,
    searchFocused,
    setSearchFocused,
    handleInputChange,
    commitSearch,
    clearSearch,
  };
}