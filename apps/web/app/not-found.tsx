'use client';

import { ArrowLeft, Ghost, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-background via-muted/30 to-background overflow-hidden relative">
      {/* Background visual effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-[800px] bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse duration-3000" />
      <div className="absolute top-1/3 left-1/4 w-75 h-75 bg-accent/10 rounded-full blur-[80px] -z-10 mix-blend-multiply" />

      <div className="text-center space-y-8 animate-in duration-700 fade-in relative z-10">
        <div className="relative inline-block group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
          <div className="relative bg-background ring-1 ring-border/50 rounded-full p-8 flex items-center justify-center">
            <Ghost
              className="h-24 w-24 text-primary shadow-primary/20 drop-shadow-xl"
              strokeWidth={1.5}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-8xl md:text-9xl font-extrabold  er bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-3xl font-bold  ">Page Not Found</h2>
          <p className="text-muted-foreground text-lg max-w-[500px] mx-auto leading-relaxed px-4">
            Oops! It seems you&apos;ve ventured into uncharted territory. The page you&apos;re
            looking for has vanished into the digital void.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 px-4">
          <Link href="/" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full gap-2 font-bold h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-full transition-all"
            >
              <Home className="h-5 w-5" />
              Return Home
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.back()}
            className="w-full sm:w-auto gap-2 font-bold h-12 px-8 rounded-full shadow-sm hover:bg-muted/50 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </Button>
        </div>
      </div>

      <div className="absolute bottom-8 text-sm text-muted-foreground/60 font-medium tracking-widest uppercase">
        Error Code: 404_NOT_FOUND
      </div>
    </div>
  );
}
