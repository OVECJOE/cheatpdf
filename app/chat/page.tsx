"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Send,
  ArrowLeft,
  FileText,
  Bot,
  User,
  Loader2,
  BookOpen,
  Brain,
  Sparkles,
  X,
  GraduationCap,
  Clock,
  CheckCircle,
  Menu,
  Plus,
} from "lucide-react";
import AppLogo from "@/components/app-logo";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
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

interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface ExamState {
  questions: ExamQuestion[];
  currentQuestionIndex: number;
  answers: number[];
  isComplete: boolean;
  score: number;
}

export default function ChatPage() {
  const { status } = useSession();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<string>("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Mobile navigation state
  const [showSidebar, setShowSidebar] = useState(false);

  // Exam mode state
  const [examMode, setExamMode] = useState(false);
  const [examState, setExamState] = useState<ExamState | null>(null);
  const [examLoading, setExamLoading] = useState(false);

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

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

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

      // Handle the response structure from your API
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        setActiveChat(newChat);
        setShowSidebar(false); // Close sidebar on mobile after creating chat
      }
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || loading || !activeChat) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      role: "user",
      timestamp: new Date().toISOString(),
    };

    setActiveChat((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, userMessage],
          }
        : null
    );

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "message",
          chatId: activeChat.id,
          message: userMessage.content,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: result.response.content || result.response,
          role: "assistant",
          timestamp: new Date().toISOString(),
          citations: result.response.citations || [],
        };

        setActiveChat((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, assistantMessage],
              }
            : null
        );

        // Update chats list
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === activeChat.id
              ? {
                  ...chat,
                  messages: [...chat.messages, userMessage, assistantMessage],
                }
              : chat
          )
        );
      } else {
        // Handle error
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "Sorry, I encountered an error. Please try again.",
          role: "assistant",
          timestamp: new Date().toISOString(),
        };

        setActiveChat((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, assistantMessage],
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const startExam = async () => {
    if (!selectedDocument) return;

    setExamLoading(true);
    try {
      // This would be your exam generation API endpoint
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
        setExamState({
          questions: examData.questions,
          currentQuestionIndex: 0,
          answers: [],
          isComplete: false,
          score: 0,
        });
        setExamMode(true);
        setShowSidebar(false); // Close sidebar on mobile
      }
    } catch (error) {
      console.error("Error generating exam:", error);
    } finally {
      setExamLoading(false);
    }
  };

  const answerQuestion = (answerIndex: number) => {
    if (!examState) return;

    const newAnswers = [...examState.answers];
    newAnswers[examState.currentQuestionIndex] = answerIndex;

    setExamState({
      ...examState,
      answers: newAnswers,
    });
  };

  const nextQuestion = () => {
    if (!examState) return;

    if (examState.currentQuestionIndex < examState.questions.length - 1) {
      setExamState({
        ...examState,
        currentQuestionIndex: examState.currentQuestionIndex + 1,
      });
    } else {
      // Complete exam
      const score = examState.answers.reduce((acc, answer, index) => {
        return (
          acc + (answer === examState.questions[index].correctAnswer ? 1 : 0)
        );
      }, 0);

      setExamState({
        ...examState,
        isComplete: true,
        score,
      });
    }
  };

  const closeExam = () => {
    setExamMode(false);
    setExamState(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
          <div className="max-w-md mx-auto text-center">
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
            {activeChat?.title ? (
              <h1 className="font-semibold text-gray-900">
                {activeChat.title}
              </h1>
            ) : (
              <AppLogo />
            )}
            <p className="text-xs text-gray-500">
              {activeChat
                ? `${activeChat.messages.length} messages`
                : "Select a document to start"}
            </p>
          </div>
        </div>

        {selectedDocument && !examMode && (
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

      <div className="flex flex-1 overflow-hidden">
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

          <div className="relative z-50 bg-white h-full flex flex-col">
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
                    <SelectContent>
                      {documents.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{doc.fileName}</span>
                          </div>
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
                        setActiveChat(chat);
                        setShowSidebar(false); // Close sidebar on mobile
                      }}
                      className={`w-full p-3 text-left rounded-lg transition-colors ${
                        activeChat?.id === chat.id
                          ? "bg-amber-50 border border-amber-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {chat.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {chat.messages.length} messages
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {!activeChat ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">
                  Ready to Chat with Your PDFs?
                </h2>
                <p className="text-gray-600 mb-6 text-sm lg:text-base">
                  Select a document and start a new chat to begin asking
                  questions about your study materials.
                </p>
                <div className="flex flex-col md:flex-row justify-center items-center gap-3 md:gap-5 text-sm text-gray-600">
                  <div className="flex items-center gap-2 justify-start w-max min-w-40 border border-dashed border-amber-200 rounded-lg px-3 py-2">
                    <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Ask questions about your documents</span>
                  </div>
                  <div className="flex items-center gap-2 justify-start w-max min-w-40 border border-dashed border-amber-200 rounded-lg px-3 py-2">
                    <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Get instant, accurate answers</span>
                  </div>
                  <div className="flex items-center gap-2 justify-start w-max min-w-40 border border-dashed border-amber-200 rounded-lg px-3 py-2">
                    <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Learn faster with AI assistance</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Chat Header */}
              <div className="bg-white border-b p-4 hidden lg:block">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {activeChat.title}
                    </h2>
                    <p className="text-sm text-gray-600">
                      AI-powered chat • {activeChat.messages.length} messages
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 pb-4">
                {activeChat.messages.length === 0 ? (
                  <div className="text-center py-8 opacity-80">
                    <AppLogo showText={false} className="mx-auto mb-3" />
                    <p className="text-secondary font-mono font-medium text-sm lg:text-base">
                      Ask me anything about your document. I&apos;m here to help
                      you learn!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {activeChat.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex space-x-3 ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                          {msg.role === "assistant" ? (
                            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-amber-200 rounded-lg flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <Card
                            className={`p-3 lg:p-4 ${
                              msg.role === "user"
                                ? "bg-amber-600 text-white ml-8 lg:ml-16"
                                : "bg-white border mr-8 lg:mr-16"
                            }`}
                          >
                            <p className="whitespace-pre-wrap text-sm lg:text-base leading-relaxed">
                              {msg.content}
                            </p>

                            {msg.citations && msg.citations.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">
                                  Sources:
                                </p>
                                <div className="space-y-1">
                                  {msg.citations.map((citation, index) => (
                                    <p
                                      key={index}
                                      className="text-xs text-gray-600"
                                    >
                                      {citation}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </Card>

                          <p
                            className={`text-xs mt-1 px-1 ${
                              msg.role === "user"
                                ? "text-right text-gray-500"
                                : "text-gray-500"
                            }`}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="flex space-x-3">
                        <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <Card className="p-3 lg:p-4 bg-white border mr-8 lg:mr-16">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                            <p className="text-gray-600 text-sm">Thinking...</p>
                          </div>
                        </Card>
                      </div>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t p-4 safe-area-inset-bottom">
                <div className="max-w-4xl mx-auto">
                  <div className="flex space-x-3">
                    <Input
                      placeholder="Ask a question about your document..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={loading}
                      className="flex-1 min-w-0"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!message.trim() || loading}
                      className="flex-shrink-0"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 mt-2 hidden lg:block">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Exam Mode - Full Screen on Mobile, Sidebar on Desktop */}
      {examMode && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col lg:inset-y-0 lg:right-0 lg:w-96 lg:border-l lg:shadow-lg">
          {/* Exam Header */}
          <div className="p-4 border-b bg-purple-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Exam Mode</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={closeExam}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {examState && !examState.isComplete && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm text-purple-700">
                  <span>
                    Question {examState.currentQuestionIndex + 1} of{" "}
                    {examState.questions.length}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Active</span>
                  </div>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((examState.currentQuestionIndex + 1) / examState.questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Exam Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {!examState ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                <p className="text-gray-600">Generating exam questions...</p>
              </div>
            ) : examState.isComplete ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Exam Complete!
                </h3>
                <p className="text-gray-600 mb-4">
                  You scored {examState.score} out of{" "}
                  {examState.questions.length}
                </p>
                <div className="text-3xl font-bold text-purple-600 mb-6">
                  {Math.round(
                    (examState.score / examState.questions.length) * 100
                  )}
                  %
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={closeExam}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Close Exam
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setExamState({
                        ...examState,
                        currentQuestionIndex: 0,
                        isComplete: false,
                      })
                    }
                    className="w-full"
                  >
                    Review Answers
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-4 text-base lg:text-lg leading-relaxed">
                    {
                      examState.questions[examState.currentQuestionIndex]
                        ?.question
                    }
                  </h4>

                  <div className="space-y-3">
                    {examState.questions[
                      examState.currentQuestionIndex
                    ]?.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => answerQuestion(index)}
                        className={`w-full p-4 text-left rounded-lg border transition-all duration-200 ${
                          examState.answers[examState.currentQuestionIndex] ===
                          index
                            ? "bg-purple-100 border-purple-300 shadow-sm"
                            : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="font-medium text-purple-600 text-sm flex-shrink-0 mt-0.5">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <span className="text-sm lg:text-base leading-relaxed">
                            {option}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={nextQuestion}
                  disabled={
                    examState.answers[examState.currentQuestionIndex] ===
                    undefined
                  }
                  className="w-full bg-purple-600 hover:bg-purple-700 py-3"
                >
                  {examState.currentQuestionIndex <
                  examState.questions.length - 1
                    ? "Next Question"
                    : "Complete Exam"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
