import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  ArrowRightCircle,
  Calendar,
  X,
  FileText,
  SendHorizonal,
  Inbox,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SectionHeader from "@/components/SectionHeader";
import { useTCGCall } from "@/hooks/tcg_call";
import { useTCGLogin } from "@/context/TCGLoginContext";
import { useNavigate } from "react-router-dom";

/* ─── Constants ──────────────────────────────────── */
const PAGE_SIZE   = 10;
const INDIGO      = {
  accent:    "text-indigo-600 dark:text-indigo-400",
  badge:     "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  activeBg:  "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30",
  hoverRow:  "hover:bg-indigo-50/60 dark:hover:bg-indigo-900/20",
  border:    "border-indigo-200 dark:border-indigo-800",
  header:    "bg-indigo-50 dark:bg-indigo-950/40",
};

/* ─── Status Badge ───────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200",
    seen:     "bg-blue-100   text-blue-700    dark:bg-blue-900/40    dark:text-blue-300    border-blue-200",
    unseen:   "bg-slate-100  text-slate-500   dark:bg-slate-800      dark:text-slate-400   border-slate-200",
  };
  const labels = { accepted: "Accepted", seen: "Seen", unseen: "Unseen" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] ?? map.unseen}`}>
      {labels[status] ?? status}
    </span>
  );
}

/* ─── Sort Icon ──────────────────────────────────── */
function SortIcon({ dir }) {
  if (dir === "desc") return <ArrowDown className="h-3.5 w-3.5 ml-1 inline" />;
  if (dir === "asc")  return <ArrowUp   className="h-3.5 w-3.5 ml-1 inline" />;
  return <ArrowUpDown className="h-3.5 w-3.5 ml-1 inline opacity-40" />;
}

