"use client"

import { useState } from "react";
import PromptSuggestionRow from "./components/PromptSuggestionRow";
import LoadingBubble from "./components/LoadingBubble";
import Bubble from "./components/Bubble";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const noMessages = messages.length === 0;

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: content.trim(),
      role: "user",
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        content: data.message,
        role: "assistant",
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        content: "Sorry, I encountered an error while processing your request. Please try again.",
        role: "assistant",
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const onPromptClick = (promptText: string) => {
    sendMessage(promptText);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">MEDIC</h1>
          <p className="text-gray-600">Your AI Medical Assistant</p>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-xl shadow-lg min-h-[500px] flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto max-h-[600px]">
            {noMessages ? (
              <div className="text-center py-12">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    Welcome to MEDIC
                  </h2>
                  <p className="text-gray-600 mb-8">
                    The ultimate platform for medical advice. Get reliable, evidence-based health information.
                  </p>
                </div>
                <PromptSuggestionRow onClickHandler={onPromptClick} />
              </div>
            ) : (
              <div className="space-y-4 mb-4">
                {messages.map((message) => (
                  <Bubble key={message.id} message={message} />
                ))}
                {isLoading && <LoadingBubble />}
              </div>
            )}
          </div>

          {/* Input Form */}
          <div className="border-t bg-gray-50 p-4 rounded-b-xl">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ask me about medical topics..." 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Disclaimer:</strong> This AI assistant provides general medical information for educational purposes only. 
            Always consult with qualified healthcare professionals for personal medical advice, diagnosis, or treatment.
          </p>
        </div>
      </div>
    </main>
  )
}