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
  BookOpen,
  GraduationCap,
  Users,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserType } from "@prisma/client";
import clsx from "clsx";

// Types
type EducationLevel =
  | "High School"
  | "Undergraduate"
  | "Graduate"
  | "PhD"
  | "Professional"
  | "Other";
type SubjectCategory =
  | "STEM"
  | "Liberal Arts"
  | "Social Sciences"
  | "Professional"
  | "Applied";
type ExamCategory =
  | "standardized"
  | "academic"
  | "professional"
  | "international";
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

interface SubjectConfig {
  category: SubjectCategory;
  relatedExams: readonly string[];
  suggestedGoals: readonly StudyGoal[];
}

interface ExamConfig {
  category: ExamCategory;
  difficulty: number;
  timeframe: "short" | "medium" | "long";
  subjects: readonly string[];
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
      "retention",
      "time-management",
      "improve-grades",
    ],
    description: "Flexible learning path",
  },
};

const SUBJECT_CONFIGS: Record<string, SubjectConfig> = {
  Mathematics: {
    category: "STEM",
    relatedExams: ["SAT/ACT", "GRE/GMAT", "AP Exams"],
    suggestedGoals: ["problem-solving", "understand-concepts"],
  },
  "Computer Science": {
    category: "STEM",
    relatedExams: ["Technical Interviews", "Certification Exams"],
    suggestedGoals: ["problem-solving", "career-prep"],
  },
  Engineering: {
    category: "STEM",
    relatedExams: ["PE Exam", "FE Exam"],
    suggestedGoals: ["problem-solving", "career-prep"],
  },
  Medicine: {
    category: "Professional",
    relatedExams: ["Medical Boards", "MCAT"],
    suggestedGoals: ["exam-prep", "retention"],
  },
  Law: {
    category: "Professional",
    relatedExams: ["Bar Exam", "LSAT"],
    suggestedGoals: ["exam-prep", "understand-concepts"],
  },
  Business: {
    category: "Professional",
    relatedExams: ["CPA", "MBA Exams"],
    suggestedGoals: ["career-prep", "understand-concepts"],
  },
  History: {
    category: "Liberal Arts",
    relatedExams: ["AP History", "Comprehensive Exams"],
    suggestedGoals: ["retention", "understand-concepts"],
  },
  Literature: {
    category: "Liberal Arts",
    relatedExams: ["AP Literature", "Comprehensive Exams"],
    suggestedGoals: ["understand-concepts", "retention"],
  },
  Psychology: {
    category: "Social Sciences",
    relatedExams: ["Psychology Boards", "Research Defense"],
    suggestedGoals: ["research-skills", "understand-concepts"],
  },
  Economics: {
    category: "Social Sciences",
    relatedExams: ["Economics Comprehensive", "Professional Certification"],
    suggestedGoals: ["problem-solving", "understand-concepts"],
  },
};

const EXAM_CONFIGS: Record<string, ExamConfig> = {
  "SAT/ACT": {
    category: "standardized",
    difficulty: 3,
    timeframe: "medium",
    subjects: ["Mathematics", "Language Arts", "Science"],
  },
  "GRE/GMAT": {
    category: "standardized",
    difficulty: 4,
    timeframe: "long",
    subjects: ["Mathematics", "Language Arts", "Logic"],
  },
  "AP Exams": {
    category: "academic",
    difficulty: 3,
    timeframe: "medium",
    subjects: ["Subject-Specific"],
  },
  "Medical Boards": {
    category: "professional",
    difficulty: 5,
    timeframe: "long",
    subjects: ["Medicine", "Clinical Skills"],
  },
  "Bar Exam": {
    category: "professional",
    difficulty: 5,
    timeframe: "long",
    subjects: ["Law", "Legal Practice"],
  },
  "Final Exams": {
    category: "academic",
    difficulty: 2,
    timeframe: "short",
    subjects: ["Course-Specific"],
  },
  Midterms: {
    category: "academic",
    difficulty: 2,
    timeframe: "short",
    subjects: ["Course-Specific"],
  },
};

