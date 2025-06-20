"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MessageCircle,
  Send,
  FileText,
  User,
  Bot,
  Loader2,
  MoreVertical,
  Trash2,
  Copy,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import MarkdownRenderer from "@/components/markdown-renderer";
import { useChatPagination, Message as ChatMessage } from '@/lib/hooks/use-chat-pagination';
import ChatPageSkeleton from "./loading";

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.id as string;
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatMeta, setChatMeta] = useState<{ title: string; document: { id: string; name: string; fileName: string }; createdAt: string } | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const {
    messages,
    setMessages,
    loading,
    hasPrev,
    loadPrev,
    jumpToLatest,
    init,
  } = useChatPagination({ chatId, pageSize: 20 });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/chats/${chatId}`);
        if (res.ok) {
          const data = await res.json();
          setChatMeta({ title: data.chat.title, document: data.chat.document, createdAt: data.chat.createdAt });
        } else {
          setChatMeta(null);
        }
      } catch (error) {
        console.error("Failed to load chat details:", error);
        setChatMeta(null);
        toast.error("Failed to load chat details.");
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, [chatId]);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!message.trim() || sending) return;

    const userMessage = message.trim();
    
    const optimisticMessage: ChatMessage = {
      id: `pending-${Date.now()}`,
      content: userMessage,
      role: 'USER',
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    setMessage("");
    setSending(true);

    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to send message");
        setMessage(userMessage);
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      }
    } catch {
      toast.error("Failed to send message. Please check your connection.");
      setMessage(userMessage);
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
    } finally {
      setSending(false);
      jumpToLatest();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textareaRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [message]);

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Message copied to clipboard");
  };

  const deleteChat = async () => {
    if (!chatMeta) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Chat deleted successfully");
        router.push("/dashboard/chats");
      } else {
        toast.error("Failed to delete chat");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    } finally {
      setDeleting(false);
    }
  };

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el || loading) return;

    if (el.scrollTop === 0 && hasPrev) {
      loadPrev();
    }
  };

  if (loadingMeta) {
    return <ChatPageSkeleton />;
  }
  
  if (!chatMeta) {
    return (
      <div className="p-6">
        <Card className="p-8 border-border bg-card text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Chat Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The chat you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/dashboard/chats")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chats
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-shrink-0">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate text-foreground">{chatMeta.title}</h1>
              <p className="text-sm text-muted-foreground truncate" title={chatMeta.document.name}>
                {chatMeta.document.name}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={deleting}>
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/documents/${chatMeta.document.id}`)}>
                <FileText className="w-4 h-4 mr-2" />
                <span>View Document</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:text-red-500">
                    <Trash2 className="w-4 h-4 mr-2" />
                    <span>Delete Chat</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this chat history.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteChat} className="bg-red-500 hover:bg-red-600">
                      Yes, delete chat
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
      >
        {loading && messages.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          </div>
        )}

        {hasPrev && (
          <div className="text-center">
            <Button variant="outline" size="sm" onClick={loadPrev} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Load previous messages
            </Button>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 sm:gap-4 ${
              msg.role === "USER" ? "justify-end" : "justify-start"
            } ${msg.status === 'pending' ? 'opacity-60' : ''}`}
          >
            {msg.role === "ASSISTANT" && (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
            )}
            <div
              className={`max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl w-fit rounded-xl p-3 sm:p-4 text-sm sm:text-base shadow-sm break-words ${
                msg.role === "USER"
                  ? "bg-primary/20 text-primary rounded-br-none"
                  : "bg-card text-card-foreground border rounded-bl-none"
              }`}
            >
              <MarkdownRenderer content={msg.content} />
              <div className="text-xs mt-2 flex items-center justify-end opacity-70 space-x-2">
                {msg.status === 'pending' ? (
                  <>
                    <Clock className="w-3 h-3" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</span>
                    <button onClick={() => copyMessage(msg.content)} className="hover:opacity-100 transition-opacity">
                      <Copy className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
            {msg.role === "USER" && (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                {msg.status === 'pending' ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground animate-spin" /> : <User className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 sm:p-6 pt-2 border-t border-border bg-card">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask a follow-up question..."
            className="w-full min-h-[40px] resize-none bg-background pr-12 py-3"
            rows={1}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            <Button
              type="submit"
              size="icon"
              disabled={!message.trim() || sending}
              className="rounded-full w-8 h-8"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Press <kbd className="px-1.5 py-0.5 border bg-muted rounded-sm">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 border bg-muted rounded-sm">Shift+Enter</kbd> for a new line.
        </p>
      </div>
    </div>
  );
} 