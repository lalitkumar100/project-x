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
} from "lucide-react";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SectionHeader from "@/components/SectionHeader";
import { useTCGCall } from "@/hooks/tcg_call";
import { useTCGLogin } from "@/context/TCGLoginContext";
import { useNavigate } from "react-router-dom";

/* ─── Constants ─────────────────────────────────── */
const PAGE_SIZE = 10;
const VIOLET = {
  accent:   "text-violet-600 dark:text-violet-400",
  activeBg: "bg-violet-600 text-white shadow-lg shadow-violet-500/30",
  hoverRow: "hover:bg-violet-50/60 dark:hover:bg-violet-900/20",
  border:   "border-violet-200 dark:border-violet-800",
  header:   "bg-violet-50 dark:bg-violet-950/40",
};

/* ─── Status Badge ───────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    reviewed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200",
    seen:     "bg-blue-100   text-blue-700    dark:bg-blue-900/40    dark:text-blue-300    border-blue-200",
    unseen:   "bg-slate-100  text-slate-500   dark:bg-slate-800      dark:text-slate-400   border-slate-200",
  };
  const labels = { reviewed: "Reviewed", seen: "Seen", unseen: "Unseen" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] ?? map.unseen}`}>
      {labels[status] ?? status}
    </span>
  );
}

/* ─── Sort Icon ──────────────────────────────────── */
function SortIcon({ dir }) {
  if (dir === "desc") return <ArrowDown  className="h-3.5 w-3.5 ml-1 inline" />;
  if (dir === "asc")  return <ArrowUp    className="h-3.5 w-3.5 ml-1 inline" />;
  return                     <ArrowUpDown className="h-3.5 w-3.5 ml-1 inline opacity-40" />;
}

/* ─── Main Component ─────────────────────────────── */
export default function RequestReportPage() {
  const navigate = useNavigate();
  const { call, loading, error } = useTCGCall();
  const { openTCGLogin }         = useTCGLogin();

  /* toggle */
  const [tab, setTab]           = useState("received");

  /* raw data */
  const [rows, setRows]         = useState([]);
  const [fetched, setFetched]   = useState(false);

  /* filters */
  const [search, setSearch]     = useState("");
  const [dateFrom, setDateFrom] = useState("");

  /* sort */
  const [sortDir, setSortDir]   = useState("desc");

  /* pagination */
  const [page, setPage]         = useState(1);

  /* ── Fetch ────────────────────────────────────── */
  const fetchRequests = async (type) => {
    const res = await call({ route: `/v1/api/requests?type=${type}` });
    if (res && Array.isArray(res.data)) {
      setRows(res.data);
    } else if (res && res.error) {
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
    fetchRequests(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /* ── Client-side filter + sort + paginate ──────── */
  const processed = useMemo(() => {
    let list = [...rows];

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.sender_name?.toLowerCase().includes(q)   ||
          r.receiver_name?.toLowerCase().includes(q) ||
          r.request_id?.toLowerCase().includes(q)
      );
    }

    if (dateFrom) {
      const from = new Date(dateFrom).setHours(0, 0, 0, 0);
      list = list.filter((r) => new Date(r.created_at).getTime() >= from);
    }

    list.sort((a, b) => {
      const diff = new Date(b.created_at) - new Date(a.created_at);
      return sortDir === "desc" ? diff : -diff;
    });

    return list;
  }, [rows, search, dateFrom, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = processed.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, dateFrom, sortDir, tab]);

  /* ── Format date ──────────────────────────────── */
  const fmt = (iso) =>
    new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const hasToken = !!localStorage.getItem("tcg_token");

  /* ═══════════════════════════════════════════════ */
  return (
    <div className="flex flex-1 flex-col gap-5 p-4 pt-0">

      <SectionHeader
        title="TCG Request Report"
        description="View and search trade requests from the TradeChainGuardian network."
      />

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
                ? VIOLET.activeBg + " border-transparent"
                : "bg-white dark:bg-card text-muted-foreground border-border hover:border-violet-300 hover:text-violet-600 dark:hover:text-violet-400"
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
          onClick={() => fetchRequests(tab)}
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
            id="req-search"
            placeholder="Search by sender, receiver or request ID…"
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
            id="req-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="pl-9 h-9 w-44"
            title="Filter by date (from)"
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
      <Card className={`shadow-sm border ${VIOLET.border} flex-1`}>

        <CardHeader className={`py-3 px-4 border-b ${VIOLET.border} ${VIOLET.header} rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={`text-base font-semibold ${VIOLET.accent}`}>
                {tab === "sent" ? "Sent Requests" : "Received Requests"}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {loading
                  ? "Loading…"
                  : `${processed.length} record${processed.length !== 1 ? "s" : ""} found`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
              <span className="text-sm">Fetching requests…</span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-sm">
              <ShieldAlert className="h-8 w-8 text-red-400" />
              <p className="text-red-500">{error}</p>
              <Button size="sm" variant="outline" onClick={() => fetchRequests(tab)}>Retry</Button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && fetched && processed.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <FileText className="h-10 w-10 opacity-30" />
              <p className="text-sm">No requests found.</p>
              {(search || dateFrom) && (
                <Button size="sm" variant="ghost" onClick={() => { setSearch(""); setDateFrom(""); }}>
                  Clear filters
                </Button>
              )}
            </div>
          )}

          {/* Table */}
          {!loading && !error && paged.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b ${VIOLET.border} ${VIOLET.header}`}>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Request ID</th>
                    <th className="px-4 py-3 text-left">Sender</th>
                    <th className="px-4 py-3 text-left">Receiver</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th
                      className="px-4 py-3 text-left cursor-pointer select-none"
                      onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                    >
                      Created <SortIcon dir={sortDir} />
                    </th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paged.map((row, idx) => (
                    <tr key={row.id ?? row.request_id} className={`transition-colors ${VIOLET.hoverRow}`}>
                      <td className="px-4 py-3 text-muted-foreground">
                        {(safePage - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-xs text-violet-700 dark:text-violet-300 truncate max-w-[160px]">
                        {row.request_id}
                      </td>
                      <td className="px-4 py-3 font-medium">{row.sender_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.receiver_name}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {fmt(row.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-violet-500 hover:text-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                          title="View details"
                          onClick={() => navigate(`/report/request/${row.request_id}`)}
                        >
                          <ArrowRightCircle className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && paged.length > 0 && (
            <div className={`flex items-center justify-between px-4 py-3 border-t ${VIOLET.border} ${VIOLET.header} text-sm text-muted-foreground`}>
              <span>
                Page <span className={`font-semibold ${VIOLET.accent}`}>{safePage}</span> of{" "}
                <span className="font-semibold">{totalPages}</span>
                <span className="ml-2 text-xs">({processed.length} total)</span>
              </span>
              <div className="flex gap-2">
                <Button
                  id="req-prev"
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <Button
                  id="req-next"
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
