"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Bot, User, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hello! How can I help you develop today?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Add a placeholder for the AI's response
    setMessages((prev) => [...prev, { role: "ai", content: "" }]);

    try {
      const response = await fetch("http://localhost:3001/api/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: true });
        
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage.role === "ai") {
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, content: lastMessage.content + chunk },
            ];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Error fetching from MCP server:", error);
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.role === "ai") {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, content: "Sorry, I'm having trouble connecting to the server." },
          ];
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-800 text-white">
      <header className="bg-gray-900 p-4 shadow-md w-full">
        <h1 className="text-xl font-bold text-center">Developer AI Assistant</h1>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-4 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "ai" && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                  <Bot size={24} />
                </div>
              )}
              <div
                className={`p-4 rounded-lg max-w-2xl prose prose-invert ${msg.role === "user" ? "bg-blue-600" : "bg-gray-700"}`}
              >
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
              {msg.role === "user" && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                  <User size={24} />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                <Bot size={24} />
              </div>
              <div className="p-4 rounded-lg bg-gray-700">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="p-4 bg-gray-900 w-full">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-center space-x-4">
            <Input
              type="text"
              placeholder="Type your message here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-gray-700 border-gray-600 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-lg p-2" disabled={isLoading}>
              <Send size={24} />
            </Button>
          </form>
        </div>
      </footer>
    </div>
  );
}
