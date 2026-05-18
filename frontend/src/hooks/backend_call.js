import { useState, useCallback } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

/**
 * useBackendCall
 * --------------
 * Hook to call any backend API route.
 * Automatically reads `token` from localStorage.
 */
export function useBackendCall() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const call = useCallback(async ({ route, method = "GET", body = null, params = {} } = {}) => {
    const token = localStorage.getItem("token");

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
      return { data: res.data, status: res.status };

    } catch (err) {
      const resp = err?.response;
      const st = resp?.status || 500;
      
      const msg =
        resp?.data?.message ||
        resp?.data?.error   ||
        "Backend server error.";
      setError(msg);
      return { data: null, status: st };
    } finally {
      setLoading(false);
    }
  }, []);

  return { call, data, loading, error };
}
