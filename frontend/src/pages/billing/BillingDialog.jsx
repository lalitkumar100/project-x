import React, { useState, useEffect, useRef } from "react";
import { Plus, RefreshCcw, Loader2, Search, X, Package, Calendar, DollarSign, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import axios from "axios";

export function BillingDialog({
  isOpen,
  onOpenChange,
  onAddItem,
  triggerButton,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");

  const token = localStorage.getItem("token");
  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);

  // Debounced Search Effect
  useEffect(() => {
    if (searchTerm.length < 1) {
      setRecommendations([]);
      return;
    }

    if (selectedMedicine && searchTerm.includes(selectedMedicine.medicine_name)) {
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setShowSuggestions(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/admin/medicines/recommendation?query=${searchTerm}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.data && response.data.status === "success") {
          setRecommendations(response.data.recommendations);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, selectedMedicine, token]);

  // Fetch Details on Selection
  const handleSelectMedicine = async (medSummary) => {
    setSearchTerm(`${medSummary.medicine_name} (${medSummary.batch_no})`);
    setShowSuggestions(false);
    setIsFetchingDetails(true);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/admin/medicne_info/${medSummary.medicine_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.status === "success" && response.data.medicine.length > 0) {
        const details = response.data.medicine[0];
        setSelectedMedicine({
          ...details,
          medicine_id: details.medicine_id,
          stock_quantity: parseInt(details.stock_quantity),
          purchase_price: parseFloat(details.purchase_price),
          mrp: parseFloat(details.mrp)
        });
        setSellingPrice(details.mrp);
        setQuantity("");
      }
    } catch (error) {
      console.error("Failed to fetch details:", error);
      alert("Failed to fetch medicine details.");
      setSearchTerm("");
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleClearFields = () => {
    setSelectedMedicine(null);
    setSearchTerm("");
    setQuantity("");
    setSellingPrice("");
    setRecommendations([]);
  };

  const handleAdd = () => {
    if (!selectedMedicine) return;
    const qty = Number(quantity);
    const sp = Number(sellingPrice);

    if (!qty || qty <= 0) { alert("Enter valid quantity"); return; }
    if (qty > selectedMedicine.stock_quantity) { alert("Exceeds stock!"); return; }

    const newItem = {
      id: Date.now(),
      medicineId: selectedMedicine.medicine_id,
      name: selectedMedicine.medicine_name,
      batch: selectedMedicine.batch_no,
      expiry: selectedMedicine.expiry_date,
      quantity: qty,
      sellingPrice: sp,
      mrp: selectedMedicine.mrp,
      purchasePrice: selectedMedicine.purchase_price,
    };

    onAddItem(newItem);
    handleClearFields();
    onOpenChange(false);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}

      <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] border-0 bg-white p-0 shadow-2xl duration-200 sm:rounded-xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* HEADER - Fixed */}
        <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Package className="h-6 w-6" />
              Add Medicine to Bill
            </DialogTitle>
            <DialogDescription className="text-blue-100 mt-1">
              Search inventory and add medicines to the current billing session
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* BODY - Scrollable */}
        <div className="flex-1 overflow-y-auto   px-8 py-6"  style={{ zIndex: 99 }} >
          <div className="space-y-6"  style={{ zIndex: 999 }}>
            
            {/* Search Section with z-index 999 for suggestions */}
            <div className="space-y-3 relative" style={{ zIndex: 99 }} ref={dropdownRef}>
              <Label htmlFor="itemSearch" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-600" />
                Search Medicine
              </Label>
              
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="itemSearch"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm.length > 0 && setShowSuggestions(true)}
                  disabled={isFetchingDetails}
                  className="pl-12 pr-12 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-lg text-base shadow-sm transition-all"
                  placeholder="Type medicine name or batch number..."
                  autoComplete="off"
                />
                {searchTerm && (
                  <button 
                    onClick={handleClearFields} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown - z-index 999 */}
              {showSuggestions && (
                <div 
                  className="absolute left-0 right-0 top-full mt-2 bg-white border-2 border-blue-200 rounded-lg shadow-2xl max-h-80 overflow-y-auto"
                  style={{ zIndex: 999 }}
                >
                  {isSearching ? (
                    <div className="p-6 flex items-center justify-center text-gray-500 gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <span className="text-sm font-medium">Searching medicines...</span>
                    </div>
                  ) : recommendations.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {recommendations.map((med) => (
                        <div
                          key={`${med.medicine_id}-${med.batch_no}`}
                          className="px-5 py-4 cursor-pointer hover:bg-blue-50 transition-colors group"
                          onClick={() => handleSelectMedicine(med)}
                        >
                          <div className="font-semibold text-gray-800 group-hover:text-blue-700 text-base mb-1">
                            {med.medicine_name}
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              Batch: <span className="font-semibold text-gray-700">{med.batch_no}</span>
                            </span>
                            <span className="text-gray-400 font-mono">ID: {med.medicine_id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchTerm.length > 1 && (
                    <div className="p-8 text-center text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No medicines found</p>
                      <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Loading State */}
            {isFetchingDetails && (
              <div className="py-16 flex flex-col items-center justify-center text-gray-500">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-3" />
                <p className="text-base font-medium">Loading medicine details...</p>
                <p className="text-sm text-gray-400 mt-1">Please wait</p>
              </div>
            )}

            {/* Selected Medicine Details Form */}
            {!isFetchingDetails && selectedMedicine && (
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border-2 border-blue-100 space-y-5 shadow-sm">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b-2 border-blue-200">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{selectedMedicine.medicine_name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Batch: {selectedMedicine.batch_no}</p>
                  </div>
                  <span className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                    IN STOCK
                  </span>
                </div>

                {/* Stock Information Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <Label className="text-xs font-semibold text-gray-500 uppercase">Purchase Price</Label>
                    </div>
                    <div className="text-xl font-bold text-gray-800">₹{selectedMedicine.purchase_price.toFixed(2)}</div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <Label className="text-xs font-semibold text-gray-500 uppercase">MRP</Label>
                    </div>
                    <div className="text-xl font-bold text-gray-800">₹{selectedMedicine.mrp.toFixed(2)}</div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-purple-600" />
                      <Label className="text-xs font-semibold text-gray-500 uppercase">Available</Label>
                    </div>
                    <div className="text-xl font-bold text-purple-700">{selectedMedicine.stock_quantity}</div>
                    <div className="text-xs text-gray-500 mt-1">units</div>
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3 flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700 uppercase">Expiry Date</p>
                    <p className="text-sm font-bold text-amber-900">
                      {new Date(selectedMedicine.expiry_date).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      Quantity
                    </Label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Enter quantity"
                      className={`h-12 text-base font-semibold ${
                        Number(quantity) > selectedMedicine.stock_quantity 
                          ? "border-2 border-red-500 bg-red-50 focus:border-red-600" 
                          : "border-2 border-gray-200 focus:border-blue-500"
                      }`}
                    />
                    {Number(quantity) > selectedMedicine.stock_quantity && (
                      <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                        <X className="h-3 w-3" />
                        Exceeds available stock!
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Selling Price
                    </Label>
                    <Input
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      placeholder="Enter price"
                      className={`h-12 text-base font-semibold ${
                        Number(sellingPrice) < selectedMedicine.purchase_price 
                          ? "border-2 border-amber-500 bg-amber-50 focus:border-amber-600" 
                          : "border-2 border-gray-200 focus:border-blue-500"
                      }`}
                    />
                    {Number(sellingPrice) < selectedMedicine.purchase_price && (
                      <p className="text-xs text-amber-600 font-medium">Below purchase price</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER - Fixed */}
        <div className="px-8 py-5 bg-gray-50 border-t-2 border-gray-200 shrink-0 flex flex-wrap gap-3 justify-end">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="h-11 px-6 font-semibold border-2 hover:bg-gray-100"
          >
            Cancel
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleClearFields} 
            className="h-11 px-6 font-semibold border-2 hover:bg-gray-100"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          
          <Button 
            onClick={handleAdd} 
            disabled={!selectedMedicine || isFetchingDetails || !quantity || Number(quantity) <= 0}
            className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add to Bill
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
