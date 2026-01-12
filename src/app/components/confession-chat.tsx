import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Cross, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import { User } from "../lib/supabase";
import { projectId, publicAnonKey } from "/utils/supabase/info";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ConfessionChatProps {
  user?: User;
  onConfessionComplete?: () => void;
}

export function ConfessionChat({ user, onConfessionComplete }: ConfessionChatProps) {
  const [messages, setMessages] = useState<Message[]>([
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
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
    onConfessionComplete?.();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-240px)] bg-card rounded-xl shadow-lg border border-border overflow-hidden relative">
      {/* Karma Modal */}
      {showCompleteModal && karmaAnalysis && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-card border-2 border-accent rounded-2xl p-8 max-w-md mx-4 shadow-2xl animate-in zoom-in duration-500">
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/10 blur-2xl rounded-full"></div>
                  <div
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center border-2 ${
                      karmaAnalysis.karmaChange > 0
                        ? "bg-green-500/20 border-green-500/50"
                        : karmaAnalysis.karmaChange < 0
                        ? "bg-red-500/20 border-red-500/50"
                        : "bg-accent/20 border-accent/50"
                    }`}
                  >
                    {karmaAnalysis.karmaChange > 0 ? (
                      <TrendingUp className="w-10 h-10 text-green-600 dark:text-green-400" />
                    ) : karmaAnalysis.karmaChange < 0 ? (
                      <TrendingDown className="w-10 h-10 text-red-600 dark:text-red-400" />
                    ) : (
                      <Sparkles className="w-10 h-10 text-accent" />
                    )}
                  </div>
                </div>
              </div>

              {/* Title */}
              <h3
                className="text-2xl text-primary"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Исповедь завершена
              </h3>

              {/* Karma Change */}
              <div
                className={`text-5xl font-bold ${
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
              <p className="text-sm text-muted-foreground">карма</p>

              {/* Summary */}
              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">
                  {karmaAnalysis.summary}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {karmaAnalysis.reasoning}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all shadow-lg"
              >
                Начать новую исповедь
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
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message, index) => (
          <div
            key={message.id}
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
      <div className="border-t border-border bg-secondary/30 p-4">
        {/* Complete Confession Button */}
        {user && messages.length > 1 && (
          <div className="mb-3">
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
        <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1">
          <Cross className="w-3 h-3" />
          Ваши слова услышаны с любовью и без осуждения
          <Cross className="w-3 h-3" />
        </p>
      </div>

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-8 shadow-lg w-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Завершение Конфесии</h2>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-accent hover:text-accent-foreground"
              >
                <Cross className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Вы уверены, что хотите завершить конфесию? Это поможет вам получить анализ вашего кармы.
            </p>
            <div className="flex justify-end">
              <button
                onClick={handleCompleteConfession}
                className="px-5 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95"
              >
                <CheckCircle className="w-5 h-5" />
                Завершить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Karma Analysis Modal */}
      {karmaAnalysis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-8 shadow-lg w-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Анализ Кармы</h2>
              <button
                onClick={() => setKarmaAnalysis(null)}
                className="text-accent hover:text-accent-foreground"
              >
                <Cross className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {karmaAnalysis.reasoning}
            </p>
            <div className="flex items-center justify-center mb-4">
              <div
                className={`flex items-center gap-2 ${
                  karmaAnalysis.karmaChange > 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {karmaAnalysis.karmaChange > 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                <span className="font-bold">
                  {karmaAnalysis.karmaChange > 0 ? "+" : ""}
                  {karmaAnalysis.karmaChange}
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setKarmaAnalysis(null)}
                className="px-5 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95"
              >
                <CheckCircle className="w-5 h-5" />
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analyzing Modal */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-8 shadow-lg w-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Анализ Кармы</h2>
              <button
                onClick={() => setIsAnalyzing(false)}
                className="text-accent hover:text-accent-foreground"
              >
                <Cross className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Происходит анализ вашего кармы...
            </p>
            <div className="flex items-center justify-center mb-4">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      )}
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
    return "Ефесянам 4:26-27 учит нас: 'Гневаясь, не согрешайте: солнце да не зайдет во гневе вашем; и не давайте места диаволу.' Ваши чувства понятны, но позвольте Богу помочь вам преобразовать гнев в прощение и мир. Молитесь о силе отпустить то, что вас тяготит.";
  }

  // Default response
  return "Благодарю вас за то, что поделились этим. Как сказано в Притчах 3:5-6: 'Надейся на Господа всем сердцем твоим, и не полагайся на разум твой. Во всех путях твоих познавай Его, и Он направит стези твои.' Я здесь, чтобы выслушать вас. Продолжайте делиться тем, что на сердце, и вместе мы найдем утешение в Слов�� Божьем.";
}