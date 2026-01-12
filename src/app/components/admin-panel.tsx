import { useState, useEffect } from "react";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  MessageSquare,
  Search,
  Filter,
  Crown,
  Calendar,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Trash2
} from "lucide-react";
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  karma: number;
  confessionsCount: number;
  hasSubscription: boolean;
  totalDonations: number;
}

interface Feedback {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  type: 'complaint' | 'feedback';
  message: string;
  imageBase64: string | null;
  status: 'new' | 'reviewed' | 'resolved';
  createdAt: string;
}

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'feedback'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        await loadUsers();
      } else {
        await loadFeedback();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ed36fee5/admin/users`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      setUsers(data.users || []);
    }
  };

  const loadFeedback = async () => {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ed36fee5/admin/feedback`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      setFeedback(data.feedback || []);
    }
  };

  const updateFeedbackStatus = async (feedbackId: string, status: string) => {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ed36fee5/admin/feedback/${feedbackId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ status }),
      }
    );

    if (response.ok) {
      await loadFeedback();
      if (selectedFeedback?.id === feedbackId) {
        const updated = feedback.find(f => f.id === feedbackId);
        if (updated) {
          setSelectedFeedback({ ...updated, status: status as any });
        }
      }
    }
  };

  const deleteFeedback = async (feedbackId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту жалобу/предложение?')) {
      return;
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ed36fee5/admin/feedback/${feedbackId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      }
    );

    if (response.ok) {
      await loadFeedback();
      setSelectedFeedback(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFeedback = feedback.filter(item =>
    item.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalUsers: users.length,
    subscribedUsers: users.filter(u => u.hasSubscription).length,
    totalConfessions: users.reduce((sum, u) => sum + u.confessionsCount, 0),
    totalDonations: users.reduce((sum, u) => sum + u.totalDonations, 0),
    newFeedback: feedback.filter(f => f.status === 'new').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'reviewed':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return 'Новое';
      case 'reviewed':
        return 'Просмотрено';
      case 'resolved':
        return 'Решено';
      default:
        return status;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-240px)] animate-in fade-in duration-700 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full p-6 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary" style={{ fontFamily: "'Cinzel', serif" }}>
            Админ-панель
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-card rounded-xl shadow-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Пользователей</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Crown className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">С подпиской</p>
                <p className="text-2xl font-bold text-foreground">{stats.subscribedUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Исповедей</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalConfessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Донаты</p>
                <p className="text-2xl font-bold text-foreground">${stats.totalDonations}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Новых жалоб</p>
                <p className="text-2xl font-bold text-foreground">{stats.newFeedback}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Пользователи
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'feedback'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Жалобы и предложения
            {stats.newFeedback > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {stats.newFeedback}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={activeTab === 'users' ? 'Поиск пользователей...' : 'Поиск жалоб...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : activeTab === 'users' ? (
          /* Users Table */
          <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Пользователь</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Регистрация</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Карма</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Исповеди</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Тариф</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Донаты</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr key={user.id} className={index % 2 === 0 ? 'bg-background' : 'bg-secondary/30'}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{user.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${
                          user.karma >= 50 ? 'text-green-500' : 
                          user.karma >= 0 ? 'text-yellow-500' : 
                          'text-red-500'
                        }`}>
                          {user.karma}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-foreground">{user.confessionsCount}</span>
                      </td>
                      <td className="px-6 py-4">
                        {user.hasSubscription ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-sm font-medium">
                            <Crown className="w-4 h-4" />
                            Premium
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Free</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-green-500">${user.totalDonations}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Пользователи не найдены
              </div>
            )}
          </div>
        ) : (
          /* Feedback List */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feedback List */}
            <div className="space-y-4">
              {filteredFeedback.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedFeedback(item)}
                  className={`bg-card rounded-xl shadow border transition-all cursor-pointer ${
                    selectedFeedback?.id === item.id
                      ? 'border-accent'
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className="text-sm font-medium text-foreground">
                          {getStatusLabel(item.status)}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.type === 'complaint' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {item.type === 'complaint' ? 'Жалоба' : 'Предложение'}
                      </span>
                    </div>

                    <div className="mb-2">
                      <p className="font-medium text-foreground">{item.userName}</p>
                      {item.userEmail && (
                        <p className="text-sm text-muted-foreground">{item.userEmail}</p>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {item.message}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleString('ru-RU')}
                    </div>

                    {item.imageBase64 && (
                      <div className="mt-2">
                        <span className="text-xs text-accent">📎 Прикреплено изображение</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredFeedback.length === 0 && (
                <div className="bg-card rounded-xl shadow-lg border border-border p-8 text-center text-muted-foreground">
                  Жалобы и предложения не найдены
                </div>
              )}
            </div>

            {/* Feedback Detail */}
            {selectedFeedback ? (
              <div className="bg-card rounded-xl shadow-lg border border-border p-6 sticky top-6 h-fit">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Детали</h3>
                  <button
                    onClick={() => setSelectedFeedback(null)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Тип:</label>
                    <p className={`font-medium ${
                      selectedFeedback.type === 'complaint' ? 'text-red-500' : 'text-blue-500'
                    }`}>
                      {selectedFeedback.type === 'complaint' ? 'Жалоба' : 'Предложение'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground">Статус:</label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(selectedFeedback.status)}
                      <span className="font-medium text-foreground">
                        {getStatusLabel(selectedFeedback.status)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground">От:</label>
                    <p className="font-medium text-foreground">{selectedFeedback.userName}</p>
                    {selectedFeedback.userEmail && (
                      <p className="text-sm text-muted-foreground">{selectedFeedback.userEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground">Дата:</label>
                    <p className="text-sm text-foreground">
                      {new Date(selectedFeedback.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground">Сообщение:</label>
                    <p className="mt-2 text-foreground whitespace-pre-wrap">
                      {selectedFeedback.message}
                    </p>
                  </div>

                  {selectedFeedback.imageBase64 && (
                    <div>
                      <label className="text-sm text-muted-foreground">Прикрепленное изображение:</label>
                      <img
                        src={`data:image/png;base64,${selectedFeedback.imageBase64}`}
                        alt="Attachment"
                        className="mt-2 w-full rounded-lg border border-border"
                      />
                    </div>
                  )}

                  <div className="pt-4 border-t border-border space-y-2">
                    <label className="text-sm text-muted-foreground">Изменить статус:</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => updateFeedbackStatus(selectedFeedback.id, 'new')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedFeedback.status === 'new'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-secondary text-foreground hover:bg-secondary/80'
                        }`}
                      >
                        Новое
                      </button>
                      <button
                        onClick={() => updateFeedbackStatus(selectedFeedback.id, 'reviewed')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedFeedback.status === 'reviewed'
                            ? 'bg-blue-500 text-white'
                            : 'bg-secondary text-foreground hover:bg-secondary/80'
                        }`}
                      >
                        Просмотрено
                      </button>
                      <button
                        onClick={() => updateFeedbackStatus(selectedFeedback.id, 'resolved')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedFeedback.status === 'resolved'
                            ? 'bg-green-500 text-white'
                            : 'bg-secondary text-foreground hover:bg-secondary/80'
                        }`}
                      >
                        Решено
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteFeedback(selectedFeedback.id)}
                    className="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-xl shadow-lg border border-border p-8 text-center text-muted-foreground sticky top-6">
                Выберите жалобу или предложение для просмотра деталей
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
