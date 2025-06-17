"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageCircle,
  Search,
  Filter,
  MoreVertical,
  FileText,
  Trash2,
  Eye,
  Calendar,
  Plus,
  Loader2,
  MessageSquareDashed,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  document: {
    id: string;
    name: string;
    fileName: string;
  };
  messages: {
    id: string;
    content: string;
    role: string;
    createdAt: string;
  }[];
  _count: {
    messages: number;
  };
}

export default function ChatsPage() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await fetch("/api/chats");
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
      return;
    }

    setDeleteLoading(chatId);
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setChats(chats => chats.filter(chat => chat.id !== chatId));
      } else {
        alert("Failed to delete chat");
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
      alert("Failed to delete chat");
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredAndSortedChats = chats
    .filter(chat => {
      const searchTerm = searchQuery.toLowerCase();
      return (
        chat.title.toLowerCase().includes(searchTerm) ||
        chat.document.name.toLowerCase().includes(searchTerm) ||
        chat.messages.some(msg => 
          msg.content.toLowerCase().includes(searchTerm)
        )
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "messages":
          return b._count.messages - a._count.messages;
        default:
          return 0;
      }
    });

  const getLastMessage = (chat: Chat) => {
    if (chat.messages.length === 0) return "No messages yet";
    const lastMessage = chat.messages[chat.messages.length - 1];
    return lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? "..." : "");
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chats</h1>
          <p className="text-muted-foreground">
            View and manage all your document conversations
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/chats/new")} className="w-full sm:w-auto gradient-brand hover:opacity-90 transition-all duration-300">
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search chats, documents, or messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="title">Title A-Z</SelectItem>
            <SelectItem value="messages">Most Messages</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Card */}
      <Card className="p-4 border-border bg-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{chats.length}</p>
              <p className="text-sm text-muted-foreground">Total Chats</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <MessageSquareDashed className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {chats.reduce((sum, chat) => sum + chat._count.messages, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Messages</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <FileText className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {new Set(chats.map(chat => chat.document.id)).size}
              </p>
              <p className="text-sm text-muted-foreground">Documents Used</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Chats List */}
      {filteredAndSortedChats.length === 0 ? (
        <Card className="p-8 border-border bg-card">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {chats.length === 0 ? "No chats yet" : "No chats found"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {chats.length === 0 
                ? "Start your first conversation with a document"
                : "Try adjusting your search or filter criteria"
              }
            </p>
            {chats.length === 0 && (
              <Button onClick={() => router.push("/dashboard/chats/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Start First Chat
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedChats.map((chat) => (
            <Card key={chat.id} className="p-4 border-border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Chat Header */}
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <MessageCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {chat.title}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <FileText className="w-3 h-3" />
                        <span className="truncate">{chat.document.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Last Message Preview */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {getLastMessage(chat)}
                  </p>

                  {/* Chat Stats */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {chat._count.messages} message{chat._count.messages !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/dashboard/chats/${chat.id}`)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Continue
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/chats/${chat.id}`)}
                            className="cursor-pointer"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Chat
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/documents?highlight=${chat.document.id}`)}
                            className="cursor-pointer"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View Document
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteChat(chat.id)}
                            className="cursor-pointer text-destructive"
                            disabled={deleteLoading === chat.id}
                          >
                            {deleteLoading === chat.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Delete Chat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 