"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain,
  Send,
  User,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Code2,
  RefreshCcw
} from "lucide-react";

interface Message {
  role: "assistant" | "user";
  content: string;
}

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome to the AI Educational Tutor! I'm here to explain concepts, guide code reasoning through scaffolding hints, and answer your questions. What are you currently studying?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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
      const res = (await api.tutorChat(
        newMessages.map((m) => ({ role: m.role, content: m.content }))
      )) as any;

      const assistantMsg: Message = {
        role: "assistant",
        content: res.message?.content || "I can help explain that concept step by step!",
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I ran into a temporary error. Could you repeat your question?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    setInput(q);
  };

  return (
    <main className="max-w-4xl w-full mx-auto p-4 flex-1 flex flex-col my-4 min-h-[80vh]">
      <Card className="flex-1 flex flex-col overflow-hidden border-primary/20">
        <CardHeader className="border-b border-border pb-4 bg-muted/30">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" /> Educational Scaffolding Tutor
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Guided hints → Worked examples → Explanations
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                setMessages([
                  {
                    role: "assistant",
                    content:
                      "Welcome to the AI Educational Tutor! I'm here to explain concepts, guide code reasoning through scaffolding hints, and answer your questions. What are you currently studying?",
                  },
                ])
              }
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Clear
            </Button>
          </div>
        </CardHeader>

        {/* Quick Prompts */}
        <div className="px-6 py-3 border-b border-border/60 bg-card flex flex-wrap gap-2 text-xs">
          <span className="text-muted-foreground self-center font-medium">Quick Prompts:</span>
          <Button
            variant="secondary"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => handleQuickQuestion("Explain Python list comprehensions with an example")}
          >
            <Code2 className="h-3 w-3" /> List Comprehensions
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => handleQuickQuestion("How do REST APIs use HTTP methods?")}
          >
            <Lightbulb className="h-3 w-3" /> REST API Methods
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => handleQuickQuestion("Give me a hint for solving a binary search algorithm")}
          >
            <HelpCircle className="h-3 w-3" /> Binary Search Hint
          </Button>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-6">
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
                      ? "bg-card border border-border text-card-foreground rounded-tl-sm shadow-xs"
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

        {/* Input Form */}
        <CardFooter className="p-4 border-t border-border bg-card">
          <form onSubmit={handleSend} className="flex gap-3 w-full items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question or request a hint..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={!input.trim() || loading} className="gap-2 font-bold">
              <Send className="h-4 w-4" /> Send
            </Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  );
}
