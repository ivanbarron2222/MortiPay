import { useEffect, useState } from "react";
import { ArrowLeft, Shield, UserRound } from "lucide-react";
import { useNavigate } from "react-router";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  changeCurrentDemoUserPassword,
  getCurrentDemoUser,
  updateCurrentDemoUserProfile,
  type DemoUserAccount,
} from "../../lib/demo-users";

export function Account() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<DemoUserAccount | null>(null);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [securitySuccess, setSecuritySuccess] = useState("");

  const [profileForm, setProfileForm] = useState({
    fullName: currentUser?.fullName ?? "",
    email: currentUser?.email ?? "",
    phone: currentUser?.phone ?? "",
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      const user = await getCurrentDemoUser();
      if (!active || !user) return;
      setCurrentUser(user);
      setProfileForm({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      });
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleProfileSave = async () => {
    const { user, error } = await updateCurrentDemoUserProfile({
      fullName: profileForm.fullName,
      phone: profileForm.phone,
    });

    if (error) {
      setProfileSuccess("");
      setProfileError(error);
      return;
    }
    setProfileError("");
    setProfileSuccess("Profile updated successfully.");
    if (user) setCurrentUser(user);
  };

  const handlePasswordChange = async () => {
    if (securityForm.newPassword.length < 6) {
      setSecuritySuccess("");
      setSecurityError("New password must be at least 6 characters.");
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecuritySuccess("");
      setSecurityError("New password and confirmation do not match.");
      return;
    }

    const { success, error } = await changeCurrentDemoUserPassword({
      currentPassword: securityForm.currentPassword,
      newPassword: securityForm.newPassword,
    });

    if (!success) {
      setSecuritySuccess("");
      setSecurityError(error ?? "Unable to change password.");
      return;
    }

    setSecurityError("");
    setSecuritySuccess("Password changed successfully.");
    setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/user")}
            className="mr-4 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        <Card className="rounded-2xl p-5">
          <div className="flex items-center mb-4">
            <UserRound className="text-blue-600 mr-2" size={20} />
            <h3 className="font-bold text-gray-900">Profile Info</h3>
          </div>
          <div className="space-y-3">
            <Input
              value={profileForm.fullName}
              onChange={(event) =>
                setProfileForm({ ...profileForm, fullName: event.target.value })
              }
              placeholder="Full name"
              className="rounded-lg"
            />
            <Input
              value={profileForm.email}
              disabled
              placeholder="Email"
              className="rounded-lg bg-gray-100"
            />
            <Input
              value={profileForm.phone}
              onChange={(event) =>
                setProfileForm({ ...profileForm, phone: event.target.value })
              }
              placeholder="Phone"
              className="rounded-lg"
            />
            <Button
              onClick={handleProfileSave}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Save Profile
            </Button>
            {profileError ? <p className="text-sm text-red-600">{profileError}</p> : null}
            {profileSuccess ? (
              <p className="text-sm text-green-600">{profileSuccess}</p>
            ) : null}
          </div>
        </Card>

        <Card className="rounded-2xl p-5">
          <div className="flex items-center mb-4">
            <Shield className="text-blue-600 mr-2" size={20} />
            <h3 className="font-bold text-gray-900">Security</h3>
          </div>
          <div className="space-y-3">
            <Input
              type="password"
              value={securityForm.currentPassword}
              onChange={(event) =>
                setSecurityForm({ ...securityForm, currentPassword: event.target.value })
              }
              placeholder="Current password"
              className="rounded-lg"
            />
            <Input
              type="password"
              value={securityForm.newPassword}
              onChange={(event) =>
                setSecurityForm({ ...securityForm, newPassword: event.target.value })
              }
              placeholder="New password"
              className="rounded-lg"
            />
            <Input
              type="password"
              value={securityForm.confirmPassword}
              onChange={(event) =>
                setSecurityForm({ ...securityForm, confirmPassword: event.target.value })
              }
              placeholder="Confirm new password"
              className="rounded-lg"
            />
            <Button
              onClick={handlePasswordChange}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Change Password
            </Button>
            {securityError ? (
              <p className="text-sm text-red-600">{securityError}</p>
            ) : null}
            {securitySuccess ? (
              <p className="text-sm text-green-600">{securitySuccess}</p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
