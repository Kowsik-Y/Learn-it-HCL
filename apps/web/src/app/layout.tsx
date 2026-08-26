import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Learn-it HCL — AI-Powered Personalized Learning",
  description:
    "Adaptive learning platform that understands you, identifies what you need to learn, and guides you with intelligent recommendations, gamification, and AI tutoring.",
  keywords: [
    "learning platform",
    "AI tutor",
    "personalized learning",
    "adaptive education",
    "skill development",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
