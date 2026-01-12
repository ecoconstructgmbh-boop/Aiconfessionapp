import { useState } from "react";
import { X, Heart, Sparkles, DollarSign } from "lucide-react";

interface DonationModalProps {
  onClose: () => void;
}

export function DonationModal({ onClose }: DonationModalProps) {
  const [amount, setAmount] = useState(5);

  const handleDonate = () => {
    // В будущем здесь будет интеграция с платежной системой
    alert(`Спасибо за ваше пожертвование в размере $${amount}! Интеграция с платежной системой будет добавлена в ближайшее время.`);
    onClose();
  };

  const getEncouragementText = (amount: number) => {
    if (amount >= 100) return "Невероятная щедрость! 🌟";
    if (amount >= 50) return "Великодушный дар! 🙏";
    if (amount >= 25) return "Благородное пожертвование! ✨";
    if (amount >= 10) return "Большое спасибо! 💝";
    if (amount >= 5) return "Очень ценим вашу поддержку! 💛";
    return "Каждый вклад важен! 💙";
  };

  const getHeartSize = (amount: number) => {
    if (amount >= 100) return "w-16 h-16";
    if (amount >= 50) return "w-14 h-14";
    if (amount >= 25) return "w-12 h-12";
    if (amount >= 10) return "w-10 h-10";
    return "w-8 h-8";
  };

  const getGlowIntensity = (amount: number) => {
    const intensity = Math.min(amount / 100, 1);
    return `0 0 ${20 + intensity * 30}px rgba(var(--accent-rgb), ${0.3 + intensity * 0.5})`;
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
                <div 
                  className="absolute inset-0 blur-xl rounded-full transition-all duration-300"
                  style={{ boxShadow: getGlowIntensity(amount) }}
                ></div>
                <div 
                  className={`relative ${getHeartSize(amount)} rounded-full bg-gradient-to-br from-red-400/30 to-pink-500/30 flex items-center justify-center border-2 border-red-400/40 transition-all duration-300`}
                  style={{ boxShadow: getGlowIntensity(amount) }}
                >
                  <Heart className={`${getHeartSize(amount)} text-red-500 fill-red-400/50 transition-all duration-300`} />
                </div>
              </div>
            </div>
            
            <div>
              <h2
                className="text-3xl text-primary mb-2"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Поддержать проект
              </h2>
              <p className="text-sm text-muted-foreground">
                Ваши пожертвования помогают развивать духовные инструменты
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Amount Display */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="w-8 h-8 text-accent" />
              <div 
                className="text-6xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent transition-all duration-300"
                style={{ 
                  fontSize: `${Math.min(3.75 + amount / 25, 5)}rem`,
                  filter: `brightness(${1 + amount / 200})`
                }}
              >
                {amount}
              </div>
            </div>
            <p className="text-lg text-accent font-semibold animate-pulse">
              {getEncouragementText(amount)}
            </p>
          </div>

          {/* Slider */}
          <div className="space-y-4">
            <div className="relative">
              <input
                type="range"
                min="1"
                max="100"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-3 bg-secondary rounded-full appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, 
                    hsl(var(--accent)) 0%, 
                    hsl(var(--accent)) ${amount}%, 
                    hsl(var(--secondary)) ${amount}%, 
                    hsl(var(--secondary)) 100%)`
                }}
              />
              <style>{`
                .slider::-webkit-slider-thumb {
                  appearance: none;
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)));
                  cursor: pointer;
                  border: 3px solid white;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.2), 0 0 20px rgba(var(--accent-rgb), 0.4);
                  transition: all 0.2s;
                }
                .slider::-webkit-slider-thumb:hover {
                  transform: scale(1.2);
                  box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 30px rgba(var(--accent-rgb), 0.6);
                }
                .slider::-moz-range-thumb {
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)));
                  cursor: pointer;
                  border: 3px solid white;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.2), 0 0 20px rgba(var(--accent-rgb), 0.4);
                  transition: all 0.2s;
                }
                .slider::-moz-range-thumb:hover {
                  transform: scale(1.2);
                  box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 30px rgba(var(--accent-rgb), 0.6);
                }
              `}</style>
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$1</span>
              <span>$50</span>
              <span>$100+</span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 25, 50].map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  amount === quickAmount
                    ? 'bg-gradient-to-r from-accent to-primary text-white shadow-lg scale-105'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                ${quickAmount}
              </button>
            ))}
          </div>

          {/* Benefits */}
          <div className="p-4 bg-accent/10 border border-accent/30 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <p className="text-sm font-medium text-foreground">На что пойдут средства:</p>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground pl-6">
              <li>• Развитие новых духовных функций</li>
              <li>• Поддержка серверов и инфраструктуры</li>
              <li>• Улучшение качества AI-наставника</li>
              <li>• Создание контента и переводы</li>
            </ul>
          </div>

          {/* Custom Amount Input */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground whitespace-nowrap">
              Своя сумма:
            </label>
            <div className="relative flex-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                min="1"
                max="10000"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, Math.min(10000, Number(e.target.value))))}
                className="w-full pl-9 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Введите сумму"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-all"
            >
              Отмена
            </button>
            <button
              onClick={handleDonate}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-accent to-primary text-white rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-semibold"
              style={{
                transform: amount >= 50 ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.3s'
              }}
            >
              <Heart className="w-5 h-5" />
              Пожертвовать ${amount}
            </button>
          </div>

          {/* Thank You Note */}
          <p className="text-xs text-center text-muted-foreground italic">
            Спасибо за вашу веру в наш проект! 🙏
          </p>
        </div>
      </div>
    </div>
  );
}
