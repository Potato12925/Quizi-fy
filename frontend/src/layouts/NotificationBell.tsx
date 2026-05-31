import { useEffect, useMemo, useRef, useState } from 'react';
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead, type NotificationItem } from '@/api/notificationsApi';

const formatDateTime = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const loadNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getNotifications({ page: 1, limit: 10 });
      setItems(result.items);
      setUnreadCount(result.meta?.unread_count ?? 0);
    } catch {
      setError('Không thể tải thông báo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasUnread = useMemo(() => unreadCount > 0, [unreadCount]);

  const handleMarkOneRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      setItems((prev) => prev.map((item) => (item.notification_id === notificationId ? { ...item, is_read: true } : item)));
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch {
      setError('Không thể tải thông báo');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch {
      setError('Không thể tải thông báo');
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#b20112] transition-colors cursor-pointer border border-slate-100 shadow-sm relative"
      >
        <span className="text-lg material-symbols-outlined">notifications</span>
        {hasUnread && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#b20112] text-white text-[10px] font-black flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[360px] max-w-[calc(100vw-2rem)] bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-slate-700">Thông báo</p>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={!hasUnread}
              className="text-[10px] font-black uppercase tracking-wider text-[#b20112] disabled:text-slate-300 cursor-pointer"
            >
              Đánh dấu tất cả đã đọc
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center text-xs font-bold text-slate-400">Đang tải...</div>
            ) : error ? (
              <div className="p-6 text-center text-xs font-bold text-[#b20112]">{error}</div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center text-xs font-bold text-slate-400">Chưa có thông báo</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((item) => (
                  <li key={item.notification_id} className={`p-4 ${item.is_read ? 'bg-white' : 'bg-red-50/30'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900">{item.title || 'Thông báo'}</p>
                        <p className="text-xs text-slate-600">{item.content || ''}</p>
                        <p className="text-[10px] font-bold text-slate-400">{formatDateTime(item.created_at)}</p>
                      </div>
                      {!item.is_read && (
                        <button
                          type="button"
                          onClick={() => handleMarkOneRead(item.notification_id)}
                          className="text-[10px] font-black uppercase tracking-wider text-[#b20112] cursor-pointer"
                        >
                          Đã đọc
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
