"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import {
  ArrowRight,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Skeleton } from "@/components/ui/skeleton";

// Types
type EducationLevel =
  | "High School"
  | "Undergraduate"
  | "Graduate"
  | "PhD"
  | "Professional"
  | "Other";

type StudyGoal =
  | "improve-grades"
  | "exam-prep"
  | "understand-concepts"
  | "time-management"
  | "retention"
  | "problem-solving"
  | "research-skills"
  | "career-prep";

interface EducationConfig {
  level: number;
  subjects: readonly string[];
  exams: readonly string[];
  goals: readonly StudyGoal[];
  description: string;
}

interface StudentData {
  educationLevel: EducationLevel | "";
  subjects: string[];
  studyGoals: StudyGoal | "";
  examType: string;
}

// Smart configuration system
const EDUCATION_CONFIGS: Record<EducationLevel, EducationConfig> = {
  "High School": {
    level: 1,
    subjects: [
      "Mathematics",
      "Science",
      "History",
      "Literature",
      "Language Arts",
      "Chemistry",
      "Physics",
      "Biology",
    ],
    exams: ["SAT/ACT", "AP Exams", "Final Exams", "State Tests"],
    goals: [
      "improve-grades",
      "exam-prep",
      "understand-concepts",
      "time-management",
    ],
    description: "Building foundational knowledge",
  },
  Undergraduate: {
    level: 2,
    subjects: [
      "Mathematics",
      "Computer Science",
      "Engineering",
      "Business",
      "Economics",
      "Psychology",
      "Chemistry",
      "Physics",
      "Biology",
    ],
    exams: [
      "Final Exams",
      "Midterms",
      "GRE/GMAT",
      "Professional Certification",
    ],
    goals: [
      "improve-grades",
      "understand-concepts",
      "exam-prep",
      "problem-solving",
      "career-prep",
    ],
    description: "Developing specialized expertise",
  },
  Graduate: {
    level: 3,
    subjects: [
      "Computer Science",
      "Engineering",
      "Medicine",
      "Law",
      "Business",
      "Economics",
      "Psychology",
      "Research Methods",
    ],
    exams: [
      "Comprehensive Exams",
      "Thesis Defense",
      "Professional Certification",
      "Medical Boards",
      "Bar Exam",
    ],
    goals: [
      "research-skills",
      "understand-concepts",
      "exam-prep",
      "career-prep",
      "problem-solving",
    ],
    description: "Advanced study and research",
  },
  PhD: {
    level: 4,
    subjects: [
      "Research Methods",
      "Advanced Theory",
      "Dissertation Topic",
      "Teaching Methods",
    ],
    exams: ["Qualifying Exams", "Dissertation Defense", "Comprehensive Exams"],
    goals: [
      "research-skills",
      "understand-concepts",
      "career-prep",
      "time-management",
    ],
    description: "Original research and expertise",
  },
  Professional: {
    level: 5,
    subjects: [
      "Industry Standards",
      "Certification Requirements",
      "Continuing Education",
    ],
    exams: [
      "Professional Certification",
      "Licensing Exams",
      "Industry Certifications",
    ],
    goals: ["career-prep", "exam-prep", "understand-concepts", "retention"],
    description: "Career advancement and certification",
  },
  Other: {
    level: 0,
    subjects: ["General Studies", "Personal Interest", "Skill Development"],
    exams: ["Custom Assessments", "Self-Evaluation"],
    goals: [
      "understand-concepts",
      "time-management",
      "retention",
      "problem-solving",
    ],
    description: "Flexible learning approach",
  },
};

const STUDY_GOAL_LABELS: Record<StudyGoal, string> = {
  "improve-grades": "Improve Grades",
  "exam-prep": "Exam Preparation",
  "understand-concepts": "Understand Concepts",
  "time-management": "Time Management",
  "retention": "Better Retention",
  "problem-solving": "Problem Solving",
  "research-skills": "Research Skills",
  "career-prep": "Career Preparation",
};

