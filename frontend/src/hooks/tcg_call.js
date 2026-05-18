import { useState, useCallback } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_TCG_URL || "http://localhost:5001";

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
  const [status,  setStatus]  = useState(null);

  const call = useCallback(async ({ route, method = "GET", body = null, params = {} } = {}) => {
    const token = localStorage.getItem("tcg_token");

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const res = await axios({
        method,
        url:     `${BASE_URL}${route}`,
        headers: { Authorization: `Bearer ${token}` },
        params,
        data:    body,
      });

      setData(res.data);
      setStatus(res.status);
      return { data: res.data, status: res.status };

    } catch (err) {
      const resp = err?.response;
      const st = resp?.status || 500;
      setStatus(st);
      
      const msg =
        resp?.data?.message ||
        resp?.data?.error   ||
        "TCG server error.";
      setError(msg);
      return { data: null, status: st };
    } finally {
      setLoading(false);
    }
  }, []);

  return { call, data, loading, error, status };
}
