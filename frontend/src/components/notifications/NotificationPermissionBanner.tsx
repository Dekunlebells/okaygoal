import React, { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { notificationService } from '@/services/notifications';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectUser } from '@/store/slices/authSlice';
import { updateUserPreferences } from '@/store/slices/userSlice';

interface NotificationPermissionBannerProps {
  className?: string;
}

export const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({ 
  className = '' 
}) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const [isVisible, setIsVisible] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if we should show the banner
    const checkShowBanner = () => {
      if (!notificationService.isSupported) return;
      if (!user) return;
      
      const currentPermission = notificationService.permissionStatus;
      setPermission(currentPermission);
      
      // Show banner if:
      // 1. Notifications are supported
      // 2. User is logged in
      // 3. Permission is not granted
      // 4. User hasn't dismissed it recently
      const dismissed = localStorage.getItem('notification-banner-dismissed');
      const dismissedTime = dismissed ? parseInt(dismissed) : 0;
      const showAgainAfter = 24 * 60 * 60 * 1000; // 24 hours
      
      if (currentPermission !== 'granted' && 
          (!dismissed || Date.now() - dismissedTime > showAgainAfter)) {
        setIsVisible(true);
      }
    };

    checkShowBanner();
  }, [user]);

  const handleEnableNotifications = async () => {
    setIsEnabling(true);
    try {
      const granted = await notificationService.requestPermission();
      setPermission(granted);
      
      if (granted === 'granted') {
        await notificationService.subscribeToPush();
        
        // Update user preferences
        await dispatch(updateUserPreferences({
          notification_settings: {
            push_notifications: true,
            live_matches: true,
            team_updates: true,
            player_updates: true
          }
        }));
        
        setIsVisible(false);
        
        // Show success notification
        setTimeout(() => {
          notificationService.showNotification({
            title: '🔔 Notifications Enabled!',
            body: 'You\'ll now receive live updates about your followed teams and matches.',
            tag: 'welcome'
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('notification-banner-dismissed', Date.now().toString());
  };

  if (!isVisible || permission === 'granted') {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 ${className}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Stay Updated with Live Scores!</h3>
              <p className="text-primary-100 text-sm">
                Enable notifications to get instant updates about your followed teams, live goals, and match results.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 ml-4">
            <Button
              onClick={handleEnableNotifications}
              disabled={isEnabling}
              className="bg-white text-primary-600 hover:bg-gray-100 font-medium"
            >
              {isEnabling ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  <span>Enabling...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>Enable Notifications</span>
                </div>
              )}
            </Button>
            
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};