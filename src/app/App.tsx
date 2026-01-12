import { useState } from "react";
import { ConfessionChat } from "./components/confession-chat";
import { WelcomeScreen } from "./components/welcome-screen";
import { Cross } from "lucide-react";

export default function App() {
  const [isConfessionStarted, setIsConfessionStarted] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-secondary/20" style={{ fontFamily: "'Crimson Text', serif" }}>
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center shadow-md">
              <Cross className="w-5 h-5 text-primary" strokeWidth={2.5} />
            </div>
            <h1 style={{ fontFamily: "'Cinzel', serif" }} className="text-primary">
              ИИ Исповедь
            </h1>
          </div>
          <p className="text-center text-muted-foreground mt-2 text-sm">
            Место духовного утешения и библейской мудрости
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {!isConfessionStarted ? (
          <WelcomeScreen onStart={() => setIsConfessionStarted(true)} />
        ) : (
          <ConfessionChat />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Cross className="w-4 h-4 text-accent" />
          <p>Бог всегда слышит ваши молитвы и готов простить</p>
          <Cross className="w-4 h-4 text-accent" />
        </div>
      </footer>
    </div>
  );
}