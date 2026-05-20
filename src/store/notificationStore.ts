import { create } from 'zustand';
import type { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),

  addNotification: (notification) => {
    const state = get();
    set({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.read ? 0 : 1),
    });
  },

  markAsRead: (id) => {
    const state = get();
    const updated = state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.read).length,
    });
  },

  markAllAsRead: () => {
    const state = get();
    set({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    });
  },

  removeNotification: (id) => {
    const state = get();
    const notification = state.notifications.find((n) => n.id === id);
    const updated = state.notifications.filter((n) => n.id !== id);
    set({
      notifications: updated,
      unreadCount:
        notification && !notification.read
          ? state.unreadCount - 1
          : state.unreadCount,
    });
  },
}));

export default useNotificationStore;
