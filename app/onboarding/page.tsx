"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { BookOpen, GraduationCap, Users, ArrowRight, CheckCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState("");
  const [studentData, setStudentData] = useState({
    educationLevel: "",
    subjects: [] as string[],
    studyGoals: "",
    examType: ""
  });
  const [loading, setLoading] = useState(false);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/sign-in");
    return null;
  }

  const handleUserTypeSelect = (type: string) => {
    setUserType(type);
    setStep(2);
  };

  const handleStudentDataChange = (field: string, value: string | string[]) => {
    setStudentData(prev => ({ ...prev, [field]: value }));
  };

  const completeOnboarding = async () => {
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

  const educationLevels = [
    "High School",
    "Undergraduate",
    "Graduate",
    "PhD",
    "Professional Certification",
    "Other"
  ];

  const subjectOptions = [
    "Mathematics", "Science", "History", "Literature", "Language Arts",
    "Computer Science", "Engineering", "Medicine", "Law", "Business",
    "Economics", "Psychology", "Chemistry", "Physics", "Biology", "Other"
  ];

  const examTypes = [
    "SAT/ACT", "AP Exams", "Final Exams", "Midterms", "Professional Certification",
    "Medical Boards", "Bar Exam", "CPA", "GRE/GMAT", "Other"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CheatPDF</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to CheatPDF, {session?.user?.name}!
          </h1>
          <p className="text-gray-600">Let&apos;s personalize your study experience</p>
        </div>

        {/* Progress indicator */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex items-center justify-between">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
            }`}>
              {step > 1 ? <CheckCircle className="w-5 h-5" /> : "1"}
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
            }`}>
              {step > 2 ? <CheckCircle className="w-5 h-5" /> : "2"}
            </div>
          </div>
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
                  onClick={() => handleUserTypeSelect("STUDENT")}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-left group"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                      <GraduationCap className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Student</h3>
                      <p className="text-sm text-gray-600">Study smarter with AI</p>
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
                  onClick={() => handleUserTypeSelect("TALENT_SOURCER")}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition-colors text-left group"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Talent Sourcer</h3>
                      <p className="text-sm text-gray-600">Find top talent efficiently</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Analyze candidate profiles</li>
                    <li>• Create sourcing strategies</li>
                    <li>• Automate outreach planning</li>
                    <li>• Track recruitment metrics</li>
                  </ul>
                  <Badge variant="secondary" className="mt-4">Premium Feature</Badge>
                </button>
              </div>
            </Card>
          )}

          {step === 2 && userType === "STUDENT" && (
            <Card className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Tell us about your studies
                </h2>
                <p className="text-gray-600">
                  Help us personalize your learning experience
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Education Level</Label>
                  <Select onValueChange={(value) => handleStudentDataChange("educationLevel", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your education level" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Primary Study Subjects</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {subjectOptions.map((subject) => (
                      <button
                        key={subject}
                        onClick={() => {
                          const current = studentData.subjects;
                          const newSubjects = current.includes(subject)
                            ? current.filter(s => s !== subject)
                            : [...current, subject];
                          handleStudentDataChange("subjects", newSubjects);
                        }}
                        className={`p-2 text-sm border rounded-lg transition-colors ${
                          studentData.subjects.includes(subject)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-200 hover:border-blue-600"
                        }`}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Upcoming Exam Type</Label>
                  <Select onValueChange={(value) => handleStudentDataChange("examType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="What exams are you preparing for?" />
                    </SelectTrigger>
                    <SelectContent>
                      {examTypes.map((exam) => (
                        <SelectItem key={exam} value={exam}>
                          {exam}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Study Goals</Label>
                  <Select onValueChange={(value) => handleStudentDataChange("studyGoals", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="What's your main study goal?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="improve-grades">Improve grades</SelectItem>
                      <SelectItem value="exam-prep">Exam preparation</SelectItem>
                      <SelectItem value="understand-concepts">Better understanding of concepts</SelectItem>
                      <SelectItem value="time-management">Better time management</SelectItem>
                      <SelectItem value="retention">Improve information retention</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    onClick={completeOnboarding} 
                    className="flex-1" 
                    disabled={!studentData.educationLevel || !studentData.studyGoals || loading}
                  >
                    {loading ? "Setting up..." : "Complete Setup"}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {step === 2 && userType === "TALENT_SOURCER" && (
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
                  <h3 className="font-semibold text-purple-900 mb-2">Premium Feature</h3>
                  <p className="text-sm text-purple-700 mb-4">
                    Sourcer mode is available with a Pro subscription ($5/month).
                    You&apos;ll be able to upload candidate profiles and get AI-powered sourcing strategies.
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
                      onClick={() => handleUserTypeSelect("student")}
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