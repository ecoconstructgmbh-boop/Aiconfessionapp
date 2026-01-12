import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Cross, CheckCircle, TrendingUp, TrendingDown, Mic, MicOff, Volume2, VolumeX, MessageSquare, Radio } from "lucide-react";
import { User } from "../lib/supabase";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import karmaImage from "figma:asset/c8f3764c17c1083638255b73d04e345938e51d4e.png";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ConfessionChatProps {
  user?: User;
  onConfessionComplete?: () => void;
  initialMessages?: Message[];
}

const MAX_MESSAGES_GUEST = 30;

type InputMode = "text" | "voice";

export function ConfessionChat({ user, onConfessionComplete, initialMessages }: ConfessionChatProps) {
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [messages, setMessages] = useState<Message[]>(initialMessages || [
    {
      id: "1",
      role: "assistant",
      content: "Мир вам, дитя Божие. Я здесь, чтобы выслушать вас и помочь вам найти путь к прощению и исцелению. Чувствуйте себя свободно поделиться тем, что лежит на вашем сердце.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [karmaAnalysis, setKarmaAnalysis] = useState<{ karmaChange: number; summary: string; reasoning: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if guest user has reached limits
  const isGuest = !user;
  const messageCount = Math.floor(messages.length / 2); // Count user messages only
  const hasReachedLimit = isGuest && messageCount >= MAX_MESSAGES_GUEST;
  const hasCompletedConfession = isGuest && localStorage.getItem('guest_completed_confession') === 'true';

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        const lastMessage = container.querySelector('[data-message]:last-of-type');
        if (lastMessage) {
          lastMessage.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  }, [input]);

  // Auto-speak first message when switching to voice mode
  useEffect(() => {
    if (inputMode === "voice" && autoSpeak && messages.length === 1) {
      // Speak the initial greeting
      setTimeout(() => {
        speak(messages[0].content);
      }, 500);
    }
  }, [inputMode, autoSpeak]);

  // Auto-save active confession after each message
  useEffect(() => {
    if (user && messages.length > 1) {
      saveActiveConfession();
    }
  }, [messages]);

  const saveActiveConfession = async () => {
    if (!user) return;

    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed36fee5/confessions/active`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            userId: user.id,
            messages: messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp.toISOString(),
            })),
          }),
        }
      );
    } catch (error) {
      console.error("Error auto-saving confession:", error);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    // Check guest limits
    if (hasReachedLimit) {
      alert("Вы достигли лимита сообщений для гостевого режима (30 сообщений). Пожалуйста, зарегистрируйтесь для продолжения.");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Call AI API
    fetchAIResponse(input, [...messages, userMessage]);
  };

  const fetchAIResponse = async (userInput: string, conversationHistory: Message[]) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed36fee5/chat/response`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            userMessage: userInput,
            messages: conversationHistory.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      const aiResponse = data.response;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (autoSpeak) {
        speak(aiResponse);
      }
    } catch (error) {
      console.error("Error fetching AI response:", error);
      // Fallback to simple response
      const fallbackResponse = generateAIResponse(userInput);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fallbackResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (autoSpeak) {
        speak(fallbackResponse);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCompleteConfession = async () => {
    if (messages.length <= 1 || !user) return;

    setIsAnalyzing(true);
    try {
      // Analyze the confession
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed36fee5/confessions/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            messages: messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to analyze confession");
      }

      const analysis = await response.json();
      setKarmaAnalysis(analysis);

      // Save confession
      const saveResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed36fee5/confessions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            userId: user.id,
            messages: messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            karmaChange: analysis.karmaChange,
            summary: analysis.summary,
          }),
        }
      );

      if (!saveResponse.ok) {
        throw new Error("Failed to save confession");
      }

      const confession = await saveResponse.json();

      // Complete confession and update karma
      const completeResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed36fee5/confessions/${confession.id}/complete`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            karmaChange: analysis.karmaChange,
          }),
        }
      );

      if (!completeResponse.ok) {
        throw new Error("Failed to complete confession");
      }

      setShowCompleteModal(true);

      // Delete active confession after completing
      if (user) {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ed36fee5/confessions/active?userId=${user.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
      }
    } catch (error) {
      console.error("Error completing confession:", error);
      alert("Ошибка при завершении исповеди");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCloseModal = () => {
    setShowCompleteModal(false);
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: "Мир вам, дитя Божие. Я здесь, чтобы выслушать вас и помочь вам найти путь к прощению и исцелению. Чувствуйте себя свободно поделиться тем, что лежит на вашем сердце.",
        timestamp: new Date(),
      },
    ]);
    setKarmaAnalysis(null);
    
    // Mark guest confession as completed
    if (isGuest) {
      localStorage.setItem('guest_completed_confession', 'true');
    }
    
    // Call the callback to return to home
    onConfessionComplete?.();
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Ваш браузер не поддерживает распознавание речи. Попробуйте Chrome или Edge.");
        return;
      }
      
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "ru-RU";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        
        // Create user message
        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: transcript,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsTyping(true);

        // Call AI API
        fetchAIResponse(transcript, [...messages, userMessage]);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert("Пожалуйста, разрешите доступ к микрофону для голосовой исповеди.");
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speak = (text: string) => {
    speakWithOpenAI(text);
  };

  const speakWithOpenAI = async (text: string) => {
    try {
      setIsSpeaking(true);

      console.log("Requesting TTS from OpenAI...");

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed36fee5/chat/speak`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("TTS API error:", errorData);
        setIsSpeaking(false);
        return;
      }

      const data = await response.json();
      
      if (!data.audio) {
        console.error("No audio data in response:", data);
        setIsSpeaking(false);
        return;
      }

      console.log("Audio data received, length:", data.audio.length);

      // Convert base64 to blob
      const audioBlob = base64ToBlob(data.audio, "audio/mpeg");
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log("Audio blob created, size:", audioBlob.size);

      // Create and play audio element
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        console.log("Audio playback ended");
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        
        // Automatically start listening again in voice mode after AI finishes speaking
        if (inputMode === "voice" && autoSpeak) {
          setTimeout(() => {
            startListening();
          }, 500);
        }
      };

      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      console.log("Starting audio playback...");
      await audio.play();
      console.log("Audio playing successfully");
    } catch (error) {
      console.error("Error with OpenAI TTS:", error);
      setIsSpeaking(false);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-card rounded-xl shadow-lg border border-border overflow-hidden relative">
      {/* Karma Modal */}
      {showCompleteModal && karmaAnalysis && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300 p-4">
          <div className="bg-card border-2 border-accent rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in duration-500">
            <div className="text-center space-y-4">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/10 blur-2xl rounded-full"></div>
                  <div
                    className={`relative w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                      karmaAnalysis.karmaChange > 0
                        ? "bg-green-500/20 border-green-500/50"
                        : karmaAnalysis.karmaChange < 0
                        ? "bg-red-500/20 border-red-500/50"
                        : "bg-accent/20 border-accent/50"
                    }`}
                  >
                    {karmaAnalysis.karmaChange > 0 ? (
                      <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                    ) : karmaAnalysis.karmaChange < 0 ? (
                      <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
                    ) : (
                      <Sparkles className="w-8 h-8 text-accent" />
                    )}
                  </div>
                </div>
              </div>

              {/* Title */}
              <h3
                className="text-xl text-primary"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Исповедь завершена
              </h3>

              {/* Karma Change */}
              <div
                className={`text-4xl font-bold ${
                  karmaAnalysis.karmaChange > 0
                    ? "text-green-600 dark:text-green-400"
                    : karmaAnalysis.karmaChange < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-foreground"
                }`}
              >
                {karmaAnalysis.karmaChange > 0 ? "+" : ""}
                {karmaAnalysis.karmaChange}
              </div>
              <img src={karmaImage} alt="С любовью" className="hidden w-20 h-auto mx-auto" />

              {/* Summary */}
              <div className="space-y-2">
                <p className="text-base font-medium text-foreground">
                  {karmaAnalysis.summary}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {karmaAnalysis.reasoning}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="w-full px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all shadow-lg"
              >
                На главную
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decorative crosses in corners */}
      <div className="absolute top-4 left-4 text-accent/10 pointer-events-none">
        <Cross className="w-8 h-8" />
      </div>
      <div className="absolute top-4 right-4 text-accent/10 pointer-events-none">
        <Cross className="w-8 h-8" />
      </div>

      {/* Mode Selection Header */}
      <div className="border-b border-border bg-secondary/30 p-4">
        {/* Guest Limitation Warning */}
        {isGuest && (
          <div className="mb-3 p-3 bg-accent/10 border border-accent/30 rounded-lg">
            <p className="text-xs text-accent text-center">
              ✨ Гостевой режим: {messageCount}/{MAX_MESSAGES_GUEST} сообщений · Голосовой режим доступен после регистрации
            </p>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-background rounded-xl p-1 border border-border">
            <button
              onClick={() => {
                setInputMode("text");
                stopListening();
                setAutoSpeak(false);
              }}
              className={`flex-1 px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
                inputMode === "text"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">Текст</span>
            </button>
            <button
              onClick={() => {
                if (isGuest) {
                  alert("Голосовой режим доступен только для зарегистрированных пользователей. Пожалуйста, войдите или зарегистрируйтесь.");
                  return;
                }
                setInputMode("voice");
                setAutoSpeak(true);
              }}
              disabled={isGuest}
              className={`flex-1 px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
                inputMode === "voice"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : isGuest
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Radio className="w-4 h-4" />
              <span className="text-sm font-medium">Голос {isGuest && "🔒"}</span>
            </button>
          </div>

          {/* Voice controls */}
          {inputMode === "voice" && (
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`px-3 py-2 rounded-lg transition-all ${
                autoSpeak
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "bg-background text-muted-foreground border border-border"
              }`}
              title={autoSpeak ? "Озвучивание включено" : "Озвучивание выключено"}
            >
              {autoSpeak ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message, index) => (
          <div
            key={message.id}
            data-message
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-500`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-4 transition-all hover:shadow-md ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground border border-border"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex items-center gap-2 mb-2 opacity-70">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span className="text-xs" style={{ fontFamily: "'Cinzel', serif" }}>
                    Духовный Наставник
                  </span>
                </div>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              <span className="text-xs opacity-60 mt-2 block">
                {message.timestamp.toLocaleTimeString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="max-w-[80%] rounded-2xl px-5 py-4 bg-secondary text-secondary-foreground border border-border">
              <div className="flex items-center gap-2 mb-2 opacity-70">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="text-xs" style={{ fontFamily: "'Cinzel', serif" }}>
                  Духовный Наставник
                </span>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-secondary/30 p-3">
        {/* Complete Confession Button */}
        {user && messages.length > 1 && (
          <div className="mb-2">
            <button
              onClick={handleCompleteConfession}
              disabled={isAnalyzing}
              className="w-full px-4 py-2.5 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent rounded-xl transition-all flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              {isAnalyzing ? "Анализ исповеди..." : "Завершить исповедь"}
            </button>
          </div>
        )}

        {inputMode === "text" ? (
          <div className="flex gap-2 items-end">
            <div className="flex-1 bg-background rounded-xl border border-border focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Поделитесь своими мыслями..."
                className="w-full px-4 py-3 bg-transparent resize-none outline-none max-h-32"
                rows={1}
                style={{ minHeight: "52px" }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-5 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isTyping || isSpeaking}
              className={`w-full px-8 py-5 rounded-2xl transition-all flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-8 h-8" />
                  <span className="font-medium">Остановить запись</span>
                  <span className="text-xs opacity-80">Слушаю...</span>
                </>
              ) : isSpeaking ? (
                <>
                  <Volume2 className="w-8 h-8 animate-pulse" />
                  <span className="font-medium">Духовный наставник говорит</span>
                  <span className="text-xs opacity-80">Слушайте ответ...</span>
                </>
              ) : (
                <>
                  <Mic className="w-8 h-8" />
                  <span className="font-medium">Нажмите, чтобы говорить</span>
                  <span className="text-xs opacity-80">Голосовая исповедь</span>
                </>
              )}
            </button>
          </div>
        )}

        <p className="hidden text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
          <Cross className="w-3 h-3" />
          Ваши слова услышаны с любовью и без осуждения
          <Cross className="w-3 h-3" />
        </p>
      </div>
    </div>
  );
}

