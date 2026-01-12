import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Cross } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ConfessionChat() {
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

  return (
    <div className="flex flex-col h-[calc(100vh-240px)] bg-card rounded-xl shadow-lg border border-border overflow-hidden relative">
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
  return "Благодарю вас за то, что поделились этим. Как сказано в Притчах 3:5-6: 'Надейся на Господа всем сердцем твоим, и не полагайся на разум твой. Во всех путях твоих познавай Его, и Он направит стези твои.' Я здесь, чтобы выслушать вас. Продолжайте делиться тем, что на сердце, и вместе мы найдем утешение в Слове Божьем.";
}