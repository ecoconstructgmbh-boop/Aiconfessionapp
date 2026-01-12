import { useEffect, useState } from "react";
import { User } from "../lib/supabase";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { ScrollText, TrendingUp, TrendingDown, Calendar, ChevronRight, Sparkles } from "lucide-react";

interface Confession {
  id: string;
  userId: string;
  messages: Array<{ role: string; content: string }>;
  karmaChange: number;
  summary: string;
  createdAt: string;
  completed: boolean;
  completedAt?: string;
}

interface ConfessionsHistoryProps {
  user: User;
  onSelectConfession?: (confession: Confession) => void;
}

export function ConfessionsHistory({ user, onSelectConfession }: ConfessionsHistoryProps) {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfessions();
  }, [user.id]);

  const fetchConfessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed36fee5/confessions/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConfessions(data);
      }
    } catch (error) {
      console.error("Error fetching confessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} мин назад`;
    } else if (diffHours < 24) {
      return `${diffHours} ч назад`;
    } else if (diffDays < 7) {
      return `${diffDays} дн назад`;
    } else {
      return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/10 blur-2xl rounded-full animate-pulse"></div>
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-muted-foreground">Загрузка истории...</p>
        </div>
      </div>
    );
  }

  if (confessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/10 blur-3xl rounded-full"></div>
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center border-2 border-accent/20">
              <ScrollText className="w-12 h-12 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-3">
            <h3
              className="text-2xl text-primary"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              История пуста
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Здесь будут храниться все ваши исповеди. Начните первую беседу с Богом, чтобы очистить душу.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-700">
      <div className="mb-8 text-center">
        <h2
          className="text-3xl text-primary mb-3"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          История исповедей
        </h2>
        <p className="text-muted-foreground">
          Всего исповедей: {confessions.length}
        </p>
      </div>

      <div className="space-y-4">
        {confessions.map((confession, index) => (
          <div
            key={confession.id}
            onClick={() => onSelectConfession?.(confession)}
            className="bg-card border border-border rounded-xl p-6 hover:bg-secondary transition-all cursor-pointer group animate-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(confession.createdAt)}</span>
                  </div>
                  {confession.completed && (
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                        confession.karmaChange > 0
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : confession.karmaChange < 0
                          ? "bg-red-500/10 text-red-600 dark:text-red-400"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      {confession.karmaChange > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : confession.karmaChange < 0 ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span>
                        {confession.karmaChange > 0 ? "+" : ""}
                        {confession.karmaChange} карма
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-medium text-foreground">
                  {confession.summary || "Духовная беседа"}
                </h3>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {confession.messages.length > 0
                    ? confession.messages[confession.messages.length - 1].content
                    : "Нет сообщений"}
                </p>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ScrollText className="w-3.5 h-3.5" />
                  <span>{confession.messages.length} сообщений</span>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
