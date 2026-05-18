import React, { useEffect, useMemo, useRef, useState } from "react"
import axios from "axios"
import { useTCGLogin } from "@/context/TCGLoginContext"
import { useLocation } from "react-router-dom"
import { useBackendCall } from "@/hooks/backend_call"

// Lucide Icons
import {
  Search, User, Phone, Mail, MapPin, CreditCard,
  CheckCircle2, XCircle, Trash2, Receipt, ShieldCheck,
  AlertCircle, ShoppingCart, Info, Loader2, AlertTriangle
} from "lucide-react"

// Shadcn UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const API_ORIGIN = import.meta.env.VITE_RETAIL_API_URL || "http://localhost:5000"
const API_BASE = API_ORIGIN.endsWith("/v1/api") ? API_ORIGIN : `${API_ORIGIN}/v1/api`

const emptyCustomer = {
  id: null,
  name: "",
  phone: "",
  email: "",
  type: "unregistered",
  address: "",
  tcg_id: "",
  tcg_verified: false,
}

const money = (value) => Number(value || 0).toFixed(2)

const today = () => new Date().toISOString().slice(0, 10)

function CustomerForm({
  billingType,
  customer,
  paymentMethod,
  isFetchingCustomer,
  customerMessage,
  onCustomerChange,
  onPaymentChange,
  onFetchCustomer,
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
          <Phone className="w-3 h-3" /> Phone Number
        </Label>
        <div className="relative">
          <Input
            id="phone"
            value={customer.phone}
            onChange={(e) =>
              onCustomerChange({
                phone: e.target.value,
                id: null,
                type: "unregistered",
                address: "",
              })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") onFetchCustomer()
            }}
            placeholder="Enter phone and press Enter"
            autoComplete="off"
            className="pl-9"
          />
          <Phone className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          {isFetchingCustomer && <Loader2 className="w-4 h-4 absolute right-3 top-2.5 animate-spin text-primary" />}
        </div>
        {customerMessage && (
           <p className={`text-xs flex items-center gap-1 ${customerMessage.includes("failed") ? "text-destructive" : "text-primary"}`}>
             {customerMessage.includes("found") ? <CheckCircle2 className="w-3 h-3"/> : <Info className="w-3 h-3"/>}
             {customerMessage}
           </p>
        )}
      </div>

      <div className="space-y-2">
         <Label htmlFor="name" className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
          <User className="w-3 h-3" /> Customer Name
        </Label>
        <div className="relative">
           <Input id="name" value={customer.name} onChange={(e) => onCustomerChange({ name: e.target.value })} placeholder="John Doe" autoComplete="off" className="pl-9" />
           <User className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
        </div>
      </div>

      {billingType === "wholesale" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="tcg" className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" /> TCG ID
            </Label>
            <div className="relative">
              <Input id="tcg" value={customer.tcg_id} onChange={(e) => onCustomerChange({ tcg_id: e.target.value })} placeholder="TCG-000123" autoComplete="off" className="pl-9" />
              <ShieldCheck className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
             <input type="checkbox" id="tcg_verified" checked={Boolean(customer.tcg_verified)} onChange={(e) => onCustomerChange({ tcg_verified: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
             <Label htmlFor="tcg_verified" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
               TCG Verified
             </Label>
          </div>
        </>
      )}

      <div className="space-y-2">
         <Label htmlFor="email" className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
          <Mail className="w-3 h-3" /> Email (Optional)
        </Label>
        <div className="relative">
           <Input id="email" type="email" value={customer.email} onChange={(e) => onCustomerChange({ email: e.target.value })} placeholder="customer@example.com" autoComplete="off" className="pl-9" />
           <Mail className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
        </div>
      </div>

      {customer.address && (
        <div className="rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground flex items-start gap-2">
           <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
           <span>{customer.address}</span>
        </div>
      )}
      
      <div className="space-y-2 pt-2">
         <Label htmlFor="payment" className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
          <CreditCard className="w-3 h-3" /> Payment Method
        </Label>
        <Select value={paymentMethod} onValueChange={onPaymentChange}>
          <SelectTrigger id="payment">
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="UPI">UPI</SelectItem>
            <SelectItem value="card">Card</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function ItemSearchBar({
  search,
  suggestions,
  activeIndex,
  isSearching,
  onSearchChange,
  onKeyDown,
  onSelect,
}) {
  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search items by name, brand..."
          className="pl-10 h-11 text-base shadow-sm border-primary/20 focus-visible:ring-primary"
          autoComplete="off"
        />
        {isSearching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />}
      </div>

      {(suggestions.length > 0 || isSearching) && (
        <div className="absolute left-0 right-0 top-12 z-50 mt-1 rounded-md border bg-popover shadow-md overflow-hidden animate-in fade-in zoom-in-95">
          {isSearching && suggestions.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching...
            </div>
          )}
          {!isSearching && suggestions.slice(0, 5).map((item, index) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onSelect(item); }}
              className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                activeIndex === index ? "bg-primary/10 text-primary" : "bg-transparent hover:bg-muted"
              }`}
            >
              <div>
                <span className="font-medium block">{item.name}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{item.brand || item.subcategory || ""}</span>
              </div>
              <Badge variant="outline" className="text-xs bg-background">
                Stock: {item.quantity || 0}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function itemError(item) {
  const quantity = Number(item.quantity)
  const price = Number(item.selling_price)

  if (!quantity || quantity <= 0) return "Qty must be > 0"
  if (quantity > Number(item.stock || 0)) return `Only ${item.stock} in stock`
  if (price < Number(item.net_buy_price || 0)) return `Price below buy ₹${money(item.net_buy_price)}`
  return ""
}

function ItemsTable({ items, onUpdateItem, onRemoveItem }) {
  if (!items.length) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground bg-muted/30">
        <ShoppingCart className="h-10 w-10 mb-3 text-muted-foreground/50" />
        <p>Scan or search item to start billing</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[45%]">Item Details</TableHead>
            <TableHead className="w-[20%] text-center">Qty</TableHead>
            <TableHead className="w-[20%] text-right">Price (₹)</TableHead>
            <TableHead className="w-[15%] text-right">Total</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const error = itemError(item)
            return (
              <TableRow key={item.item_id} className="group">
                <TableCell>
                  <div className="font-medium text-foreground">{item.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Stock {item.stock}</Badge>
                    <span className="text-xs text-muted-foreground">Buy ₹{money(item.net_buy_price)}</span>
                  </div>
                  {error && <span className="text-[10px] font-medium text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {error}</span>}
                </TableCell>
                <TableCell>
                   <Input
                    value={item.quantity}
                    onChange={(e) => onUpdateItem(index, { quantity: e.target.value })}
                    className={`h-8 w-20 mx-auto text-center font-medium ${error?.includes('stock') || error?.includes('Qty') ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    type="number" min="1"
                  />
                </TableCell>
                <TableCell>
                   <Input
                    value={item.selling_price}
                    onChange={(e) => onUpdateItem(index, { selling_price: e.target.value })}
                    className={`h-8 w-24 ml-auto text-right font-medium ${error?.includes('Price') ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    type="number" min="0" step="0.01"
                  />
                </TableCell>
                <TableCell className="text-right font-semibold text-primary">
                  ₹{money(Number(item.quantity || 0) * Number(item.selling_price || 0))}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => onRemoveItem(index)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function SummaryBox({ total, hasErrors, isSubmitting, submitMessage, onSubmit }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-theme-50 p-4 border border-theme-200">
        <div className="text-xs font-semibold uppercase text-theme-600 mb-1 flex items-center justify-between">
           <span>Total Amount</span>
           <Receipt className="h-4 w-4" />
        </div>
        <div className="text-4xl font-bold text-theme-900 tracking-tight">₹{money(total)}</div>
      </div>

      <Button
        size="lg"
        onClick={onSubmit}
        disabled={isSubmitting || hasErrors}
        className="w-full h-12 text-base shadow-md"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Generate Bill
          </>
        )}
      </Button>

      {submitMessage.text && (
        <Alert variant={submitMessage.type === "error" ? "destructive" : "default"} className={submitMessage.type === "success" ? "border-green-500 bg-green-50 text-green-700" : ""}>
          {submitMessage.type === "error" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
          <AlertTitle>{submitMessage.type === "error" ? "Error" : "Success"}</AlertTitle>
          <AlertDescription>{submitMessage.text}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default function BillingPage() {
  const [billingType, setBillingType] = useState("retail")
  const [customer, setCustomer] = useState(emptyCustomer)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [items, setItems] = useState([])
  const [search, setSearch] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [isFetchingCustomer, setIsFetchingCustomer] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customerMessage, setCustomerMessage] = useState("")
  const [submitMessage, setSubmitMessage] = useState({ type: "", text: "" })
  const [unmatchedItems, setUnmatchedItems] = useState([])
  const [billingResult, setBillingResult] = useState({ open: false, type: "", title: "", message: "", details: null })
  const searchTimer = useRef(null)

  const location = useLocation()
  const backend = useBackendCall()

  // TCG login dialog — opens automatically on TCG auth error
  const { openTCGLogin } = useTCGLogin()

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.selling_price || 0), 0),
    [items]
  )

  const hasItemErrors = items.some((item) => Boolean(itemError(item)))

  const updateCustomer = (patch) => {
    setCustomer((prev) => ({ ...prev, ...patch }))
    setCustomerMessage("")
  }

  const formatAddress = (addresses = []) => {
    const address = addresses[0]
    if (!address) return ""
    return [address.address_line, address.city, address.state, address.pincode, address.label]
      .filter(Boolean)
      .join(", ")
  }

  const fetchCustomer = async () => {
    const phone = customer.phone.trim()
    if (!phone) {
      setCustomerMessage("Enter phone first")
      return
    }

    setIsFetchingCustomer(true)
    setCustomerMessage("")

    try {
      const { data } = await axios.get(`${API_BASE}/admin/customer`, {
        params: { phone },
      })

      if (data?.found && data.customer) {
        setCustomer({
          id: data.customer.id,
          name: data.customer.name || "",
          email: data.customer.email || "",
          phone: data.customer.phone || phone,
          type: "registered",
          address: formatAddress(data.customer.addresses),
          tcg_id: data.customer.tcg_id || "",
          tcg_verified: Boolean(data.customer.tcg_verified),
        })
        setCustomerMessage("Customer found")
      } else {
        setCustomer((prev) => ({
          ...emptyCustomer,
          phone: prev.phone,
          type: "unregistered",
        }))
        setCustomerMessage("New / unregistered customer")
      }
    } catch (error) {
      setCustomerMessage(error.response?.data?.message || "Customer lookup failed")
    } finally {
      setIsFetchingCustomer(false)
    }
  }

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)

    const term = search.trim()
    if (!term) {
      setSuggestions([])
      setActiveIndex(0)
      setIsSearching(false)
      return
    }

    searchTimer.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const { data } = await axios.get(`${API_BASE}/admin/items/suggestions`, {
          params: { q: term },
        })
        setSuggestions(Array.isArray(data) ? data.slice(0, 5) : [])
        setActiveIndex(0)
      } catch {
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, 180)

    return () => clearTimeout(searchTimer.current)
  }, [search])

  /* ── process request data ── */
  useEffect(() => {
    const state = location.state
    if (state?.isFromRequest && state.items) {
      // 1. Auto-fill customer
      if (state.customer) {
        setCustomer({
          id: state.customer.id || null,
          name: state.customer.name || "",
          phone: state.customer.phone || "",
          email: state.customer.email || "",
          type: "registered",
          address: "",
          tcg_id: state.customer.tcg_id || "",
          tcg_verified: true,
        })
        setBillingType("wholesale")
      }

      // 2. Resolve items against local DB
      const resolveItems = async () => {
        setSubmitMessage({ type: "info", text: "Resolving request items..." })
        const { data } = await backend.call({
          route: "/v1/api/admin/sales/resolve-request",
          method: "POST",
          body: {
            items: state.items,
            review_action: "accept"
          }
        })
        
        if (data) {
          const matched = (data.matched || []).map(m => ({
            item_id: m.item_id,
            name: m.name,
            quantity: m.quantity,
            selling_price: m.selling_price,
            stock: m.stock,
            net_buy_price: m.net_buy_price,
          }))
          setItems(matched)
          setUnmatchedItems(data.unmatched || [])
          setSubmitMessage({ type: "success", text: "Request items imported." })
        } else {
          setSubmitMessage({ type: "error", text: "Failed to resolve items." })
        }
      }
      resolveItems()
    }
  }, [location.state])

  const addItemFromSuggestion = async (suggestion) => {
    if (!suggestion?.id) return

    setSubmitMessage({ type: "", text: "" })

    try {
      const { data } = await axios.get(`${API_BASE}/admin/items/details/${suggestion.id}`)
      const item = {
        item_id: data.id,
        name: data.name || data.item_name || suggestion.name,
        quantity: 1,
        selling_price: Number(data.mrp || 0),
        stock: Number(data.quantity || 0),
        net_buy_price: Number(data.net_buy_price || 0),
      }

      setItems((prev) => {
        const existingIndex = prev.findIndex((row) => row.item_id === item.item_id)
        if (existingIndex === -1) return [...prev, item]

        return prev.map((row, index) =>
          index === existingIndex
            ? { ...row, quantity: Number(row.quantity || 0) + 1 }
            : row
        )
      })

      setSearch("")
      setSuggestions([])
      setActiveIndex(0)
    } catch (error) {
      setSubmitMessage({
        type: "error",
        text: error.response?.data?.message || "Item details failed",
      })
    }
  }

  const handleSearchKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, Math.max(suggestions.length - 1, 0)))
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()
      if (suggestions[activeIndex]) addItemFromSuggestion(suggestions[activeIndex])
    }
  }

  const updateItem = (index, patch) => {
    setItems((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
  }

  const submitBill = async () => {
    setSubmitMessage({ type: "", text: "" })

    if (!items.length) {
      setSubmitMessage({ type: "error", text: "Add at least one item" })
      return
    }

    if (hasItemErrors) {
      setSubmitMessage({ type: "error", text: "Fix item errors before billing" })
      return
    }

    const cleanPhone = String(customer.phone || "").trim()
    const cleanName = String(customer.name || "").trim()

    const payload = {
      token: localStorage.getItem("tcg_token"),
      customer: {
        type: customer.type,
        ...(customer.id ? { id: customer.id } : {}),
        name: cleanName || "Walk-in Customer",
        phone: cleanPhone,
        email: String(customer.email || "").trim(),
        ...(billingType === "wholesale"
          ? {
              tcg_id: String(customer.tcg_id || "").trim(),
              tcg_verification: Boolean(customer.tcg_verified),
            }
          : {}),
      },
      items: items.map((item) => ({
        item_id: Number(item.item_id),
        quantity: Number(item.quantity),
        sell_price: Number(item.selling_price),
        discount: 0,
        tax_amount: 0,
      })),
      summary: {
        total_amount: total,
        extra_cost: 0,
        transport_cost: 0,
        final_amount: total,
      },
      payment: {
        method: paymentMethod,
        status: "paid",
      },
      meta: {
        employee_id: null,
        billing_date: today(),
        status: "completed",
      },
    }

    setIsSubmitting(true)

    try {
      const endpoint = billingType === "wholesale" ? "wholesaler" : "retail"
      const { data } = await axios.post(`${API_BASE}/sales/${endpoint}`, payload)
      
      setBillingResult({
        open: true,
        type: "success",
        title: "Bill Generated Successfully",
        message: `Invoice ${data.invoice_number} has been created.`,
        details: data
      })

      setItems([])
      setCustomer(emptyCustomer)
      setPaymentMethod("cash")
      setSearch("")
      setUnmatchedItems([])
    } catch (error) {
      const errMsg = error.response?.data?.message || "Bill generation failed"

      // Auto-open TCG login if the server reports a TCG auth failure
      const isTCGAuthError =
        typeof errMsg === "string" &&
        errMsg.toLowerCase().includes("tcg authentication failed")

      if (isTCGAuthError) {
        setSubmitMessage({
          type: "error",
          text: "TCG authentication failed — please reconnect your TCG session.",
        })
        openTCGLogin()
      } else {
        setBillingResult({
          open: true,
          type: "error",
          title: "Billing Failed",
          message: errMsg,
          details: null
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col space-y-6 w-full max-w-[1600px] mx-auto p-4 md:p-6 min-h-screen bg-theme-50/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-xl border shadow-sm shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-primary" /> Point of Sale
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create a new retail or wholesale bill.</p>
        </div>
        <div className="w-full md:w-[320px]">
           <Tabs value={billingType} onValueChange={setBillingType} className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-lg">
              <TabsTrigger value="retail" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Retail</TabsTrigger>
              <TabsTrigger value="wholesale" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Wholesale</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left column: Search and Items */}
        <div className="flex-1 w-full flex flex-col space-y-6 min-w-0">
          <Card className="shadow-sm border-t-4 border-t-primary shrink-0">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-base flex items-center gap-2 text-foreground">
                <Search className="h-4 w-4 text-primary" /> Item Search
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ItemSearchBar
                search={search}
                suggestions={suggestions}
                activeIndex={activeIndex}
                isSearching={isSearching}
                onSearchChange={setSearch}
                onKeyDown={handleSearchKeyDown}
                onSelect={addItemFromSuggestion}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm flex-1 flex flex-col min-h-[500px] max-h-[700px]">
            <CardHeader className="pb-3 flex flex-row items-center justify-between py-3 px-4 shrink-0 bg-muted/20 border-b">
               <CardTitle className="text-base font-semibold">Cart Items</CardTitle>
               <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-0">{items.length} items</Badge>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
               <ScrollArea className="flex-1 w-full p-4">
                  <ItemsTable
                    items={items}
                    onUpdateItem={updateItem}
                    onRemoveItem={removeItem}
                  />

                  {/* Unmatched Items Alert */}
                  {unmatchedItems.length > 0 && (
                    <Alert variant="destructive" className="mt-4 border-amber-500 bg-amber-50 text-amber-800">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-900 font-bold text-sm">Unmatched Items</AlertTitle>
                      <AlertDescription className="text-xs">
                        The following items from the request were not found in your inventory:
                        <ul className="list-disc list-inside mt-2 space-y-1 font-medium">
                          {unmatchedItems.map((item, idx) => (
                            <li key={idx}>
                              {item.name} (ID: {item.item_id || 'N/A'}) - Qty: {item.quantity}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
               </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Customer and Summary */}
        <div className="w-full lg:w-[400px] flex flex-col space-y-6 lg:sticky lg:top-6 shrink-0">
          <Card className="shadow-sm shrink-0">
            <CardHeader className="pb-4 pt-4 px-4 border-b bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <CustomerForm
                billingType={billingType}
                customer={customer}
                paymentMethod={paymentMethod}
                isFetchingCustomer={isFetchingCustomer}
                customerMessage={customerMessage}
                onCustomerChange={updateCustomer}
                onPaymentChange={setPaymentMethod}
                onFetchCustomer={fetchCustomer}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/20 bg-gradient-to-b from-white to-theme-50/30 flex-1 flex flex-col min-h-0">
             <CardHeader className="pb-2 pt-4 px-4 shrink-0">
               <CardTitle className="text-base">Order Summary</CardTitle>
             </CardHeader>
             <CardContent className="p-4 flex-1 flex flex-col justify-end">
              <SummaryBox
                total={total}
                hasErrors={hasItemErrors || !items.length}
                isSubmitting={isSubmitting}
                submitMessage={submitMessage}
                onSubmit={submitBill}
              />
             </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Result Dialog ── */}
      <Dialog open={billingResult.open} onOpenChange={(o) => setBillingResult(p => ({ ...p, open: o }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {billingResult.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              {billingResult.title}
            </DialogTitle>
            <DialogDescription>
              {billingResult.message}
            </DialogDescription>
          </DialogHeader>

          {billingResult.type === "success" && billingResult.details && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-2 border text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice No:</span>
                <span className="font-mono font-bold">{billingResult.details.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Blockchain Status:</span>
                <Badge variant={billingResult.details.blockchain_status === 'success' ? 'success' : 'outline'}>
                  {billingResult.details.blockchain_status}
                </Badge>
              </div>
              {billingResult.details.blockchain_txn_id && (
                <div className="flex flex-col gap-1 pt-1 border-t mt-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Transaction Hash</span>
                  <span className="text-[10px] font-mono break-all bg-background p-1 rounded border">
                    {billingResult.details.blockchain_txn_id}
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              className={billingResult.type === "success" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              onClick={() => setBillingResult(p => ({ ...p, open: false }))}
            >
              {billingResult.type === "success" ? "Done" : "Try Again"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
