"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Mail,
  MessageCircle,
  Send,
  Clock,
  ArrowRight,
  DollarSign,
  BookOpen,
  Loader2,
} from "lucide-react";
import AppHeader from "@/components/app/header";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ContactPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // Open up their email client with the subject and body pre-filled
    const formData = new FormData(e.target as HTMLFormElement);
    const { firstName, lastName, subject, message } = Object.fromEntries(formData);

    const emailBody = `
      Dear CheatPDF Team,

      I am ${firstName}, a customer of CheatPDF, and I have an inquiry to make.

      ${message}

      Thank you, in anticipation, for your time and help.

      Best regards,
      ${firstName} ${lastName}
    `;
    const emailSubject = `[CheatPDF Inquiry] ${subject}`;
    const emailLink = `mailto:info@cheatpdf.live?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(emailLink, '_blank');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-surface-secondary to-surface-tertiary">
      <AppHeader />

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="space-y-6 max-w-4xl mx-auto">
            <Badge variant="outline" className="text-primary border-primary text-sm">
              <MessageCircle className="inline w-4 h-4 mr-1" />
              Get in Touch
            </Badge>
            <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                We&apos;re Here to
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {" "}Help You Succeed
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                Have questions about CheatPDF? Need help with your study tools? 
                Want to share feedback? We&apos;d love to hear from you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="p-6 sm:p-8 border-border bg-card shadow-lg">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                    Send us a Message
                  </h2>
                  <p className="text-muted-foreground">
                    Fill out the form below and we&apos;ll get back to you within 24 hours.
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                        First Name
                      </label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                        Last Name
                      </label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      type="text"
                      placeholder="How can we help?"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your question or feedback..."
                      className="w-full min-h-[120px]"
                    />
                  </div>

                  <Button type="submit" className="w-full gradient-brand hover:opacity-90" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <div className="space-y-2 mb-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Get in Touch
                </h2>
                <p className="text-lg text-muted-foreground">
                  We&apos;re committed to providing excellent support to help you make the most of CheatPDF.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Email Support</h3>
                    <p className="text-muted-foreground mb-2">info@cheatpdf.live</p>
                    <p className="text-sm text-muted-foreground">
                      Get help with technical issues, account questions, and general support.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Live Chat</h3>
                    <p className="text-muted-foreground mb-2">Available 24/7</p>
                    <p className="text-sm text-muted-foreground">
                      Chat with our support team for instant help and guidance.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-amber/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-brand-amber" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Response Time</h3>
                    <p className="text-muted-foreground mb-2">Within 24 hours</p>
                    <p className="text-sm text-muted-foreground">
                      We typically respond to all inquiries within one business day.
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ Quick Links */}
              <Card className="p-6 border-border bg-card">
                <h3 className="font-semibold text-foreground mb-4">Quick Help</h3>
                <div className="space-y-3">
                  {/* <Link href="/help" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <CheckCircle className="w-4 h-4" />
                    <span>Help Center & FAQ</span>
                  </Link> */}
                  <Link href="/features" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <BookOpen className="w-4 h-4" />
                    <span>Feature Guide</span>
                  </Link>
                  <Link href="/#pricing" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <DollarSign className="w-4 h-4" />
                    <span>Pricing Information</span>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Ready to Get Started?
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground">
                Join thousands of students who are already using CheatPDF to transform their learning experience.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/sign-up">
                <Button size="lg" className="gradient-brand hover:opacity-90 px-8 py-4 text-lg">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg" onClick={() => {
                router.push("/features");
              }}>
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}