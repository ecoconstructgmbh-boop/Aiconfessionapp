import { useState, useRef } from "react";
import { X, MessageSquare, AlertCircle, Upload, Check } from "lucide-react";
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { User } from "../lib/supabase";

interface FeedbackModalProps {
  onClose: () => void;
  user?: User | null;
}

export function FeedbackModal({ onClose, user }: FeedbackModalProps) {
  const [type, setType] = useState<'complaint' | 'feedback'>('feedback');
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Файл слишком большой. Максимальный размер 5 МБ.');
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert('Пожалуйста, введите сообщение');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert image to base64 if present
      let imageBase64 = null;
      if (imageFile) {
        const reader = new FileReader();
        imageBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(imageFile);
        });
      }

      // Submit feedback
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed36fee5/feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            userId: user?.id || null,
            userName: user?.name || 'Аноним',
            userEmail: user?.email || null,
            type,
            message,
            imageBase64,
          }),
        }
      );

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Произошла ошибка при отправке. Пожалуйста, попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300 p-4">
        <div className="bg-card border-2 border-accent/20 rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in duration-500 p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-center text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
              Спасибо!
            </h3>
            <p className="text-center text-muted-foreground">
              Ваше {type === 'complaint' ? 'жалоба' : 'предложение'} отправлено. Мы обязательно рассмотрим его.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300 p-4">
      <div className="bg-card border-2 border-accent/20 rounded-2xl max-w-lg w-full shadow-2xl animate-in zoom-in duration-500 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-accent/20 to-primary/10 p-6 border-b border-accent/20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-background/50 hover:bg-background transition-all"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center border-2 border-accent/30">
              <MessageSquare className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl text-primary" style={{ fontFamily: "'Cinzel', serif" }}>
                Обратная связь
              </h2>
              <p className="text-sm text-muted-foreground">
                Помогите нам стать лучше
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Тип сообщения:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setType('feedback')}
                disabled={isSubmitting}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  type === 'feedback'
                    ? 'bg-gradient-to-r from-accent to-primary text-white shadow-lg'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Предложение
              </button>
              <button
                onClick={() => setType('complaint')}
                disabled={isSubmitting}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  type === 'complaint'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Жалоба
              </button>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Ваше сообщение:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
              placeholder={type === 'complaint' ? 'Опишите проблему подробно...' : 'Поделитесь своими идеями...'}
              className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent min-h-[120px] resize-none"
              maxLength={1000}
            />
            <div className="mt-1 text-xs text-muted-foreground text-right">
              {message.length} / 1000
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Прикрепить изображение (необязательно):
            </label>
            
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full rounded-lg border border-border max-h-64 object-cover"
                />
                <button
                  onClick={removeImage}
                  disabled={isSubmitting}
                  className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full hover:opacity-90 transition-all shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="w-full px-4 py-8 border-2 border-dashed border-border rounded-lg hover:border-accent transition-all flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Upload className="w-8 h-8" />
                <span className="text-sm">Нажмите для выбора изображения</span>
                <span className="text-xs">Максимум 5 МБ</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* User Info */}
          {user ? (
            <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Отправляется от: <span className="font-medium text-foreground">{user.name}</span>
              </p>
            </div>
          ) : (
            <div className="p-3 bg-secondary/50 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">
                Вы отправляете анонимно. Войдите для получения ответа.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-all disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !message.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-accent to-primary text-white rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 font-semibold"
            >
              {isSubmitting ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
