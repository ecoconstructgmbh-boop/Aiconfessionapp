import { useState, useEffect } from "react";
import { ConfessionChat } from "./components/confession-chat";
import { WelcomeScreen } from "./components/welcome-screen";
import { Profile } from "./components/profile";
import { AuthScreen } from "./components/auth-screen";
import { ConfessionsHistory } from "./components/confessions-history";
import { SubscriptionModal } from "./components/subscription-modal";
import { AdminPanel } from "./components/admin-panel";
import { getCurrentUser, onAuthStateChange, User, getUserProfile, UserProfile } from "./lib/supabase";
import { Cross, UserIcon, Home, ScrollText, Shield, Menu, User as UserIconMenu, History, LogOut, X } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

type View = "home" | "confession" | "profile" | "auth" | "history" | "admin";

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
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [confessionLimit, setConfessionLimit] = useState<{confessionsToday: number; limit: number} | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    // Check for existing session
    getCurrentUser().then((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadProfile(currentUser.id);
        loadActiveConfession(currentUser.id);
        loadConfessionLimit(currentUser.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data } = onAuthStateChange((newUser) => {
      setUser(newUser);
      if (newUser) {
        loadProfile(newUser.id);
        loadActiveConfession(newUser.id);
        loadConfessionLimit(newUser.id);
        if (currentView === "auth") {
          setCurrentView("home");
        }
      } else {
        setProfile(null);
        setActiveConfession(null);
        setConfessionLimit(null);
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

  const loadConfessionLimit = async (userId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed36fee5/confessions/check-limit?userId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (!data.hasSubscription) {
          setConfessionLimit({ 
            confessionsToday: data.confessionsToday, 
            limit: data.limit 
          });
        } else {
          setConfessionLimit(null); // No limit for subscribed users
        }
      }
    } catch (error) {
      console.error("Error loading confession limit:", error);
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
    
    // Check if user has reached the daily confession limit
    if (user && confessionLimit && confessionLimit.confessionsToday >= confessionLimit.limit) {
      setShowSubscriptionModal(true);
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

            {/* Burger Menu Button */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-3 bg-gradient-to-br from-primary/90 to-accent/90 backdrop-blur-sm text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border border-primary/30"
            >
              {showMenu ? (
                <X className="w-5 h-5 md:w-6 md:h-6" />
              ) : (
                <Menu className="w-5 h-5 md:w-6 md:h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Burger Menu Dropdown */}
        {showMenu && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-in fade-in duration-200"
              onClick={() => setShowMenu(false)}
            />
            
            {/* Menu Panel */}
            <div className="fixed top-24 right-6 z-50 w-80 bg-gradient-to-br from-card/95 to-background/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 overflow-hidden animate-in slide-in-from-top-4 duration-300">
              {/* User Info Section */}
              {user && (
                <div className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                      <UserIconMenu className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
                        {user.email?.split('@')[0] || 'Пользователь'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Menu Items */}
              <div className="p-3">
                {/* Home */}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setCurrentView("home");
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-primary/10 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Home className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">Главная</p>
                    <p className="text-xs text-muted-foreground">Начальный экран</p>
                  </div>
                </button>

                {user && (
                  <>
                    {/* Profile */}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setCurrentView("profile");
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-primary/10 transition-all duration-200 group mt-1"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <UserIconMenu className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-foreground">Профиль</p>
                        <p className="text-xs text-muted-foreground">Настройки аккаунта</p>
                      </div>
                    </button>

                    {/* History */}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setCurrentView("history");
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-accent/10 transition-all duration-200 group mt-1"
                    >
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                        <History className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-foreground">История исповедей</p>
                        <p className="text-xs text-muted-foreground">Ваши прошлые беседы</p>
                      </div>
                    </button>

                    {/* Admin Panel (only for admin) */}
                    {user.isAdmin && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setCurrentView("admin");
                        }}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-purple-500/10 transition-all duration-200 group mt-1"
                      >
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                          <Shield className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-foreground">Админ-панель</p>
                          <p className="text-xs text-muted-foreground">Управление системой</p>
                        </div>
                      </button>
                    )}

                    {/* Divider */}
                    <div className="my-3 border-t border-border/50" />

                    {/* Logout */}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-all duration-200 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                        <LogOut className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-red-500">Выход</p>
                        <p className="text-xs text-muted-foreground">Выйти из аккаунта</p>
                      </div>
                    </button>
                  </>
                )}

                {/* Login button for guests */}
                {!user && (
                  <>
                    <div className="my-3 border-t border-border/50" />
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setCurrentView("auth");
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-primary/10 transition-all duration-200 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <UserIconMenu className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-primary">Войти</p>
                        <p className="text-xs text-muted-foreground">Авторизация</p>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {currentView === "home" && (
          <WelcomeScreen 
            onStart={handleStartNewConfession} 
            hasActiveConfession={!!activeConfession} 
            onContinue={handleContinueConfession} 
            user={user}
          />
        )}
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
        {currentView === "admin" && user && user.isAdmin && <AdminPanel />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Cross className="w-4 h-4 text-accent" />
          <p>Бог всегда слышит ваши молитвы и готов простить</p>
          <Cross className="w-4 h-4 text-accent" />
        </div>
      </footer>

      {/* Subscription Modal */}
      {showSubscriptionModal && confessionLimit && (
        <SubscriptionModal
          onClose={() => setShowSubscriptionModal(false)}
          confessionsToday={confessionLimit.confessionsToday}
          limit={confessionLimit.limit}
        />
      )}
    </div>
  );
}