"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Brain, Send, User, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface Message {
  role: "assistant" | "user";
  content: string;
}

export default function OnboardingPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your Learn-it AI Guide. I'm here to help set up your personalized learning path. What are your main career or learning goals?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // @ts-ignore
      const res = await api.onboardingChat(newMessages) as any;
      
      const assistantMessage: Message = {
        role: "assistant",
        content: res.message?.content || res.message || "I didn't get that. Could you repeat?",
      };
      
      setMessages((prev) => [...prev, assistantMessage]);

      if (res.type === "extraction" || res.is_complete) {
        setIsComplete(true);
        setExtractedData(res.data || res.extracted_data);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error. Could you try saying that again?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const progress = Math.min((messages.length / 8) * 100, 100);

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full border-primary/20 bg-linear-to-b from-card to-primary/5">
          <CardContent className="pt-10 pb-8 px-8 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-success/20 text-success rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            
            <h2 className="text-2xl font-bold mb-3">Profile Complete!</h2>
            <p className="text-muted-foreground mb-8">
              I've built your learning profile based on our chat. We're ready to start your journey.
            </p>

            <div className="w-full bg-card border border-border rounded-lg p-4 mb-8 text-left space-y-3">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Goal</span>
                <div className="font-medium">{extractedData?.goal || "Learn new skills"}</div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Known Skills</span>
                <div className="font-medium text-sm">
                  {extractedData?.known_skills?.length ? extractedData.known_skills.join(", ") : "None yet"}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Target Role</span>
                <div className="font-medium">{extractedData?.target_role || "Not specified"}</div>
              </div>
            </div>

            <Link href="/dashboard" className="w-full">
              <Button size="lg" className="w-full gap-2">
                Go to Dashboard <Sparkles className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background max-w-3xl mx-auto border-x border-border">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">AI Guide</h1>
            <p className="text-xs text-muted-foreground">Profile Setup</p>
          </div>
        </div>
        <div className="w-32 flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </header>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="flex flex-col gap-6 pb-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-4 ${
                msg.role === "assistant" ? "flex-row" : "flex-row-reverse"
              }`}
            >
              <Avatar className={`h-8 w-8 ${msg.role === "assistant" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                <AvatarFallback>
                  {msg.role === "assistant" ? <Brain className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${
                  msg.role === "assistant"
                    ? "bg-card border border-border text-card-foreground rounded-tl-sm"
                    : "bg-primary text-primary-foreground rounded-tr-sm"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-4">
              <Avatar className="h-8 w-8 bg-primary/20 text-primary">
                <AvatarFallback><Brain className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" />
                <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:0.2s]" />
                <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-background border-t border-border">
        <form
          onSubmit={handleSend}
          className="flex gap-3 max-w-3xl mx-auto relative items-end"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
            disabled={loading}
            className="flex-1 min-h-13 rounded-xl pr-14"
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || loading}
            size="icon"
            className="absolute right-2 bottom-1.5 h-10 w-10 rounded-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground mt-3">
          The AI will automatically finish setup when it has enough info.
        </p>
      </div>
    </div>
  );
}
