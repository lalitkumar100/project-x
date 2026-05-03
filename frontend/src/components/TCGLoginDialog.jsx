import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useTCGLogin } from "@/context/TCGLoginContext";
import { Eye, EyeOff, Loader2, X, ShieldCheck } from "lucide-react";

/* ─────────────────────────────────────────────
   TCGLoginDialog
   • Mounted once in MainLayout (always in the DOM)
   • Controlled by TCGLoginContext → useTCGLogin()
   • On success: saves token to localStorage as "tcg_token"
   • Background: backdrop-blur with dark overlay
───────────────────────────────────────────── */
export default function TCGLoginDialog() {
  const { isOpen, closeTCGLogin } = useTCGLogin();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setShowPass(false);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    closeTCGLogin();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const { data } = await axios.post(`${baseUrl}/v1/api/tcg/login`, {
        email:    email.trim(),
        password: password.trim(),
      });

      if (data.success && data.token) {
        localStorage.setItem("tcg_token", data.token);
        toast.success("TCG connected successfully!", {
          description: "TradeChainGuardian session is now active.",
        });
        handleClose();
      } else {
        setError(data.message || "Login failed. Please try again.");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Unable to connect to TCG server.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Backdrop click closes dialog ── */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  if (!isOpen) return null;

  return (
    /* ── Backdrop ── */
    <div
      onClick={handleBackdropClick}
      style={{
        position:        "fixed",
        inset:           0,
        zIndex:          9999,
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        backdropFilter:  "blur(8px) brightness(0.55)",
        WebkitBackdropFilter: "blur(8px) brightness(0.55)",
        backgroundColor: "rgba(0, 0, 20, 0.45)",
        animation:       "tcgFadeIn 0.2s ease",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        @keyframes tcgFadeIn   { from { opacity: 0 } to { opacity: 1 } }
        @keyframes tcgSlideUp  { from { opacity: 0; transform: translateY(28px) scale(0.97) }
                                  to   { opacity: 1; transform: translateY(0)    scale(1)    } }

        .tcg-card   { animation: tcgSlideUp 0.28s cubic-bezier(0.34,1.56,0.64,1) both; }

        .tcg-input  {
          width: 100%; box-sizing: border-box;
          padding: 11px 14px;
          border: 1.5px solid #d1d5db;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          background: #f9fafb;
          color: #111827;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .tcg-input:focus {
          border-color: #1d4ed8;
          box-shadow: 0 0 0 3px rgba(29,78,216,0.12);
          background: #fff;
        }
        .tcg-input::placeholder { color: #9ca3af; }

        .tcg-btn {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          letter-spacing: 0.3px;
          background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%);
          color: #fff;
          box-shadow: 0 4px 14px rgba(29,78,216,0.35);
          transition: opacity 0.18s, transform 0.14s, box-shadow 0.18s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .tcg-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(29,78,216,0.42);
        }
        .tcg-btn:active:not(:disabled) { transform: scale(0.98); }
        .tcg-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .tcg-eye-btn {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #6b7280; padding: 2px;
          display: flex; align-items: center;
          transition: color 0.15s;
        }
        .tcg-eye-btn:hover { color: #1d4ed8; }

        .tcg-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 10px 13px;
          font-size: 13px;
          color: #dc2626;
          font-family: 'Inter', sans-serif;
        }

        .tcg-divider {
          display: flex; align-items: center; gap: 10px;
          margin: 6px 0;
        }
        .tcg-divider::before, .tcg-divider::after {
          content: ''; flex: 1; height: 1px; background: #e5e7eb;
        }
        .tcg-divider span {
          font-size: 11px; color: #9ca3af;
          font-family: 'Inter', sans-serif; white-space: nowrap;
        }
      `}</style>

      {/* ── Dialog Card ── */}
      <div
        className="tcg-card"
        style={{
          background:   "#fff",
          borderRadius: "20px",
          width:        "100%",
          maxWidth:     "420px",
          margin:       "16px",
          boxShadow:    "0 25px 60px rgba(0,0,30,0.28), 0 0 0 1px rgba(29,78,216,0.08)",
          overflow:     "hidden",
          fontFamily:   "'Inter', sans-serif",
        }}
      >
        {/* ── Top accent bar ── */}
        <div style={{
          height: "4px",
          background: "linear-gradient(90deg, #1e40af 0%, #dc2626 50%, #1e40af 100%)",
          backgroundSize: "200% 100%",
        }} />

        {/* ── Card Body ── */}
        <div style={{ padding: "32px 32px 28px" }}>

          {/* ── Close button ── */}
          <button
            onClick={handleClose}
            style={{
              position: "absolute", top: 0, right: 0,
              /* relative to card — use flex header instead */
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "4px" }}>
            <button
              onClick={handleClose}
              style={{
                background: "#f3f4f6", border: "none", borderRadius: "8px",
                padding: "6px", cursor: "pointer", color: "#6b7280",
                display: "flex", alignItems: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#e5e7eb"}
              onMouseLeave={e => e.currentTarget.style.background = "#f3f4f6"}
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>
          </div>

          {/* ── Logo + Branding ── */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <img
              src="/PROJECT-X/TCG_logo.png"
              alt="TradeChainGuardian logo"
              style={{
                width: "90px",
                height: "90px",
                objectFit: "contain",
                marginBottom: "14px",
                filter: "drop-shadow(0 4px 12px rgba(29,78,216,0.18))",
              }}
            />

            {/* Brand name: Trade[blue] Chain[red] Guardian[blue] */}
            <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.3px", lineHeight: 1.2 }}>
              <span style={{ color: "#1d4ed8" }}>Trade</span>
              <span style={{ color: "#dc2626" }}>Chain</span>
              <span style={{ color: "#1d4ed8" }}>Guardian</span>
            </div>

            <div style={{
              marginTop: "6px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
              fontSize: "12px", color: "#6b7280", fontWeight: 500,
            }}>
              <ShieldCheck size={13} style={{ color: "#1d4ed8" }} />
              Secure server authentication
            </div>
          </div>

          <div className="tcg-divider">
            <span>Sign in to TCG</span>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                Email address
              </label>
              <input
                id="tcg-email"
                className="tcg-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="tcg-password"
                  className="tcg-input"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ paddingRight: "42px" }}
                />
                <button
                  type="button"
                  className="tcg-eye-btn"
                  onClick={() => setShowPass(p => !p)}
                  tabIndex={-1}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="tcg-error">
                ⚠ {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="tcg-login-submit"
              type="submit"
              className="tcg-btn"
              disabled={loading}
              style={{ marginTop: "4px" }}
            >
              {loading
                ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Connecting…</>
                : <><ShieldCheck size={16} /> Connect to TCG</>
              }
            </button>

          </form>

          {/* ── Footer ── */}
          <p style={{
            marginTop: "20px", textAlign: "center",
            fontSize: "11.5px", color: "#9ca3af",
          }}>
            Your credentials are encrypted in transit &amp; never stored locally.
          </p>
        </div>
      </div>

      {/* Spinner keyframe (for Loader2) */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
