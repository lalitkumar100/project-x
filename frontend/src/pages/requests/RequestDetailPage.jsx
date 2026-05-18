import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft, AlertTriangle, Calendar, CheckCircle, CheckCheck,
  Edit3, Eye, FileText, Loader2, PackageOpen, ReceiptText,
  Search, ThumbsDown, ThumbsUp, Trash2, User, X, XCircle, ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { useTCGCall } from "@/hooks/tcg_call"
import { useBackendCall } from "@/hooks/backend_call"
import { useTCGLogin } from "@/context/TCGLoginContext"

/* ── helpers ── */
function fmt(d) {
  if (!d) return "—"
  return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}

function Pill({ label, color }) {
  const map = {
    teal:   "bg-teal-100 text-teal-700",
    amber:  "bg-amber-100 text-amber-700",
    green:  "bg-emerald-100 text-emerald-700",
    blue:   "bg-blue-100 text-blue-700",
    slate:  "bg-slate-100 text-slate-600",
    red:    "bg-red-100 text-red-600",
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[color] ?? map.slate}`}>
      {label}
    </span>
  )
}

function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-16 h-16 rounded-full border-4 border-theme-200 border-t-theme-600 animate-spin" />
      <p className="text-muted-foreground text-sm animate-pulse">Loading request…</p>
    </div>
  )
}

function NotFound({ onBack }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-full bg-theme-100 flex items-center justify-center">
          <PackageOpen className="w-14 h-14 text-theme-400" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle className="w-6 h-6 text-red-500" />
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-2">Request Not Found</h2>
      <p className="text-muted-foreground text-sm max-w-xs mb-6">
        This request doesn't exist or may have been deleted.
      </p>
      <Button onClick={onBack} className="bg-theme-600 hover:bg-theme-700 text-white">
        <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
      </Button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════ */
export default function RequestDetailPage() {
  const { request_id } = useParams()
  const navigate = useNavigate()
  const tcg = useTCGCall()
  const backend = useBackendCall()
  const { openTCGLogin } = useTCGLogin()

  const [request, setRequest]           = useState(null)
  const [pageLoading, setPageLoading]   = useState(true)
  const [notFound, setNotFound]         = useState(false)

  /* edit */
  const [editMode, setEditMode]         = useState(false)
  const [editItems, setEditItems]       = useState([])
  const [saving, setSaving]             = useState(false)

  /* search */
  const [search, setSearch]             = useState("")
  const [suggestions, setSuggestions]   = useState([])
  const [activeIdx, setActiveIdx]       = useState(0)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimer = useRef(null)

  /* dialogs */
  const [editConfirmOpen, setEditConfirmOpen]     = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [successDialog, setSuccessDialog]         = useState({ open: false, message: "" })
  const [reviewConfirm, setReviewConfirm]         = useState({ open: false, action: "" })
  const [deleting, setDeleting]                   = useState(false)
  const [reviewLoading, setReviewLoading]         = useState(false)

  /* ── fetch ── */
  const fetchRequest = useCallback(async () => {
    setPageLoading(true)
    const { data, status } = await tcg.call({ route: `/v1/api/requests/${request_id}` })
    setPageLoading(false)
    if (data?.success) { setRequest(data.data); setNotFound(false) }
    else if (status === 404) setNotFound(true)
    else if (status === 401) openTCGLogin()
  }, [request_id])

  useEffect(() => { fetchRequest() }, [fetchRequest])

  /* ── item search ── */
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    const term = search.trim()
    if (!term) { setSuggestions([]); setActiveIdx(0); return }
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true)
      const { data } = await backend.call({ route: "/v1/api/admin/items/suggestions", params: { q: term } })
      setSearchLoading(false)
      if (data) { setSuggestions(Array.isArray(data) ? data.slice(0, 5) : []); setActiveIdx(0) }
    }, 300)
    return () => clearTimeout(searchTimer.current)
  }, [search])

  /* ── edit helpers ── */
  function enterEditMode() {
    setEditItems((request?.request_data?.items || []).map(i => ({ ...i })))
    setEditMode(true); setSearch(""); setSuggestions([])
  }
  function cancelEdit() { setEditMode(false); setSearch(""); setSuggestions([]) }

  function addItem(s) {
    const exists = editItems.find(i => i.item_id === s.id)
    if (exists) setEditItems(editItems.map(i => i.item_id === s.id ? { ...i, quantity: i.quantity + 1 } : i))
    else setEditItems([...editItems, { item_id: s.id, name: s.name, quantity: 1 }])
    setSearch(""); setSuggestions([])
  }
  function removeItem(id) { setEditItems(editItems.filter(i => i.item_id !== id)) }
  function updateQty(id, q) { setEditItems(editItems.map(i => i.item_id === id ? { ...i, quantity: Math.max(1, Number(q)) } : i)) }

  function handleKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(p => Math.min(p + 1, suggestions.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(p => Math.max(p - 1, 0)) }
    else if (e.key === "Enter") { e.preventDefault(); if (suggestions[activeIdx]) addItem(suggestions[activeIdx]) }
  }

  /* ── save edit ── */
  async function saveEdit() {
    setSaving(true)
    const { data, status } = await tcg.call({
      route: `/v1/api/requests/${request_id}`,
      method: "PUT",
      body: { receiver_id: request.receiver_id, request_data: { items: editItems } },
    })
    setSaving(false)
    if (data?.success) { setRequest(data.data); setEditMode(false); setSuccessDialog({ open: true, message: "Request updated successfully!" }) }
    else if (status === 401) openTCGLogin()
  }

  /* ── delete ── */
  async function doDelete() {
    setDeleting(true)
    const { status } = await tcg.call({ route: `/v1/api/requests/${request_id}`, method: "DELETE" })
    setDeleting(false); setDeleteConfirmOpen(false)
    if (status === 200 || status === 204) { setSuccessDialog({ open: true, message: "Request deleted successfully!" }); setNotFound(true); setRequest(null) }
    else if (status === 401) openTCGLogin()
  }

  /* ── review ── */
  async function doReview(action) {
    setReviewLoading(true)
    const { data, status } = await tcg.call({ route: `/v1/api/requests/${request_id}/review`, method: "PUT", body: { action } })
    setReviewLoading(false); setReviewConfirm({ open: false, action: "" })
    if (data?.success) { setRequest(data.data); setSuccessDialog({ open: true, message: action === "accept" ? "Request accepted!" : "Request rejected." }) }
    else if (status === 401) openTCGLogin()
  }

  /* ── bill it ── */
  const handleBillIt = () => {
    if (!request) return
    navigate("/billing", {
      state: {
        isFromRequest: true,
        requestId: request.request_id,
        customer: {
          name: request.sender_name,
          phone: request.sender_phone || "", // Fallback if phone not in object
          tcg_id: request.sender_id,
          type: "registered"
        },
        items: request.request_data?.items || []
      }
    })
  }

  /* ── derived ── */
  const isSender = request?.request_type === "sender"
  const canAct   = !request?.is_seen && !request?.is_reviewed
  const displayItems = editMode ? editItems : (request?.request_data?.items || [])

  const isAccepted = request?.is_reviewed && request?.request_data?.review_action === "accept"
  const isRejected = request?.is_reviewed && request?.request_data?.review_action === "reject"
  const isBilled   = request?.is_converted_to_invoice

  if (pageLoading) return <PageLoader />
  if (notFound && !successDialog.open) return <NotFound onBack={() => navigate(-1)} />

  return (
    <div className="max-w-5xl mx-auto w-full p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mt-0.5 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground">Request Details</h1>
          <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{request?.request_id}</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Pill label={request?.is_seen ? "Seen" : "Unseen"} color={request?.is_seen ? "teal" : "slate"} />
          <Pill 
            label={isRejected ? "Rejected" : isAccepted ? "Accepted" : request?.is_reviewed ? "Reviewed" : "Pending"} 
            color={isRejected ? "red" : isAccepted ? "green" : request?.is_reviewed ? "teal" : "amber"} 
          />
          {isBilled && <Pill label="Billed" color="blue" />}
          <Pill label={isSender ? "Sent" : "Received"} color={isSender ? "teal" : "blue"} />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-t-4 border-t-theme-600 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> SENDER
              {isSender && <span className="ml-auto bg-theme-100 text-theme-700 px-2 py-0.5 rounded-full text-[10px] font-bold">YOU</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-lg text-foreground leading-tight">{request?.sender_name}</p>
            <p className="text-xs text-muted-foreground mt-1">User ID: {request?.sender_id}</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-cyan-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> RECEIVER
              {!isSender && <span className="ml-auto bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full text-[10px] font-bold">YOU</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-lg text-foreground leading-tight">{request?.receiver_name}</p>
            <p className="text-xs text-muted-foreground mt-1">User ID: {request?.receiver_id}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> TIMELINE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-theme-500" />
              <span>Sent: <span className="text-foreground font-medium">{fmt(request?.sent_at)}</span></span>
            </div>
            {request?.seen_at && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Eye className="h-3.5 w-3.5 shrink-0 text-teal-500" />
                <span>Seen: <span className="text-foreground font-medium">{fmt(request?.seen_at)}</span></span>
              </div>
            )}
            {request?.reviewed_at && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>Reviewed: <span className="text-foreground font-medium">{fmt(request?.reviewed_at)}</span></span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-theme-600" />
              Items
              <span className="bg-theme-100 text-theme-700 text-xs px-2 py-0.5 rounded-full font-bold">
                {displayItems.length}
              </span>
            </CardTitle>
            {editMode && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={cancelEdit}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" className="bg-theme-600 hover:bg-theme-700 text-white" onClick={saveEdit} disabled={saving || editItems.length === 0}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Search — edit mode only */}
          {editMode && (
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items to add…"
                className="pl-9 border-theme-300 focus-visible:ring-theme-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleKey}
                autoComplete="off"
              />
              {(suggestions.length > 0 || searchLoading) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                  {searchLoading
                    ? <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Searching…</div>
                    : suggestions.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`px-4 py-2.5 cursor-pointer border-b last:border-b-0 transition-colors ${idx === activeIdx ? "bg-theme-50 border-l-2 border-l-theme-600" : "hover:bg-muted"}`}
                          onClick={() => addItem(item)}
                        >
                          <p className="font-semibold text-sm text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.brand} · {item.subcategory}</p>
                        </div>
                      ))
                  }
                </div>
              )}
            </div>
          )}

          {/* Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-3 font-semibold text-muted-foreground w-12">No.</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Name</th>
                  <th className="text-center p-3 font-semibold text-muted-foreground w-28">Quantity</th>
                  {editMode && <th className="text-center p-3 font-semibold text-muted-foreground w-16">Remove</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayItems.length === 0
                  ? <tr><td colSpan={editMode ? 4 : 3} className="p-10 text-center text-muted-foreground italic text-sm">No items found.</td></tr>
                  : displayItems.map((item, idx) => (
                      <tr key={item.item_id ?? idx} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-muted-foreground">{idx + 1}</td>
                        <td className="p-3 font-medium text-foreground">{item.name}</td>
                        <td className="p-3 text-center">
                          {editMode
                            ? <Input type="number" min="1" value={item.quantity} onChange={e => updateQty(item.item_id, e.target.value)} className="h-8 w-20 mx-auto text-center" />
                            : <span className="bg-theme-100 text-theme-700 px-3 py-1 rounded-full text-xs font-bold">{item.quantity}</span>
                          }
                        </td>
                        {editMode && (
                          <td className="p-3 text-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeItem(item.item_id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Actions */}
      {!editMode && (
        <div className="flex flex-wrap items-center gap-3 pb-6">
          {isSender && (
            <>
              <Button variant="outline" className="border-theme-300 text-theme-700 hover:bg-theme-50" onClick={() => setEditConfirmOpen(true)}>
                <Edit3 className="h-4 w-4 mr-2" /> Edit Request
              </Button>
              <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setDeleteConfirmOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete Request
              </Button>
            </>
          )}
          {!isSender && (
            <>
              {!request?.is_reviewed && (
                <>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setReviewConfirm({ open: true, action: "accept" })}>
                    <ThumbsUp className="h-4 w-4 mr-2" /> Accept
                  </Button>
                  <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setReviewConfirm({ open: true, action: "reject" })}>
                    <ThumbsDown className="h-4 w-4 mr-2" /> Reject
                  </Button>
                </>
              )}
              
              {isAccepted && !isBilled && (
                <Button className="bg-theme-600 hover:bg-theme-700 text-white" onClick={handleBillIt}>
                  <ReceiptText className="h-4 w-4 mr-2" /> Bill It
                </Button>
              )}

              {isAccepted && isBilled && (
                <Button variant="outline" className="border-blue-300 text-blue-600 bg-blue-50" disabled>
                  <CheckCircle className="h-4 w-4 mr-2" /> Already Billed
                </Button>
              )}

              {isRejected && (
                <Button variant="outline" className="border-red-300 text-red-600 bg-red-50" disabled>
                  <XCircle className="h-4 w-4 mr-2" /> Request Rejected
                </Button>
              )}

              {!request?.is_reviewed && (
                <Button variant="outline" className="border-theme-300 text-theme-700 hover:bg-theme-50" disabled>
                  <ReceiptText className="h-4 w-4 mr-2" /> Bill It
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Edit Confirm Dialog ── */}
      <Dialog open={editConfirmOpen} onOpenChange={setEditConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit3 className="h-5 w-5 text-theme-600" /> Edit Request</DialogTitle>
            <DialogDescription>Review the conditions below before editing.</DialogDescription>
          </DialogHeader>
          {!canAct
            ? <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 font-medium">
                  {request?.is_seen ? "Cannot edit — the receiver has already seen this request." : "Cannot edit — this request has already been reviewed."}
                </p>
              </div>
            : <div className="flex items-start gap-3 p-4 bg-theme-50 border border-theme-200 rounded-lg">
                <Edit3 className="h-5 w-5 text-theme-600 shrink-0 mt-0.5" />
                <p className="text-sm text-theme-800">You can modify item quantities, remove items, or add new items.</p>
              </div>
          }
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditConfirmOpen(false)}>Cancel</Button>
            {canAct && (
              <Button className="bg-theme-600 hover:bg-theme-700 text-white" onClick={() => { setEditConfirmOpen(false); enterEditMode() }}>
                <Edit3 className="h-4 w-4 mr-2" /> Yes, Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><Trash2 className="h-5 w-5" /> Delete Request</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          {!canAct
            ? <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 font-medium">
                  {request?.is_seen ? "Cannot delete — already seen by receiver." : "Cannot delete — already reviewed."}
                </p>
              </div>
            : <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 font-medium">Are you sure you want to permanently delete this request?</p>
              </div>
          }
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            {canAct && (
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={doDelete} disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                {deleting ? "Deleting…" : "Yes, Delete"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Review Confirm Dialog ── */}
      <Dialog open={reviewConfirm.open} onOpenChange={v => !v && setReviewConfirm({ open: false, action: "" })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${reviewConfirm.action === "accept" ? "text-emerald-600" : "text-red-600"}`}>
              {reviewConfirm.action === "accept" ? <ThumbsUp className="h-5 w-5" /> : <ThumbsDown className="h-5 w-5" />}
              {reviewConfirm.action === "accept" ? "Accept Request" : "Reject Request"}
            </DialogTitle>
            <DialogDescription>
              {reviewConfirm.action === "accept"
                ? "You are about to accept this order request. The sender will be notified."
                : "You are about to reject this order request. This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewConfirm({ open: false, action: "" })}>Cancel</Button>
            <Button
              className={reviewConfirm.action === "accept" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
              onClick={() => doReview(reviewConfirm.action)}
              disabled={reviewLoading}
            >
              {reviewLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {reviewLoading ? "Processing…" : reviewConfirm.action === "accept" ? "Accept" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Success Dialog ── */}
      <Dialog open={successDialog.open} onOpenChange={v => !v && setSuccessDialog({ open: false, message: "" })}>
        <DialogContent className="sm:max-w-sm text-center">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">Done!</h3>
              <p className="text-sm text-muted-foreground mt-1">{successDialog.message}</p>
            </div>
            <Button
              className="bg-theme-600 hover:bg-theme-700 text-white w-full"
              onClick={() => {
                setSuccessDialog({ open: false, message: "" })
                if (notFound) navigate(-1)
              }}
            >
              {notFound ? <><ArrowLeft className="h-4 w-4 mr-2" /> Go Back</> : "Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
