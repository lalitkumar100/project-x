import { useState, useCallback } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:5001";

/**
 * useTCGCall
 * ----------
 * Hook to call any TCG API route.
 * Automatically reads `tcg_token` from localStorage.
 *
 * Usage:
 *   const { call, data, loading, error } = useTCGCall();
 *
 *   // GET
 *   await call({ route: "/v1/api/tcg/workers" });
 *
 *   // GET with params
 *   await call({ route: "/v1/api/tcg/workers", params: { status: "active" } });
 *
 *   // POST with body
 *   await call({ route: "/v1/api/tcg/invoice", method: "POST", body: { amount: 500 } });
 *
 *   // PUT / PATCH / DELETE
 *   await call({ route: "/v1/api/tcg/invoice/5", method: "DELETE" });
 */
export function useTCGCall() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const call = useCallback(async ({ route, method = "GET", body = null, params = {} } = {}) => {
    const token = localStorage.getItem("tcg_token");

    setLoading(true);
    setError(null);

    try {
      const res = await axios({
        method,
        url:     `${BASE_URL}${route}`,
        headers: { Authorization: `Bearer ${token}` },
        params,
        data:    body,
      });

      setData(res.data);
      return res.data;

    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error   ||
        "TCG server error.";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { call, data, loading, error };
}
