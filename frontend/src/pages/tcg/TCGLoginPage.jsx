import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft, Lock } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   TCGLoginPage — Full standalone page at /admin/tcg/login
   • No sidebar / MainLayout
   • Premium split-screen design
   • Calls POST /v1/api/tcg/login
   • Saves token to localStorage as "tcg_token"
───────────────────────────────────────────────────────────── */
export default function TCGLoginPage() {
  const navigate  = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const { data } = await axios.post(`${base}/v1/api/tcg/login`, {
        email:    email.trim(),
        password: password.trim(),
      });

      if (data.success && data.token) {
        localStorage.setItem("tcg_token", data.token);
        if (data.business_name) {
          localStorage.setItem("business_name", data.business_name);
        }
        toast.success("TCG connected!", {
          description: "TradeChainGuardian session is now active.",
        });
        navigate(-1);
      } else {
        setError(data.message || "Login failed. Please try again.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error   ||
        "Unable to reach TCG server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .tcgp-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', sans-serif;
          background: #030712;
          overflow: hidden;
        }

        /* ── Left panel ── */
        .tcgp-left {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          overflow: hidden;
          background: linear-gradient(145deg, #050b1f 0%, #0a1535 40%, #0f1f4a 100%);
        }

        .tcgp-left-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 30% 60%, rgba(29,78,216,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 70% 20%, rgba(220,38,38,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        /* animated rings */
        .tcgp-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(29,78,216,0.12);
          animation: ringPulse 6s ease-in-out infinite;
        }
        .tcgp-ring:nth-child(1){ width:260px;height:260px;animation-delay:0s;}
        .tcgp-ring:nth-child(2){ width:420px;height:420px;animation-delay:1.5s;}
        .tcgp-ring:nth-child(3){ width:600px;height:600px;animation-delay:3s; border-color:rgba(220,38,38,0.07);}
        @keyframes ringPulse {
          0%,100%{ transform:scale(1);   opacity:0.6; }
          50%    { transform:scale(1.04); opacity:1;   }
        }

        .tcgp-logo-wrap {
          position: relative;
          z-index: 2;
          text-align: center;
        }
        .tcgp-logo-img {
          width: 160px;
          height: 160px;
          object-fit: contain;
          filter: drop-shadow(0 0 40px rgba(29,78,216,0.5)) drop-shadow(0 0 80px rgba(220,38,38,0.2));
          animation: logoBob 4s ease-in-out infinite;
        }
        @keyframes logoBob {
          0%,100%{ transform: translateY(0); }
          50%    { transform: translateY(-10px); }
        }

        .tcgp-brand {
          margin-top: 24px;
          font-size: 34px;
          font-weight: 900;
          letter-spacing: -1px;
          line-height: 1;
        }
        .tcgp-brand-trade    { color: #3b82f6; }
        .tcgp-brand-chain    { color: #ef4444; }
        .tcgp-brand-guardian { color: #3b82f6; }

        .tcgp-tagline {
          margin-top: 12px;
          font-size: 13px;
          color: rgba(148,163,184,0.8);
          font-weight: 400;
          letter-spacing: 0.5px;
        }

        .tcgp-badges {
          margin-top: 36px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: 280px;
        }
        .tcgp-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(10px);
        }
        .tcgp-badge-icon {
          width: 36px; height: 36px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .tcgp-badge-icon.blue { background: rgba(29,78,216,0.2); color: #60a5fa; }
        .tcgp-badge-icon.red  { background: rgba(220,38,38,0.2); color: #f87171; }
        .tcgp-badge-text-title { font-size: 13px; font-weight: 600; color: #e2e8f0; }
        .tcgp-badge-text-sub   { font-size: 11px; color: #64748b; margin-top: 1px; }

        /* ── Right panel (form) ── */
        .tcgp-right {
          width: 480px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 56px 52px;
          background: #fff;
          position: relative;
          overflow: hidden;
        }

        .tcgp-right-accent {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, #1e40af 0%, #ef4444 50%, #1e40af 100%);
          background-size: 200%;
          animation: accentMove 3s linear infinite;
        }
        @keyframes accentMove {
          0%  { background-position: 0%   50%; }
          100%{ background-position: 200% 50%; }
        }

        .tcgp-back-btn {
          position: absolute;
          top: 24px; left: 28px;
          display: flex; align-items: center; gap: 6px;
          background: none; border: none; cursor: pointer;
          color: #6b7280; font-size: 13px; font-weight: 500;
          font-family: 'Inter', sans-serif;
          padding: 6px 10px; border-radius: 8px;
          transition: color 0.15s, background 0.15s;
        }
        .tcgp-back-btn:hover { color: #1d4ed8; background: #eff6ff; }

        .tcgp-form-heading {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
          margin-bottom: 6px;
        }
        .tcgp-form-sub {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 36px;
          font-weight: 400;
          line-height: 1.5;
        }

        .tcgp-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 7px;
        }
        .tcgp-input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .tcgp-input:focus {
          border-color: #1d4ed8;
          box-shadow: 0 0 0 4px rgba(29,78,216,0.1);
          background: #fff;
        }
        .tcgp-input::placeholder { color: #94a3b8; }
        .tcgp-input-wrap { position: relative; }
        .tcgp-eye {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #94a3b8; display: flex; align-items: center;
          padding: 2px;
          transition: color 0.15s;
        }
        .tcgp-eye:hover { color: #1d4ed8; }

        .tcgp-field { margin-bottom: 20px; }

        .tcgp-error {
          background: #fff5f5;
          border: 1px solid #fecaca;
          border-left: 3px solid #ef4444;
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 13px;
          color: #dc2626;
          margin-bottom: 20px;
          animation: shakeErr 0.3s ease;
        }
        @keyframes shakeErr {
          0%,100%{ transform:translateX(0); }
          25%    { transform:translateX(-6px); }
          75%    { transform:translateX(6px); }
        }

        .tcgp-submit {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%);
          color: #fff;
          box-shadow: 0 6px 20px rgba(29,78,216,0.35);
          transition: opacity 0.18s, transform 0.14s, box-shadow 0.18s;
          display: flex; align-items: center; justify-content: center; gap: 9px;
          letter-spacing: 0.2px;
        }
        .tcgp-submit:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(29,78,216,0.42);
        }
        .tcgp-submit:active:not(:disabled) { transform: scale(0.98); }
        .tcgp-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .tcgp-footer {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
          text-align: center;
        }
        .tcgp-footer p {
          font-size: 12px; color: #94a3b8; line-height: 1.6;
        }

        /* slide-in animation */
        .tcgp-right  { transform: translateX(${mounted ? "0" : "40px"}); opacity: ${mounted ? 1 : 0}; transition: transform 0.4s cubic-bezier(0.34,1.1,0.64,1), opacity 0.35s ease; }
        .tcgp-left   { transform: translateX(${mounted ? "0" : "-30px"}); opacity: ${mounted ? 1 : 0}; transition: transform 0.4s cubic-bezier(0.34,1.1,0.64,1) 0.05s, opacity 0.35s ease 0.05s; }

        @keyframes spin { to{ transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }

        @media (max-width: 768px) {
          .tcgp-left  { display: none; }
          .tcgp-right { width: 100%; padding: 48px 28px; }
        }
      `}</style>

      <div className="tcgp-root">

        {/* ── LEFT: Branding panel ── */}
        <div className="tcgp-left">
          <div className="tcgp-left-bg" />
          <div className="tcgp-ring" />
          <div className="tcgp-ring" />
          <div className="tcgp-ring" />

          <div className="tcgp-logo-wrap">
            <img
              src="/PROJECT-X/TCG_logo.png"
              alt="TradeChainGuardian"
              className="tcgp-logo-img"
            />

            <div className="tcgp-brand">
              <span className="tcgp-brand-trade">Trade</span>
              <span className="tcgp-brand-chain">Chain</span>
              <span className="tcgp-brand-guardian">Guardian</span>
            </div>

            <p className="tcgp-tagline">
              Secure · Reliable · Traceable
            </p>
          </div>

          <div className="tcgp-badges">
            <div className="tcgp-badge">
              <div className="tcgp-badge-icon blue">🔐</div>
              <div>
                <div className="tcgp-badge-text-title">JWT Authentication</div>
                <div className="tcgp-badge-text-sub">End-to-end encrypted sessions</div>
              </div>
            </div>
            <div className="tcgp-badge">
              <div className="tcgp-badge-icon red">🛡️</div>
              <div>
                <div className="tcgp-badge-text-title">Chain Integrity</div>
                <div className="tcgp-badge-text-sub">Tamper-proof trade records</div>
              </div>
            </div>
            <div className="tcgp-badge">
              <div className="tcgp-badge-icon blue">⚡</div>
              <div>
                <div className="tcgp-badge-text-title">Real-time Sync</div>
                <div className="tcgp-badge-text-sub">Live inventory & transaction data</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Form panel ── */}
        <div className="tcgp-right">
          <div className="tcgp-right-accent" />

          {/* Back button */}
          <button className="tcgp-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} />
            Go back
          </button>

          {/* Heading */}
          <h1 className="tcgp-form-heading">Connect to TCG</h1>
          <p className="tcgp-form-sub">
            Sign in with your TradeChainGuardian credentials to activate
            the server integration.
          </p>

          <form onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className="tcgp-field">
              <label htmlFor="tcgp-email" className="tcgp-label">Email address</label>
              <input
                id="tcgp-email"
                className="tcgp-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="tcgp-field">
              <label htmlFor="tcgp-password" className="tcgp-label">Password</label>
              <div className="tcgp-input-wrap">
                <input
                  id="tcgp-password"
                  className="tcgp-input"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ paddingRight: "46px" }}
                />
                <button
                  type="button"
                  className="tcgp-eye"
                  onClick={() => setShowPass(p => !p)}
                  tabIndex={-1}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="tcgp-error">⚠ {error}</div>
            )}

            {/* Submit */}
            <button
              id="tcgp-submit"
              type="submit"
              className="tcgp-submit"
              disabled={loading}
            >
              {loading
                ? <><Loader2 size={17} className="spin" /> Connecting…</>
                : <><ShieldCheck size={17} /> Connect to TCG</>
              }
            </button>
          </form>

          <div className="tcgp-footer">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", marginBottom:"8px", color:"#94a3b8" }}>
              <Lock size={12} />
              <span style={{ fontSize:"12px" }}>256-bit encrypted connection</span>
            </div>
            <p>
              Your credentials are sent directly to the TCG server.<br />
              They are never stored on this device.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
