import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Brain,
  Clock,
  Zap,
  MessageCircle,
  FileText,
  Target,
  Shield,
  Users,
  CheckCircle,
  ArrowRight,
  Star,
  BookOpen,
  GraduationCap,
  Lightbulb,
} from "lucide-react";
import AppHeader from "@/components/app/header";

export const metadata: Metadata = {
  title: "Features - AI-Powered Study Tools & PDF Analysis",
  description: "Discover CheatPDF's powerful features: AI chat with PDFs, practice exam generation, document summarization, and smart study tools. Transform your learning experience.",
  keywords: [
    "AI PDF chat",
    "practice exam generator",
    "document summarization",
    "study tools",
    "AI tutor",
    "PDF analysis",
    "exam preparation",
    "study assistant",
    "document processing",
    "learning AI"
  ],
  openGraph: {
    title: "CheatPDF Features - AI-Powered Study Tools & PDF Analysis",
    description: "Discover CheatPDF's powerful features: AI chat with PDFs, practice exam generation, document summarization, and smart study tools.",
  },
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-surface-secondary to-surface-tertiary">
      <AppHeader />

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="w-full space-y-6 max-w-4xl mx-auto">
            <Badge variant="outline" className="text-primary border-primary text-sm">
              <Brain className="inline w-4 h-4 mr-1" />
              Advanced AI Features
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Powerful Features to
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {" "}Transform Your Learning
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              CheatPDF combines cutting-edge AI technology with intuitive design to create the ultimate study companion. 
              From document analysis to personalized practice tests, we&apos;ve got everything you need to excel.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/sign-up">
                <Button size="lg" className="gradient-brand hover:opacity-90 px-8 py-4 text-lg">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-12 sm:py-16 lg:py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* AI Chat with PDFs */}
            <Card className="p-6 sm:p-8 border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="space-y-6">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    AI Chat with PDFs
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                    Have natural conversations with your documents. Ask questions, get explanations, 
                    and dive deep into any topic with our advanced AI chat interface.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Instant answers to complex questions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Context-aware responses</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Multi-document conversations</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Practice Exam Generation */}
            <Card className="p-6 sm:p-8 border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="space-y-6">
                <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-7 h-7 text-secondary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    Practice Exam Generation
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                    Generate realistic practice exams from your study materials. 
                    Get detailed explanations and track your progress over time.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Timed exam simulations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Detailed answer explanations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Performance analytics</span>
                    </li>
                  </ul>
                  <Badge variant="secondary" className="mt-4">
                    Premium Feature
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Document Summarization */}
            <Card className="p-6 sm:p-8 border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="space-y-6">
                <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Zap className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    Smart Document Summarization
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                    Get instant summaries, key points, and study guides generated 
                    automatically from your uploaded documents.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">AI-powered summaries</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Key concept extraction</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Study guide generation</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Advanced Analytics */}
            <Card className="p-6 sm:p-8 border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="space-y-6">
                <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center">
                  <Target className="w-7 h-7 text-accent" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    Learning Analytics & Insights
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                    Track your study progress, identify knowledge gaps, and get 
                    personalized recommendations for improvement.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Progress tracking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Knowledge gap analysis</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Personalized study plans</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              From basic document reading to advanced AI-powered study tools, 
              CheatPDF has everything you need to excel in your studies.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <Card className="p-6 border-border bg-card shadow-lg hover:shadow-xl transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Multi-Format Support</h3>
                <p className="text-muted-foreground">
                  Upload PDFs up to 100MB. Support for more formats coming soon.
                </p>
              </div>
            </Card>

            <Card className="p-6 border-border bg-card shadow-lg hover:shadow-xl transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Secure & Private</h3>
                <p className="text-muted-foreground">
                  Your documents are encrypted and never shared. Complete privacy guaranteed.
                </p>
              </div>
            </Card>

            <Card className="p-6 border-border bg-card shadow-lg hover:shadow-xl transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Collaborative Learning</h3>
                <p className="text-muted-foreground">
                  Share study materials and collaborate with classmates (coming soon).
                </p>
              </div>
            </Card>

            <Card className="p-6 border-border bg-card shadow-lg hover:shadow-xl transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Study History</h3>
                <p className="text-muted-foreground">
                  Keep track of all your study sessions and review past conversations.
                </p>
              </div>
            </Card>

            <Card className="p-6 border-border bg-card shadow-lg hover:shadow-xl transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Academic Focus</h3>
                <p className="text-muted-foreground">
                  Designed specifically for students, researchers, and educators.
                </p>
              </div>
            </Card>

            <Card className="p-6 border-border bg-card shadow-lg hover:shadow-xl transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/30 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Smart Suggestions</h3>
                <p className="text-muted-foreground">
                  Get AI-powered study tips and learning recommendations.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Join thousands of students who are already using CheatPDF to study smarter and achieve better results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/sign-up">
                <Button size="lg" className="gradient-brand hover:opacity-90 px-8 py-4 text-lg">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                View Pricing
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="w-4 h-4 text- fill-primary" />
                ))}
                <span>4.9/5 rating</span>
              </div>
              <span>•</span>
              <span>10,000+ students</span>
              <span>•</span>
              <span>Free to start</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 