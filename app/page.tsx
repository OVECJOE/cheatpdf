import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Clock,
  Users,
  CheckCircle,
  Star,
  Zap,
  Shield,
  Globe,
} from "lucide-react";
import AppLogo from "@/components/app/logo";
import Image from "next/image";
import AppHeader from "@/components/app/header";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <AppHeader />

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 lg:space-y-8 order-2 lg:order-1">
              <div className="space-y-4">
                <Badge
                  variant="outline"
                  className="text-amber-600 border-amber-600 text-xs sm:text-sm"
                >
                  <Brain className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  AI-Powered Study Assistant
                </Badge>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Turn Your PDFs Into
                  <span className="bg-gradient-to-r from-amber-600 to-purple-600 bg-clip-text text-transparent">
                    {" "}
                    Smart Study Partners
                  </span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed">
                  Upload your study materials, practice with AI-generated exams,
                  and chat with your PDFs. CheatPDF helps students ace their
                  exams with personalized AI tutoring.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/sign-up" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-700 hover:to-purple-700 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg"
                  >
                    Start Studying for Free
                    <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg"
                >
                  Watch Demo
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-500">
                      <Image
                        src="https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0"
                        alt="Student profile"
                        width="100"
                        height="100"
                        className="rounded-full object-cover w-full h-full"
                      />
                    </div>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-500">
                      <Image
                        src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d"
                        alt="Student profile"
                        width="100"
                        height="100"
                        className="rounded-full object-cover w-full h-full"
                      />
                    </div>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-500">
                      <Image
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330"
                        alt="Student profile"
                        width="100"
                        height="100"
                        className="rounded-full object-cover w-full h-full"
                      />
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600">
                    10,000+ students trust CheatPDF
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current"
                    />
                  ))}
                  <span className="text-xs sm:text-sm text-gray-600 ml-1">
                    4.9/5 rating
                  </span>
                </div>
              </div>
            </div>

            <div className="relative order-1 lg:order-2">
              <Image
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f"
                alt="Students studying with technology"
                width={800}
                height={600}
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-12 sm:py-16 lg:py-20 px-4 bg-purple-50"
      >
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Why Students Love CheatPDF
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to study smarter, not harder. Turn any PDF
              into an interactive learning experience.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <Card className="p-4 sm:p-6 border-0 shadow-lg">
              <div className="space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">
                  AI Chat with PDFs
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Ask questions about your study materials and get instant,
                  accurate answers. It&apos;s like having a tutor available
                  24/7.
                </p>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 border-0 shadow-lg">
              <div className="space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">
                  Timed Practice Exams
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Generate realistic practice exams from your materials. Get
                  detailed explanations for wrong answers only after completion.
                </p>
                <Badge variant="secondary" className="text-xs">
                  Premium Feature
                </Badge>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 border-0 shadow-lg">
              <div className="space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">
                  Instant Summarization
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Get key points, summaries, and study guides generated
                  automatically from your uploaded documents.
                </p>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 border-0 shadow-lg">
              <div className="space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">
                  Multi-Language Support
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Study in your preferred language. CheatPDF adapts to your
                  location and language preferences automatically.
                </p>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 border-0 shadow-lg">
              <div className="space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">
                  Secure & Private
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Your study materials are encrypted and private. We never share
                  your documents or study data with anyone.
                </p>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 border-0 shadow-lg">
              <div className="space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">
                  For All Students
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Whether you&apos;re in high school, college, or professional
                  training - CheatPDF adapts to your learning level.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 sm:py-16 lg:py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Join thousands of students who are already studying smarter
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg sm:text-2xl font-bold text-white">
                  1
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">
                Upload Your PDFs
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Simply drag and drop your study materials, textbooks, or exam
                papers. We support all PDF formats.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg sm:text-2xl font-bold text-white">
                  2
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">
                Chat & Practice
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Ask questions, generate practice exams, or get summaries. Our AI
                understands your documents perfectly.
              </p>
            </div>

            <div className="text-center space-y-4 sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-pink-600 to-red-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg sm:text-2xl font-bold text-white">
                  3
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">
                Ace Your Exams
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Track your progress, identify weak areas, and study more
                effectively with personalized insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-12 sm:py-16 lg:py-20 px-4 bg-purple-50 scroll-smooth"
      >
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Simple, Student-Friendly Pricing
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Start free, upgrade when you need more power
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
            <Card className="p-6 sm:p-8 border-2 shadow-lg">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Free
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Perfect for getting started
                  </p>
                </div>
                <div className="space-y-2">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                    $0
                  </span>
                  <span className="text-sm sm:text-base text-gray-600">
                    /month
                  </span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm sm:text-base">
                      Chat with PDFs (unlimited)
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm sm:text-base">
                      Upload up to 3 documents
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm sm:text-base">
                      Basic summarization
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm sm:text-base">
                      Multi-language support
                    </span>
                  </li>
                </ul>
                <Link href="/auth/sign-up">
                  <Button variant="outline" className="w-full">
                    Start Free
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 sm:p-8 border-2 border-amber-600 shadow-lg relative">
              <Badge className="absolute -top-3 left-4 bg-amber-600 text-xs sm:text-sm">
                Most Popular
              </Badge>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Pro
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Everything you need to excel
                  </p>
                </div>
                <div className="space-y-2">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                    $5
                  </span>
                  <span className="text-sm sm:text-base text-gray-600">
                    /month
                  </span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm sm:text-base">
                      Everything in Free
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm sm:text-base">
                      Unlimited document uploads
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm sm:text-base">
                      Exam Mode with detailed explanations
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm sm:text-base">
                      Sourcer Mode (for professionals)
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm sm:text-base">
                      Priority support
                    </span>
                  </li>
                </ul>
                <Link href="/auth/sign-up">
                  <Button className="w-full bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-700 hover:to-purple-700">
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 bg-gradient-to-r to-purple-600 from-amber-600">
        <div className="container mx-auto text-center">
          <div className="space-y-6 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to Transform Your Study Experience?
            </h2>
            <p className="text-base sm:text-xl text-purple-100">
              Join thousands of students who are already studying smarter with
              CheatPDF. Start your free account today and see the difference AI
              can make.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/sign-up" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold bg-white text-purple-600 hover:bg-gray-100"
                >
                  Start Your Free Account
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg border-white font-semibold text-white hover:bg-white hover:text-amber-600"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 bg-gray-900 text-white">
        <div className="container mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="space-y-4 sm:col-span-2 lg:col-span-1">
              <AppLogo darkMode />
              <p className="text-sm sm:text-base text-gray-400">
                AI-powered study assistant that helps students learn more
                effectively with their PDF materials.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm sm:text-base">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li>
                  <a href="#features" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm sm:text-base">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li>
                  <a href="#" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm sm:text-base">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Status
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400">
            <p className="text-xs sm:text-sm">
              &copy; {new Date().getFullYear()} CheatPDF. All rights reserved.
              Built with ❤️ for students worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
