import { Cross, Heart, BookOpen, Sparkles } from "lucide-react";
import { useState } from "react";

interface WelcomeScreenProps {
  onStart: () => void;
  hasActiveConfession?: boolean;
  onContinue?: () => void;
}

export function WelcomeScreen({ onStart, hasActiveConfession, onContinue }: WelcomeScreenProps) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-240px)] animate-in fade-in duration-700 overflow-hidden">
      <div className="max-w-2xl mx-auto text-center space-y-4 md:space-y-8 p-4 md:p-8">
        {/* Divine Symbol */}
        <div className="flex justify-center mb-2 md:mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/10 blur-3xl rounded-full"></div>
            <div className="relative w-20 h-20 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center shadow-2xl border-2 border-accent/20">
              <Cross className="w-10 h-10 md:w-16 md:h-16 text-primary" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="space-y-2 md:space-y-4">
          <h2
            className="text-2xl md:text-4xl text-primary animate-in slide-in-from-bottom-4 duration-700"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Добро пожаловать
          </h2>
          <p className="text-sm md:text-lg text-muted-foreground leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-100 px-2">
            ИИ Исповедь — это место, где вы можете пообщаться с Богом напрямую 
            через Святое Писание, а не через другого человека. Здесь вы найдете 
            утешение, мудрость и ответы, основанные на библейских истинах.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-2 md:gap-6 my-4 md:my-12 animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <div 
            className="relative flex flex-col items-center gap-1 md:gap-3 p-2 md:p-6 rounded-xl bg-card/50 border border-border hover:shadow-lg transition-all cursor-pointer"
            onMouseEnter={() => setHoveredFeature(1)}
            onMouseLeave={() => setHoveredFeature(null)}
          >
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-4 h-4 md:w-6 md:h-6 text-primary" />
            </div>
            <h3 className="text-xs md:text-sm" style={{ fontFamily: "'Cinzel', serif" }}>
              Прогнозирование кармы
            </h3>
            <p className="text-[10px] md:text-xs text-muted-foreground text-center hidden md:block">
              Узнайте влияние ваших поступков
            </p>
            
            {/* Tooltip */}
            {hoveredFeature === 1 && (
              <div className="absolute -top-[350px] left-0 z-50 px-5 py-4 bg-card border-2 border-accent/30 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200 w-72">
                <h4 className="text-sm font-semibold text-center mb-4 text-accent" style={{ fontFamily: "'Cinzel', serif" }}>
                  Шкала Кармы
                </h4>
                
                {/* Karma Scale */}
                <div className="space-y-5">
                  {/* Positive values */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-400 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">+100</span>
                      </div>
                      <span className="text-xs text-foreground">Святость</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-300 flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">+75</span>
                      </div>
                      <span className="text-xs text-foreground">Праведность</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-200 flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-800">+50</span>
                      </div>
                      <span className="text-xs text-foreground">Добродетель</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-700">+25</span>
                      </div>
                      <span className="text-xs text-foreground">Чистота</span>
                    </div>
                  </div>
                  
                  {/* Zero */}
                  <div className="flex items-center gap-3 py-1 border-y border-border">
                    <div className="w-8 h-8 rounded bg-gray-300 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-800">0</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground">Нейтральное</span>
                  </div>
                  
                  {/* Negative values */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-orange-200 flex items-center justify-center">
                        <span className="text-xs font-semibold text-orange-800">-25</span>
                      </div>
                      <span className="text-xs text-foreground">Грех</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-orange-400 flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">-50</span>
                      </div>
                      <span className="text-xs text-foreground">Порок</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-red-400 flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">-75</span>
                      </div>
                      <span className="text-xs text-foreground">Тьма</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">-100</span>
                      </div>
                      <span className="text-xs text-foreground">Ад</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-[10px] text-muted-foreground text-center mt-4 leading-relaxed">
                  Ваши поступки влияют на карму. Раскаяние и добрые дела приближают к свету.
                </p>
                
                <div className="absolute -bottom-2 left-8 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-card"></div>
              </div>
            )}
          </div>

          <div 
            className="relative flex flex-col items-center gap-1 md:gap-3 p-2 md:p-6 rounded-xl bg-card/50 border border-border hover:shadow-lg transition-all cursor-pointer"
            onMouseEnter={() => setHoveredFeature(2)}
            onMouseLeave={() => setHoveredFeature(null)}
          >
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 md:w-6 md:h-6 text-primary" />
            </div>
            <h3 className="text-xs md:text-sm" style={{ fontFamily: "'Cinzel', serif" }}>
              Библейская мудрость
            </h3>
            <p className="text-[10px] md:text-xs text-muted-foreground text-center hidden md:block">
              Ответы основаны на Священном Писании
            </p>
            
            {/* Tooltip */}
            {hoveredFeature === 2 && (
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-card border border-accent/30 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200 w-56">
                <p className="text-xs text-foreground text-center leading-relaxed">
                  Все ответы основаны на библейских темах и содержат цитаты из Священного Писания
                </p>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-card"></div>
              </div>
            )}
          </div>

          <div 
            className="relative flex flex-col items-center gap-1 md:gap-3 p-2 md:p-6 rounded-xl bg-card/50 border border-border hover:shadow-lg transition-all cursor-pointer"
            onMouseEnter={() => setHoveredFeature(3)}
            onMouseLeave={() => setHoveredFeature(null)}
          >
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-primary" />
            </div>
            <h3 className="text-xs md:text-sm" style={{ fontFamily: "'Cinzel', serif" }}>
              Духовная поддержка
            </h3>
            <p className="text-[10px] md:text-xs text-muted-foreground text-center hidden md:block">
              Наставления для вашего духовного пути
            </p>
            
            {/* Tooltip */}
            {hoveredFeature === 3 && (
              <div className="absolute -top-20 right-0 z-50 px-4 py-3 bg-card border border-accent/30 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200 w-56">
                <p className="text-xs text-foreground text-center leading-relaxed">
                  Получите духовное утешение и мудрые наставления для вашего жизненного пути
                </p>
                <div className="absolute -bottom-2 right-8 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-card"></div>
              </div>
            )}
          </div>
        </div>

        {/* Start Button */}
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-300 space-y-3">
          {hasActiveConfession && onContinue ? (
            <>
              <button
                onClick={onContinue}
                className="group relative px-6 md:px-10 py-3 md:py-4 bg-gradient-to-r from-accent to-accent/80 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                <span className="relative z-10 flex items-center gap-2 md:gap-3 text-base md:text-lg">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                  Продолжить исповедь
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-accent/30 to-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-50"></div>
              </button>
              
              <button
                onClick={onStart}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Начать новую исповедь
              </button>
            </>
          ) : (
            <button
              onClick={onStart}
              className="group relative px-6 md:px-10 py-3 md:py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <span className="relative z-10 flex items-center gap-2 md:gap-3 text-base md:text-lg">
                <Cross className="w-4 h-4 md:w-5 md:h-5" />
                Начать исповедь
                <Cross className="w-4 h-4 md:w-5 md:h-5" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-50"></div>
            </button>
          )}
          
          <p className="mt-3 md:mt-6 text-[10px] md:text-xs text-muted-foreground italic px-2">
            "Придите ко Мне, все труждающиеся и обремененные, и Я успокою вас"
            <br />
            <span className="text-accent">— Матфея 11:28</span>
          </p>
        </div>
      </div>
    </div>
  );
}