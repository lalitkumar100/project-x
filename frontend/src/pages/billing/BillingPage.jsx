import React, { useEffect, useMemo, useRef, useState } from "react"
import axios from "axios"
import { useTCGLogin } from "@/context/TCGLoginContext"

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

function BillingTypeToggle({ billingType, onChange }) {
  return (
    <div className="flex border-b bg-white">
      {["retail", "wholesale"].map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={`h-10 px-6 text-sm font-semibold uppercase border-r ${
            billingType === type ? "bg-slate-900 text-white" : "bg-white text-slate-700"
          }`}
        >
          {type === "retail" ? "Retail" : "Wholesale"}
        </button>
      ))}
    </div>
  )
}

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
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">Phone</label>
        <input
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
          className="h-9 w-full border px-2 text-sm outline-none focus:border-slate-900"
          placeholder="Phone + Enter"
          autoComplete="off"
        />
        <div className="mt-1 min-h-4 text-xs text-slate-500">
          {isFetchingCustomer ? "Searching customer..." : customerMessage}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">Name</label>
        <input
          value={customer.name}
          onChange={(e) => onCustomerChange({ name: e.target.value })}
          className="h-9 w-full border px-2 text-sm outline-none focus:border-slate-900"
          placeholder="Customer name"
          autoComplete="off"
        />
      </div>

      {billingType === "wholesale" && (
        <>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">TCG ID</label>
            <input
              value={customer.tcg_id}
              onChange={(e) => onCustomerChange({ tcg_id: e.target.value })}
              className="h-9 w-full border px-2 text-sm outline-none focus:border-slate-900"
              placeholder="TCG-000123"
              autoComplete="off"
            />
          </div>

          <label className="flex h-9 items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(customer.tcg_verified)}
              onChange={(e) => onCustomerChange({ tcg_verified: e.target.checked })}
              className="h-4 w-4 accent-slate-900"
            />
            <span className="font-semibold">TCG Verified</span>
          </label>
        </>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
        <input
          value={customer.email}
          onChange={(e) => onCustomerChange({ email: e.target.value })}
          className="h-9 w-full border px-2 text-sm outline-none focus:border-slate-900"
          placeholder="Optional"
          autoComplete="off"
        />
      </div>

      {customer.address && (
        <div className="border bg-slate-50 p-2 text-xs text-slate-700">{customer.address}</div>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">Payment</label>
        <select
          value={paymentMethod}
          onChange={(e) => onPaymentChange(e.target.value)}
          className="h-9 w-full border bg-white px-2 text-sm outline-none focus:border-slate-900"
        >
          <option value="cash">cash</option>
          <option value="UPI">UPI</option>
          <option value="card">card</option>
        </select>
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
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="h-10 w-full border px-3 text-sm outline-none focus:border-slate-900"
        placeholder="Search item..."
        autoComplete="off"
      />

      {(suggestions.length > 0 || isSearching) && (
        <div className="absolute left-0 right-0 top-10 z-20 border border-t-0 bg-white">
          {isSearching && <div className="px-3 py-2 text-xs text-slate-500">Searching...</div>}
          {!isSearching &&
            suggestions.slice(0, 5).map((item, index) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelect(item)
                }}
                className={`block w-full px-3 py-2 text-left text-sm ${
                  activeIndex === index ? "bg-slate-900 text-white" : "bg-white text-slate-800"
                }`}
              >
                <span className="font-medium">{item.name}</span>
                <span className="ml-2 text-xs opacity-75">{item.brand || item.subcategory || ""}</span>
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

  if (!quantity || quantity <= 0) return "Qty must be greater than 0"
  if (quantity > Number(item.stock || 0)) return `Only ${item.stock} in stock`
  if (price < Number(item.net_buy_price || 0)) return `Price below buy ₹${money(item.net_buy_price)}`
  return ""
}

function ItemsTable({ items, onUpdateItem, onRemoveItem }) {
  if (!items.length) {
    return (
      <div className="flex h-72 items-center justify-center border border-t-0 text-sm text-slate-500">
        Scan or search item to start billing
      </div>
    )
  }

  return (
    <div className="border border-t-0">
      <div className="grid grid-cols-12 border-b bg-slate-100 px-2 py-2 text-xs font-semibold text-slate-700">
        <div className="col-span-5">Item Name</div>
        <div className="col-span-2">Qty</div>
        <div className="col-span-2">Price</div>
        <div className="col-span-2 text-right">Total</div>
        <div className="col-span-1 text-right">Remove</div>
      </div>

      <div className="max-h-[calc(100vh-235px)] overflow-y-auto">
        {items.map((item, index) => {
          const error = itemError(item)
          return (
            <div key={item.item_id} className="grid grid-cols-12 items-start border-b px-2 py-2 text-sm">
              <div className="col-span-5 pr-2">
                <div className="font-medium text-slate-900">{item.name}</div>
                <div className="text-xs text-slate-500">
                  Stock {item.stock} | Buy ₹{money(item.net_buy_price)}
                </div>
                {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
              </div>

              <div className="col-span-2 pr-2">
                <input
                  value={item.quantity}
                  onChange={(e) => onUpdateItem(index, { quantity: e.target.value })}
                  className="h-8 w-full border px-2 text-right outline-none focus:border-slate-900"
                  type="number"
                  min="1"
                />
              </div>

              <div className="col-span-2 pr-2">
                <input
                  value={item.selling_price}
                  onChange={(e) => onUpdateItem(index, { selling_price: e.target.value })}
                  className="h-8 w-full border px-2 text-right outline-none focus:border-slate-900"
                  type="number"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="col-span-2 pt-1 text-right font-semibold">
                ₹{money(Number(item.quantity || 0) * Number(item.selling_price || 0))}
              </div>

              <div className="col-span-1 text-right">
                <button
                  type="button"
                  onClick={() => onRemoveItem(index)}
                  className="h-8 w-8 border text-red-600"
                  aria-label={`Remove ${item.name}`}
                >
                  x
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SummaryBox({ total, hasErrors, isSubmitting, submitMessage, onSubmit }) {
  return (
    <div className="space-y-3">
      <div className="border p-4">
        <div className="text-xs font-semibold uppercase text-slate-500">Total</div>
        <div className="mt-1 text-4xl font-bold text-slate-900">₹{money(total)}</div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting || hasErrors}
        className="h-11 w-full bg-slate-900 text-sm font-semibold text-white disabled:bg-slate-300 disabled:text-slate-600"
      >
        {isSubmitting ? "Generating..." : "Generate Bill"}
      </button>

      <div className={`min-h-5 text-xs ${submitMessage.type === "error" ? "text-red-600" : "text-green-700"}`}>
        {submitMessage.text}
      </div>
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
  const searchTimer = useRef(null)

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

    const cleanPhone = customer.phone.trim()
    const cleanName = customer.name.trim()

    const payload = {
      customer: {
        type: customer.type,
        ...(customer.id ? { id: customer.id } : {}),
        name: cleanName || "Walk-in Customer",
        phone: cleanPhone,
        email: customer.email.trim(),
        ...(billingType === "wholesale"
          ? {
              tcg_id: customer.tcg_id.trim(),
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
      setSubmitMessage({
        type: "success",
        text: `Bill generated: ${data.invoice_number}`,
      })
      setItems([])
      setCustomer(emptyCustomer)
      setPaymentMethod("cash")
      setSearch("")
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
        setSubmitMessage({ type: "error", text: errMsg })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <BillingTypeToggle billingType={billingType} onChange={setBillingType} />

      <div className="grid h-[calc(100vh-41px)] grid-cols-12 overflow-hidden">
        <aside className="col-span-12 border-r p-3 md:col-span-3">
          <div className="mb-3 text-sm font-bold uppercase">Customer + Payment</div>
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

          <div className="mt-5">
            <SummaryBox
              total={total}
              hasErrors={hasItemErrors}
              isSubmitting={isSubmitting}
              submitMessage={submitMessage}
              onSubmit={submitBill}
            />
          </div>
        </aside>

        <main className="col-span-12 p-3 md:col-span-9">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-bold uppercase">Items</div>
            <div className="text-xs text-slate-500">Enter to add | Arrows to select</div>
          </div>

          <ItemSearchBar
            search={search}
            suggestions={suggestions}
            activeIndex={activeIndex}
            isSearching={isSearching}
            onSearchChange={setSearch}
            onKeyDown={handleSearchKeyDown}
            onSelect={addItemFromSuggestion}
          />

          <ItemsTable items={items} onUpdateItem={updateItem} onRemoveItem={removeItem} />
        </main>
      </div>
    </div>
  )
}