/* ─── Main Component ─────────────────────────────── */
export default function TransactionReportPage() {
  const navigate = useNavigate();
  const { call, loading, error } = useTCGCall();
  const { openTCGLogin }         = useTCGLogin();

  /* toggle */
  const [tab, setTab]         = useState("received"); // "sent" | "received"

  /* raw data from API */
  const [rows, setRows]       = useState([]);
  const [fetched, setFetched] = useState(false);

  /* search / filter */
  const [search, setSearch]   = useState("");
  const [dateFrom, setDateFrom] = useState("");

  /* sort: field & direction */
  const [sortDir, setSortDir] = useState("desc"); // "desc" | "asc"

  /* pagination */
  const [page, setPage]       = useState(1);

  /* ── Fetch ─────────────────────────────────────── */
  const fetchTxns = async (type) => {
    const res = await call({ route: `/v1/api/transactions?type=${type}` });
    
    if (res && res.data && Array.isArray(res.data.data)) {
      setRows(res.data.data);
    } else if (res && res.status === 401) {
      // token missing / expired → open login
      openTCGLogin();
    }
    setFetched(true);
  };

  useEffect(() => {
    setRows([]);
    setFetched(false);
    setPage(1);
    setSearch("");
    setDateFrom("");
    fetchTxns(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /* ── Client-side filter + sort + paginate ──────── */
  const processed = useMemo(() => {
    let list = [...rows];

    /* search */
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.sender_name?.toLowerCase().includes(q)   ||
          r.receiver_name?.toLowerCase().includes(q) ||
          r.invoice_id?.toLowerCase().includes(q)
      );
    }

    /* date filter */
    if (dateFrom) {
      const from = new Date(dateFrom).setHours(0, 0, 0, 0);
      list = list.filter((r) => new Date(r.created_at).getTime() >= from);
    }

    /* sort by created_at */
    list.sort((a, b) => {
      const diff = new Date(b.created_at) - new Date(a.created_at);
      return sortDir === "desc" ? diff : -diff;
    });

    return list;
  }, [rows, search, dateFrom, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = processed.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /* reset to page 1 on filter change */
  useEffect(() => { setPage(1); }, [search, dateFrom, sortDir, tab]);

  /* ── Format date ───────────────────────────────── */
  const fmt = (iso) =>
    new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  /* ── No TCG token guard ────────────────────────── */
  const hasToken = !!localStorage.getItem("tcg_token");

  /* ═══════════════════════════════════════════════ */
  return (
    <div className="flex flex-1 flex-col bg-theme-50 gap-6 p-4 max-w-7xl mx-auto w-full">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/report")}
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">TCG Transaction Report</h1>
          <p className="text-sm text-muted-foreground">View and search transactions from the TradeChainGuardian network.</p>
        </div>
      </div>

      {/* ── Sent / Received Toggle ───────────────── */}
      <div className="flex items-center gap-2">
        {[
          { key: "received", label: "Received", icon: Inbox },
          { key: "sent",     label: "Sent",     icon: SendHorizonal },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200
              ${tab === key
                ? INDIGO.activeBg + " border-transparent"
                : "bg-white dark:bg-card text-muted-foreground border-border hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}

        {/* Refresh */}
        <Button
          size="icon"
          variant="outline"
          className="ml-auto h-9 w-9"
          onClick={() => fetchTxns(tab)}
          disabled={loading}
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* ── Search + Date + Sort bar ─────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="txn-search"
            placeholder="Search by sender, receiver or invoice ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Date From */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="txn-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="pl-9 h-9 w-44"
            title="Filter by created date (from)"
          />
          {dateFrom && (
            <button
              onClick={() => setDateFrom("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort toggle */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
        >
          Date <SortIcon dir={sortDir} />
        </Button>
      </div>

      {/* ── TCG Token Warning ─────────────────────── */}
      {!hasToken && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4 text-sm text-amber-800 dark:text-amber-300">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <span>No TCG session found.</span>
          <Button size="sm" variant="outline" className="ml-auto border-amber-400 text-amber-700 hover:bg-amber-100" onClick={openTCGLogin}>
            Connect TCG
          </Button>
        </div>
      )}

      {/* ── Table Card ───────────────────────────── */}
      <Card className={`shadow-sm border ${INDIGO.border} flex-1`}>

        {/* Table header bar */}
        <CardHeader className={`py-4 px-6 border-b ${INDIGO.border} ${INDIGO.header} rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={`text-lg font-semibold ${INDIGO.accent}`}>
                {tab === "sent" ? "Sent Transactions" : "Received Transactions"}
              </CardTitle>
              <CardDescription className="text-sm mt-0.5 font-medium">
                {loading
                  ? "Loading…"
                  : `${processed.length} record${processed.length !== 1 ? "s" : ""} found`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* ── Loading ── */}
          {loading && (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
              <span className="text-sm">Fetching transactions…</span>
            </div>
          )}

          {/* ── Error ── */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground text-sm">
              <ShieldAlert className="h-8 w-8 text-red-400" />
              <p className="text-red-500">{error}</p>
              <Button size="sm" variant="outline" onClick={() => fetchTxns(tab)}>Retry</Button>
            </div>
          )}

          {/* ── Empty ── */}
          {!loading && !error && fetched && processed.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <FileText className="h-10 w-10 opacity-30" />
              <p className="text-sm">No transactions found.</p>
              {(search || dateFrom) && (
                <Button size="sm" variant="ghost" onClick={() => { setSearch(""); setDateFrom(""); }}>
                  Clear filters
                </Button>
              )}
            </div>
          )}

          {/* ── Table ── */}
          {!loading && !error && paged.length > 0 && (
            <div className="flex flex-col">
              {/* Table Header */}
              <div className={`grid grid-cols-10 gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b ${INDIGO.border} ${INDIGO.header}`}>
                <div className="col-span-1">#</div>
                <div className="col-span-2">Invoice ID</div>
                <div className="col-span-2">Sender</div>
                <div className="col-span-2">Receiver</div>
                <div className="col-span-1 text-center">Status</div>
                <div 
                  className="col-span-1.5 cursor-pointer select-none flex items-center"
                  onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                >
                  Created <SortIcon dir={sortDir} />
                </div>
                <div className="col-span-0.5 text-right">Action</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-border">
                {paged.map((row, idx) => (
                  <div
                    key={row.id}
                    className={`grid grid-cols-10 gap-2 px-6 py-4 items-center text-sm transition-colors ${INDIGO.hoverRow}`}
                  >
                    <div className="col-span-1 text-muted-foreground font-medium">
                      {(safePage - 1) * PAGE_SIZE + idx + 1}
                    </div>
                    <div className="col-span-2 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                      {row.invoice_id}
                    </div>
                    <div className="col-span-2 font-medium truncate">{row.sender_name}</div>
                    <div className="col-span-2 text-muted-foreground truncate">{row.receiver_name}</div>
                    <div className="col-span-1 text-center">
                      <StatusBadge status={row.status} />
                    </div>
                    <div className="col-span-1.5 text-muted-foreground whitespace-nowrap text-xs">
                      {fmt(row.created_at)}
                    </div>
                    <div className="col-span-0.5 text-right">
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 px-3 rounded-md transition-all shadow-sm active:scale-95"
                        onClick={() => navigate(`/transactions/details/${row.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Pagination ─────────────────────────── */}
          {!loading && paged.length > 0 && (
            <div className={`flex items-center justify-between px-4 py-3 border-t ${INDIGO.border} ${INDIGO.header} text-sm text-muted-foreground`}>
              <span>
                Page <span className={`font-semibold ${INDIGO.accent}`}>{safePage}</span> of{" "}
                <span className="font-semibold">{totalPages}</span>
                <span className="ml-2 text-xs">
                  ({processed.length} total)
                </span>
              </span>
              <div className="flex gap-2">
                <Button
                  id="txn-prev"
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <Button
                  id="txn-next"
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
