import { userApi } from './api';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private permission: NotificationPermission = 'default';

  constructor() {
    this.permission = Notification.permission;
  }

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      // Temporarily disable service worker registration until sw.js is created
      console.log('Service Worker registration disabled - sw.js not yet implemented');
      
      // Register service worker (disabled for now)
      // this.registration = await navigator.serviceWorker.register('/sw.js');
      // console.log('Service Worker registered:', this.registration);

      // Listen for messages from service worker
      // navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage);

      return true;
    } catch (error) {
      console.error('Failed to register service worker:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (this.permission !== 'default') {
      return this.permission;
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      this.permission = 'denied';
      return this.permission;
    }
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error('Service worker not registered');
      return null;
    }

    if (this.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Push notification permission denied');
        return null;
      }
    }

    try {
      // Check if already subscribed
      let subscription = await this.registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.getVapidPublicKey())
        });
      }

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        const success = await subscription.unsubscribe();
        if (success) {
          await this.removeSubscriptionFromServer(subscription);
        }
        return success;
      }
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  async showNotification(payload: NotificationPayload): Promise<void> {
    if (this.permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted');
      return;
    }

    if (!this.registration) {
      // Fallback to browser notification
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/football.svg',
        badge: payload.badge || '/football.svg',
        tag: payload.tag,
        data: payload.data,
        requireInteraction: payload.requireInteraction,
        silent: payload.silent
      });
      return;
    }

    try {
      await this.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/football.svg',
        badge: payload.badge || '/football.svg',
        tag: payload.tag,
        data: payload.data,
        actions: payload.actions,
        requireInteraction: payload.requireInteraction,
        silent: payload.silent
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  async showMatchNotification(match: any, event: string): Promise<void> {
    let title = '';
    let body = '';
    let tag = `match-${match.id}`;

    switch (event) {
      case 'goal':
        title = '⚽ GOAL!';
        body = `${match.home_team.name} ${match.home_score} - ${match.away_score} ${match.away_team.name}`;
        break;
      case 'red_card':
        title = '🟥 Red Card!';
        body = `${match.home_team.name} vs ${match.away_team.name}`;
        break;
      case 'match_start':
        title = '🏁 Match Started';
        body = `${match.home_team.name} vs ${match.away_team.name}`;
        break;
      case 'halftime':
        title = '⏱️ Half Time';
        body = `${match.home_team.name} ${match.home_score} - ${match.away_score} ${match.away_team.name}`;
        break;
      case 'fulltime':
        title = '🏁 Full Time';
        body = `${match.home_team.name} ${match.home_score} - ${match.away_score} ${match.away_team.name}`;
        break;
      default:
        title = 'Match Update';
        body = `${match.home_team.name} vs ${match.away_team.name}`;
    }

    await this.showNotification({
      title,
      body,
      tag,
      data: { matchId: match.id, event },
      actions: [
        { action: 'view', title: 'View Match', icon: '/icons/view.png' },
        { action: 'close', title: 'Close', icon: '/icons/close.png' }
      ],
      requireInteraction: event === 'goal' || event === 'fulltime'
    });
  }

  async showTeamNotification(team: any, message: string): Promise<void> {
    await this.showNotification({
      title: `📢 ${team.name}`,
      body: message,
      tag: `team-${team.id}`,
      data: { teamId: team.id },
      actions: [
        { action: 'view', title: 'View Team', icon: '/icons/view.png' },
        { action: 'close', title: 'Close', icon: '/icons/close.png' }
      ]
    });
  }

  async showPlayerNotification(player: any, message: string): Promise<void> {
    await this.showNotification({
      title: `⭐ ${player.name}`,
      body: message,
      tag: `player-${player.id}`,
      data: { playerId: player.id },
      actions: [
        { action: 'view', title: 'View Player', icon: '/icons/view.png' },
        { action: 'close', title: 'Close', icon: '/icons/close.png' }
      ]
    });
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await userApi.updatePreferences({
        push_subscription: JSON.stringify(subscription)
      });
      console.log('Push subscription sent to server');
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      await userApi.updatePreferences({
        push_subscription: null
      });
      console.log('Push subscription removed from server');
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }

  private handleServiceWorkerMessage = (event: MessageEvent) => {
    console.log('Message from service worker:', event.data);
    
    if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
      const { action, data } = event.data;
      this.handleNotificationAction(action, data);
    }
  };

  private handleNotificationAction(action: string, data: any) {
    switch (action) {
      case 'view':
        if (data.matchId) {
          window.open(`/matches/${data.matchId}`, '_blank');
        } else if (data.teamId) {
          window.open(`/teams/${data.teamId}`, '_blank');
        } else if (data.playerId) {
          window.open(`/players/${data.playerId}`, '_blank');
        }
        break;
      case 'close':
        // Notification closed, no action needed
        break;
      default:
        console.log('Unknown notification action:', action);
    }
  }

  private getVapidPublicKey(): string {
    // In a real app, this would come from your environment variables
    return process.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI8YlOU1h1GFgM8ikpEcC6QQHW1HqiFKsJMYjlVJi0fM_oHD3qp4dKOA5s';
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  get isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  get hasPermission(): boolean {
    return this.permission === 'granted';
  }

  get permissionStatus(): NotificationPermission {
    return this.permission;
  }
}

export const notificationService = new NotificationService();