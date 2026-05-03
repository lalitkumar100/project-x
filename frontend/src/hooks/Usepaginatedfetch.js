import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:5000";

/**
 * usePaginatedFetch
 * -----------------
 * Generic hook for paginated + searchable server data.
 *
 * @param {string}   endpoint        - e.g. "/v1/api/admin/items/search"
 * @param {string}   query           - active search query (committed)
 * @param {number}   perPage         - items per page (default 10)
 * @param {Function} dataExtractor   - how to pull the array out of the response
 *                                     default: (res) => res.data ?? res
 *                                     wholesalers: (res) => res.data?.wholesalers ?? []
 * @param {Function} totalExtractor  - how to pull the total count out of the response
 *                                     default: (res) => res.total ?? 0
 *                                     wholesalers: (res) => res.count ?? res.data?.wholesalers?.length ?? 0
 *
 * Returns { items, currentPage, setCurrentPage, totalPages, totalItems, loading, refetch }
 */
export function usePaginatedFetch(
  endpoint,
  query       = "",
  perPage     = 10,
  dataExtractor  = (res) => res.data ?? res,
  totalExtractor = (res) => res.total ?? 0,
) {
  const [items,       setItems]       = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages,  setTotalPages]  = useState(0);
  const [totalItems,  setTotalItems]  = useState(0);
  const [loading,     setLoading]     = useState(false);

  const fetchItems = useCallback(async (page, q) => {
    setLoading(true);
    try {
      const token  = localStorage.getItem("token");
      const params = { page, limit: perPage };
      if (q?.trim()) params.q = q.trim();

      const res = await axios.get(`${BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const responseData = res.data;
      const extracted    = dataExtractor(responseData);
      const total        = totalExtractor(responseData);

      setItems(extracted);
      setTotalItems(total);
      setTotalPages(Math.ceil(total / perPage));
    } catch (err) {
      console.error(`[usePaginatedFetch] Error fetching ${endpoint}`, err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, perPage, dataExtractor, totalExtractor]);

  // Reset to page 1 whenever the query changes
  useEffect(() => { setCurrentPage(1); }, [query]);

  useEffect(() => {
    fetchItems(currentPage, query);
  }, [currentPage, query, fetchItems]);

  return {
    items,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    loading,
    refetch: () => fetchItems(currentPage, query),
  };
}