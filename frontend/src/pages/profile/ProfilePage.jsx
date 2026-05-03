import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import Loader  from "@/components/loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Edit, Key,ArrowLeft  } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import axios from "axios";
import { useNavigate } from "react-router-dom";


export default function ProfilePage() {

  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  
  const [unauthorized, setUnauthorized] = useState(false);

  const token = localStorage.getItem("token"); // or from context/store

  const [loaderMessage, setLoaderMessage] = useState("Loading profile...");
  
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    general: "",
  });

    const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: "John",
    last_name: "Doe",
    contact_number: "+1 (555) 123-4567",
    email: "john.doe@pharmaDesk.com", // Non-editable
    date_of_birth: "1990-05-15",
    address: "123 Main Street, City, State 12345",
    aadhar_card_no: "1234 5678 9012",
    pan_card_no: "ABCDE1234F",
    account_no: "1234567890123456",
    salary: "$75,000", // Non-editable
    role: "Senior Pharmacist", // Non-editable
    profile_photo: "/placeholder.svg?height=150&width=150",
  });

useEffect(() => {
  let isMounted = true; // prevent state updates after unmount

  if (!token) {
    navigate("/login", { replace: true });
    return;
  }

  const fetchProfileDetails = async () => {
    setLoaderMessage("Loading profile...");
    setIsLoading(true);

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (isMounted) {
        setProfileData(res.data.data);
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        if (isMounted) {
          setUnauthorized(true);
        }

        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
      } else {
        console.error("Error fetching profile:", error);
      }
    } finally {
      if (isMounted) {
        setTimeout(() => {
          setIsLoading(false);
        }, 3000);
      }
    }
  };

  fetchProfileDetails();

  return () => {
    isMounted = false;
  };
}, [token, navigate]);


  // 🔄 Loader
  if (isLoading) {
    return (
      <Loader message={loaderMessage} />
    );
  }

  // ⛔ 401 Page
  if (unauthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-red-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600">401 – Unauthorized</h1>
          <p className="mt-2 text-gray-700">
            Please login first. Redirecting to login page…
          </p>
        </div>
      </div>
    );
  }







  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoaderMessage(" Saving profile...");
      setIsLoading(true);
      const res = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/profile`,
        profileData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
       
      setProfileData(res.data.profile);
    } catch (error) {
      console.log("Error from the server ", error);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setIsEditing(false);
      }, 3000);

    }

    console.log("Profile updated:", profileData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original data if needed
  };

  const validatePassword = (password) => {
    const minLength = 6;
   return "";
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear errors when user starts typing
    setPasswordErrors((prev) => ({
      ...prev,
      [field]: "",
      general: "",
    }));
  };

  const handlePasswordSubmit = async () => {
    const errors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      general: "",
    };

    // Validate current password
    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    // Validate new password
    const newPasswordError = validatePassword(passwordData.newPassword);
    if (newPasswordError) {
      errors.newPassword = newPasswordError;
    }

    // Validate confirm password
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // Check if new password is same as current
    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword =
        "New password must be different from current password";
    }

    setPasswordErrors(errors);

    // If no errors, proceed with password change
    if (!Object.values(errors).some((error) => error)) {
      try {
        setLoaderMessage(" Changing Password...");
        setIsLoading(true);
        const res = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/profile/changePassword`,
          passwordData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if(res.status == 200){
          localStorage.removeItem("token");
        }

 

        // Reset form and close dialog
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setIsPasswordDialogOpen(false);

        // Show success message (you could use a toast here)
        alert("Password changed successfully!");
      } catch (error) {
        setPasswordErrors((prev) => ({
          ...prev,
          general: error.response?.data?.message ,
          error,
        }));
      }
      finally{
        
          setIsLoading(false);
       
      }
    }
  };

  const handlePasswordCancel = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      general: "",
    });
    setIsPasswordDialogOpen(false);
  };

  return (
    <>


        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-0 pt-0">
                      <div className="flex items-center justify-between gap-4 p-4 bg-white ">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-teal-800 font-weight-800" />
            </Button>
            <h1 className="text-2xl font-bold text-teal-800">back </h1>
          </div>

          
        </div>
          {/* Profile Header */}
          <div className="bg-linear-to-r from-cyan-100 to-teal-100 rounded-lg p-6 border border-cyan-100">
           


            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Profile Image */}
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage
                    src={profileData.profileImg || "/placeholder.svg"}
                    alt="Profile"
                  />
                  <AvatarFallback className="text-2xl bg-linear-to-br from-cyan-500 to-teal-600 text-white">
                    {profileData.first_name}
                    {profileData.last_name}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 bg-cyan-600 hover:bg-cyan-700 text-white p-2 rounded-full transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Profile Info */}
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-800">
                  {profileData.first_name} {profileData.last_name}
                </h1>
                <p className="text-lg text-cyan-600 font-medium">
                  {profileData.role}
                </p>
                <p className="text-gray-600">{profileData.email}</p>
              </div>

              {/* Action Buttons */}
              <div className="ml-auto flex flex-col gap-2">
                {!isEditing ? (
                  <>
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-linear-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Dialog
                      open={isPasswordDialogOpen}
                      onOpenChange={setIsPasswordDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="border-blue-500 text-blue-600 hover:bg-blue-50 bg-transparent"
                        >
                          <Key className="w-4 h-4 mr-2" />
                          Change Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-blue-700">
                            Change Password
                          </DialogTitle>
                          <DialogDescription>
                            Enter your current password and choose a new secure
                            password.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          {passwordErrors.general && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="text-red-600 text-sm">
                                {passwordErrors.general}
                              </p>
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label htmlFor="currentPassword">
                              Current Password
                            </Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={(e) =>
                                handlePasswordChange(
                                  "currentPassword",
                                  e.target.value
                                )
                              }
                              className={
                                passwordErrors.currentPassword
                                  ? "border-red-500"
                                  : ""
                              }
                              placeholder="Enter current password"
                            />
                            {passwordErrors.currentPassword && (
                              <p className="text-red-500 text-sm">
                                {passwordErrors.currentPassword}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) =>
                                handlePasswordChange(
                                  "newPassword",
                                  e.target.value
                                )
                              }
                              className={
                                passwordErrors.newPassword
                                  ? "border-red-500"
                                  : ""
                              }
                              placeholder="Enter new password"
                            />
                            {passwordErrors.newPassword && (
                              <p className="text-red-500 text-sm">
                                {passwordErrors.newPassword}
                              </p>
                            )}
                            <div className="text-xs text-gray-500 space-y-1">
                              <p> For Strong Password :</p>
                              <ul className="list-disc list-inside space-y-0.5 ml-2">
                                <li>At least 8 characters</li>
                                <li>One uppercase letter</li>
                                <li>One lowercase letter</li>
                                <li>One number</li>
                                <li>One special character</li>
                              </ul>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                              Confirm New Password
                            </Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) =>
                                handlePasswordChange(
                                  "confirmPassword",
                                  e.target.value
                                )
                              }
                              className={
                                passwordErrors.confirmPassword
                                  ? "border-red-500"
                                  : ""
                              }
                              placeholder="Confirm new password"
                            />
                            {passwordErrors.confirmPassword && (
                              <p className="text-red-500 text-sm">
                                {passwordErrors.confirmPassword}
                              </p>
                            )}
                          </div>
                        </div>

                        <DialogFooter className="gap-2">
                          <Button
                            variant="outline"
                            onClick={handlePasswordCancel}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handlePasswordSubmit}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Change Password
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      className="bg-linear-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white"
                    >
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                {isEditing
                  ? "Edit your personal details below"
                  : "View your personal information"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.first_name}
                    onChange={(e) =>
                      handleInputChange("first_name", e.target.value)
                    }
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.last_name}
                    onChange={(e) =>
                      handleInputChange("last_name", e.target.value)
                    }
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phoneNo">Phone Number</Label>
                  <Input
                    id="phoneNo"
                    value={profileData.contact_number}
                    onChange={(e) =>
                      handleInputChange("contact_number", e.target.value)
                    }
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled
                    className="bg-gray-100 text-gray-500"
                  />
                  <p className="text-xs text-gray-500">
                    Email cannot be changed
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={
                      profileData.date_of_birth
                        ? profileData.date_of_birth.split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      handleInputChange("date_of_birth", e.target.value)
                    }
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={profileData.role}
                    disabled
                    className="bg-gray-100 text-gray-500"
                  />
                  <p className="text-xs text-gray-500">
                    Role cannot be changed
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={profileData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                  rows={3}
                />
              </div>

              {/* Financial Information */}
              <Separator />
              <h3 className="text-lg font-semibold text-gray-800">
                Financial Information
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="aadharNo">Aadhar Number</Label>
                  <Input
                    id="aadharNo"
                    value={profileData.aadhar_card_no}
                    onChange={(e) =>
                      handleInputChange("aadhar_card_no", e.target.value)
                    }
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panCard">PAN Card</Label>
                  <Input
                    id="panCard"
                    value={profileData.pan_card_no}
                    onChange={(e) =>
                      handleInputChange("pan_card_no", e.target.value)
                    }
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="accountNo">Account Number</Label>
                  <Input
                    id="accountNo"
                    value={profileData.account_no}
                    onChange={(e) =>
                      handleInputChange("account_no", e.target.value)
                    }
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary</Label>
                  <Input
                    id="salary"
                    value={profileData.salary}
                    disabled
                    className="bg-gray-100 text-gray-500"
                  />
                  <p className="text-xs text-gray-500">
                    Salary cannot be changed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

    </>
  );
}