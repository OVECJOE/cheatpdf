"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  ClipboardList,
  Search,
  Filter,
  MoreVertical,
  FileText,
  Trash2,
  Eye,
  Calendar,
  Plus,
  Loader2,
  Trophy,
  Clock,
  Target,
  TrendingUp,
  CheckCircle,
  XCircle,
  Play,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SubscriptionStatus } from "@prisma/client";

interface Exam {
  id: string;
  title: string;
  timeLimit: number; // in minutes
  totalQuestions: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  score?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  document: {
    id: string;
    name: string;
    fileName: string;
  };
  _count: {
    questions: number;
    answers: number;
  };
}

interface UserProfile {
  subscriptionStatus: string;
}

export default function ExamsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const examsResponse = await fetch("/api/exams");
      if (examsResponse.ok) {
        const examsData = await examsResponse.json();
        setExams(examsData.results || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
      return;
    }

    setDeleteLoading(examId);
    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setExams(exams => exams.filter(exam => exam.id !== examId));
      } else {
        alert("Failed to delete exam");
      }
    } catch (error) {
      console.error("Failed to delete exam:", error);
      alert("Failed to delete exam");
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredExams = exams
    .filter(exam => {
      const searchTerm = searchQuery.toLowerCase();
      const matchesSearch = 
        exam.title.toLowerCase().includes(searchTerm) ||
        exam.document.name.toLowerCase().includes(searchTerm);
      
      const matchesStatus = statusFilter === "all" || exam.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusColor = (status: Exam["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "default";
      case "IN_PROGRESS":
        return "secondary";
      case "NOT_STARTED":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: Exam["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-3 h-3" />;
      case "IN_PROGRESS":
        return <Clock className="w-3 h-3" />;
      case "NOT_STARTED":
        return <Play className="w-3 h-3" />;
      default:
        return <Play className="w-3 h-3" />;
    }
  };

  const calculateStats = () => {
    const completed = exams.filter(e => e.status === "COMPLETED");
    const avgScore = completed.length > 0 
      ? completed.reduce((sum, exam) => sum + (exam.score || 0), 0) / completed.length 
      : 0;
    
    return {
      total: exams.length,
      completed: completed.length,
      averageScore: Math.round(avgScore),
      bestScore: completed.length > 0 ? Math.max(...completed.map(e => e.score || 0)) : 0,
    };
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

  const stats = calculateStats();
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exams</h1>
          <p className="text-muted-foreground">
            Practice exams generated from your documents
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/exams/new")} className="w-full sm:w-auto gradient-brand hover:opacity-90 transition-all duration-300">
          <Plus className="w-4 h-4 mr-2" />
          Create Exam
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ClipboardList className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Exams</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.averageScore}%</p>
              <p className="text-sm text-muted-foreground">Avg Score</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.bestScore}%</p>
              <p className="text-sm text-muted-foreground">Best Score</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search exams or documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="NOT_STARTED">Not Started</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Exams List */}
      {filteredExams.length === 0 ? (
        <Card className="p-8 border-border bg-card">
          <div className="text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {exams.length === 0 ? "No exams yet" : "No exams found"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {exams.length === 0 
                ? "Create your first practice exam from a document"
                : "Try adjusting your search or filter criteria"
              }
            </p>
            {exams.length === 0 && (
              <Button onClick={() => router.push("/dashboard/exams/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Exam
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredExams.map((exam) => (
            <Card key={exam.id} className="p-4 border-border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Exam Header */}
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <ClipboardList className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {exam.title}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <FileText className="w-3 h-3" />
                        <span className="truncate">{exam.document.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Exam Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{exam.totalQuestions} questions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{exam.timeLimit} min</span>
                    </div>
                    {exam.score !== undefined && (
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{exam.score}% score</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(exam.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex items-center justify-between">
                    <Badge variant={getStatusColor(exam.status)} className="flex items-center space-x-1">
                      {getStatusIcon(exam.status)}
                      <span className="capitalize">{exam.status.replace("_", " ").toLowerCase()}</span>
                    </Badge>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/dashboard/exams/${exam.id}`)}
                      >
                        {exam.status === "COMPLETED" ? (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Review
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 mr-1" />
                            {exam.status === "IN_PROGRESS" ? "Continue" : "Start"}
                          </>
                        )}
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/exams/${exam.id}`)}
                            className="cursor-pointer"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Exam
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/documents?highlight=${exam.document.id}`)}
                            className="cursor-pointer"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View Document
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteExam(exam.id)}
                            className="cursor-pointer text-destructive"
                            disabled={deleteLoading === exam.id}
                          >
                            {deleteLoading === exam.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Delete Exam
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