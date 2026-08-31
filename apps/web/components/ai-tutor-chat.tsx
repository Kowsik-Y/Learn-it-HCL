'use client';

import { Bot, MessageCircle, Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function AiTutorChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm your AI Tutor. Feel free to ask me any questions about the course material.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          toast.error('Could not recognize speech. Please try again.');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        return toast.error('Speech recognition is not supported in this browser.');
      }
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const speakText = (text: string) => {
    if (!isSpeakingEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const assistantMessage = data.message;

      setMessages((prev) => [...prev, assistantMessage]);
      speakText(assistantMessage.content);
    } catch (_error) {
      toast.error('AI Tutor is currently unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            size="lg"
            className="fixed bottom-6 right-6 rounded-full shadow-xl h-14 w-14 p-0 z-50 bg-primary hover:bg-primary/90"
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </Button>
        }
      />
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0 h-full border-l">
        <SheetHeader className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI Tutor
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSpeakingEnabled(!isSpeakingEnabled)}
              title={isSpeakingEnabled ? 'Disable Voice Output' : 'Enable Voice Output'}
              className={isSpeakingEnabled ? 'text-primary' : 'text-muted-foreground'}
            >
              {isSpeakingEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <Avatar className="h-8 w-8 mt-1 shrink-0">
                  {msg.role === 'user' ? (
                    <AvatarFallback className="bg-primary/10">U</AvatarFallback>
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  )}
                </Avatar>

                <div
                  className={`p-3 rounded-2xl text-sm prose dark:prose-invert max-w-none ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground prose-p:text-primary-foreground prose-a:text-primary-foreground prose-strong:text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 max-w-[80%]">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="p-3 rounded-2xl bg-muted flex items-center gap-1">
                  <span className="h-2 w-2 bg-foreground/40 rounded-full animate-bounce" />
                  <span className="h-2 w-2 bg-foreground/40 rounded-full animate-bounce delay-100" />
                  <span className="h-2 w-2 bg-foreground/40 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background mt-auto">
          <form onSubmit={handleSend} className="flex gap-2 items-center relative">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={`shrink-0 rounded-full ${isListening ? 'bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 border-red-200' : ''}`}
              onClick={toggleListening}
              title="Voice Input"
            >
              {isListening ? (
                <Mic className="h-4 w-4 animate-pulse" />
              ) : (
                <MicOff className="h-4 w-4" />
              )}
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 rounded-full px-4"
            />
            <Button
              type="submit"
              size="icon"
              className="shrink-0 rounded-full"
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