// Mock AI response generator based on biblical themes
function generateAIResponse(userInput: string): string {
  const lowerInput = userInput.toLowerCase();

  // Detect themes and respond accordingly
  if (
    lowerInput.includes("грех") ||
    lowerInput.includes("согрешил") ||
    lowerInput.includes("виновен")
  ) {
    return "Дитя Божие, помните слова из 1 Иоанна 1:9: 'Если исповедуем грехи наши, то Он, будучи верен и праведен, простит нам грехи наши и очистит нас от всякой неправды.' Бог милосерден и всегда готов простить тех, кто искренне раскаивается. Ваше признание - это первый шаг к исцелению.";
  }

  if (
    lowerInput.includes("прост") ||
    lowerInput.includes("раскаи") ||
    lowerInput.includes("сожале")
  ) {
    return "Псалом 51:17 говорит нам: 'Жертва Богу — дух сокрушенный; сердца сокрушенного и смиренного Ты не презришь, Боже.' Ваше раскаяние искренне, и Господь видит ваше сердце. Простите себя так же, как Бог прощает вас, и идите вперед в свете Его благодати.";
  }

  if (
    lowerInput.includes("страх") ||
    lowerInput.includes("боюсь") ||
    lowerInput.includes("тревож")
  ) {
    return "В Евангелии от Иоанна 14:27 Иисус говорит: 'Мир оставляю вам, мир Мой даю вам; не так, как мир дает, Я даю вам. Да не смущается сердце ваше и да не устрашается.' Доверьтесь Господу, ибо Он с вами всегда. Ваши страхи понятны, но помните, что Божья любовь изгоняет страх.";
  }

  if (
    lowerInput.includes("одинок") ||
    lowerInput.includes("один") ||
    lowerInput.includes("покину")
  ) {
    return "Помните обещание из Второзакония 31:6: 'Будь тверд и мужествен, не бойся и не ужасайся пред ними, ибо Господь Бог твой Сам пойдет с тобою и не отступит от тебя, и не оставит тебя.' Вы никогда не одиноки - Бог всегда рядом с вами, даже в самые темные моменты.";
  }

  if (
    lowerInput.includes("злость") ||
    lowerInput.includes("гнев") ||
    lowerInput.includes("ненавижу")
  ) {
    return "Ефесянам 4:26-27 учит нас: 'Гневаясь, не согрешайте: солнце да не зайдет во гневе вашем; и не давайте места диаволу.' Ваши чувства понятны, но позвольте Богу помочь вам преобразовать гнев в прощение и мир. Молитесь о силе отустить то, что вас тяготит.";
  }

  // Default response
  return "Благодарю вас за то, что поделились этим. Как сказано в Притчах 3:5-6: 'Надейся н Господа всем сердцем твоим, и не полагайся на разум твой. Во всех путях твоих познавай Его, и Он направит стези твои.' Я здесь, чтобы выслушать вас. Продолжайте делиться тем, что на сердце, и вместе мы найдем утешение в Слов Божьем.";
}