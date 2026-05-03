import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import loaderGif from "@/components/logoloader.gif";
import axios from "axios";
import { ArrowLeft } from "lucide-react";

export default function UpdateMedicinePage() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const [medicineData, setMedicineData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { Id } = useParams();

  useEffect(() => {
    const fetchMedicineById = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/admin/medicne_info/${Id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setMedicineData(res.data.medicine[0]);
        toast.success("Medicine details loaded successfully");
      } catch (error) {
        console.error("Error fetching medicines", error);
        
        // Check if it's a 404 error
        if (error.response?.status === 404) {
          setNotFound(true);
          toast.error("Medicine not found", {
            description: "The medicine you're looking for doesn't exist",
          });
        } else {
          toast.error("Failed to load medicine details", {
            description: error.response?.data?.message || "An error occurred",
          });
        }
      } finally {
          setIsLoading(false);
       
      }
    };
    fetchMedicineById();
  }, []);

  const handleInputChange = (field, value) => {
    setMedicineData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdateSubmit = async () => {
    setIsSaving(true);

    try {
      const res = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/admin/medicine_stock/${Id}`,
        medicineData, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(res);
      
      // Success toast
      toast.success("Medicine updated successfully!", {
        description: `${medicineData.medicine_name} has been updated`,
        duration: 3000,
      });
      
      // Navigate after a short delay to show the toast
      setTimeout(() => {
        navigate("/stock");
      }, 1000);
      
    } catch (error) {
      console.error("Error updating medicine", error);
      
      // Error toast
      toast.error("Failed to update medicine", {
        description: error.response?.data?.message || "An error occurred while updating",
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/stock");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <img
            src={loaderGif}
            alt="Loading"
            className="h-36 w-36 mx-auto"
          />
          <p className="mt-3 text-sm font-semibold tracking-wide text-teal-600 animate-pulse">
            Loading Medicine Detail, please wait…
          </p>
        </div>
      </div>
    );
  }

  // 404 Not Found state
  if (notFound) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Medicine Not Found
            </h2>
            <p className="text-gray-500 mb-6">
              The medicine you're looking for doesn't exist or may have been removed.
            </p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => navigate("/stock")}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              Go Back to Stock
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!medicineData) {
    return null;
  }

  return (
    <>
      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-3xl text-teal-800" />
          </Button>
          <h1 className="text-2xl font-bold text-teal-800">
            Update Medicine: {medicineData.medicine_name}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Medicine Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Medicine Name</Label>
              <Input
                id="name"
                value={medicineData.medicine_name || ""}
                onChange={(e) =>
                  handleInputChange("medicine_name", e.target.value)
                }
              />
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={medicineData.brand_name || ""}
                onChange={(e) =>
                  handleInputChange("brand_name", e.target.value)
                }
              />
            </div>

            {/* Batch */}
            <div className="space-y-2">
              <Label htmlFor="batch">Batch</Label>
              <Input
                id="batch"
                value={medicineData.batch_no || ""}
                onChange={(e) =>
                  handleInputChange("batch_no", e.target.value)
                }
              />
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={medicineData.stock_quantity}
                onChange={(e) =>
                  handleInputChange("stock_quantity", e.target.value)
                }
              />
            </div>

            {/* Expiry */}
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                type="text"
                value={new Date(
                  medicineData.expiry_date
                ).toLocaleDateString()}
                onChange={(e) => handleInputChange("expiry", e.target.value)}
                disabled={true}
              />
            </div>

            {/* Price (MRP) */}
            <div className="space-y-2">
              <Label htmlFor="price">MRP (₹)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={medicineData.mrp}
                onChange={(e) => handleInputChange("mrp", e.target.value)}
              />
            </div>

            {/* Purchase Price (Editable for demo but pre-filled) */}
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price (₹)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                value={String(medicineData.purchase_price)}
                onChange={(e) =>
                  handleInputChange("purchase_price", e.target.value)
                }
              />
            </div>
          </div>

          <Separator />

          <h3 className="text-lg font-semibold text-gray-800">
            Non-Editable Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice No (Non-editable) */}
            <div className="space-y-2">
              <Label htmlFor="invoiceNo">Invoice No</Label>
              <Input
                id="invoiceNo"
                value={`INV-${String(medicineData.id || "").padStart(
                  4,
                  "0"
                )}`}
                disabled
                className="bg-gray-100 text-gray-500"
              />
            </div>

            {/* Wholesaler (Non-editable) */}
            <div className="space-y-2">
              <Label htmlFor="wholesaler">Wholesaler</Label>
              <Input
                id="wholesaler"
                value="MedSupply Co. Ltd."
                disabled
                className="bg-gray-100 text-gray-500"
              />
            </div>

            {/* Created At (Non-editable) */}
            <div className="space-y-2">
              <Label htmlFor="createdAt">Created At</Label>
              <Input
                id="createdAt"
                value={`${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`}
                disabled
                className="bg-gray-100 text-gray-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSubmit}
              disabled={isSaving}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isSaving ? "Updating..." : "Update Medicine"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}