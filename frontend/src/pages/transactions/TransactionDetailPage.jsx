import React, { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft, User, FileText, Package,
  CheckCircle2, Clock, Link2, ShieldCheck,
  ShieldOff, Eye, EyeOff, Boxes, Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useTCGCall } from "@/hooks/tcg_call"
import { useTCGLogin } from "@/context/TCGLoginContext"

/* ── helpers ── */
const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—"

const currency = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  })

function Pill({ label, color = "slate" }) {
  const map = {
    teal:  "bg-teal-100 text-teal-700 border-teal-200",
    green: "bg-green-100 text-green-700 border-green-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    blue:  "bg-blue-100 text-blue-700 border-blue-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    red:   "bg-red-100 text-red-600 border-red-200",
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${map[color] || map.slate}`}>
      {label}
    </span>
  )
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-4 border-theme-200 border-t-theme-600 animate-spin" />
    </div>
  )
}

function NotFound({ onBack }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <FileText className="h-12 w-12 text-muted-foreground/40" />
      <p className="text-muted-foreground font-medium">Transaction not found.</p>
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />Go Back
      </Button>
    </div>
  )
}

export default function TransactionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const tcg = useTCGCall()
  const { openTCGLogin } = useTCGLogin()

  const [tx, setTx] = useState(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" })
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const load = useCallback(async () => {
    setPageLoading(true)
    const { data, status } = await tcg.call({ route: `/v1/api/transactions/${id}` })
    if (data) {
      // API wraps in { success, data } — unwrap if needed
      setTx(data.data ?? data)
    } else {
      if (status === 401) openTCGLogin()
      setNotFound(true)
    }
    setPageLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => { load() }, [load])

  /* ── Accept → navigate to Add Stock page with invoice ID ── */
  const handleAccept = () => {
    const invoiceId = tx?.invoice_id || ""
    navigate(`/addstock?invoice_id=${encodeURIComponent(invoiceId)}`)
  }

  /* ── Delete ── */
  const handleDelete = async () => {
    setDeleteConfirmOpen(false)
    setActionLoading(true)
    setActionMsg({ type: "", text: "" })
    const { data, status } = await tcg.call({
      route: `/v1/api/transactions/${id}`,
      method: "DELETE",
    })
    if (data) {
      navigate(-1)
    } else {
      if (status === 401) openTCGLogin()
      setActionMsg({ type: "error", text: tcg.error || "Failed to delete transaction." })
    }
    setActionLoading(false)
  }

  if (pageLoading) return <PageLoader />
  if (notFound) return <NotFound onBack={() => navigate(-1)} />

  /* ── derived state ── */
  const isSender   = tx?.transaction_type === "sender"
  const isReceiver = tx?.transaction_type === "receiver"
  const items      = tx?.invoice_data?.items || []
  const totalAmount = tx?.invoice_data?.amount || 0

  return (
    <div className="max-w-5xl mx-auto w-full p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mt-0.5 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground">Transaction Details</h1>
          <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{tx?.invoice_id}</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Pill label={tx?.is_seen ? "Seen" : "Unseen"} color={tx?.is_seen ? "teal" : "slate"} />
          <Pill label={tx?.is_accepted ? "Accepted" : "Pending"} color={tx?.is_accepted ? "green" : "amber"} />
          {tx?.is_on_blockchain && <Pill label="On Blockchain" color="blue" />}
          <Pill label={isSender ? "Sent" : "Received"} color={isSender ? "teal" : "blue"} />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sender */}
        <Card className="border-t-4 border-t-theme-600 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> SENDER
              {isSender && (
                <span className="ml-auto bg-theme-100 text-theme-700 px-2 py-0.5 rounded-full text-[10px] font-bold">YOU</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-lg text-foreground leading-tight">{tx?.sender_name || "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">User ID: {tx?.sender_id}</p>
          </CardContent>
        </Card>

        {/* Receiver */}
        <Card className="border-t-4 border-t-cyan-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> RECEIVER
              {isReceiver && (
                <span className="ml-auto bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full text-[10px] font-bold">YOU</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-lg text-foreground leading-tight">{tx?.receiver_name || "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">User ID: {tx?.receiver_id}</p>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> TIMELINE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground w-16 shrink-0">Sent:</span>
              <span className="font-medium">{fmt(tx?.created_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {tx?.is_seen
                ? <><Eye className="h-3 w-3 text-teal-500 shrink-0" /><span className="text-muted-foreground w-14 shrink-0">Seen:</span><span className="font-medium">{fmt(tx?.seen_at)}</span></>
                : <><EyeOff className="h-3 w-3 text-slate-400 shrink-0" /><span className="text-muted-foreground">Not seen yet</span></>
              }
            </div>
            {tx?.is_accepted && (
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                <span className="text-muted-foreground w-14 shrink-0">Accepted:</span>
                <span className="font-medium">{fmt(tx?.accepted_at)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> INVOICE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono font-bold text-base text-foreground">
              {tx?.invoice_data?.invoice_number || tx?.invoice_id}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Boxes className="h-3.5 w-3.5" /> TOTAL AMOUNT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-xl text-theme-700">{currency(totalAmount)}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" /> BLOCKCHAIN
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {tx?.is_on_blockchain
              ? <><ShieldCheck className="h-5 w-5 text-blue-500" /><span className="text-sm font-semibold text-blue-600">Verified on Blockchain</span></>
              : <><ShieldOff className="h-5 w-5 text-slate-400" /><span className="text-sm font-semibold text-slate-500">Not on Blockchain yet</span></>
            }
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 bg-muted/20 border-b">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Items ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-600">#</th>
                  <th className="text-left p-3 font-semibold text-gray-600">Item Name</th>
                  <th className="text-left p-3 font-semibold text-gray-600">Brand</th>
                  <th className="text-left p-3 font-semibold text-gray-600">Category</th>
                  <th className="text-center p-3 font-semibold text-gray-600">Qty</th>
                  <th className="text-right p-3 font-semibold text-gray-600">Rate</th>
                  <th className="text-right p-3 font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground italic">
                      No items found.
                    </td>
                  </tr>
                ) : items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-muted-foreground text-xs">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.subcategory}</div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{item.brand || "—"}</td>
                    <td className="p-3 text-sm text-muted-foreground">{item.category || "—"}</td>
                    <td className="p-3 text-center">
                      <span className="bg-theme-100 text-theme-700 px-3 py-1 rounded-full text-xs font-bold">
                        {item.qty}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium">{currency(item.rate)}</td>
                    <td className="p-3 text-right font-bold text-theme-700">
                      {currency((item.rate || 0) * (item.qty || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
              {items.length > 0 && (
                <tfoot className="bg-muted/30 border-t-2">
                  <tr>
                    <td colSpan={6} className="p-3 text-right font-bold text-sm">Grand Total</td>
                    <td className="p-3 text-right font-bold text-base text-theme-700">{currency(totalAmount)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Actions */}
      <div className="flex flex-wrap items-center gap-3 pb-6">
        {actionMsg.text && (
          <p className={`text-sm font-medium ${actionMsg.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {actionMsg.text}
          </p>
        )}

        {/* RECEIVER actions */}
        {isReceiver && !tx?.is_accepted && (
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={actionLoading}
            onClick={handleAccept}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {actionLoading ? "Accepting…" : "Accept Transaction"}
          </Button>
        )}
        {isReceiver && tx?.is_accepted && (
          <Button variant="outline" className="border-green-300 text-green-700 bg-green-50" disabled>
            <CheckCircle2 className="h-4 w-4 mr-2" /> Already Accepted
          </Button>
        )}

        {/* SENDER actions */}
        {isSender && !tx?.is_seen && (
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
            disabled={actionLoading}
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete Transaction
          </Button>
        )}
        {isSender && tx?.is_seen && (
          <Button variant="outline" className="border-slate-300 text-slate-500 bg-slate-50" disabled>
            <Trash2 className="h-4 w-4 mr-2" /> Cannot Delete (Already Seen)
          </Button>
        )}
      </div>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Transaction
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={actionLoading}
              onClick={handleDelete}
            >
              {actionLoading ? "Deleting…" : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
