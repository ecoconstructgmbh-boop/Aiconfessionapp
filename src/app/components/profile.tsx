import { useState, useEffect } from "react";
import { User, UserProfile, getUserProfile, saveUserProfile } from "../lib/supabase";
import { signOut } from "../lib/supabase";
import { 
  User as UserIcon, 
  LogOut, 
  Mail, 
  Edit2, 
  Save, 
  X, 
  MapPin, 
  Globe, 
  Star,
  Sparkles,
  Crown,
  Infinity,
  Calendar
} from "lucide-react";

interface ProfileProps {
  user: User;
  onSignOut: () => void;
}

export function Profile({ user, onSignOut }: ProfileProps) {
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    city: '',
    language: 'Русский',
    karma: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);

  useEffect(() => {
    loadProfile();
  }, [user.id]);

  const loadProfile = async () => {
    const userProfile = await getUserProfile(user.id);
    if (userProfile) {
      setProfile(userProfile);
      setEditedProfile(userProfile);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onSignOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleEdit = () => {
    setEditedProfile(profile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveUserProfile(user.id, editedProfile);
      setProfile(editedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getKarmaColor = (karma: number) => {
    if (karma >= 100) return "text-green-500";
    if (karma >= 50) return "text-blue-500";
    if (karma >= 0) return "text-yellow-500";
    return "text-red-500";
  };

  const getKarmaLabel = (karma: number) => {
    if (karma >= 100) return "Праведник";
    if (karma >= 50) return "Благочестивый";
    if (karma >= 10) return "Ищущий";
    if (karma > 0) return "Начинающий";
    return "Новичок";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-240px)] animate-in fade-in duration-700 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full space-y-6 p-6">
        {/* Profile Header */}
        <div className="bg-card rounded-xl shadow-lg border border-border p-8 text-center relative">
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary transition-colors text-primary"
              aria-label="Edit profile"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}

          <div className="flex justify-center mb-4">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-24 h-24 rounded-full border-4 border-accent/30 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center shadow-md">
                <UserIcon className="w-12 h-12 text-primary" />
              </div>
            )}
          </div>

          <h2
            className="text-2xl text-primary mb-2"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {user.name}
          </h2>

          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6">
            <Mail className="w-4 h-4" />
            <p className="text-sm">{user.email}</p>
          </div>

          <div className="border-t border-border pt-6 space-y-4">
            {/* First Name */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Имя:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.firstName}
                  onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                  className="px-3 py-1 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Введите имя"
                />
              ) : (
                <span className="text-sm font-medium">
                  {profile.firstName || <span className="text-muted-foreground">Не указано</span>}
                </span>
              )}
            </div>

            {/* Last Name */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Фамилия:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.lastName}
                  onChange={(e) => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                  className="px-3 py-1 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Введите фамилию"
                />
              ) : (
                <span className="text-sm font-medium">
                  {profile.lastName || <span className="text-muted-foreground">Не указано</span>}
                </span>
              )}
            </div>

            {/* City */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Город:</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.city}
                  onChange={(e) => setEditedProfile({ ...editedProfile, city: e.target.value })}
                  className="px-3 py-1 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Введите город"
                />
              ) : (
                <span className="text-sm font-medium">
                  {profile.city || <span className="text-muted-foreground">Не указано</span>}
                </span>
              )}
            </div>

            {/* Language */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Язык:</span>
              </div>
              {isEditing ? (
                <select
                  value={editedProfile.language}
                  onChange={(e) => setEditedProfile({ ...editedProfile, language: e.target.value })}
                  className="px-3 py-1 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="Русский">Русский</option>
                  <option value="English">English</option>
                  <option value="Español">Español</option>
                  <option value="Français">Français</option>
                  <option value="Deutsch">Deutsch</option>
                </select>
              ) : (
                <span className="text-sm font-medium">{profile.language}</span>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="flex gap-3 mt-6 justify-center">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Сохранение..." : "Сохранить"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-6 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Отмена
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignOut}
              className="mt-6 px-6 py-3 bg-destructive text-destructive-foreground rounded-xl hover:opacity-90 transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          )}
        </div>

        {/* Karma Card */}
        <div className="bg-card rounded-xl shadow-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-lg text-primary flex items-center gap-2"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <Star className="w-5 h-5 text-accent" />
              Карма
            </h3>
            <span className={`text-2xl font-bold ${getKarmaColor(profile.karma)}`}>
              {profile.karma}
            </span>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Уровень:</span>
              <span className="font-medium text-accent">{getKarmaLabel(profile.karma)}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-gradient-to-r from-accent to-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((profile.karma / 100) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-foreground mb-1">
                  Карма растет с каждой исповедью и добрым делом
                </p>
                <p className="text-xs text-muted-foreground">
                  Ваша карма отражает ваш духовный путь и стремление к праведности
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="bg-card rounded-xl shadow-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-lg text-primary flex items-center gap-2"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <Crown className="w-5 h-5 text-accent" />
              Подписка
            </h3>
          </div>

          {profile.hasSubscription ? (
            <div className="space-y-4">
              {/* Active subscription */}
              <div className="p-4 bg-gradient-to-br from-accent/20 to-primary/10 border border-accent/30 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center border-2 border-accent/30">
                    <Infinity className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Premium активна</p>
                    <p className="text-sm text-muted-foreground">Безлимитные исповеди</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span className="text-muted-foreground">Неограниченное количество исповедей</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span className="text-muted-foreground">Полная история всех бесед</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span className="text-muted-foreground">Приоритетная поддержка</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Следующий платеж</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')}
                </span>
              </div>

              <button
                className="w-full px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-all text-sm"
              >
                Управление подпиской
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Free plan */}
              <div className="p-4 bg-secondary/30 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">Бесплатный план</p>
                    <p className="text-sm text-muted-foreground">Ограничено 2 исповеди в день</p>
                  </div>
                  <span className="text-2xl font-bold text-primary">$0</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                    <span className="text-muted-foreground">2 исповеди в день</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                    <span className="text-muted-foreground">История последних 10 исповедей</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                    <span className="text-muted-foreground">Базовая поддержка</span>
                  </div>
                </div>
              </div>

              {/* Upgrade offer */}
              <div className="p-4 bg-gradient-to-br from-accent/10 to-primary/5 border-2 border-accent/30 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center">
                    <Infinity className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Premium</p>
                    <p className="text-lg font-bold text-accent">$3<span className="text-sm text-muted-foreground">/месяц</span></p>
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span className="text-muted-foreground">Неограниченные исповеди</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span className="text-muted-foreground">Полная история всех бесед</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span className="text-muted-foreground">Приоритетная поддержка</span>
                  </li>
                </ul>

                <button
                  onClick={() => alert("Интеграция с платежной системой будет добавлена в ближайшее время.")}
                  className="w-full px-4 py-3 bg-gradient-to-r from-accent to-primary text-white rounded-lg hover:opacity-90 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Подписаться за $3
                </button>
              </div>
            </div>
          )}
        </div>

        {/* About Section */}
        <div className="bg-card rounded-xl shadow-lg border border-border p-6">
          <h3
            className="text-lg mb-4 text-primary"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            О приложении
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            ИИ Исповедь — это духовное пространство, где вы можете найти утешение
            через библейскую мудрость. Здесь нет осуждения, только любовь и
            понимание через Слово Божье.
          </p>
          <div className="mt-6 p-4 bg-secondary/30 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground italic text-center">
              "Ибо где двое или трое собраны во имя Мое, там Я посреди них"
              <br />
              <span className="text-accent">— Матфея 18:20</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}