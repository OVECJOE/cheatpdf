"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  Mail,
  Crown,
  Shield,
  Trash2,
  Save,
  Loader2,
  Settings as SettingsIcon,
  Palette,
  LogOut,
  CreditCard,
  FileText,
  MessageCircle,
  Calendar,
} from "lucide-react";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: string;
  subscriptionPlan?: string;
  subscriptionEndsAt?: string;
  createdAt: string;
  _count: {
    documents: number;
    chats: number;
    exams: number;
  };
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setUserProfile(updatedProfile);
        
        // Update session if name changed
        if (formData.name !== session?.user?.name) {
          await update({ name: formData.name });
        }
        
        toast.success("Profile updated successfully");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      if (response.ok) {
        await signOut({ redirect: true, callbackUrl: "/" });
      } else {
        toast.error("Failed to delete account");
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error("Failed to delete account");
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  const isProUser = userProfile?.subscriptionStatus === "ACTIVE";

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center space-x-3 mb-6">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Profile Information</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    className="pl-10"
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>
              
              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </Card>

          {/* Subscription Settings */}
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center space-x-3 mb-6">
              <Crown className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Subscription</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Current Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {isProUser ? "Pro Plan" : "Free Plan"}
                  </p>
                </div>
                <Badge variant={isProUser ? "default" : "secondary"}>
                  {isProUser ? "Active" : "Free"}
                </Badge>
              </div>
              
              {isProUser && userProfile?.subscriptionEndsAt && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Subscription ends: {new Date(userProfile.subscriptionEndsAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              <div className="flex space-x-2">
                {!isProUser ? (
                  <Button onClick={() => router.push("/upgrade")}>
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => router.push("/billing")}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Manage Billing
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/upgrade")}>
                      <SettingsIcon className="w-4 h-4 mr-2" />
                      Plan Details
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Appearance Settings */}
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center space-x-3 mb-6">
              <Palette className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Theme</p>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred theme
                </p>
              </div>
              <ThemeToggle />
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 border-destructive/20 bg-card">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="w-5 h-5 text-destructive" />
              <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="font-medium text-foreground mb-2">Sign Out</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Sign out of your account on this device.
                </p>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <p className="font-medium text-destructive mb-2">Delete Account</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-foreground">Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        This action cannot be undone. This will permanently delete your account,
                        all your documents, chats, exams, and remove all associated data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Overview */}
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Account Overview</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Member since:</span>
                <span className="text-sm text-foreground">
                  {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Subscription:</span>
                <Badge variant={isProUser ? "default" : "secondary"} className="text-xs">
                  {isProUser ? "Pro" : "Free"}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Usage Stats */}
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center space-x-3 mb-4">
              <SettingsIcon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Usage Statistics</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Documents</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {userProfile?._count.documents || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Chats</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {userProfile?._count.chats || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Exams</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {userProfile?._count.exams || 0}
                  {!isProUser && <span className="text-xs text-muted-foreground"> (Pro only)</span>}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 border-border bg-card">
            <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/documents")}
                className="w-full justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                View Documents
              </Button>
              
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/chats")}
                className="w-full justify-start"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                View Chats
              </Button>
              
              {isProUser && (
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/exams")}
                  className="w-full justify-start"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View Exams
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 