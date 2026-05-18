import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useTCGCall } from "@/hooks/tcg_call";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;



const today = new Date().toISOString().slice(0, 10);

async function fetchWholesalerSuggestions(query, token) {
  try {
    const response = await axios.get(`${BASE_URL}/v1/api/admin/contact/suggestions`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: query },
    });
    return response.data?.data ?? [];
  } catch (_error) {
    return [];
  }
}

async function fetchItemSuggestions(query, token) {
  try {
    const response = await axios.get(`${BASE_URL}/v1/api/admin/items/suggestions`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: query },
    });
    const suggestionRows = Array.isArray(response.data) ? response.data : (response.data?.data ?? []);
    return suggestionRows.map((item) =>
      typeof item === "string"
        ? { id: null, name: item, brand: "", category: "", subcategory: "", mrp: "" }
        : item
    );
  } catch (_error) {
    return [];
  }
}

async function fetchItemDetails(itemId, token) {
  const response = await axios.get(`${BASE_URL}/v1/api/admin/items/details/${itemId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data?.data ?? response.data;
}

export default function AddStockPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem("token");
  const listRefs = useRef({});
  const wholesalerTimer = useRef(null);
  const itemTimer = useRef(null);
  const autoFetchDone = useRef(false);

  const [wholesalerPicked, setWholesalerPicked] = useState(false);
  const [activeWholesalerField, setActiveWholesalerField] = useState("name");
  const [wholesalerSuggestions, setWholesalerSuggestions] = useState([]);
  const [showWholesalerSuggestions, setShowWholesalerSuggestions] = useState(false);
  const [wholesalerSuggestionIndex, setWholesalerSuggestionIndex] = useState(-1);
  const [loadingWholesalers, setLoadingWholesalers] = useState(false);

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [itemSuggestions, setItemSuggestions] = useState([]);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [itemSuggestionIndex, setItemSuggestionIndex] = useState(-1);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState(null);
  const [loadingItemDetails, setLoadingItemDetails] = useState(false);
  const [submittingPurchase, setSubmittingPurchase] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [purchaseSuccess, setPurchaseSuccess] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(null);

  const tcg = useTCGCall();

  // Invoice Fetch Dialog state
  const [invoiceFetch, setInvoiceFetch] = useState({
    open: false,
    invoiceId: "",
    phase: "fetching", // "fetching" | "success" | "error"
    errorMsg: "",
  });

  const wholesalerForm = useForm({
    defaultValues: {
      name: "",
      gst_no: "",
      invoice_id: "",
      billing_type: "inter",
      billing_date: "",
      delivered_date: today,
    },
  });

  const invoiceForm = useForm({
    defaultValues: { items: [] },
  });

  const itemForm = useForm({
    defaultValues: {
      name: "",
      brand: "",
      category: "",
      subcategory: "",
      rate: "",
      buy_price: "",
      qty: "",
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: invoiceForm.control,
    name: "items",
  });

  const grandTotal = useMemo(
    () =>
      fields.reduce(
        (sum, row) => sum + (Number(row.buy_price || 0) * Number(row.qty || 0)),
        0
      ),
    [fields]
  );

  const rowKey = (row) =>
    `${String(row.name).trim().toLowerCase()}|${String(row.brand).trim().toLowerCase()}|${String(row.category).trim().toLowerCase()}`;

  const highlightAndScroll = (index) => {
    setHighlightedIndex(index);
    listRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlightedIndex(null), 2200);
  };

  const selectWholesaler = (entry) => {
    wholesalerForm.setValue("name", entry.name || "");
    wholesalerForm.setValue("gst_no", entry.gst_no || "");
    setShowWholesalerSuggestions(false);
    setWholesalerSuggestionIndex(-1);
  };

  const onWholesalerChange = (field, value) => {
    setActiveWholesalerField(field);
    wholesalerForm.setValue(field, value, { shouldValidate: true, shouldDirty: true });
    if (wholesalerTimer.current) clearTimeout(wholesalerTimer.current);
    if (!value.trim()) {
      setShowWholesalerSuggestions(false);
      setWholesalerSuggestions([]);
      return;
    }
    wholesalerTimer.current = setTimeout(async () => {
      setLoadingWholesalers(true);
      const rows = await fetchWholesalerSuggestions(value.trim(), token);
      setWholesalerSuggestions(rows.slice(0, 5));
      setWholesalerSuggestionIndex(-1);
      setShowWholesalerSuggestions(true);
      setLoadingWholesalers(false);
    }, 300);
  };

  const onItemNameChange = (value) => {
    itemForm.setValue("name", value, { shouldValidate: true, shouldDirty: true });
    setSelectedSuggestionId(null);
    if (itemTimer.current) clearTimeout(itemTimer.current);
    if (!value.trim()) {
      setShowItemSuggestions(false);
      setItemSuggestions([]);
      return;
    }
    itemTimer.current = setTimeout(async () => {
      setLoadingItems(true);
      const rows = await fetchItemSuggestions(value.trim(), token);
      setItemSuggestions(rows.slice(0, 5));
      setShowItemSuggestions(true);
      setItemSuggestionIndex(-1);
      setLoadingItems(false);
    }, 300);
  };

  const selectItemSuggestion = (entry) => {
    itemForm.setValue("name", entry.name ?? "");
    itemForm.setValue("brand", entry.brand ?? "");
    itemForm.setValue("category", entry.category ?? "");
    itemForm.setValue("subcategory", entry.subcategory ?? "");
    setSelectedSuggestionId(entry.id ?? null);
    if (entry.mrp !== undefined && entry.mrp !== null && entry.mrp !== "") {
      itemForm.setValue("rate", String(entry.mrp));
    }
    setShowItemSuggestions(false);
    setItemSuggestionIndex(-1);
  };

  const fillItemFormFromDetails = (details) => {
    if (!details) return;
    itemForm.setValue("name", details.name ?? itemForm.getValues("name"));
    itemForm.setValue("brand", details.brand ?? "");
    itemForm.setValue("subcategory", details.subcategory ?? "");
    itemForm.setValue("category", details.category ?? itemForm.getValues("category") ?? "");
    if (details.mrp !== undefined && details.mrp !== null) itemForm.setValue("rate", String(details.mrp));
    if (details.net_buy_price !== undefined && details.net_buy_price !== null) {
      itemForm.setValue("buy_price", String(details.net_buy_price));
    }
    if (details.quantity !== undefined && details.quantity !== null) {
      itemForm.setValue("qty", String(details.quantity));
    }
  };

  const fetchAndFillItemDetails = async (itemId) => {
    if (!itemId) return;
    try {
      setLoadingItemDetails(true);
      const details = await fetchItemDetails(itemId, token);
      fillItemFormFromDetails(details);
    } catch (error) {
      console.error("Failed to fetch item details", error);
    } finally {
      setLoadingItemDetails(false);
    }
  };

  const submitWholesaler = () => setWholesalerPicked(true);

  /* ── Reusable invoice fetch logic ── */
  const fetchInvoiceFromTCG = async (invoiceId) => {
    if (!invoiceId) return;

    setInvoiceFetch({ open: true, invoiceId, phase: "fetching", errorMsg: "" });
    wholesalerForm.setValue("invoice_id", invoiceId);

    const { data, status } = await tcg.call({
      route: "/v1/api/transactions/by-invoice",
      method: "POST",
      body: { invoice_no: invoiceId },
    });

    if (status === 200 && data?.success) {
      setInvoiceFetch((prev) => ({ ...prev, phase: "success" }));
      const txData = data.data;

      // Autofill wholesaler info from sender
      wholesalerForm.setValue("name", txData.sender_info?.name || "");
      wholesalerForm.setValue("gst_no", txData.sender_info?.gst_no || "");

      // Autofill items from invoice_data
      const rawItems = txData.invoice_data?.items || (Array.isArray(txData.invoice_data) ? txData.invoice_data : []);
      invoiceForm.reset({ items: [] });
      rawItems.forEach((item) => {
        append({
          item_id: null,
          name: item.name || "",
          brand: item.brand || "",
          category: item.category || "",
          subcategory: item.subcategory || "",
          rate: Number(item.rate || 0),
          buy_price: Number(item.buy_price || 0),
          qty: Number(item.qty || 0),
          total: Number(item.buy_price || 0) * Number(item.qty || 0),
        });
      });
      setWholesalerPicked(true);
      setTimeout(() => setInvoiceFetch((prev) => ({ ...prev, open: false })), 3000);
    } else {
      const errorMsg = data?.message || tcg.error || "Failed to fetch invoice";
      setInvoiceFetch((prev) => ({ ...prev, phase: "error", errorMsg }));
    }
  };

  /* ── Pre-fill invoice_id & billing type from URL query params ── */
  useEffect(() => {
    const urlInvoiceId = searchParams.get("invoice_id");
    if (urlInvoiceId && !autoFetchDone.current) {
      autoFetchDone.current = true;
      wholesalerForm.setValue("invoice_id", urlInvoiceId);
      wholesalerForm.setValue("billing_type", "inter");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /* ── Invoice ID Enter key → fetch from TCG server ── */
  const handleInvoiceIdKeyDown = async (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const invoiceId = wholesalerForm.getValues("invoice_id").trim();
    fetchInvoiceFromTCG(invoiceId);
  };

  const closeInvoiceFetchDialog = () => {
    setInvoiceFetch((prev) => ({ ...prev, open: false }));
  };

  const openCreateItemDialog = () => {
    setEditingIndex(null);
    setSelectedSuggestionId(null);
    setDuplicateWarning("");
    itemForm.reset({
      name: "",
      brand: "",
      category: "",
      subcategory: "",
      rate: "",
      buy_price: "",
      qty: "",
    });
    setItemDialogOpen(true);
  };

  const openEditItemDialog = (index) => {
    const row = fields[index];
    setEditingIndex(index);
    setSelectedSuggestionId(row.item_id ?? null);
    setDuplicateWarning("");
    itemForm.reset({
      name: row.name,
      brand: row.brand,
      category: row.category,
      subcategory: row.subcategory,
      rate: String(row.rate),
      buy_price: String(row.buy_price),
      qty: String(row.qty),
    });
    setItemDialogOpen(true);
  };

  const onItemSubmit = (payload) => {
    const existingItemId = editingIndex !== null ? (fields[editingIndex]?.item_id ?? null) : null;
    const normalized = {
      ...payload,
      item_id: selectedSuggestionId ?? existingItemId,
      rate: Number(payload.rate),
      buy_price: Number(payload.buy_price),
      qty: Number(payload.qty),
      total: Number(payload.buy_price) * Number(payload.qty),
    };

    const duplicateIndex = fields.findIndex((row, idx) => {
      if (editingIndex === idx) return false;
      return rowKey(row) === rowKey(normalized);
    });

    if (duplicateIndex !== -1) {
      highlightAndScroll(duplicateIndex);
      setDuplicateWarning(
        "This item is already added in the invoice. You can update existing quantity."
      );
      return;
    }

    if (editingIndex !== null) update(editingIndex, normalized);
    else append(normalized);

    setItemDialogOpen(false);
    setDuplicateWarning("");
    setShowItemSuggestions(false);
    setSelectedSuggestionId(null);
  };

  const bumpQuantityForDuplicate = () => {
    const values = itemForm.getValues();
    const duplicateIndex = fields.findIndex((row) => rowKey(row) === rowKey(values));
    if (duplicateIndex === -1) return;
    const existing = fields[duplicateIndex];
    const extra = Number(values.qty || 0);
    const nextQty = Number(existing.qty || 0) + extra;
    update(duplicateIndex, {
      ...existing,
      qty: nextQty,
      total: Number(existing.buy_price || 0) * nextQty,
    });
    setDuplicateWarning("");
    highlightAndScroll(duplicateIndex);
    setItemDialogOpen(false);
  };

  const buildPurchasePayload = () => {
    const wholesalerValues = wholesalerForm.getValues();
    const items = fields.map((row) => ({
      item_id: row.item_id ?? null,
      item_name: row.name,
      brand: row.brand || "",
      category: row.category || "",
      subcategory: row.subcategory || "",
      qty: Number(row.qty || 0),
      quantity: Number(row.qty || 0),
      buy_price: Number(row.buy_price || 0),
      purchase_price: Number(row.buy_price || 0),
      rate: Number(row.rate || 0),
      mrp: Number(row.rate || 0),
      line_total: Number(row.buy_price || 0) * Number(row.qty || 0),
    }));

    return {
      wholesaler: {
        name: wholesalerValues.name,
        gst_no: wholesalerValues.gst_no,
      },
      invoice_id: wholesalerValues.invoice_id || null,
      billing_type: wholesalerValues.billing_type || "inter",
      billing_date: wholesalerValues.billing_date || null,
      delivered_date: wholesalerValues.delivered_date || null,
      grand_total: items.reduce((sum, item) => sum + item.line_total, 0),
      items,
    };
  };

  const submitPurchaseInvoice = async () => {
    const wholesalerValid = await wholesalerForm.trigger();
    if (!wholesalerValid) {
      setPurchaseError("Please complete wholesaler details before submitting purchase.");
      return;
    }
    if (fields.length === 0) {
      setPurchaseError("Add at least one item before submitting purchase.");
      return;
    }
    try {
      setSubmittingPurchase(true);
      setPurchaseError("");
      setPurchaseSuccess("");
      const payload = buildPurchasePayload();
      const response = await axios.post(`${BASE_URL}/v1/api/admin/purchase`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPurchaseError("");
      setPurchaseSuccess(response?.data?.message || "Purchase submitted successfully.");
      invoiceForm.reset({ items: [] });
      setWholesalerPicked(false);
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to submit purchase invoice.";
      setPurchaseError(message);
      setPurchaseSuccess("");
    } finally {
      setSubmittingPurchase(false);
    }
  };

  const suggestionDisplayValue = (entry) =>
    activeWholesalerField === "name" ? entry.name : entry.gst_no;

  const renderWholesalerSuggestions = () => (
    <ul className="absolute top-full mt-1 w-full bg-white border rounded-md shadow-lg z-20 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
      {loadingWholesalers ? (
        <li className="px-3 py-2 text-sm text-gray-500">Loading...</li>
      ) : wholesalerSuggestions.length === 0 ? (
        <li className="px-3 py-2 text-sm text-gray-500">No results found</li>
      ) : (
        wholesalerSuggestions.map((entry, idx) => (
          <li
            key={entry.id ?? `${entry.name}-${idx}`}
            className={`px-3 py-2 text-sm cursor-pointer ${
              idx === wholesalerSuggestionIndex ? "bg-cyan-100 text-cyan-900" : "hover:bg-gray-100"
            }`}
            onMouseDown={() => selectWholesaler(entry)}
          >
            {suggestionDisplayValue(entry)}
          </li>
        ))
      )}
    </ul>
  );

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Stock / Purchase Invoice</h1>
          <p className="text-sm text-gray-500">Step 1: select wholesaler. Step 2: add invoice items.</p>
        </div>
      </div>

      <Card className="border-t-4 border-t-cyan-600 shadow-sm">
        <CardHeader>
          <CardTitle>Wholesaler Form</CardTitle>
          <CardDescription>Items form appears only after wholesaler selection is completed.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={wholesalerForm.handleSubmit(submitWholesaler)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 relative">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                autoComplete="off"
                {...wholesalerForm.register("name", { required: "Name is required" })}
                onChange={(e) => onWholesalerChange("name", e.target.value)}
                onFocus={() => setActiveWholesalerField("name")}
                onKeyDown={(e) => {
                  if (!showWholesalerSuggestions) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setWholesalerSuggestionIndex((prev) => Math.min(prev + 1, wholesalerSuggestions.length - 1));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setWholesalerSuggestionIndex((prev) => Math.max(prev - 1, 0));
                  }
                  if (e.key === "Enter" && wholesalerSuggestionIndex >= 0) {
                    e.preventDefault();
                    selectWholesaler(wholesalerSuggestions[wholesalerSuggestionIndex]);
                  }
                }}
                className={wholesalerForm.formState.errors.name ? "border-red-500" : ""}
              />
              {wholesalerForm.formState.errors.name && (
                <p className="text-xs text-red-600">{wholesalerForm.formState.errors.name.message}</p>
              )}

              {showWholesalerSuggestions && activeWholesalerField === "name" ? renderWholesalerSuggestions() : null}
            </div>

            <div className="space-y-1 relative">
              <Label htmlFor="gst_no">GST Number *</Label>
              <Input
                id="gst_no"
                autoComplete="off"
                {...wholesalerForm.register("gst_no", { required: "GST Number is required" })}
                onChange={(e) => onWholesalerChange("gst_no", e.target.value)}
                onFocus={() => setActiveWholesalerField("gst_no")}
                onKeyDown={(e) => {
                  if (!showWholesalerSuggestions) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setWholesalerSuggestionIndex((prev) => Math.min(prev + 1, wholesalerSuggestions.length - 1));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setWholesalerSuggestionIndex((prev) => Math.max(prev - 1, 0));
                  }
                  if (e.key === "Enter" && wholesalerSuggestionIndex >= 0) {
                    e.preventDefault();
                    selectWholesaler(wholesalerSuggestions[wholesalerSuggestionIndex]);
                  }
                }}
                className={wholesalerForm.formState.errors.gst_no ? "border-red-500" : ""}
              />
              {wholesalerForm.formState.errors.gst_no && (
                <p className="text-xs text-red-600">{wholesalerForm.formState.errors.gst_no.message}</p>
              )}
              {showWholesalerSuggestions && activeWholesalerField === "gst_no" ? renderWholesalerSuggestions() : null}
            </div>

            <div className="space-y-1">
              <Label htmlFor="invoice_id">Invoice ID *</Label>
              <Input
                id="invoice_id"
                placeholder="INV-2026-001"
                {...wholesalerForm.register("invoice_id", { required: "Invoice ID is required" })}
                className={wholesalerForm.formState.errors.invoice_id ? "border-red-500" : ""}
                onKeyDown={handleInvoiceIdKeyDown}
              />
              {wholesalerForm.formState.errors.invoice_id && (
                <p className="text-xs text-red-600">{wholesalerForm.formState.errors.invoice_id.message}</p>
              )}
              <p className="text-[11px] text-muted-foreground">Press Enter to fetch invoice from TCG server</p>
            </div>

            <div className="space-y-1">
              <Label>Billing Type *</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={wholesalerForm.watch("billing_type") === "inter" ? "default" : "outline"}
                  onClick={() => wholesalerForm.setValue("billing_type", "inter", { shouldDirty: true })}
                >
                  Inter Billing
                </Button>
                <Button
                  type="button"
                  variant={wholesalerForm.watch("billing_type") === "outer" ? "default" : "outline"}
                  onClick={() => wholesalerForm.setValue("billing_type", "outer", { shouldDirty: true })}
                >
                  Outer Billing
                </Button>
              </div>
              <input type="hidden" {...wholesalerForm.register("billing_type", { required: true })} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="billing_date">Billing Date</Label>
              <Input id="billing_date" type="date" {...wholesalerForm.register("billing_date")} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="delivered_date">Delivered Date *</Label>
              <Input
                id="delivered_date"
                type="date"
                {...wholesalerForm.register("delivered_date", { required: "Delivered date is required" })}
                className={wholesalerForm.formState.errors.delivered_date ? "border-red-500" : ""}
              />
              {wholesalerForm.formState.errors.delivered_date && (
                <p className="text-xs text-red-600">{wholesalerForm.formState.errors.delivered_date.message}</p>
              )}
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button type="submit">Continue to Items</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {wholesalerPicked && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Invoice Items</CardTitle>
              <CardDescription>Add items through dialog only.</CardDescription>
            </div>
            <Button onClick={openCreateItemDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed p-10 text-center">
                <p className="text-gray-500 mb-4">No items added</p>
                <Button onClick={openCreateItemDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2">Item Name</th>
                        <th className="text-left px-3 py-2">Brand</th>
                        <th className="text-left px-3 py-2">Category</th>
                        <th className="text-left px-3 py-2">Qty</th>
                        <th className="text-left px-3 py-2">Rate</th>
                        <th className="text-left px-3 py-2">Buy Price</th>
                        <th className="text-left px-3 py-2">Total</th>
                        <th className="text-left px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((row, index) => (
                        <tr
                          key={row.id}
                          ref={(el) => {
                            listRefs.current[index] = el;
                          }}
                          className={`border-t ${highlightedIndex === index ? "bg-yellow-100" : ""}`}
                        >
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2">{row.brand || "-"}</td>
                          <td className="px-3 py-2">{row.category || "-"}</td>
                          <td className="px-3 py-2">{row.qty}</td>
                          <td className="px-3 py-2">₹{Number(row.rate).toFixed(2)}</td>
                          <td className="px-3 py-2">₹{Number(row.buy_price).toFixed(2)}</td>
                          <td className="px-3 py-2">₹{(Number(row.buy_price) * Number(row.qty)).toFixed(2)}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => openEditItemDialog(index)}>
                                <Pencil className="h-3.5 w-3.5 mr-1" />
                                Edit
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => remove(index)}>
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end text-lg font-semibold">
                  Grand Total: <span className="ml-2 text-cyan-700">₹{grandTotal.toFixed(2)}</span>
                </div>
                {purchaseSuccess ? <p className="text-sm text-green-700 text-right">{purchaseSuccess}</p> : null}
                <div className="flex items-center justify-end gap-3">
                  {purchaseError ? <p className="text-sm text-red-600">{purchaseError}</p> : null}
                  <Button type="button" onClick={submitPurchaseInvoice} disabled={submittingPurchase}>
                    {submittingPurchase ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Submit Purchase
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Edit Item" : "Add Item"}</DialogTitle>
            <DialogDescription>Fill invoice item details and save.</DialogDescription>
          </DialogHeader>
          <form onSubmit={itemForm.handleSubmit(onItemSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 relative">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  autoComplete="off"
                  {...itemForm.register("name", { required: "Item name is required" })}
                  onChange={(e) => onItemNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" && showItemSuggestions) {
                      e.preventDefault();
                      setItemSuggestionIndex((prev) => Math.min(prev + 1, itemSuggestions.length - 1));
                    }
                    if (e.key === "ArrowUp" && showItemSuggestions) {
                      e.preventDefault();
                      setItemSuggestionIndex((prev) => Math.max(prev - 1, 0));
                    }
                    if (e.key === "Enter" && showItemSuggestions && itemSuggestions.length > 0) {
                      e.preventDefault();
                      const targetIndex = itemSuggestionIndex >= 0 ? itemSuggestionIndex : 0;
                      selectItemSuggestion(itemSuggestions[targetIndex]);
                      return;
                    }
                    if (e.key === "Enter" && selectedSuggestionId) {
                      e.preventDefault();
                      fetchAndFillItemDetails(selectedSuggestionId);
                    }
                  }}
                  className={itemForm.formState.errors.name ? "border-red-500" : ""}
                />
                {itemForm.formState.errors.name && (
                  <p className="text-xs text-red-600">{itemForm.formState.errors.name.message}</p>
                )}
                {selectedSuggestionId ? (
                  <p className="text-xs text-cyan-700">Press Enter again to fetch full item details.</p>
                ) : null}
                {loadingItemDetails ? (
                  <p className="text-xs text-gray-500">Fetching item details...</p>
                ) : null}

                {showItemSuggestions && (
                  <ul className="absolute top-full mt-1 w-full bg-white border rounded-md shadow-lg z-20 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                    {loadingItems ? (
                      <li className="px-3 py-2 text-sm text-gray-500">Loading...</li>
                    ) : itemSuggestions.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-gray-500">No results found</li>
                    ) : (
                      itemSuggestions.map((entry, idx) => (
                        <li
                          key={entry.id ?? `${entry.name}-${idx}`}
                          className={`px-3 py-2 text-sm cursor-pointer ${
                            idx === itemSuggestionIndex ? "bg-cyan-100 text-cyan-900" : "hover:bg-gray-100"
                          }`}
                          onMouseDown={() => selectItemSuggestion(entry)}
                        >
                          <p className="font-medium">{entry.name}</p>
                          <p className="text-xs text-gray-500">
                            {entry.brand || "-"} | {entry.category || "-"} | {entry.subcategory || "-"} | MRP: ₹{entry.mrp ?? "-"}
                          </p>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" {...itemForm.register("brand")} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="category">Category</Label>
                <Input id="category" placeholder="e.g. Kitchen Appliances" {...itemForm.register("category")} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="subcategory">Subcategory</Label>
                <Input id="subcategory" {...itemForm.register("subcategory")} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="rate">Rate (MRP) *</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  {...itemForm.register("rate", {
                    required: "Rate is required",
                    min: { value: 0.01, message: "Rate should be greater than 0" },
                  })}
                  className={itemForm.formState.errors.rate ? "border-red-500" : ""}
                />
                {itemForm.formState.errors.rate && (
                  <p className="text-xs text-red-600">{itemForm.formState.errors.rate.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="buy_price">Buy Price *</Label>
                <Input
                  id="buy_price"
                  type="number"
                  step="0.01"
                  {...itemForm.register("buy_price", {
                    required: "Buy price is required",
                    min: { value: 0.01, message: "Buy price should be greater than 0" },
                  })}
                  className={itemForm.formState.errors.buy_price ? "border-red-500" : ""}
                />
                {itemForm.formState.errors.buy_price && (
                  <p className="text-xs text-red-600">{itemForm.formState.errors.buy_price.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="qty">Quantity *</Label>
                <Input
                  id="qty"
                  type="number"
                  {...itemForm.register("qty", {
                    required: "Quantity is required",
                    min: { value: 1, message: "Quantity should be greater than 0" },
                  })}
                  className={itemForm.formState.errors.qty ? "border-red-500" : ""}
                />
                {itemForm.formState.errors.qty && (
                  <p className="text-xs text-red-600">{itemForm.formState.errors.qty.message}</p>
                )}
              </div>
            </div>

            {duplicateWarning ? (
              <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
                <p>{duplicateWarning}</p>
                <div className="flex gap-2 mt-2">
                  <Button type="button" size="sm" variant="outline" onClick={bumpQuantityForDuplicate}>
                    Update Quantity
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const values = itemForm.getValues();
                      const existingIndex = fields.findIndex((row) => rowKey(row) === rowKey(values));
                      if (existingIndex >= 0) {
                        setItemDialogOpen(false);
                        openEditItemDialog(existingIndex);
                        highlightAndScroll(existingIndex);
                      }
                    }}
                  >
                    Go to Edit Item
                  </Button>
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setItemDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {itemForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {editingIndex !== null ? "Update Item" : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── TCG Invoice Fetch Dialog ── */}
      {invoiceFetch.open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(10px) brightness(0.5)",
            WebkitBackdropFilter: "blur(10px) brightness(0.5)",
            backgroundColor: "rgba(0,0,20,0.5)",
            animation: "tcgif-fade 0.25s ease",
          }}
          onClick={closeInvoiceFetchDialog}
        >
          <style>{`
            @keyframes tcgif-fade   { from { opacity:0 } to { opacity:1 } }
            @keyframes tcgif-slide  { from { opacity:0; transform:translateY(24px) scale(0.96) } to { opacity:1; transform:translateY(0) scale(1) } }
            @keyframes tcgif-spin   { to { transform: rotate(360deg) } }
            @keyframes tcgif-pulse  { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
            @keyframes tcgif-arrow  { 0%,100% { transform:translateX(0) } 50% { transform:translateX(6px) } }
            @keyframes tcgif-bounce { 0%,100% { transform:scale(1) } 50% { transform:scale(1.12) } }
            .tcgif-card { animation: tcgif-slide 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }
            .tcgif-arrow-anim { animation: tcgif-arrow 1s ease-in-out infinite; }
            .tcgif-spin { animation: tcgif-spin 1.4s linear infinite; }
            .tcgif-pulse { animation: tcgif-pulse 1.5s ease-in-out infinite; }
            .tcgif-success-bounce { animation: tcgif-bounce 0.4s ease; }
          `}</style>

          <div
            className="tcgif-card"
            style={{
              background: "linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)",
              borderRadius: "24px",
              width: "100%", maxWidth: "460px", margin: "16px",
              boxShadow: "0 32px 80px rgba(0,0,40,0.35), 0 0 0 1px rgba(99,102,241,0.15)",
              overflow: "hidden",
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent bar */}
            <div style={{
              height: "4px",
              background: "linear-gradient(90deg, #4f46e5 0%, #dc2626 50%, #4f46e5 100%)",
            }} />

            <div style={{ padding: "36px 36px 32px" }}>
              {/* Logos row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", marginBottom: "28px" }}>
                {/* Your logo */}
                <div style={{
                  background: "white", borderRadius: "16px", padding: "10px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                  border: "1px solid #e0e7ff",
                }}>
                  <img src="/assets/log1.png" alt="Company Logo"
                    style={{ width: "64px", height: "64px", objectFit: "contain", display: "block" }} />
                </div>

                {/* Animated arrow */}
                <div className="tcgif-arrow-anim" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
                    <path d="M0 8 H32" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M28 2 L38 8 L28 14" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: "9px", color: "#6366f1", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>TCG</span>
                </div>

                {/* TCG logo */}
                <div style={{
                  background: "white", borderRadius: "16px", padding: "10px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                  border: "1px solid #fecaca",
                }}>
                  <img src="/PROJECT-X/TCG_logo.png" alt="TCG Logo"
                    style={{ width: "64px", height: "64px", objectFit: "contain", display: "block" }} />
                </div>
              </div>

              {/* Status section */}
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "6px", fontWeight: 500 }}>
                  Fetching invoice from TCG Server
                </p>
                <p style={{
                  fontFamily: "monospace", fontSize: "15px", fontWeight: 700,
                  color: "#4f46e5", background: "#eef2ff",
                  padding: "6px 14px", borderRadius: "8px", display: "inline-block",
                  border: "1px solid #c7d2fe", marginBottom: "24px", letterSpacing: "0.5px",
                }}>
                  {invoiceFetch.invoiceId}
                </p>

                {/* Phase indicator */}
                {invoiceFetch.phase === "fetching" && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                    <svg className="tcgif-spin" width="42" height="42" viewBox="0 0 42 42" fill="none">
                      <circle cx="21" cy="21" r="18" stroke="#e0e7ff" strokeWidth="4" />
                      <path d="M21 3 A18 18 0 0 1 39 21" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                    <p className="tcgif-pulse" style={{ fontSize: "14px", color: "#4f46e5", fontWeight: 600 }}>
                      Contacting TradeChainGuardian…
                    </p>
                    <p style={{ fontSize: "12px", color: "#9ca3af" }}>Verifying invoice ID and fetching data</p>
                  </div>
                )}

                {invoiceFetch.phase === "success" && (
                  <div className="tcgif-success-bounce" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "56px", height: "56px", borderRadius: "50%",
                      background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid #6ee7b7",
                    }}>
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <path d="M5 14 L11 20 L23 8" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p style={{ fontSize: "15px", fontWeight: 700, color: "#059669" }}>Invoice Fetched Successfully!</p>
                    <p style={{ fontSize: "12px", color: "#6b7280" }}>Invoice data is ready. You can now proceed.</p>
                  </div>
                )}

                {invoiceFetch.phase === "error" && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "56px", height: "56px", borderRadius: "50%",
                      background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid #fca5a5",
                    }}>
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <path d="M8 8 L20 20 M20 8 L8 20" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p style={{ fontSize: "15px", fontWeight: 700, color: "#dc2626" }}>Fetch Failed</p>
                    <p style={{ fontSize: "12px", color: "#6b7280" }}>{invoiceFetch.errorMsg || "Unable to contact TCG server."}</p>
                  </div>
                )}
              </div>

              {/* Close button */}
              <div style={{ marginTop: "28px", display: "flex", justifyContent: "center" }}>
                <button
                  onClick={closeInvoiceFetchDialog}
                  style={{
                    padding: "10px 28px", borderRadius: "10px",
                    border: "1.5px solid #e0e7ff",
                    background: "white", cursor: "pointer",
                    fontSize: "14px", fontWeight: 600, color: "#6b7280",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f3ff"; e.currentTarget.style.borderColor = "#a5b4fc"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#e0e7ff"; }}
                >
                  {invoiceFetch.phase === "success" ? "✓ Done" : "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}