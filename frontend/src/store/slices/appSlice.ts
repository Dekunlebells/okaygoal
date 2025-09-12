import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppState, Theme, Notification } from '@/types';

// Get initial theme from localStorage or system preference
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';
  
  const stored = localStorage.getItem('okaygoal-theme') as Theme;
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    return stored;
  }
  
  return 'system';
};

const initialState: AppState = {
  theme: getInitialTheme(),
  sidebarOpen: false,
  notifications: [],
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('okaygoal-theme', action.payload);
        
        // Apply theme to document
        const root = document.documentElement;
        if (action.payload === 'dark') {
          root.classList.add('dark');
        } else if (action.payload === 'light') {
          root.classList.remove('dark');
        } else {
          // System theme
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      }
    },
    
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const notification: Notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload,
      };
      state.notifications.unshift(notification);
      
      // Keep only the latest 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  clearAllNotifications,
} = appSlice.actions;

// Selectors
export const selectTheme = (state: { app: AppState }) => state.app.theme;
export const selectSidebarOpen = (state: { app: AppState }) => state.app.sidebarOpen;
export const selectNotifications = (state: { app: AppState }) => state.app.notifications;
export const selectUnreadNotificationsCount = (state: { app: AppState }) => 
  state.app.notifications.filter(n => !n.read).length;

export default appSlice.reducer;