const STUDY_GOAL_DESCRIPTIONS: Record<StudyGoal, string> = {
  "improve-grades": "Focus on achieving better academic performance",
  "exam-prep": "Prepare for specific tests and examinations",
  "understand-concepts": "Deepen comprehension of subject matter",
  "time-management": "Optimize study time and schedule",
  "retention": "Improve long-term memory and recall",
  "problem-solving": "Enhance analytical and critical thinking skills",
  "research-skills": "Develop academic research capabilities",
  "career-prep": "Build skills for professional advancement",
};

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [studentData, setStudentData] = useState<StudentData>({
    educationLevel: "",
    subjects: [],
    studyGoals: "",
    examType: "none",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Smart suggestions based on selections
  const smartSuggestions = useMemo(() => {
    if (!studentData.educationLevel || studentData.educationLevel === "Other") {
      return {
        subjects: [],
        exams: [],
        goals: [],
      };
    }

    const config = EDUCATION_CONFIGS[studentData.educationLevel];
    return {
      subjects: config.subjects,
      exams: config.exams,
      goals: config.goals,
    };
  }, [studentData.educationLevel]);

  const handleStudentDataChange = (
    field: keyof StudentData,
    value: string | string[]
  ): void => {
    setStudentData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubjectToggle = (subject: string): void => {
    setStudentData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const completeOnboarding = async (): Promise<void> => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const payload = {
        educationLevel: studentData.educationLevel,
        subjects: studentData.subjects,
        studyGoals: studentData.studyGoals,
        examType: studentData.examType === "none" ? "" : studentData.examType,
      };

      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push("/dashboard");
      } else {
        console.error("Onboarding failed");
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 max-w-md w-full px-4">
          <Skeleton className="h-12 w-full bg-muted" />
          <Skeleton className="h-8 w-3/4 bg-muted" />
          <Skeleton className="h-32 w-full bg-muted" />
        </div>
      </div>
    );
  }

  if (!session) {
    router.push("/auth/sign-in");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">
              Welcome to CheatPDF!
            </h1>
            <Badge variant="outline" className="border-primary/30 text-primary">
              Step {step} of 2
            </Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="gradient-brand h-2 rounded-full transition-all duration-500"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Student Details */}
        {step === 1 && (
          <Card className="p-8 bg-card border-border transition-all duration-300 hover:shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Let&apos;s personalize your study experience
              </h2>
              <p className="text-muted-foreground">
                We&apos;ll suggest the best features and content for your needs
              </p>
            </div>

            <div className="space-y-8">
              {/* Education Level */}
              <div>
                <Label className="text-base font-medium text-foreground mb-4 block">
                  What&apos;s your current education level?
                </Label>
                <Select
                  value={studentData.educationLevel}
                  onValueChange={(value: EducationLevel) =>
                    handleStudentDataChange("educationLevel", value)
                  }
                >
                  <SelectTrigger className="w-full bg-background border-border text-foreground">
                    <SelectValue placeholder="Select your education level" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EDUCATION_CONFIGS).map(([level, config]) => (
                      <SelectItem key={level} value={level}>
                        <div>
                          <div className="font-medium">{level}</div>
                          <div className="text-sm text-muted-foreground">
                            {config.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Study Goals */}
              {studentData.educationLevel && (
                <div>
                  <Label className="text-base font-medium text-foreground mb-4 block">
                    What&apos;s your primary study goal?
                  </Label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {smartSuggestions.goals.map((goal) => (
                      <button
                        key={goal}
                        onClick={() => handleStudentDataChange("studyGoals", goal)}
                        className={clsx(
                          "p-4 rounded-lg border-2 transition-all duration-300 text-left hover:shadow-sm",
                          studentData.studyGoals === goal
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:border-primary/50"
                        )}
                      >
                        <div className="font-medium text-foreground mb-1">
                          {STUDY_GOAL_LABELS[goal]}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {STUDY_GOAL_DESCRIPTIONS[goal]}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject Areas */}
              {studentData.educationLevel && (
                <div>
                  <Label className="text-base font-medium text-foreground mb-4 block">
                    Which subjects are you focusing on? (Optional)
                  </Label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {smartSuggestions.subjects.map((subject) => (
                      <button
                        key={subject}
                        onClick={() => handleSubjectToggle(subject)}
                        className={clsx(
                          "p-3 rounded-lg border-2 transition-all duration-300 text-sm font-medium",
                          studentData.subjects.includes(subject)
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-background text-foreground hover:border-primary/50"
                        )}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Exams */}
              {studentData.educationLevel && smartSuggestions.exams.length > 0 && (
                <div>
                  <Label className="text-base font-medium text-foreground mb-4 block">
                    Do you have any upcoming exams? (Optional)
                  </Label>
                  <Select
                    value={studentData.examType}
                    onValueChange={(value) =>
                      handleStudentDataChange("examType", value)
                    }
                  >
                    <SelectTrigger className="w-full bg-background border-border text-foreground">
                      <SelectValue placeholder="Select an exam type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific exam</SelectItem>
                      {smartSuggestions.exams.map((exam) => (
                        <SelectItem key={exam} value={exam}>
                          {exam}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="border-border text-foreground hover:bg-muted transition-all duration-300"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!studentData.educationLevel || !studentData.studyGoals}
                className="gradient-brand hover:opacity-90 transition-all duration-300"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Summary & Completion */}
        {step === 2 && (
          <Card className="p-8 bg-card border-border transition-all duration-300 hover:shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                You&apos;re all set!
              </h2>
              <p className="text-muted-foreground">
                Here&apos;s what we&apos;ve set up for your CheatPDF experience
              </p>
            </div>

            <div className="space-y-6 mb-8">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-4">Your Profile</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Type:</span>
                    <span className="font-medium text-foreground">Student</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Education Level:</span>
                    <span className="font-medium text-foreground">
                      {studentData.educationLevel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Primary Goal:</span>
                    <span className="font-medium text-foreground">
                      {studentData.studyGoals
                        ? STUDY_GOAL_LABELS[studentData.studyGoals]
                        : "Not specified"}
                    </span>
                  </div>
                  {studentData.subjects.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Focus Subjects:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {studentData.subjects.map((subject) => (
                          <Badge
                            key={subject}
                            variant="secondary"
                            className="bg-primary/10 text-primary border-primary/20"
                          >
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {studentData.examType && studentData.examType !== "none" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Upcoming Exam:</span>
                      <span className="font-medium text-foreground">
                        {studentData.examType}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-muted/50 border border-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-4">
                  Recommended Features
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <div className="font-medium text-foreground">Document Chat</div>
                      <div className="text-sm text-muted-foreground">
                        Ask questions about your study materials
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <div className="font-medium text-foreground">Practice Exams</div>
                      <div className="text-sm text-muted-foreground">
                        Generate quizzes from your documents
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <div className="font-medium text-foreground">Study Plans</div>
                      <div className="text-sm text-muted-foreground">
                        Personalized learning schedules
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <div className="font-medium text-foreground">Progress Tracking</div>
                      <div className="text-sm text-muted-foreground">
                        Monitor your learning progress
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="border-border text-foreground hover:bg-muted transition-all duration-300"
              >
                Back
              </Button>
              <Button
                onClick={completeOnboarding}
                disabled={isLoading}
                className="gradient-brand hover:opacity-90 transition-all duration-300"
              >
                {isLoading ? "Setting up your account..." : "Get Started with CheatPDF"}
                {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
