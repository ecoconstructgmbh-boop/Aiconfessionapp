import { useState, useEffect } from "react";
import { ConfessionChat } from "./components/confession-chat";
import { WelcomeScreen } from "./components/welcome-screen";
import { Profile } from "./components/profile";
import { AuthScreen } from "./components/auth-screen";
import { ConfessionsHistory } from "./components/confessions-history";
import { getCurrentUser, onAuthStateChange, User, getUserProfile, UserProfile } from "./lib/supabase";
import { Cross, UserIcon, Home, ScrollText } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

type View = "home" | "confession" | "profile" | "auth" | "history";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>("home");
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeConfession, setActiveConfession] = useState<{messages: Message[]} | null>(null);

  useEffect(() => {
    // Check for existing session
    getCurrentUser().then((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadProfile(currentUser.id);
        loadActiveConfession(currentUser.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data } = onAuthStateChange((newUser) => {
      setUser(newUser);
      if (newUser) {
        loadProfile(newUser.id);
        loadActiveConfession(newUser.id);
        if (currentView === "auth") {
          setCurrentView("home");
        }
      } else {
        setProfile(null);
        setActiveConfession(null);
      }
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, [currentView]);

  const loadProfile = async (userId: string) => {
    const userProfile = await getUserProfile(userId);
    if (userProfile) {
      setProfile(userProfile);
    }
  };

  const loadActiveConfession = async (userId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed36fee5/confessions/active?userId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.confession && data.confession.messages) {
          // Convert timestamp strings back to Date objects
          const messages = data.confession.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
          setActiveConfession({ messages });
        }
      }
    } catch (error) {
      console.error("Error loading active confession:", error);
    }
  };

  const handleConfessionComplete = () => {
    setActiveConfession(null);
    if (user) {
      loadProfile(user.id);
    }
    // Return to home view
    setCurrentView("home");
  };

  const handleContinueConfession = () => {
    setCurrentView("confession");
  };

  const handleStartNewConfession = async () => {
    // Check if guest has already completed a confession
    if (!user && localStorage.getItem('guest_completed_confession') === 'true') {
      alert('Вы уже прошли одну исповедь в гостевом режиме. Пожалуйста, зарегистрируйтесь для продолжения.');
      setCurrentView('auth');
      return;
    }
    
    // Clear active confession when starting a new one
    if (user && activeConfession) {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed36fee5/confessions/active?userId=${user.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      setActiveConfession(null);
    }
    setCurrentView("confession");
  };

  const getKarmaColor = (karma: number) => {
    if (karma >= 75) return "from-blue-400 to-blue-500";
    if (karma >= 50) return "from-blue-300 to-blue-400";
    if (karma >= 25) return "from-blue-200 to-blue-300";
    if (karma > 0) return "from-blue-100 to-blue-200";
    if (karma === 0) return "from-gray-200 to-gray-300";
    if (karma >= -25) return "from-orange-200 to-orange-300";
    if (karma >= -50) return "from-orange-300 to-orange-400";
    if (karma >= -75) return "from-red-300 to-red-400";
    return "from-red-500 to-red-600";
  };

  const getKarmaLabel = (karma: number) => {
    if (karma >= 100) return "Святость";
    if (karma >= 75) return "Праведность";
    if (karma >= 50) return "Добродетель";
    if (karma >= 25) return "Чистота";
    if (karma > 0) return "Начинающий";
    if (karma === 0) return "Нейтральное";
    if (karma >= -25) return "Грех";
    if (karma >= -50) return "Порок";
    if (karma >= -75) return "Тьма";
    return "Ад";
  };

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
              {user && profile ? (
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getKarmaColor(profile.karma)} flex items-center justify-center text-sm font-bold text-white shadow-md`}>
                    {profile.karma}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground leading-none">Карма</p>
                    <p className="text-sm font-semibold text-primary leading-tight" style={{ fontFamily: "'Cinzel', serif" }}>
                      {getKarmaLabel(profile.karma)}
                    </p>
                  </div>
                </div>
              ) : (
                <h1 style={{ fontFamily: "'Cinzel', serif" }} className="text-primary">
                  ИИ Исповедь
                </h1>
              )}
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
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {currentView === "home" && <WelcomeScreen onStart={handleStartNewConfession} hasActiveConfession={!!activeConfession} onContinue={handleContinueConfession} />}
        {currentView === "confession" && <ConfessionChat user={user || undefined} onConfessionComplete={handleConfessionComplete} initialMessages={activeConfession?.messages} />}
        {currentView === "profile" && user && <Profile user={user} onSignOut={handleSignOut} />}
        {currentView === "auth" && <AuthScreen />}
        {currentView === "history" && user && (
          <ConfessionsHistory 
            user={user}
            onSelectConfession={(confession) => {
              // Handle confession selection if needed
              console.log("Selected confession:", confession);
            }}
            onConfessionsChanged={() => {
              // Reload profile to update karma
              if (user) {
                loadProfile(user.id);
              }
            }}
          />
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