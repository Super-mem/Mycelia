"use client"

import type React from "react"
import { Send } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { extractDataFromText, queryData } from "@/lib/knowledgeGraph"
import { useSpaces, useCreateEntity, useQuery } from "@graphprotocol/hypergraph-react"
import { Concept, Fact, User } from "@/lib/schema"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function MinimalChat() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const spaceIds = useSpaces({mode: "private"});
  const spaceId = "f15a17f0-078e-4eae-85e1-78a001e5e83e";
  console.log(spaceId);
  const createConcept = useCreateEntity(Concept, { space: spaceId });
  const createFact = useCreateEntity(Fact, { space: spaceId });
  const createUser = useCreateEntity(User, { space: spaceId });

  
  let { data: facts, error: queryError, isPending: isLoadingA } = useQuery(Fact, { 
    mode: 'private', 
    space: spaceId,
    include: { user: {}, concept: {} }
  });

  console.log(facts.length);

  // Print allFacts every second
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     console.log('allFacts:', facts);
  //   }, 1000);

  //   return () => clearInterval(interval);
  // }, [queryError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const originalInput = input;
    
    //TODO: Here given the input I have to find out the context related to it
    const categories = await queryData(originalInput);

    // Now use these categories to get the context from the knowledge graph
    
    //TODO: Wait until all the facts are loaded
    console.log(facts);
    const contextFacts = facts
      .filter(fact => categories.includes(fact.concept[0].category))
      .map(fact => `${fact.concept[0].name} --> ${fact.details}`)
      .join('\n');

    console.log()

    const middleText = "you have to answer user query, for helping you the following context has been captured and added into the prompt based on knowledge graph of the user \n <Context> \n"
    const newInput = originalInput + "\n\n"+ middleText + contextFacts + "\n <Context/>";

    console.log("aaaa");
    console.log(newInput);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: originalInput, // Display only the original user input
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Make a call to a function which will save the extracted data to the kg
    // This will happen on another thread (no blocking)
    try {
      extractDataFromText(newInput, createConcept, createFact, createUser);
    } catch (error) {
      console.error("error saving into knowledge graph");
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            // Send the enhanced input with context to the LLM
            {
              role: "user",
              content: newInput,
            }
          ],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      }

      setMessages((prev) => [...prev, assistantMessage])

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") break

              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id ? { ...msg, content: msg.content + parsed.content } : msg,
                    ),
                  )
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <p>Start a conversation with the AI assistant</p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse">Thinking...</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
