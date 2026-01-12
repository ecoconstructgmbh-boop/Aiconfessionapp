import { Cross, Heart, BookOpen, Sparkles } from "lucide-react";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
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
            Это безопасное пространство для духовного размышления и исцеления.
            Здесь вы можете поделиться своими мыслями, получить библейскую мудрость
            и найти путь к прощению и внутреннему миру.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-2 md:gap-6 my-4 md:my-12 animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="flex flex-col items-center gap-1 md:gap-3 p-2 md:p-6 rounded-xl bg-card/50 border border-border hover:shadow-lg transition-all">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-4 h-4 md:w-6 md:h-6 text-primary" />
            </div>
            <h3 className="text-xs md:text-sm" style={{ fontFamily: "'Cinzel', serif" }}>
              С любовью
            </h3>
            <p className="text-[10px] md:text-xs text-muted-foreground text-center hidden md:block">
              Без осуждения и с пониманием
            </p>
          </div>

          <div className="flex flex-col items-center gap-1 md:gap-3 p-2 md:p-6 rounded-xl bg-card/50 border border-border hover:shadow-lg transition-all">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 md:w-6 md:h-6 text-primary" />
            </div>
            <h3 className="text-xs md:text-sm" style={{ fontFamily: "'Cinzel', serif" }}>
              Библейская мудрость
            </h3>
            <p className="text-[10px] md:text-xs text-muted-foreground text-center hidden md:block">
              Ответы основаны на Священном Писании
            </p>
          </div>

          <div className="flex flex-col items-center gap-1 md:gap-3 p-2 md:p-6 rounded-xl bg-card/50 border border-border hover:shadow-lg transition-all">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-primary" />
            </div>
            <h3 className="text-xs md:text-sm" style={{ fontFamily: "'Cinzel', serif" }}>
              Духовная поддержка
            </h3>
            <p className="text-[10px] md:text-xs text-muted-foreground text-center hidden md:block">
              Наставления для вашего духовного пути
            </p>
          </div>
        </div>

        {/* Start Button */}
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-300">
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