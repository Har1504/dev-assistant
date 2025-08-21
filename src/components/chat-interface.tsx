"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hello! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch("http://localhost:3001/api/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      const aiMessage: Message = { role: "ai", content: data.message };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error fetching from MCP server:", error);
      const errorMessage: Message = {
        role: "ai",
        content: "Sorry, I'm having trouble connecting to the server.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-background">
      <Card className="w-[800px] h-[90vh] grid grid-rows-[auto_1fr_auto]">
        <CardHeader>
          <CardTitle>Developer AI Assistant</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-full w-full pr-4">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-4 ${
                    msg.role === "user" ? "justify-end" : ""
                  }`}
                >
                  {msg.role === "ai" && (
                    <div className="rounded-full bg-primary text-primary-foreground w-8 h-8 flex items-center justify-center">
                      AI
                    </div>
                  )}
                  <div
                    className={`p-4 rounded-lg max-w-[75%] ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p>{msg.content}</p>
                  </div>
                  {msg.role === "user" && (
                    <div className="rounded-full bg-secondary text-secondary-foreground w-8 h-8 flex items-center justify-center">
                      You
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="Type your message here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button type="submit">Send</Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
