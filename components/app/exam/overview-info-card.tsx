import { Card } from "@/components/ui/card";
import { FileText, Target, Clock, Brain, Zap, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface Exam {
  id: string;
  title: string;
  document: { id: string; name: string; fileName: string };
  timeLimit: number;
  totalQuestions: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  score?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

interface ExamInfoCardProps {
  exam: Exam;
  difficulty: string;
  color: string;
  timePerQuestion: number;
}

export default function ExamInfoCard({ exam, difficulty, color, timePerQuestion }: ExamInfoCardProps) {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Exam Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Source Document</p>
                  <p className="text-sm text-muted-foreground">{exam.document.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Questions</p>
                  <p className="text-sm text-muted-foreground">{exam.totalQuestions} multiple choice</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Time Limit</p>
                  <p className="text-sm text-muted-foreground">{exam.timeLimit} minutes total</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Brain className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Difficulty</p>
                  <Badge className={color}>{difficulty}</Badge>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Pace</p>
                  <p className="text-sm text-muted-foreground">~{timePerQuestion} min per question</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Security</p>
                  <p className="text-sm text-muted-foreground">Proctoring enabled</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {exam.status === "COMPLETED" && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Final Score</p>
                <p className="text-2xl font-bold text-primary">{exam.score}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-sm font-medium text-foreground">
                  {exam.completedAt ? formatDistanceToNow(new Date(exam.completedAt), { addSuffix: true }) : "Recently"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
} 