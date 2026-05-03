import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;
const url  = `http://localhost:5000`;
/**
 * ItemDetailsDialog
 * Props:
 *   isOpen       {boolean}
 *   onOpenChange {(open: boolean) => void}
 *   itemId       {number | null}
 */
export function ItemDetailsDialog({ isOpen, onOpenChange, itemId }) {
  const [item,    setItem]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!isOpen || !itemId) return;

    const fetchItem = async () => {
      setLoading(true);
      setError(null);
      setItem(null);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${url}/v1/api/admin/items/details/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItem(res.data.data ?? res.data);
      } catch (err) {
        console.error("Error fetching item details", err);
        setError("Failed to load item details.");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [isOpen, itemId]);

  const qtyColor = (qty) => {
    if (qty < 10)  return "bg-red-100 text-red-800";
    if (qty < 30)  return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-teal-800 text-lg">
            Item Details
          </DialogTitle>
        </DialogHeader>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
            Loading...
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex items-center justify-center py-12 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        {item && !loading && (
          <div className="space-y-4 pt-2">

            {/* Name */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                Product Name
              </p>
              <p className="text-base font-semibold text-gray-900">{item.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">

              {/* Brand */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                  Brand
                </p>
                <p className="text-sm font-medium text-gray-800">{item.brand ?? "—"}</p>
              </div>

              {/* Subcategory */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                  Subcategory
                </p>
                <p className="text-sm font-medium text-gray-800">
                  {item.subcategory ?? "—"}
                </p>
              </div>

              {/* Quantity */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                  Stock Quantity
                </p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${qtyColor(item.quantity)}`}>
                  {item.quantity}
                </span>
              </div>

              {/* Total Sold */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                  Total Sold
                </p>
                <p className="text-sm font-medium text-gray-800">
                  {item.total_items_sold ?? 0}
                </p>
              </div>

              {/* Warranty */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                  Warranty
                </p>
                <p className="text-sm font-medium text-gray-800">
                  {item.warranty_months != null
                    ? `${item.warranty_months} month${item.warranty_months !== 1 ? "s" : ""}`
                    : "—"}
                </p>
              </div>

              {/* MRP */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                  MRP
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  ₹{parseFloat(item.mrp ?? 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              {/* buying price */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                  buying price
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  ₹{parseFloat(item.net_buy_price ?? 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              
              {/* reorder_level */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                  reorder level
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  ₹{parseFloat(item.reorder_level ?? 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              

            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}