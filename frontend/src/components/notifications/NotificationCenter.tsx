import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Clock, Star, Trophy, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/slices/authSlice';
import { notificationService } from '@/services/notifications';
import { useNavigate } from 'react-router-dom';
// Simple time formatting function to replace date-fns
const formatDistanceToNow = (date: Date, options?: { addSuffix?: boolean }) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ${options?.addSuffix ? 'ago' : ''}`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ${options?.addSuffix ? 'ago' : ''}`;
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ${options?.addSuffix ? 'ago' : ''}`;
};

interface Notification {
  id: string;
  type: 'match' | 'team' | 'player' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  actions?: NotificationAction[];
}

interface NotificationAction {
  id: string;
  label: string;
  action: () => void;
  primary?: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      setPushPermission(notificationService.permissionStatus);
    }
  }, [isOpen]);

  useEffect(() => {
    // Mock notifications for demo
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'match',
        title: '⚽ GOAL! Liverpool 2-1 Arsenal',
        message: 'Mohamed Salah scores in the 67th minute',
        data: { matchId: 123 },
        read: false,
        createdAt: new Date(Date.now() - 300000), // 5 minutes ago
        actions: [
          {
            id: 'view',
            label: 'View Match',
            action: () => navigate('/matches/123'),
            primary: true
          }
        ]
      },
      {
        id: '2',
        type: 'team',
        title: '📢 Manchester United News',
        message: 'New signing confirmed: Midfielder joins on 4-year deal',
        data: { teamId: 456 },
        read: false,
        createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
        actions: [
          {
            id: 'view',
            label: 'View Team',
            action: () => navigate('/teams/456'),
            primary: true
          }
        ]
      },
      {
        id: '3',
        type: 'match',
        title: '🏁 Match Started',
        message: 'Chelsea vs Tottenham - Premier League',
        data: { matchId: 789 },
        read: true,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        actions: [
          {
            id: 'view',
            label: 'View Match',
            action: () => navigate('/matches/789')
          }
        ]
      },
      {
        id: '4',
        type: 'player',
        title: '⭐ Player Milestone',
        message: 'Cristiano Ronaldo reaches 800 career goals',
        data: { playerId: 101 },
        read: true,
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
        actions: [
          {
            id: 'view',
            label: 'View Player',
            action: () => navigate('/players/101')
          }
        ]
      }
    ];

    setNotifications(mockNotifications);
  }, [navigate]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would fetch from the API
      // const response = await notificationsApi.getNotifications();
      // setNotifications(response.data.data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const enablePushNotifications = async () => {
    const permission = await notificationService.requestPermission();
    setPushPermission(permission);
    
    if (permission === 'granted') {
      await notificationService.subscribeToPush();
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'match':
        return Trophy;
      case 'team':
        return Star;
      case 'player':
        return User;
      case 'system':
        return Settings;
      default:
        return Bell;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {unreadCount} unread
                </p>
              )}
            </div>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="p-2">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Push Permission Banner */}
        {pushPermission !== 'granted' && notificationService.isSupported && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-3">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Enable Push Notifications
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Get instant updates about your followed teams and matches
                </p>
                <Button
                  onClick={enablePushNotifications}
                  size="sm"
                  className="mt-2 bg-blue-600 hover:bg-blue-700"
                >
                  Enable Notifications
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <Button
              onClick={markAllAsRead}
              variant="ghost"
              size="sm"
              disabled={unreadCount === 0}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
            <Button
              onClick={clearAllNotifications}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Clear All
            </Button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner size="md" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No notifications
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You'll see live match updates and news here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        notification.type === 'match' ? 'bg-green-100 dark:bg-green-900/20' :
                        notification.type === 'team' ? 'bg-blue-100 dark:bg-blue-900/20' :
                        notification.type === 'player' ? 'bg-purple-100 dark:bg-purple-900/20' :
                        'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          notification.type === 'match' ? 'text-green-600 dark:text-green-400' :
                          notification.type === 'team' ? 'text-blue-600 dark:text-blue-400' :
                          notification.type === 'player' ? 'text-purple-600 dark:text-purple-400' :
                          'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                                </span>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.read && (
                              <Button
                                onClick={() => markAsRead(notification.id)}
                                variant="ghost"
                                size="sm"
                                className="p-1"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              onClick={() => deleteNotification(notification.id)}
                              variant="ghost"
                              size="sm"
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete notification"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        {notification.actions && notification.actions.length > 0 && (
                          <div className="flex items-center space-x-2 mt-3">
                            {notification.actions.map((action) => (
                              <Button
                                key={action.id}
                                onClick={() => {
                                  action.action();
                                  markAsRead(notification.id);
                                  onClose();
                                }}
                                variant={action.primary ? 'primary' : 'secondary'}
                                size="sm"
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};