import React, { useMemo, useRef, useState } from "react";
import axios from "axios";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

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

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";



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
  const token = localStorage.getItem("token");
  const listRefs = useRef({});
  const wholesalerTimer = useRef(null);
  const itemTimer = useRef(null);

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
      item_name: "",
      brand: "",
      category: "Tablet",
      subcategory: "",
      mrp: "",
      purchase_price: "",
      quantity: "",
      warranty: "",
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: invoiceForm.control,
    name: "items",
  });

  const grandTotal = useMemo(
    () =>
      fields.reduce(
        (sum, row) => sum + (Number(row.purchase_price || 0) * Number(row.quantity || 0)),
        0
      ),
    [fields]
  );

  const rowKey = (row) =>
    `${String(row.item_name).trim().toLowerCase()}|${String(row.brand).trim().toLowerCase()}|${String(row.category).trim().toLowerCase()}`;

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
    itemForm.setValue("item_name", value, { shouldValidate: true, shouldDirty: true });
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
    itemForm.setValue("item_name", entry.name ?? "");
    itemForm.setValue("brand", entry.brand ?? "");
    itemForm.setValue("category", entry.category ?? "Tablet");
    itemForm.setValue("subcategory", entry.subcategory ?? "");
    setSelectedSuggestionId(entry.id ?? null);
    if (entry.mrp !== undefined && entry.mrp !== null && entry.mrp !== "") {
      itemForm.setValue("mrp", String(entry.mrp));
    }
    setShowItemSuggestions(false);
    setItemSuggestionIndex(-1);
  };

  const fillItemFormFromDetails = (details) => {
    if (!details) return;
    itemForm.setValue("item_name", details.name ?? itemForm.getValues("item_name"));
    itemForm.setValue("brand", details.brand ?? "");
    itemForm.setValue("subcategory", details.subcategory ?? "");
    itemForm.setValue("category", details.category ?? itemForm.getValues("category") ?? "Tablet");
    if (details.mrp !== undefined && details.mrp !== null) itemForm.setValue("mrp", String(details.mrp));
    if (details.net_buy_price !== undefined && details.net_buy_price !== null) {
      itemForm.setValue("purchase_price", String(details.net_buy_price));
    }
    if (details.quantity !== undefined && details.quantity !== null) {
      itemForm.setValue("quantity", String(details.quantity));
    }
    if (details.warranty_months !== undefined && details.warranty_months !== null) {
      itemForm.setValue("warranty", String(details.warranty_months));
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

  const openCreateItemDialog = () => {
    setEditingIndex(null);
    setSelectedSuggestionId(null);
    setDuplicateWarning("");
    itemForm.reset({
      item_name: "",
      brand: "",
      category: "Tablet",
      subcategory: "",
      mrp: "",
      purchase_price: "",
      quantity: "",
      warranty: "",
    });
    setItemDialogOpen(true);
  };

  const openEditItemDialog = (index) => {
    const row = fields[index];
    setEditingIndex(index);
    setSelectedSuggestionId(row.item_id ?? null);
    setDuplicateWarning("");
    itemForm.reset({
      item_name: row.item_name,
      brand: row.brand,
      category: row.category,
      subcategory: row.subcategory,
      mrp: String(row.mrp),
      purchase_price: String(row.purchase_price),
      quantity: String(row.quantity),
      warranty: row.warranty ? String(row.warranty) : "",
    });
    setItemDialogOpen(true);
  };

  const onItemSubmit = (payload) => {
    const existingItemId = editingIndex !== null ? (fields[editingIndex]?.item_id ?? null) : null;
    const normalized = {
      ...payload,
      item_id: selectedSuggestionId ?? existingItemId,
      mrp: Number(payload.mrp),
      purchase_price: Number(payload.purchase_price),
      quantity: Number(payload.quantity),
      warranty: payload.warranty ? Number(payload.warranty) : 0,
      total: Number(payload.purchase_price) * Number(payload.quantity),
    };

    const duplicateIndex = fields.findIndex((row, idx) => {
      if (editingIndex === idx) return false;
      return rowKey(row) === rowKey(normalized);
    });

    if (duplicateIndex !== -1) {
      const existing = fields[duplicateIndex];
      const sameWarranty = Number(existing.warranty || 0) === Number(normalized.warranty || 0);
      highlightAndScroll(duplicateIndex);
      setDuplicateWarning(
        sameWarranty
          ? "This item is already added in the invoice. You can update existing quantity."
          : "This item already exists. If warranty is different, please update the existing item instead of adding a new one."
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
    const extra = Number(values.quantity || 0);
    const nextQty = Number(existing.quantity || 0) + extra;
    update(duplicateIndex, {
      ...existing,
      quantity: nextQty,
      total: Number(existing.purchase_price || 0) * nextQty,
    });
    setDuplicateWarning("");
    highlightAndScroll(duplicateIndex);
    setItemDialogOpen(false);
  };

  const buildPurchasePayload = () => {
    const wholesalerValues = wholesalerForm.getValues();
    const items = fields.map((row) => ({
      item_id: row.item_id ?? null,
      item_name: row.item_name,
      brand: row.brand || "",
      category: row.category || "",
      subcategory: row.subcategory || "",
      quantity: Number(row.quantity || 0),
      purchase_price: Number(row.purchase_price || 0),
      mrp: Number(row.mrp || 0),
      warranty_months: Number(row.warranty || 0),
      line_total: Number(row.purchase_price || 0) * Number(row.quantity || 0),
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
              />
              {wholesalerForm.formState.errors.invoice_id && (
                <p className="text-xs text-red-600">{wholesalerForm.formState.errors.invoice_id.message}</p>
              )}
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
                        <th className="text-left px-3 py-2">Purchase Price</th>
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
                          <td className="px-3 py-2">{row.item_name}</td>
                          <td className="px-3 py-2">{row.brand || "-"}</td>
                          <td className="px-3 py-2">{row.category || "-"}</td>
                          <td className="px-3 py-2">{row.quantity}</td>
                          <td className="px-3 py-2">₹{Number(row.purchase_price).toFixed(2)}</td>
                          <td className="px-3 py-2">₹{(Number(row.purchase_price) * Number(row.quantity)).toFixed(2)}</td>
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
                <Label htmlFor="item_name">Item Name *</Label>
                <Input
                  id="item_name"
                  autoComplete="off"
                  {...itemForm.register("item_name", { required: "Item name is required" })}
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
                  className={itemForm.formState.errors.item_name ? "border-red-500" : ""}
                />
                {itemForm.formState.errors.item_name && (
                  <p className="text-xs text-red-600">{itemForm.formState.errors.item_name.message}</p>
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
                <select
                  id="category"
                  className="h-9 w-full rounded-md border px-3 text-sm bg-transparent"
                  {...itemForm.register("category")}
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="subcategory">Subcategory</Label>
                <Input id="subcategory" {...itemForm.register("subcategory")} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="mrp">MRP *</Label>
                <Input
                  id="mrp"
                  type="number"
                  step="0.01"
                  {...itemForm.register("mrp", {
                    required: "MRP is required",
                    min: { value: 0.01, message: "MRP should be greater than 0" },
                  })}
                  className={itemForm.formState.errors.mrp ? "border-red-500" : ""}
                />
                {itemForm.formState.errors.mrp && (
                  <p className="text-xs text-red-600">{itemForm.formState.errors.mrp.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="purchase_price">Purchase Price *</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  {...itemForm.register("purchase_price", {
                    required: "Purchase price is required",
                    min: { value: 0.01, message: "Purchase price should be greater than 0" },
                  })}
                  className={itemForm.formState.errors.purchase_price ? "border-red-500" : ""}
                />
                {itemForm.formState.errors.purchase_price && (
                  <p className="text-xs text-red-600">{itemForm.formState.errors.purchase_price.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  {...itemForm.register("quantity", {
                    required: "Quantity is required",
                    min: { value: 1, message: "Quantity should be greater than 0" },
                  })}
                  className={itemForm.formState.errors.quantity ? "border-red-500" : ""}
                />
                {itemForm.formState.errors.quantity && (
                  <p className="text-xs text-red-600">{itemForm.formState.errors.quantity.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="warranty">Warranty (months)</Label>
                <Input id="warranty" type="number" {...itemForm.register("warranty")} />
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

    </div>
  );
}