const GOAL_CONFIGS: Record<
  StudyGoal,
  { label: string; priority: number; description: string }
> = {
  "improve-grades": {
    label: "Improve grades",
    priority: 1,
    description: "Boost your academic performance",
  },
  "exam-prep": {
    label: "Exam preparation",
    priority: 2,
    description: "Ace your upcoming tests",
  },
  "understand-concepts": {
    label: "Better understanding",
    priority: 3,
    description: "Deepen your knowledge",
  },
  "time-management": {
    label: "Time management",
    priority: 4,
    description: "Study more efficiently",
  },
  retention: {
    label: "Information retention",
    priority: 5,
    description: "Remember what you learn",
  },
  "problem-solving": {
    label: "Problem-solving skills",
    priority: 6,
    description: "Tackle complex challenges",
  },
  "research-skills": {
    label: "Research methodology",
    priority: 7,
    description: "Develop research capabilities",
  },
  "career-prep": {
    label: "Career preparation",
    priority: 8,
    description: "Prepare for your profession",
  },
};

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [userType, setUserType] = useState<UserType>();
  const [studentData, setStudentData] = useState<StudentData>({
    educationLevel: "",
    subjects: [],
    studyGoals: "",
    examType: "",
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Smart computed values based on user selections
  const availableSubjects = useMemo((): string[] => {
    if (!studentData.educationLevel) return [];

    const config = EDUCATION_CONFIGS[studentData.educationLevel];
    const baseSubjects = [...config.subjects];

    // Add subjects from other categories if user has shown interest
    if (studentData.subjects.length > 0) {
      const userCategories = new Set(
        studentData.subjects
          .map((subject) => SUBJECT_CONFIGS[subject]?.category)
          .filter(Boolean)
      );

      // Add related subjects from same categories
      Object.entries(SUBJECT_CONFIGS).forEach(([subject, subjectConfig]) => {
        if (
          userCategories.has(subjectConfig.category) &&
          !baseSubjects.includes(subject)
        ) {
          baseSubjects.push(subject);
        }
      });
    }

    return Array.from(new Set(baseSubjects)).sort();
  }, [studentData.educationLevel, studentData.subjects]);

  const availableExams = useMemo((): string[] => {
    if (!studentData.educationLevel) return [];

    const config = EDUCATION_CONFIGS[studentData.educationLevel];
    const baseExams = [...config.exams];

    // Add exams related to selected subjects
    studentData.subjects.forEach((subject) => {
      const subjectConfig = SUBJECT_CONFIGS[subject];
      if (subjectConfig) {
        baseExams.push(...subjectConfig.relatedExams);
      }
    });

    return Array.from(new Set(baseExams)).sort();
  }, [studentData.educationLevel, studentData.subjects]);

  const availableGoals = useMemo((): Array<{
    value: StudyGoal;
    label: string;
    description: string;
    priority: number;
  }> => {
    if (!studentData.educationLevel) return [];

    const config = EDUCATION_CONFIGS[studentData.educationLevel];
    const goalSet = new Set(config.goals);

    // Add goals based on selected subjects
    studentData.subjects.forEach((subject) => {
      const subjectConfig = SUBJECT_CONFIGS[subject];
      if (subjectConfig) {
        subjectConfig.suggestedGoals.forEach((goal) => goalSet.add(goal));
      }
    });

    // Prioritize exam prep if exam is selected
    if (studentData.examType && studentData.examType !== "") {
      goalSet.add("exam-prep");
    }

    return Array.from(goalSet)
      .map((goal) => ({
        value: goal,
        label: GOAL_CONFIGS[goal].label,
        description: GOAL_CONFIGS[goal].description,
        priority: GOAL_CONFIGS[goal].priority,
      }))
      .sort((a, b) => a.priority - b.priority);
  }, [studentData.educationLevel, studentData.subjects, studentData.examType]);

  const contextualizedExamLabel = useMemo((): string => {
    if (!studentData.examType) return "What exams are you preparing for?";

    const examConfig = EXAM_CONFIGS[studentData.examType];
    if (!examConfig) return "What exams are you preparing for?";

    const timeframeText =
      examConfig.timeframe === "short"
        ? "soon"
        : examConfig.timeframe === "medium"
          ? "this semester"
          : "this year";
    return `Preparing for ${studentData.examType} ${timeframeText}?`;
  }, [studentData.examType]);

  const smartSubjectGroups = useMemo((): Array<{
    category: string;
    subjects: string[];
  }> => {
    const groups: Record<string, string[]> = {};

    availableSubjects.forEach((subject) => {
      const config = SUBJECT_CONFIGS[subject];
      const category = config?.category || "Other";

      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(subject);
    });

    return Object.entries(groups)
      .map(([category, subjects]) => ({ category, subjects: subjects.sort() }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [availableSubjects]);

  const completionProgress = useMemo((): number => {
    const fields = [
      studentData.educationLevel,
      studentData.subjects.length > 0,
      studentData.studyGoals,
      studentData.examType,
    ];
    return (fields.filter(Boolean).length / fields.length) * 100;
  }, [studentData]);

  const isFormValid = useMemo((): boolean => {
    return !!(
      studentData.educationLevel &&
      studentData.subjects.length > 0 &&
      studentData.studyGoals
    );
  }, [studentData]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/sign-in");
    return null;
  }

  const handleUserTypeSelect = (type: UserType): void => {
    setUserType(type);
    setStep(2);
  };

  const handleStudentDataChange = (
    field: keyof StudentData,
    value: string | string[]
  ): void => {
    setStudentData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubjectToggle = (subject: string): void => {
    const current = studentData.subjects;
    const newSubjects = current.includes(subject)
      ? current.filter((s) => s !== subject)
      : [...current, subject];
    handleStudentDataChange("subjects", newSubjects);
  };

  const completeOnboarding = async (): Promise<void> => {
    setLoading(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userType,
          ...studentData,
        }),
      });

      if (response.ok) {
        router.push("/dashboard");
      } else {
        console.error("Onboarding failed");
      }
    } catch (error) {
      console.error("Onboarding error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-amber-600 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CheatPDF</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to CheatPDF, {session?.user?.name}!
          </h1>
          <p className="text-gray-600">
            Let&apos;s personalize your study experience
          </p>
        </div>

        {/* Progress indicator */}
        <div className="max-w-md mx-auto my-8">
          <div className="flex items-center justify-between">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1
                  ? "bg-amber-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {step > 1 ? <CheckCircle className="w-5 h-5" /> : "1"}
            </div>
            <div
              className={`flex-1 h-1 mx-2 ${step >= 2 ? "bg-amber-600" : "bg-gray-200"}`}
            />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2
                  ? "bg-amber-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {step > 2 ? <CheckCircle className="w-5 h-5" /> : "2"}
            </div>
          </div>
          {step === 2 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Setup Progress</span>
                <span>{Math.round(completionProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div
                  className="bg-amber-600 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${completionProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="max-w-2xl mx-auto">
          {step === 1 && (
            <Card className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  What brings you to CheatPDF?
                </h2>
                <p className="text-gray-600">
                  Choose your primary use case to get personalized features
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <button
                  onClick={() => handleUserTypeSelect(UserType.STUDENT)}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-amber-600 hover:bg-amber-50 transition-colors text-left group"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                      <GraduationCap className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Student
                      </h3>
                      <p className="text-sm text-gray-600">
                        Study smarter with AI
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Chat with your study materials</li>
                    <li>• Generate practice exams</li>
                    <li>• Get instant explanations</li>
                    <li>• Track your progress</li>
                  </ul>
                  <Badge className="mt-4">Most Popular</Badge>
                </button>

                <button
                  onClick={() => handleUserTypeSelect(UserType.TALENT_SOURCER)}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition-colors text-left group"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Talent Sourcer
                      </h3>
                      <p className="text-sm text-gray-600">
                        Find top talent efficiently
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Analyze candidate profiles</li>
                    <li>• Create sourcing strategies</li>
                    <li>• Automate outreach planning</li>
                    <li>• Track recruitment metrics</li>
                  </ul>
                  <Badge variant="secondary" className="mt-4">
                    Premium Feature
                  </Badge>
                </button>
              </div>
            </Card>
          )}

          {step === 2 && userType === UserType.STUDENT && (
            <Card className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Tell us about your studies
                </h2>
                <p className="text-gray-600">
                  {studentData.educationLevel
                    ? EDUCATION_CONFIGS[studentData.educationLevel].description
                    : "Help us personalize your learning experience"}
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Education Level</Label>
                  <Select
                    onValueChange={(value: EducationLevel) =>
                      handleStudentDataChange("educationLevel", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your education level" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EDUCATION_CONFIGS).map(
                        ([level, config]) => (
                          <SelectItem key={level} value={level}>
                            <div className="flex flex-col items-start">
                              <span>{level}</span>
                              <span className="text-xs text-gray-500">
                                {config.description}
                              </span>
                            </div>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {studentData.educationLevel && (
                  <div className="space-y-2">
                    <Label>Primary Study Subjects</Label>
                    <p className="text-xs text-gray-500 mb-3">
                      Select subjects relevant to your{" "}
                      {studentData.educationLevel.toLowerCase()} studies
                    </p>
                    {smartSubjectGroups.map((group) => (
                      <div key={group.category} className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">
                          {group.category}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {group.subjects.map((subject) => (
                            <button
                              key={subject}
                              onClick={() => handleSubjectToggle(subject)}
                              className={clsx(
                                "p-2 text-sm border rounded-lg transition-colors bg-white text-gray-700",
                                studentData.subjects.includes(subject)
                                  ? "border-purple-600 text-purple-600 font-medium"
                                  : "border-amber-100 hover:border-amber-200"
                              )}
                            >
                              {subject}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {availableExams.length > 0 && (
                  <div className="space-y-2">
                    <Label>Upcoming Exam Type (Optional)</Label>
                    <Select
                      onValueChange={(value: string) =>
                        handleStudentDataChange("examType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={contextualizedExamLabel} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableExams.map((exam) => (
                          <SelectItem key={exam} value={exam}>
                            <div className="flex flex-col items-start">
                              <span>{exam}</span>
                              {EXAM_CONFIGS[exam] && (
                                <span className="text-xs text-gray-500">
                                  {EXAM_CONFIGS[exam].timeframe} term •{" "}
                                  {EXAM_CONFIGS[exam].category}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {availableGoals.length > 0 && (
                  <div className="space-y-2">
                    <Label>Primary Study Goal</Label>
                    <Select
                      onValueChange={(value: StudyGoal) =>
                        handleStudentDataChange("studyGoals", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="What's your main study goal?" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableGoals.map((goal) => (
                          <SelectItem key={goal.value} value={goal.value}>
                            <div className="flex flex-col items-start">
                              <span>{goal.label}</span>
                              <span className="text-xs text-gray-500">
                                {goal.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={completeOnboarding}
                    className="flex-1"
                    disabled={!isFormValid || loading}
                  >
                    {loading ? "Setting up..." : "Complete Setup"}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {step === 2 && userType === UserType.TALENT_SOURCER && (
            <Card className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Talent Sourcer Setup
                </h2>
                <p className="text-gray-600">
                  Configure your recruitment preferences
                </p>
              </div>

              <div className="space-y-6">
                <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                  <h3 className="font-semibold text-purple-900 mb-2">
                    Premium Feature
                  </h3>
                  <p className="text-sm text-purple-700 mb-4">
                    Sourcer mode is available with a Pro subscription
                    ($5/month). You&apos;ll be able to upload candidate profiles
                    and get AI-powered sourcing strategies.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => router.push("/dashboard?upgrade=true")}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Upgrade to Pro
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUserTypeSelect(UserType.STUDENT)}
                    >
                      Use Student Mode Instead
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
