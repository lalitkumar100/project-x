import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, RefreshCw, AlertCircle, Search, Pill } from "lucide-react";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;
const token = localStorage.getItem("token") || "";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
}

const initialFields = {
  medicine_name: "",
  brand_name: "",
  mfg_date: "",
  expiry_date: "",
  packed_type: "",
  stock_quantity: "",
  purchase_price: "",
  mrp: "",
  batch_no: "",
};

export default function AddMedicineModal({ onClose, onAddMedicine }) {
  const [fields, setFields] = useState(initialFields);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [error, setError] = useState(null);

  const debounceTimeout = useRef(null);
  const inputRef = useRef(null);

  // --- LOGIC: Debounced Search ---
  useEffect(() => {
    if (!fields.medicine_name) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    // Only show suggestions if we are typing, not after selecting
    if(document.activeElement === document.getElementById('medicine_name')){
        setShowSuggestions(true);
    }
    
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${BASE_URL}/admin/medicines/recommendation?query=${fields.medicine_name}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (res.data.status === "success") {
          setSuggestions(res.data.recommendations || []);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        setSuggestions([]);
      }
      setLoading(false);
    }, 400);

    return () => clearTimeout(debounceTimeout.current);
  }, [fields.medicine_name]);

  // --- LOGIC: Keyboard Navigation ---
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((idx) => (idx + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((idx) => (idx <= 0 ? suggestions.length - 1 : idx - 1));
    } else if (e.key === "Enter" && selectedIdx >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIdx]);
    }
  };

  // --- LOGIC: Select & Fetch Details ---
  const handleSelectSuggestion = async (suggestion) => {
    setShowSuggestions(false);
    setFields((f) => ({
      ...f,
      medicine_name: suggestion.medicine_name,
    }));
    setSuggestions([]);
    setSelectedIdx(-1);
    setFetchingDetails(true);
    setError(null);
    try {
      const res = await axios.get(
        `${BASE_URL}/admin/medicne_info/${suggestion.medicine_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (
        res.data.status === "success" &&
        res.data.medicine &&
        res.data.medicine.length > 0
      ) {
        const med = res.data.medicine[0];
        setFields({
          medicine_name: med.medicine_name || "",
          brand_name: med.brand_name || "",
          mfg_date: formatDate(med.mfg_date),
          expiry_date: formatDate(med.expiry_date),
          packed_type: med.packed_type || "",
          stock_quantity: med.stock_quantity || "",
          purchase_price: med.purchase_price || "",
          mrp: med.mrp || "",
          batch_no: med.batch_no || "",
        });
      } else {
        setError("Failed to fetch medicine details automatically. Please enter manually.");
      }
    } catch (err) {
      setError("Network error or failed to fetch medicine details.");
    }
    setFetchingDetails(false);
  };

  // --- LOGIC: Handle Change ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((f) => ({
      ...f,
      [name]: value,
    }));
    if (name === "medicine_name") {
       // logic handled by effect
    }
    setError(null);
  };

  // --- LOGIC: Submit ---
  const handleAdd = () => {
    setError(null);
    if (
      !fields.medicine_name ||
      !fields.brand_name ||
      !fields.mfg_date ||
      !fields.expiry_date ||
      !fields.packed_type ||
      !fields.stock_quantity ||
      !fields.purchase_price ||
      !fields.mrp ||
      !fields.batch_no
    ) {
      setError("All fields are required. Please fill in the missing information.");
      return;
    }

    onAddMedicine({
      medicine_name: fields.medicine_name,
      brand_name: fields.brand_name,
      mfg_date: fields.mfg_date,
      expiry_date: fields.expiry_date,
      packed_type: fields.packed_type,
      stock_quantity: Number(fields.stock_quantity),
      purchase_price: Number(fields.purchase_price),
      mrp: Number(fields.mrp),
      batch_no: fields.batch_no,
    });
    onClose();
  };

  // --- LOGIC: Refresh ---
  const handleRefresh = () => {
    setFields(initialFields);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIdx(-1);
    setError(null);
  };

  // --- LOGIC: Click Outside ---
  useEffect(() => {
    const handleClick = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-w-[95vw] max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 shadow-2xl">
        
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-indigo-50/50 border-b">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-100 rounded-full">
                <Pill className="w-5 h-5 text-indigo-600" />
             </div>
             <div>
                <DialogTitle className="text-xl text-gray-900">Add New Medicine</DialogTitle>
                <DialogDescription className="mt-1 text-gray-500">
                    Search for an existing medicine to auto-fill details, or enter manually.
                </DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
            
            {/* Error Alert */}
            {error && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Validation Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
            )}

            {/* Fetching Indicator */}
            {fetchingDetails && (
            <div className="flex items-center gap-3 p-3 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-md animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching medicine details from database...
            </div>
            )}

          {/* Medicine Name Search */}
          <div ref={inputRef} className="relative space-y-2">
            <Label htmlFor="medicine_name" className="text-gray-700 font-medium">
              Medicine Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                id="medicine_name"
                name="medicine_name"
                placeholder="Start typing to search..."
                className="pl-9 border-gray-300 focus-visible:ring-indigo-500"
                value={fields.medicine_name}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                disabled={fetchingDetails}
                />
            </div>
            
            {/* Suggestions Dropdown */}
            {showSuggestions && fields.medicine_name && (
              <div className="absolute z-50 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-52 overflow-y-auto">
                {loading ? (
                  <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                    Searching database...
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 italic">
                    No matching medicines found.
                  </div>
                ) : (
                  suggestions.map((s, idx) => (
                    <div
                      key={s.medicine_id}
                      className={`px-4 py-3 cursor-pointer text-sm border-b last:border-0 transition-colors flex items-center justify-between ${
                        idx === selectedIdx
                          ? "bg-indigo-50 text-indigo-900 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      onMouseDown={() => handleSelectSuggestion(s)}
                    >
                      <span>{s.medicine_name}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Select</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column */}
            <div className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="brand_name">Brand Name <span className="text-red-500">*</span></Label>
                    <Input
                        id="brand_name"
                        name="brand_name"
                        placeholder="e.g. Cipla"
                        className="focus-visible:ring-indigo-500"
                        value={fields.brand_name}
                        onChange={handleChange}
                        disabled={fetchingDetails}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="packed_type">Packed Type <span className="text-red-500">*</span></Label>
                    <Input
                        id="packed_type"
                        name="packed_type"
                        placeholder="e.g. Strip of 10"
                        className="focus-visible:ring-indigo-500"
                        value={fields.packed_type}
                        onChange={handleChange}
                        disabled={fetchingDetails}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="batch_no">Batch No <span className="text-red-500">*</span></Label>
                    <Input
                        id="batch_no"
                        name="batch_no"
                        placeholder="Batch #12345"
                        className="focus-visible:ring-indigo-500"
                        value={fields.batch_no}
                        onChange={handleChange}
                        disabled={fetchingDetails}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="stock_quantity">Quantity <span className="text-red-500">*</span></Label>
                    <Input
                        id="stock_quantity"
                        type="number"
                        name="stock_quantity"
                        placeholder="0"
                        className="focus-visible:ring-indigo-500"
                        value={fields.stock_quantity}
                        onChange={handleChange}
                        min={1}
                        disabled={fetchingDetails}
                    />
                </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="mfg_date">MFG Date <span className="text-red-500">*</span></Label>
                    <Input
                        id="mfg_date"
                        type="date"
                        name="mfg_date"
                        className="focus-visible:ring-indigo-500 block w-full"
                        value={fields.mfg_date}
                        onChange={handleChange}
                        disabled={fetchingDetails}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="expiry_date">Expiry Date <span className="text-red-500">*</span></Label>
                    <Input
                        id="expiry_date"
                        type="date"
                        name="expiry_date"
                        className="focus-visible:ring-indigo-500 block w-full"
                        value={fields.expiry_date}
                        onChange={handleChange}
                        disabled={fetchingDetails}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="purchase_price">Purchase Price (₹) <span className="text-red-500">*</span></Label>
                    <Input
                        id="purchase_price"
                        type="number"
                        name="purchase_price"
                        placeholder="0.00"
                        className="focus-visible:ring-indigo-500"
                        value={fields.purchase_price}
                        onChange={handleChange}
                        min={0}
                        step="0.01"
                        disabled={fetchingDetails}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="mrp">MRP (₹) <span className="text-red-500">*</span></Label>
                    <Input
                        id="mrp"
                        type="number"
                        name="mrp"
                        placeholder="0.00"
                        className="focus-visible:ring-indigo-500"
                        value={fields.mrp}
                        onChange={handleChange}
                        min={0}
                        step="0.01"
                        disabled={fetchingDetails}
                    />
                </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 pt-2 bg-gray-50 border-t flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={fetchingDetails}
            className="w-full sm:w-auto border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
          >
            Cancel
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={fetchingDetails}
            className="w-full sm:w-auto gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
          
          <Button
            type="button"
            onClick={handleAdd}
            disabled={fetchingDetails}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            {fetchingDetails ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Add to List"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}