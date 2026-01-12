import { useState } from "react";
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from "../lib/supabase";
import { Cross, Sparkles, Mail, Lock, User, AlertCircle } from "lucide-react";

export function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      setError(error.message || "Ошибка входа через Google");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          setError("Пожалуйста, введите ваше имя");
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Пароль должен быть не менее 6 символов");
          setIsLoading(false);
          return;
        }
        await signUpWithEmail(email, password, fullName);
        setError(""); // Success - user will be redirected
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error: any) {
      console.error("Error with email auth:", error);
      
      // Handle specific errors
      if (error.message && error.message.includes("already exists. Please sign in")) {
        setError("Этот email уже зарегистрирован. Пожалуйста, войдите в систему.");
        // Switch to sign in mode
        setTimeout(() => {
          setIsSignUp(false);
          setError("");
        }, 2000);
      } else if (error.message && error.message.includes("only request this after")) {
        const match = error.message.match(/after (\d+) seconds/);
        const seconds = match ? match[1] : "60";
        setError(`Слишком много попыток. Пожалуйста, подождите ${seconds} секунд и попробуйте снова.`);
      } else if (error.message && error.message.includes("Invalid login credentials")) {
        setError("Неверный email или пароль");
      } else if (error.message && error.message.includes("Email not confirmed")) {
        setError("Повторите попытку входа - email автоматически подтверждается.");
      } else {
        setError(error.message || "Ошибка аутентификации");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-240px)] animate-in fade-in duration-700 overflow-y-auto py-6">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="text-center space-y-6 mb-8">
          {/* Divine Symbol */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/10 blur-3xl rounded-full"></div>
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center shadow-2xl border-2 border-accent/20">
                <Cross className="w-12 h-12 text-primary" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="space-y-3">
            <h2
              className="text-3xl text-primary animate-in slide-in-from-bottom-4 duration-700"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {isSignUp ? "Регистрация" : "Вход в систему"}
            </h2>
            <p className="text-muted-foreground leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-100">
              {isSignUp
                ? "Создайте аккаунт для сохранения истории исповедей"
                : "Войдите, чтобы продолжить духовное путешествие"}
            </p>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Полное имя
                </div>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                placeholder="Введите ваше имя"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </div>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Пароль
              </div>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              placeholder="••••••••"
              required
              minLength={6}
            />
            {isSignUp && (
              <p className="text-xs text-muted-foreground mt-1">
                Минимум 6 символов
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2 animate-in fade-in duration-300">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Загрузка..."
              : isSignUp
              ? "Создать аккаунт"
              : "Войти"}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignUp
              ? "Уже есть аккаунт? Войти"
              : "Нет аккаунта? Зарегистрироваться"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">или</span>
          </div>
        </div>

        {/* Google Sign in Button */}
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <button
            onClick={handleGoogleSignIn}
            className="w-full px-8 py-4 bg-card border-2 border-border text-foreground rounded-xl hover:bg-secondary transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium">Войти через Google</span>
          </button>

          <p className="mt-4 text-xs text-muted-foreground italic text-center">
            Для работы Google OAuth требуется настройка в Supabase
          </p>
        </div>

        {/* Important Notice */}
        <div className="mt-6 p-4 bg-accent/10 border border-accent/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm text-foreground font-medium mb-1">
                Рекомендуется вход по email
              </p>
              <p className="text-xs text-muted-foreground">
                Вход по email/паролю работает сразу без дополнительной настройки.
                Google OAuth требует настройки провайдера в Supabase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
