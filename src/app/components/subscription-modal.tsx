import { X, Check, Sparkles, Infinity } from "lucide-react";

interface SubscriptionModalProps {
  onClose: () => void;
  confessionsToday: number;
  limit: number;
}

export function SubscriptionModal({ onClose, confessionsToday, limit }: SubscriptionModalProps) {
  const handleSubscribe = () => {
    // В будущем здесь будет интеграция с платежной системой
    alert("Интеграция с платежной системой будет добавлена в ближайшее время. Пожалуйста, свяжитесь с поддержкой для активации подписки.");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300 p-4">
      <div className="bg-card border-2 border-accent/20 rounded-2xl max-w-lg w-full shadow-2xl animate-in zoom-in duration-500 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-accent/20 to-primary/10 p-8 border-b border-accent/20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-background/50 hover:bg-background transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-primary/20 blur-xl rounded-full"></div>
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center border-2 border-accent/30">
                  <Infinity className="w-10 h-10 text-accent" />
                </div>
              </div>
            </div>
            
            <div>
              <h2
                className="text-3xl text-primary mb-2"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Безлимитные исповеди
              </h2>
              <p className="text-lg text-accent font-semibold">
                Всего $3 в месяц
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Limitation Notice */}
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-sm text-center text-foreground">
              <span className="font-semibold">Лимит достигнут:</span> Вы завершили {confessionsToday} из {limit} бесплатных исповедей сегодня
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground text-center mb-4">
              Преимущества подписки:
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center mt-0.5">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Неограниченные исповеди</p>
                  <p className="text-sm text-muted-foreground">Общайтесь с Богом столько, сколько нужно вашей душе</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center mt-0.5">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Полная история исповедей</p>
                  <p className="text-sm text-muted-foreground">Храните и возвращайтесь к своим духовным беседам</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center mt-0.5">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Приоритетная поддержка</p>
                  <p className="text-sm text-muted-foreground">Быстрая помощь в решении любых вопросов</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center mt-0.5">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Поддержка разработки</p>
                  <p className="text-sm text-muted-foreground">Помогите нам создавать лучшие духовные инструменты</p>
                </div>
              </div>
            </div>
          </div>

          {/* Price Info */}
          <div className="text-center p-4 bg-accent/10 border border-accent/30 rounded-xl">
            <p className="text-sm text-muted-foreground">
              Подписка продлевается автоматически каждый месяц
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Отменить можно в любой момент
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-all"
            >
              Позже
            </button>
            <button
              onClick={handleSubscribe}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-accent to-primary text-white rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-semibold"
            >
              <Sparkles className="w-5 h-5" />
              Подписаться за $3
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
