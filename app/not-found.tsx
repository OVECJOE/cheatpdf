"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Home,
    Search,
    FileText,
    MessageCircle,
    ClipboardList,
    ArrowLeft,
    Loader2,
    AlertTriangle,
} from "lucide-react";
import AppLogo from "@/components/app/logo";

export default function NotFound() {
    const { status } = useSession();
    const router = useRouter();

    const isAuthenticated = status === "authenticated";
    const isLoading = status === "loading";

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <AppLogo />
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Main Content */}
                    <div className="text-center mb-8">
                        <div className="flex flex-col items-center justify-center mb-6">
                            <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle className="w-12 h-12 text-muted-foreground" />
                            </div>

                            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                                404
                            </h1>
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">
                                Page Not Found
                            </h2>
                            <div className="flex flex-col items-center justify-center">
                                <p className="text-muted-foreground text-lg mb-8">
                                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Options */}
                    <div className="space-y-6">
                        {isAuthenticated ? (
                            // Authenticated user navigation
                            <>
                                <Card className="p-6 border-border">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">
                                        Quick Actions
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Button
                                            onClick={() => router.push("/dashboard")}
                                            className="w-full justify-start"
                                            variant="outline"
                                        >
                                            <Home className="w-4 h-4 mr-2" />
                                            Dashboard
                                        </Button>
                                        <Button
                                            onClick={() => router.push("/dashboard/documents")}
                                            className="w-full justify-start"
                                            variant="outline"
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            My Documents
                                        </Button>
                                        <Button
                                            onClick={() => router.push("/dashboard/chats")}
                                            className="w-full justify-start"
                                            variant="outline"
                                        >
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            My Chats
                                        </Button>
                                        <Button
                                            onClick={() => router.push("/dashboard/exams")}
                                            className="w-full justify-start"
                                            variant="outline"
                                        >
                                            <ClipboardList className="w-4 h-4 mr-2" />
                                            My Exams
                                        </Button>
                                    </div>
                                </Card>

                                <Card className="p-6 border-border">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">
                                        Get Started
                                    </h3>
                                    <div className="space-y-3">
                                        <Button
                                            onClick={() => router.push("/dashboard/upload")}
                                            className="w-full"
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            Upload New Document
                                        </Button>
                                        <Button
                                            onClick={() => router.push("/dashboard/chats/new")}
                                            variant="outline"
                                            className="w-full"
                                        >
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            Start New Chat
                                        </Button>
                                    </div>
                                </Card>
                            </>
                        ) : (
                            // Unauthenticated user navigation
                            <>
                                <Card className="p-6 border-border">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">
                                        Explore CheatPDF
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Button
                                            onClick={() => router.push("/")}
                                            className="w-full justify-start"
                                            variant="outline"
                                        >
                                            <Home className="w-4 h-4 mr-2" />
                                            Home
                                        </Button>
                                        <Button
                                            onClick={() => router.push("/features")}
                                            className="w-full justify-start"
                                            variant="outline"
                                        >
                                            <Search className="w-4 h-4 mr-2" />
                                            Features
                                        </Button>
                                        <Button
                                            onClick={() => router.push("/contact")}
                                            className="w-full justify-start"
                                            variant="outline"
                                        >
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            Contact
                                        </Button>
                                        <Button
                                            onClick={() => router.push("/donate")}
                                            className="w-full justify-start"
                                            variant="outline"
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            Donate
                                        </Button>
                                    </div>
                                </Card>

                                <Card className="p-6 border-border">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">
                                        Get Started
                                    </h3>
                                    <div className="space-y-3">
                                        <Button
                                            onClick={() => router.push("/auth/sign-in")}
                                            className="w-full"
                                        >
                                            Sign In
                                        </Button>
                                        <Button
                                            onClick={() => router.push("/auth/sign-up")}
                                            variant="outline"
                                            className="w-full"
                                        >
                                            Create Account
                                        </Button>
                                    </div>
                                </Card>
                            </>
                        )}

                        {/* Help Section */}
                        <Card className="p-6 border-border">
                            <h3 className="text-lg font-semibold text-foreground mb-4">
                                Need Help?
                            </h3>
                            <div className="space-y-3">
                                <p className="text-muted-foreground">
                                    If you believe this is an error, you can:
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button
                                        onClick={() => router.back()}
                                        variant="outline"
                                        className="w-full sm:w-auto"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Go Back
                                    </Button>
                                    <Button
                                        onClick={() => router.push("/contact")}
                                        variant="outline"
                                        className="w-full sm:w-auto"
                                    >
                                        Contact Support
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
} 