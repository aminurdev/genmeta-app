import { getCurrentUser } from "@/services/auth-services";
import {
  SparklesIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  ArrowPathIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 bg-muted/20">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Transform Your Images with{" "}
            <span className="text-primary">AI Power</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Generate accurate metadata, enhance quality, and optimize your
            images using advanced AI technology. Start with 20 free tokens!
          </p>
          <div className="flex gap-4 justify-center">
            <RedirectUrl />
            {/* <Link
              href="/generate"
              className="px-8 py-3 bg-background text-primary rounded-lg border-2 border-primary hover:bg-accent transition-colors font-medium"
            >
              Try Demo
            </Link> */}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Powerful Features for Your Images
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="AI Metadata Generation"
              description="Automatically generate accurate and SEO-friendly metadata for your images using advanced AI technology."
              icon={SparklesIcon}
            />
            <FeatureCard
              title="Batch Processing"
              description="Process multiple images simultaneously with our efficient batch processing system. Save time and effort."
              icon={ArrowPathIcon}
            />
            <FeatureCard
              title="Smart Analysis"
              description="Get detailed technical analysis, EXIF data extraction, and content insights for each processed image."
              icon={CpuChipIcon}
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20  bg-muted/20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Why Choose Our Platform
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <BenefitCard
              icon={ShieldCheckIcon}
              title="Secure"
              description="Your images and data are protected with enterprise-grade security"
            />
            <BenefitCard
              icon={CloudArrowUpIcon}
              title="Cloud-Based"
              description="Access your processed images and metadata from anywhere"
            />
            <BenefitCard
              icon={DocumentTextIcon}
              title="Export Options"
              description="Download results in multiple formats (CSV, ZIP)"
            />
            <BenefitCard
              icon={UserGroupIcon}
              title="User-Friendly"
              description="Intuitive interface designed for all skill levels"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <StepCard
              number="1"
              title="Sign Up"
              description="Create your account and get 20 free tokens"
            />
            <StepCard
              number="2"
              title="Upload"
              description="Upload your images individually or in batch"
            />
            <StepCard
              number="3"
              title="Process"
              description="Let our AI analyze and enhance your images"
            />
            <StepCard
              number="4"
              title="Download"
              description="Get your processed images with metadata"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-6 text-foreground">
            Ready to Transform Your Images?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users who are already enhancing their images with
            our AI-powered platform.
          </p>
          <Link
            href="/signup"
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium inline-block"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="p-6 bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
      <Icon className="w-12 h-12 text-primary mb-4" />
      <h3 className="text-xl font-semibold mb-2 text-card-foreground">
        {title}
      </h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function BenefitCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-block p-3 bg-accent rounded-full mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

const RedirectUrl = async () => {
  const user = await getCurrentUser();

  return (
    <Link
      href={user ? "generate" : "/signup"}
      className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
    >
      Get Started Free
    </Link>
  );
};

import React from "react";

export const Footer = () => {
  return (
    <footer className="bg-background text-card-foreground py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4 w-52">
              {" "}
              <Link href="/">
                <Image
                  src={"/Assets/SVG/Asset 5.svg"}
                  className=" h-16 py-2 w-auto"
                  alt="logo"
                  width={128}
                  height={128}
                />
              </Link>
            </div>
            <p className="text-muted-foreground text-sm">
              Transform your images with advanced AI technology and
              professional-grade tools.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/generate" className="hover:text-card-foreground">
                  Generate
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-card-foreground">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-card-foreground">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:text-card-foreground">
                  Terms & Condition
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-card-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-card-foreground">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                {" "}
                <a
                  href="mailto:helpgenmeta@gmail.com"
                  className="text-blue-600 hover:underline"
                >
                  helpgenmeta@gmail.com
                </a>
              </li>
              <li>Nilphamari, Rangpur, Bangladesh</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} GenMeta. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
