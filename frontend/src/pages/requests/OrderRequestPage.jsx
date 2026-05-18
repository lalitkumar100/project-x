import React, { useEffect, useRef, useState } from "react"
import { ArrowLeft, Loader2, Plus, Send, Trash2, CheckCircle, XCircle, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Custom Hooks
import { useTCGCall } from "@/hooks/tcg_call"
import { useBackendCall } from "@/hooks/backend_call"
import { useTCGLogin } from "@/context/TCGLoginContext"

export default function OrderRequestPage() {
  const navigate = useNavigate()
  
  // Hooks for API calls
  const tcg = useTCGCall()
  const backend = useBackendCall()
  const { openTCGLogin } = useTCGLogin()

  const [receiverId, setReceiverId] = useState("")
  const [receiverInfo, setReceiverInfo] = useState(null)
  const [receiverError, setReceiverError] = useState("")

  const [items, setItems] = useState([])
  const [search, setSearch] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" })
  
  const [successData, setSuccessData] = useState(null)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)

  const searchTimer = useRef(null)
  const receiverTimer = useRef(null)

  // 1. Receiver lookup (TCG API)
  useEffect(() => {
    if (receiverTimer.current) clearTimeout(receiverTimer.current)
    
    const id = receiverId.trim()
    if (!id) {
      setReceiverInfo(null)
      setReceiverError("")
      return
    }

    receiverTimer.current = setTimeout(async () => {
      setReceiverError("")
      const { data, status } = await tcg.call({ route: `/v1/api/users/${id}` })
      if (data) {
        setReceiverInfo(data)
      } else {
        setReceiverInfo(null)
        if (status === 401) {
          openTCGLogin()
          setReceiverError("Unauthorized — Please connect TCG")
        } else {
          setReceiverError("Receiver not found on TCG network")
        }
      }
    }, 500)

    return () => clearTimeout(receiverTimer.current)
  }, [receiverId, tcg.call])

  // 2. Item suggestions (Backend API)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)

    const term = search.trim()
    if (!term) {
      setSuggestions([])
      setActiveIndex(0)
      return
    }

    searchTimer.current = setTimeout(async () => {
      const { data } = await backend.call({ 
        route: "/v1/api/admin/items/suggestions", 
        params: { q: term } 
      })
      if (data) {
        setSuggestions(Array.isArray(data) ? data.slice(0, 5) : [])
        setActiveIndex(0)
      }
    }, 300)

    return () => clearTimeout(searchTimer.current)
  }, [search, backend.call])

  const addItem = (suggestion) => {
    const exists = items.find((i) => i.id === suggestion.id)
    if (exists) {
      setItems(items.map((i) => 
        i.id === suggestion.id ? { ...i, quantity: i.quantity + 1 } : i
      ))
    } else {
      setItems([...items, { ...suggestion, quantity: 1 }])
    }
    setSearch("")
    setSuggestions([])
  }

  const updateQuantity = (id, qty) => {
    setItems(items.map((i) => 
      i.id === id ? { ...i, quantity: Math.max(1, Number(qty)) } : i
    ))
  }

  const removeItem = (id) => {
    setItems(items.filter((i) => i.id !== id))
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const term = search.trim()
      if (term) {
        // Add current search text as a custom item
        addItem({ id: `custom-${Date.now()}`, name: term, brand: "Custom", subcategory: "N/A" })
      }
    } else if (e.key === "Tab") {
      if (suggestions.length > 0) {
        e.preventDefault()
        // Fill search bar with the currently highlighted suggestion
        setSearch(suggestions[activeIndex].name)
      }
    }
  }

  // 3. Submit request (TCG API)
  const submitRequest = async () => {
    if (!receiverInfo) {
      setSubmitStatus({ type: "error", message: "Please enter a valid Receiver ID" })
      return
    }
    if (items.length === 0) {
      setSubmitStatus({ type: "error", message: "Please add at least one item" })
      return
    }

    setSubmitStatus({ type: "", message: "" })

    const payload = {
      receiver_id: Number(receiverId),
      request_data: {
        items: items.map((i) => ({
          item_id: i.id,
          name: i.name,
          quantity: i.quantity
        }))
      }
    }

    const { data, status } = await tcg.call({ 
      route: "/v1/api/requests", 
      method: "POST", 
      body: payload 
    })

    if (data) {
      setSubmitStatus({ type: "success", message: "Order request submitted successfully!" })
      
      // Extract data from response (handles both {success, data} and raw data)
      const respData = data.data || data;
      
      setSuccessData({
        receiverName: receiverInfo.business_name,
        receiverGst: receiverInfo.gst_number,
        requestId: respData.request_id || respData.id,
        id: respData.id
      })
      setIsSuccessDialogOpen(true)

      setItems([])
      setReceiverId("")
      setReceiverInfo(null)
    } else {
      if (status === 401) {
        openTCGLogin()
        setSubmitStatus({ type: "error", message: "Unauthorized — Please connect your TCG session" })
      } else {
        setSubmitStatus({ type: "error", message: tcg.error || "Failed to submit request" })
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Order Request</h1>
          <p className="text-sm text-gray-500">Request goods from wholesalers or other branches.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Receiver & Actions */}
        <aside className="lg:col-span-4 space-y-6">
          <Card className="border-t-4 border-t-cyan-600 shadow-sm">
            <CardHeader>
              <CardTitle>Request Destination</CardTitle>
              <CardDescription>Enter the ID of the receiver you want to request goods from.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receiverId">Receiver ID / User ID</Label>
                <div className="relative">
                  <Input
                    id="receiverId"
                    placeholder="Enter ID (e.g. 1)"
                    value={receiverId}
                    onChange={(e) => setReceiverId(e.target.value)}
                    className={receiverError ? "border-red-500" : receiverInfo ? "border-green-500" : ""}
                  />
                  {tcg.loading && !tcg.data && (
                    <div className="absolute right-3 top-2.5">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Receiver Info Display */}
                {receiverInfo && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Verified: {receiverInfo.business_name}
                    </div>
                    {receiverInfo.gst_number && (
                      <p className="text-xs text-green-600 mt-1">GST: {receiverInfo.gst_number}</p>
                    )}
                  </div>
                )}
                {receiverError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                    <XCircle className="h-4 w-4" />
                    {receiverError}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Items Count:</span>
                  <span className="font-bold">{items.length}</span>
                </div>
                
                <Button 
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white" 
                  size="lg"
                  disabled={tcg.loading || items.length === 0 || !receiverInfo}
                  onClick={submitRequest}
                >
                  {tcg.loading && items.length > 0 ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {tcg.loading && items.length > 0 ? "Sending..." : "Submit Request"}
                </Button>

                {submitStatus.message && (
                  <p className={`text-xs text-center font-medium ${
                    submitStatus.type === "success" ? "text-green-600" : "text-red-600"
                  }`}>
                    {submitStatus.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content: Item Search & List */}
        <main className="lg:col-span-8 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Items to Request</CardTitle>
              <CardDescription>Search and add goods you want to order.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search item by name, brand or category..."
                    className="pl-10 h-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                  />
                </div>

                {/* Suggestions Dropdown */}
                {(suggestions.length > 0 || backend.loading) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                    {backend.loading ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                        Searching...
                      </div>
                    ) : (
                      suggestions.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`p-3 cursor-pointer border-b last:border-b-0 hover:bg-cyan-50 transition-colors ${
                            idx === activeIndex ? "bg-cyan-50" : ""
                          }`}
                          onClick={() => addItem(item)}
                        >
                          <div className="font-semibold text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500 flex gap-2">
                            <span>{item.brand}</span>
                            <span>•</span>
                            <span>{item.subcategory}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-semibold text-gray-600">Item Name</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Details</th>
                      <th className="text-center p-3 font-semibold text-gray-600 w-32">Quantity</th>
                      <th className="text-right p-3 font-semibold text-gray-600 w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-gray-400 italic">
                          No items added yet. Search above to add items to your request.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3">
                            <div className="font-medium text-gray-900">{item.name}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-xs text-gray-500">
                              {item.brand} | {item.subcategory}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Input
                              type="number"
                              min="1"
                              className="h-8 w-20 mx-auto text-center"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, e.target.value)}
                            />
                          </td>
                          <td className="p-3 text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Request Created Successfully
            </DialogTitle>
            <DialogDescription>
              Your order request has been sent successfully.
            </DialogDescription>
          </DialogHeader>
          
          {successData && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 my-4">
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-slate-500 w-24">Sent To:</span>
                <span className="text-sm font-medium text-slate-900 flex-1 text-right">{successData.receiverName}</span>
              </div>
              {successData.receiverGst && (
                <div className="flex justify-between items-start">
                  <span className="text-sm font-semibold text-slate-500 w-24">GST No:</span>
                  <span className="text-sm font-medium text-slate-900 flex-1 text-right">{successData.receiverGst}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-3 flex justify-between items-start">
                <span className="text-sm font-semibold text-slate-500 w-24">Request ID:</span>
                <span className="text-xs font-mono bg-white px-2 py-1 border rounded text-slate-700 flex-1 text-right break-all">
                  {successData.requestId}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSuccessDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={() => {
                setIsSuccessDialogOpen(false)
                if (successData?.requestId) {
                  navigate(`/requests/details/${successData.requestId}`)
                }
              }}
            >
              Show Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
