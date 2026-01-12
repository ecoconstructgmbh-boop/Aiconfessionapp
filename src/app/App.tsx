import { useState, useEffect } from "react";
import { ConfessionChat } from "./components/confession-chat";
import { WelcomeScreen } from "./components/welcome-screen";
import { Profile } from "./components/profile";
import { AuthScreen } from "./components/auth-screen";
import { ConfessionsHistory } from "./components/confessions-history";
import { getCurrentUser, onAuthStateChange, User } from "./lib/supabase";
import { Cross, UserIcon, Home, ScrollText } from "lucide-react";

type View = "home" | "confession" | "profile" | "auth" | "history";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("home");
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    getCurrentUser().then((currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data } = onAuthStateChange((newUser) => {
      setUser(newUser);
      if (newUser && currentView === "auth") {
        setCurrentView("home");
      }
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, [currentView]);

  const handleSignOut = () => {
    setUser(null);
    setCurrentView("home");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Cross className="w-12 h-12 text-primary" strokeWidth={2.5} />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-secondary/20" style={{ fontFamily: "'Crimson Text', serif" }}>
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center shadow-md">
                <Cross className="w-5 h-5 text-primary" strokeWidth={2.5} />
              </div>
              <h1 style={{ fontFamily: "'Cinzel', serif" }} className="text-primary">
                ИИ Исповедь
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {currentView !== "home" && (
                <button
                  onClick={() => setCurrentView("home")}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  aria-label="Home"
                >
                  <Home className="w-5 h-5 text-primary" />
                </button>
              )}
              {user && (
                <button
                  onClick={() => setCurrentView(currentView === "history" ? "home" : "history")}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  aria-label="История исповедей"
                >
                  <ScrollText className="w-5 h-5 text-primary" />
                </button>
              )}
              {user ? (
                <button
                  onClick={() => setCurrentView(currentView === "profile" ? "home" : "profile")}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  aria-label="Profile"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border-2 border-accent/30"
                    />
                  ) : (
                    <UserIcon className="w-5 h-5 text-primary" />
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentView("auth")}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all text-sm"
                >
                  Войти
                </button>
              )}
            </div>
          </div>
          <p className="text-center text-muted-foreground mt-2 text-sm">
            Место духовноо утешения и библейской мудрости
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {currentView === "home" && <WelcomeScreen onStart={() => setCurrentView("confession")} />}
        {currentView === "confession" && <ConfessionChat user={user || undefined} onConfessionComplete={() => setCurrentView("history")} />}
        {currentView === "profile" && user && <Profile user={user} onSignOut={handleSignOut} />}
        {currentView === "auth" && <AuthScreen />}
        {currentView === "history" && user && <ConfessionsHistory user={user} />}
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