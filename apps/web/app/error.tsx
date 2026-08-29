"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertOctagon, RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-background via-destructive/5 to-background overflow-hidden relative">
      
      <div className="text-center space-y-8 animate-in duration-500 fade-in max-w-lg px-6 relative z-10">
        <div className="relative inline-block group mx-auto">
          <div className="relative bg-background border border-destructive/20 rounded-full p-8 flex items-center justify-center">
            <AlertOctagon className="h-20 w-20 text-destructive animate-in spin-in-12 duration-1000" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            An unexpected error occurred while processing your request. Our engineering team has been notified.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg text-left overflow-auto border border-border/50 shadow-inner max-h-50">
              <p className="text-sm font-mono text-destructive font-semibold mb-2">Error Details (Dev Only):</p>
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap wrap-break-word">
                {error.message || "Unknown error"}
              </pre>
            </div>
          )}
        </div>

        <div className="pt-6">
          <Button 
            onClick={() => reset()} 
            size="lg" 
            className="gap-2 font-bold h-12 px-8 rounded-full bg-destructive text-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20"
          >
            <RotateCcw className="h-5 w-5" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
