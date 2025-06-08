"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Loader2,
  X,
  GraduationCap,
  Menu,
  Plus,
} from "lucide-react";
import AppLogo from "@/components/app-logo";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  createdAt: string;
  citations?: string[];
}

interface Document {
  id: string;
  name: string;
  fileName: string;
  vectorized: boolean;
}

interface Chat {
  id: string;
  title: string;
  documentId: string;
  messages: Message[];
}

interface ChatLayoutProps {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string>("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [examLoading, setExamLoading] = useState(false);

  // Get current chat ID from pathname
  const currentChatId =
    pathname.startsWith("/chat/") && pathname !== "/chat"
      ? pathname.split("/")[2]
      : null;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
      return;
    }

    if (status === "authenticated") {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router]);

  const fetchData = async () => {
    try {
      const [docsRes, chatsRes] = await Promise.all([
        fetch("/api/documents"),
        fetch("/api/chat"),
      ]);

      if (!docsRes.ok || !chatsRes.ok) {
        console.error("Failed to fetch data");
        return;
      }

      const [docsData, chatsData] = await Promise.all([
        docsRes.json(),
        chatsRes.json(),
      ]);

      const processedDocs = (docsData.documents || docsData || []).filter(
        (doc: Document) => doc.vectorized === true
      );

      const userChats = chatsData.chats || chatsData || [];

      setDocuments(processedDocs);
      setChats(userChats);

      // Auto-select first document if available
      if (processedDocs.length > 0 && !selectedDocument) {
        setSelectedDocument(processedDocs[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const startNewChat = async () => {
    if (!selectedDocument) return;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          documentId: selectedDocument,
          title: `Chat with ${documents.find((d) => d.id === selectedDocument)?.fileName}`,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const newChat = { ...result.chat, messages: [] } as Chat;
        setChats((prev) => [newChat, ...prev]);
        setShowSidebar(false);
        // Navigate to the new chat
        router.push(`/chat/${newChat.id}`);
      }
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const startExam = async () => {
    if (!selectedDocument) return;

    setExamLoading(true);
    try {
      const response = await fetch("/api/exam/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: selectedDocument,
          questionCount: 10,
        }),
      });

      if (response.ok) {
        const examData = await response.json();
        console.log("Exam generated:", examData);
        router.push(`/exam/${selectedDocument}`);
      }
    } catch (error) {
      console.error("Error generating exam:", error);
    } finally {
      setExamLoading(false);
    }
  };

  if (status === "loading" || isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="min-h-screen bg-amber-50">
        <header className="bg-white border-b">
          <div className="px-4 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </header>

        <div className="px-4 py-16">
          <div className="max-w-md mx-auto text-center border border-purple-200 bg-white rounded-lg p-8 shadow-md">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No Documents Available
            </h2>
            <p className="text-gray-600 mb-6">
              You need to upload and process some PDF documents before you can
              start chatting.
            </p>
            <Button onClick={() => router.push("/upload")}>
              Upload Documents
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentChat = chats.find((chat) => chat.id === currentChatId);

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col relative">
      {/* Mobile Header */}
      <header className="bg-white border-b p-4 flex items-center justify-between lg:hidden">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSidebar(true)}
          >
            <Menu className="w-4 h-4" />
          </Button>
          <div>
            {currentChat?.title ? (
              <h1 className="font-semibold text-gray-900 truncate max-w-[90%]">
                {currentChat.title}
              </h1>
            ) : (
              <AppLogo />
            )}
            <p className="text-xs text-gray-400">
              {currentChat
                ? currentChat.messages.length > 0
                  ? `Last updated on ${new Date(currentChat.messages[0].createdAt).toLocaleDateString()}`
                  : "No messages yet"
                : "Select a document to start cheating."}
            </p>
          </div>
        </div>

        {selectedDocument && (
          <Button
            onClick={startExam}
            disabled={examLoading}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            {examLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GraduationCap className="w-4 h-4" />
            )}
          </Button>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - Mobile Overlay & Desktop Fixed */}
        <div
          className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-white border-r transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${showSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        >
          {/* Mobile Overlay */}
          {showSidebar && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setShowSidebar(false)}
            />
          )}

          <div className="sticky top-0 z-50 bg-white h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <AppLogo />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSidebar(false)}
                  className="lg:hidden"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="w-full mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Select Document
                  </label>
                  <Select
                    value={selectedDocument}
                    onValueChange={setSelectedDocument}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a document" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      align="start"
                      className="max-w-full truncate"
                    >
                      {documents.map((doc) => (
                        <SelectItem
                          key={doc.id}
                          value={doc.id}
                          disabled={!doc.vectorized}
                          className="cursor-pointer"
                        >
                          <span className="font-medium">{doc.fileName}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={startNewChat}
                    disabled={!selectedDocument}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Chat
                  </Button>

                  <Button
                    onClick={startExam}
                    disabled={!selectedDocument || examLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 hidden lg:flex"
                  >
                    {examLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <GraduationCap className="w-4 h-4 mr-2" />
                    )}
                    Start Exam
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Recent Chats
              </h3>
              {chats.length === 0 ? (
                <p className="text-sm text-gray-500">No chats yet</p>
              ) : (
                <div className="space-y-2">
                  {chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => {
                        router.push(`/chat/${chat.id}`);
                        setShowSidebar(false);
                      }}
                      className={`w-full p-3 text-left rounded-lg transition-colors ${
                        currentChatId === chat.id
                          ? "bg-amber-50 border border-amber-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {chat.title}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-3 mt-1">
                        {chat.messages && chat.messages.length > 0
                          ? chat.messages[chat.messages.length - 1]?.content
                          : "No messages yet"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">{children}</div>
      </div>
    </div>
  );
}
