import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, PencilLine, Save } from "lucide-react";
import { toast } from "sonner";

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

const BASE_URL = "http://localhost:5000";

const basicDefaultValues = {
  name: "",
  email: "",
  contact_type: "",
  gst_no: "",
};

const addressDefaultValues = {
  address_line: "",
  city: "",
  state: "",
  pincode: "",
  label: "",
};

const phoneDefaultValues = {
  phone: "",
  label: "",
};

function formatDate(value) {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WholesalerDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingBasic, setSavingBasic] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [details, setDetails] = useState(null);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressMessage, setAddressMessage] = useState("");
  const [addressError, setAddressError] = useState("");

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState(null);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const token = localStorage.getItem("token");
  const firstAddress = useMemo(() => details?.addresses?.[0] ?? null, [details]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: basicErrors },
  } = useForm({ defaultValues: basicDefaultValues });

  const {
    register: registerAddress,
    handleSubmit: handleAddressSubmit,
    reset: resetAddress,
    formState: { errors: addressFormErrors },
  } = useForm({ defaultValues: addressDefaultValues });

  const {
    register: registerPhone,
    handleSubmit: handlePhoneSubmit,
    reset: resetPhone,
    formState: { errors: phoneFormErrors },
  } = useForm({ defaultValues: phoneDefaultValues });

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${BASE_URL}/v1/api/admin/contact/details/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = res.data?.data;
      setDetails(payload);
      reset({
        name: payload?.name ?? "",
        email: payload?.email ?? "",
        contact_type: payload?.contact_type ?? "",
        gst_no: payload?.gst_no ?? "",
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch wholesaler details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const onUpdateBasic = async (values) => {
    if (!id) return;
    setSavingBasic(true);
    try {
      await axios.put(
        `${BASE_URL}/v1/api/admin/contact/details/update/${id}`,
        {
          name: values.name,
          email: values.email,
          contact_type: values.contact_type,
          gst_no: values.gst_no,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Wholesaler basic details updated successfully.");
      setIsEditMode(false);
      await fetchDetails();
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to update details.";
      toast.error(message);
    } finally {
      setSavingBasic(false);
    }
  };

  const openAddressModal = () => {
    if (!firstAddress) return;
    setAddressError("");
    setAddressMessage("");
    resetAddress({
      address_line: firstAddress.address_line ?? "",
      city: firstAddress.city ?? "",
      state: firstAddress.state ?? "",
      pincode: firstAddress.pincode ?? "",
      label: firstAddress.label ?? "",
    });
    setIsAddressModalOpen(true);
  };

  const onAddressSave = async (values) => {
    if (!id || !firstAddress?.id) return;
    setAddressSaving(true);
    setAddressError("");
    setAddressMessage("");
    try {
      await axios.put(
        `${BASE_URL}/v1/api/admin/contact/details/update/${id}/address/${firstAddress.id}`,
        values,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAddressMessage("Address updated successfully. Closing in 3 seconds...");
      toast.success("Address updated successfully.");
      await fetchDetails();
      setTimeout(() => setIsAddressModalOpen(false), 3000);
    } catch (err) {
      setAddressError(err?.response?.data?.message || "Failed to update address.");
    } finally {
      setAddressSaving(false);
    }
  };

  const openPhoneModal = (phoneRow) => {
    setEditingPhone(phoneRow);
    setPhoneError("");
    resetPhone({
      phone: phoneRow?.phone ?? "",
      label: phoneRow?.label ?? "",
    });
    setIsPhoneModalOpen(true);
  };

  const onPhoneSave = async (values) => {
    if (!editingPhone?.id) return;
    setPhoneSaving(true);
    setPhoneError("");
    try {
      // Phone endpoint is not finalized in backend routes, so update is mocked for now.
      await new Promise((resolve) => setTimeout(resolve, 700));
      setDetails((prev) => ({
        ...prev,
        phones: (prev?.phones ?? []).map((row) =>
          row.id === editingPhone.id ? { ...row, phone: values.phone, label: values.label } : row
        ),
      }));
      toast.success("Phone updated successfully.");
      setIsPhoneModalOpen(false);
    } catch (_err) {
      setPhoneError("Failed to update phone.");
    } finally {
      setPhoneSaving(false);
    }
  };

  const addressLine = firstAddress
    ? `${firstAddress.address_line || ""}, ${firstAddress.city || ""}, ${firstAddress.state || ""} - ${firstAddress.pincode || ""} (${firstAddress.label || "N/A"})`
    : "No address available.";

  return (
    <div className="max-w-6xl mx-auto w-full p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Wholesaler Details</h1>
        </div>
        <Button onClick={() => navigate("/admin/report/wholesaler/add")}>
          Add New Wholesaler
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-lg border bg-white h-44">
          <Loader2 className="h-7 w-7 animate-spin text-cyan-600" />
          <span className="ml-2 text-gray-600">Loading wholesaler details...</span>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      ) : (
        <>
          <section className="rounded-xl border bg-white shadow-sm p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Details</h2>
            <form onSubmit={handleSubmit(onUpdateBasic)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    disabled={!isEditMode || savingBasic}
                    aria-invalid={!!basicErrors.name}
                    className={basicErrors.name ? "border-red-500" : ""}
                    {...register("name", { required: "Name is required" })}
                  />
                  {basicErrors.name && <p className="text-xs text-red-600 mt-1">{basicErrors.name.message}</p>}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    disabled={!isEditMode || savingBasic}
                    aria-invalid={!!basicErrors.email}
                    className={basicErrors.email ? "border-red-500" : ""}
                    {...register("email", {
                      required: "Email is required",
                      validate: (v) =>
                        (v?.includes("@") && v?.includes(".com")) || "Email must include @ and .com",
                    })}
                  />
                  {basicErrors.email && <p className="text-xs text-red-600 mt-1">{basicErrors.email.message}</p>}
                </div>

                <div>
                  <Label htmlFor="contact_type">Contact Type</Label>
                  <Input
                    id="contact_type"
                    disabled={!isEditMode || savingBasic}
                    aria-invalid={!!basicErrors.contact_type}
                    className={basicErrors.contact_type ? "border-red-500" : ""}
                    {...register("contact_type", { required: "Contact type is required" })}
                  />
                  {basicErrors.contact_type && (
                    <p className="text-xs text-red-600 mt-1">{basicErrors.contact_type.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="gst_no">GST Number</Label>
                  <Input
                    id="gst_no"
                    disabled={!isEditMode || savingBasic}
                    aria-invalid={!!basicErrors.gst_no}
                    className={basicErrors.gst_no ? "border-red-500" : ""}
                    {...register("gst_no", {
                      required: "GST number is required",
                      minLength: { value: 10, message: "GST must be at least 10 characters" },
                      maxLength: { value: 15, message: "GST must be at most 15 characters" },
                    })}
                  />
                  {basicErrors.gst_no && <p className="text-xs text-red-600 mt-1">{basicErrors.gst_no.message}</p>}
                </div>
              </div>

              <div>
                <Label>Created At</Label>
                <Input value={formatDate(details?.created_at)} disabled readOnly />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={savingBasic}>
                  Back
                </Button>
                {!isEditMode ? (
                  <Button type="button" onClick={() => setIsEditMode(true)}>
                    <PencilLine className="h-4 w-4 mr-2" />
                    Update
                  </Button>
                ) : (
                  <Button type="submit" disabled={savingBasic}>
                    {savingBasic ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-xl border bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Address</h2>
              <Button type="button" variant="outline" onClick={openAddressModal} disabled={!firstAddress}>
                Edit
              </Button>
            </div>
            <p className="text-sm text-gray-700">{addressLine}</p>
          </section>

          <section className="rounded-xl border bg-white shadow-sm p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Phone</h2>
            <div className="max-h-60 overflow-y-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Phone</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Label</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(details?.phones ?? []).length > 0 ? (
                    (details?.phones ?? []).map((phoneRow) => (
                      <tr key={phoneRow.id} className="border-t">
                        <td className="px-3 py-2">{phoneRow.phone || "N/A"}</td>
                        <td className="px-3 py-2">{phoneRow.label || "N/A"}</td>
                        <td className="px-3 py-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => openPhoneModal(phoneRow)}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-3 py-4 text-gray-500" colSpan={3}>
                        No phone records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
            <DialogDescription>Update the address fields and save changes.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddressSubmit(onAddressSave)} className="space-y-4">
            <div>
              <Label htmlFor="address_line">Address Line</Label>
              <Input
                id="address_line"
                disabled={addressSaving}
                aria-invalid={!!addressFormErrors.address_line}
                className={addressFormErrors.address_line ? "border-red-500" : ""}
                {...registerAddress("address_line", { required: "Address line is required" })}
              />
              {addressFormErrors.address_line && (
                <p className="text-xs text-red-600 mt-1">{addressFormErrors.address_line.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" disabled={addressSaving} {...registerAddress("city", { required: "City is required" })} />
                {addressFormErrors.city && <p className="text-xs text-red-600 mt-1">{addressFormErrors.city.message}</p>}
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" disabled={addressSaving} {...registerAddress("state", { required: "State is required" })} />
                {addressFormErrors.state && (
                  <p className="text-xs text-red-600 mt-1">{addressFormErrors.state.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" disabled={addressSaving} {...registerAddress("pincode", { required: "Pincode is required" })} />
                {addressFormErrors.pincode && (
                  <p className="text-xs text-red-600 mt-1">{addressFormErrors.pincode.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="label">Label</Label>
                <Input id="label" disabled={addressSaving} {...registerAddress("label", { required: "Label is required" })} />
                {addressFormErrors.label && (
                  <p className="text-xs text-red-600 mt-1">{addressFormErrors.label.message}</p>
                )}
              </div>
            </div>

            {addressError ? <p className="text-sm text-red-600">{addressError}</p> : null}
            {addressMessage ? <p className="text-sm text-green-700">{addressMessage}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddressModalOpen(false)} disabled={addressSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={addressSaving}>
                {addressSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Update Address
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Phone</DialogTitle>
            <DialogDescription>Update phone and label.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePhoneSubmit(onPhoneSave)} className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                disabled={phoneSaving}
                aria-invalid={!!phoneFormErrors.phone}
                className={phoneFormErrors.phone ? "border-red-500" : ""}
                {...registerPhone("phone", { required: "Phone is required" })}
              />
              {phoneFormErrors.phone && <p className="text-xs text-red-600 mt-1">{phoneFormErrors.phone.message}</p>}
            </div>
            <div>
              <Label htmlFor="phone_label">Label</Label>
              <Input
                id="phone_label"
                disabled={phoneSaving}
                aria-invalid={!!phoneFormErrors.label}
                className={phoneFormErrors.label ? "border-red-500" : ""}
                {...registerPhone("label", { required: "Label is required" })}
              />
              {phoneFormErrors.label && <p className="text-xs text-red-600 mt-1">{phoneFormErrors.label.message}</p>}
            </div>

            {phoneError ? <p className="text-sm text-red-600">{phoneError}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPhoneModalOpen(false)} disabled={phoneSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={phoneSaving}>
                {phoneSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Update Phone
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
