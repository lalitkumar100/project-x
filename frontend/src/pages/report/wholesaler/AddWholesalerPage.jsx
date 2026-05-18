import React, { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Store, Search } from "lucide-react";
import { toast } from "sonner";
import { useTCGCall } from "@/hooks/tcg_call";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const defaultValues = {
  name: "",
  email: "",
  contact_type: "wholesaler",
  gst_no: "",
  primary_phone: "",
  secondary_phone: "",
  address_line: "",
  city: "",
  state: "",
  pincode: "",
  address_label: "office",
};

export default function AddWholesalerPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [submitting, setSubmitting] = useState(false);
  const [tcgId, setTcgId] = useState("");
  const [tcgFetching, setTcgFetching] = useState(false);
  const tcg = useTCGCall();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues });

  /* ── Fetch wholesaler details from TCG server by user ID ── */
  const fetchFromTCG = async () => {
    const id = tcgId.trim();
    if (!id) return;
    setTcgFetching(true);
    const { data, status } = await tcg.call({ route: `/v1/api/users/${id}` });
    if (status === 200 && data) {
      const u = data.data ?? data;
      setValue("name", u.business_name || "");
      setValue("email", u.email || "");
      setValue("gst_no", u.gst_number || "");
      setValue("primary_phone", u.phone || u.phone_primary || "");
      if (u.address) {
        setValue("address_line", u.address);
      }
      toast.success(`Fetched details for TCG user #${id}`);
    } else {
      toast.error(tcg.error || "Failed to fetch TCG user details.");
    }
    setTcgFetching(false);
  };

  const handleTcgIdKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchFromTCG();
    }
  };

  const addressFields = watch(["address_line", "city", "state", "pincode", "address_label"]);
  const hasAnyAddressInput = addressFields.some((value) => String(value || "").trim().length > 0);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const phones = [{ phone: values.primary_phone.trim(), label: "primary" }];
      if (values.secondary_phone.trim()) {
        phones.push({ phone: values.secondary_phone.trim(), label: "secondary" });
      }

      const payload = {
        name: values.name.trim(),
        email: values.email.trim(),
        gst_no: values.gst_no.trim(),
        contact_type: values.contact_type.trim(),
        phones,
      };

      if (hasAnyAddressInput) {
        payload.addresses = [
          {
            address_line: values.address_line.trim(),
            city: values.city.trim(),
            state: values.state.trim(),
            pincode: values.pincode.trim(),
            label: values.address_label.trim(),
          },
        ];
      }

      await axios.post(`${BASE_URL}/v1/api/admin/contact/add`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Wholesaler created successfully.");
      navigate("/report/wholesaler");
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to add wholesaler.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Wholesaler</h1>
          <p className="text-sm text-gray-500">Create a wholesaler profile and save it to contacts.</p>
        </div>
      </div>

      <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 pb-4 bg-indigo-50/50 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-full">
              <Store className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Wholesaler Information</h2>
              <p className="text-sm text-gray-500">Fields marked with * are required.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* TCG Import Section */}
          <div className="rounded-lg border border-dashed border-indigo-300 bg-indigo-50/40 p-4">
            <Label className="text-xs font-semibold text-indigo-700 mb-2 block">Import from TCG Server</Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter TCG User ID (e.g. 2)"
                value={tcgId}
                onChange={(e) => setTcgId(e.target.value)}
                onKeyDown={handleTcgIdKeyDown}
                className="max-w-xs"
              />
              <Button type="button" variant="outline" size="sm" onClick={fetchFromTCG} disabled={tcgFetching || !tcgId.trim()}>
                {tcgFetching ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
                Fetch
              </Button>
            </div>
            <p className="text-[11px] text-indigo-500 mt-1.5">Enter a TCG user ID and press Enter or click Fetch to auto-fill details.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Shree Traders"
                aria-invalid={!!errors.name}
                className={errors.name ? "border-red-500" : ""}
                {...register("name", { required: "Name is required" })}
              />
              {errors.name ? <p className="text-xs text-red-600 mt-1">{errors.name.message}</p> : null}
            </div>

            <div>
              <Label htmlFor="gst_no">GST Number *</Label>
              <Input
                id="gst_no"
                placeholder="29ABCDE1234F1Z5"
                aria-invalid={!!errors.gst_no}
                className={errors.gst_no ? "border-red-500" : ""}
                {...register("gst_no", {
                  required: "GST number is required",
                  minLength: { value: 10, message: "GST number must be at least 10 characters" },
                  maxLength: { value: 15, message: "GST number must be at most 15 characters" },
                })}
              />
              {errors.gst_no ? <p className="text-xs text-red-600 mt-1">{errors.gst_no.message}</p> : null}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                placeholder="shree@traders.com"
                aria-invalid={!!errors.email}
                className={errors.email ? "border-red-500" : ""}
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: EMAIL_REGEX, message: "Please enter a valid email address" },
                })}
              />
              {errors.email ? <p className="text-xs text-red-600 mt-1">{errors.email.message}</p> : null}
            </div>

            <div>
              <Label htmlFor="contact_type">Contact Type *</Label>
              <Input
                id="contact_type"
                placeholder="wholesaler"
                aria-invalid={!!errors.contact_type}
                className={errors.contact_type ? "border-red-500" : ""}
                {...register("contact_type", { required: "Contact type is required" })}
              />
              {errors.contact_type ? (
                <p className="text-xs text-red-600 mt-1">{errors.contact_type.message}</p>
              ) : null}
            </div>
          </div>

          <div className="border-t pt-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Phone Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary_phone">Primary Phone *</Label>
                <Input
                  id="primary_phone"
                  placeholder="9876543210"
                  aria-invalid={!!errors.primary_phone}
                  className={errors.primary_phone ? "border-red-500" : ""}
                  {...register("primary_phone", {
                    required: "Primary phone is required",
                    pattern: { value: /^[0-9]{10}$/, message: "Phone number must be 10 digits" },
                  })}
                />
                {errors.primary_phone ? (
                  <p className="text-xs text-red-600 mt-1">{errors.primary_phone.message}</p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="secondary_phone">Secondary Phone</Label>
                <Input
                  id="secondary_phone"
                  placeholder="9123456780"
                  aria-invalid={!!errors.secondary_phone}
                  className={errors.secondary_phone ? "border-red-500" : ""}
                  {...register("secondary_phone", {
                    validate: (v) =>
                      !v || /^[0-9]{10}$/.test(v) || "Secondary phone number must be 10 digits",
                  })}
                />
                {errors.secondary_phone ? (
                  <p className="text-xs text-red-600 mt-1">{errors.secondary_phone.message}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="border-t pt-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Address (Optional)</h3>
            <p className="text-xs text-gray-500 mb-3">
              If you fill any address field, fill all fields in this section.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address_line">Address Line</Label>
                <Input
                  id="address_line"
                  aria-invalid={!!errors.address_line}
                  className={errors.address_line ? "border-red-500" : ""}
                  {...register("address_line", {
                    validate: (value) => {
                      if (!hasAnyAddressInput) return true;
                      return (value && value.trim()) ? true : "Address line is required when address is provided";
                    }
                  })}
                />
                {errors.address_line ? (
                  <p className="text-xs text-red-600 mt-1">{errors.address_line.message}</p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  aria-invalid={!!errors.city}
                  className={errors.city ? "border-red-500" : ""}
                  {...register("city", {
                    validate: (value) => {
                      if (!hasAnyAddressInput) return true;
                      return (value && value.trim()) ? true : "City is required";
                    }
                  })}
                />
                {errors.city ? <p className="text-xs text-red-600 mt-1">{errors.city.message}</p> : null}
              </div>

              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  aria-invalid={!!errors.state}
                  className={errors.state ? "border-red-500" : ""}
                  {...register("state", {
                    validate: (value) => {
                      if (!hasAnyAddressInput) return true;
                      return (value && value.trim()) ? true : "State is required";
                    }
                  })}
                />
                {errors.state ? <p className="text-xs text-red-600 mt-1">{errors.state.message}</p> : null}
              </div>

              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  aria-invalid={!!errors.pincode}
                  className={errors.pincode ? "border-red-500" : ""}
                  {...register("pincode", {
                    validate: (value) => {
                      if (!hasAnyAddressInput) return true;
                      if (!value.trim()) return "Pincode is required";
                      return /^[0-9]{6}$/.test(value) || "Pincode must be 6 digits";
                    },
                  })}
                />
                {errors.pincode ? <p className="text-xs text-red-600 mt-1">{errors.pincode.message}</p> : null}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address_label">Address Label</Label>
                <Input
                  id="address_label"
                  placeholder="office"
                  aria-invalid={!!errors.address_label}
                  className={errors.address_label ? "border-red-500" : ""}
                  {...register("address_label", {
                    validate: (value) => {
                      if (!hasAnyAddressInput) return true;
                      return (value && value.trim()) ? true : "Address label is required";
                    }
                  })}
                />
                {errors.address_label ? (
                  <p className="text-xs text-red-600 mt-1">{errors.address_label.message}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Wholesaler
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
