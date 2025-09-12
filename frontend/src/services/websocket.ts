import { WebSocketMessage, LiveScoreUpdate } from '@/types';
import { store } from '@/store';
import { updateLiveScore, addMatchEvent } from '@/store/slices/matchesSlice';
import { addNotification } from '@/store/slices/appSlice';
import { notificationService } from '@/services/notifications';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000; // Start with 1 second
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isAuthenticated = false;
  private subscriptions = new Set<string>();

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  }

  public connect(token?: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    const wsUrl = token 
      ? `${this.getWebSocketUrl()}?token=${encodeURIComponent(token)}`
      : this.getWebSocketUrl();

    console.log('Connecting to WebSocket:', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.scheduleReconnect();
    }
  }

  private handleOpen(event: Event): void {
    console.log('WebSocket connected successfully');
    this.reconnectAttempts = 0;
    this.reconnectInterval = 1000;
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Re-subscribe to previous subscriptions
    this.resubscribeAll();
    
    // Dispatch connection success notification
    store.dispatch(addNotification({
      type: 'success',
      title: 'Connected',
      message: 'Real-time updates are now active',
    }));
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log('WebSocket message received:', message.type);

      switch (message.type) {
        case 'connection':
          this.handleConnectionMessage(message);
          break;
          
        case 'live_score':
          this.handleLiveScoreUpdate(message);
          break;
          
        case 'match_event':
          this.handleMatchEvent(message);
          break;
          
        case 'user_notification':
          this.handleUserNotification(message);
          break;
          
        case 'subscription_success':
          console.log('Subscription successful:', message.data);
          break;
          
        case 'error':
          console.error('WebSocket error message:', message.data);
          this.handleServerError(message);
          break;
          
        case 'pong':
          // Heartbeat response - connection is alive
          break;
          
        default:
          console.log('Unknown message type:', message.type, message);
      }
      
    } catch (error) {
      console.error('Error parsing WebSocket message:', error, event.data);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason);
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Only try to reconnect if it wasn't a normal closure
    if (event.code !== 1000) {
      this.scheduleReconnect();
      
      store.dispatch(addNotification({
        type: 'warning',
        title: 'Connection Lost',
        message: 'Attempting to reconnect to live updates...',
      }));
    }
  }

  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
  }

  private handleConnectionMessage(message: WebSocketMessage): void {
    if (message.data.status === 'authenticated') {
      this.isAuthenticated = true;
      console.log('WebSocket authenticated for user:', message.data.userId);
    }
  }

  private handleLiveScoreUpdate(message: WebSocketMessage): void {
    const update: LiveScoreUpdate = message.data;
    store.dispatch(updateLiveScore(update));
    
    // Show push notification for followed teams
    const state = store.getState();
    const followedTeams = state.user.preferences?.followed_teams || [];
    
    if (followedTeams.length > 0 && notificationService.hasPermission) {
      // This would require match data to check team IDs
      // For now, show notification for all live updates
      const matchData = {
        id: update.match_id,
        home_team: { name: 'Home Team' }, // Would be populated from match data
        away_team: { name: 'Away Team' }, // Would be populated from match data
        home_score: update.home_score,
        away_score: update.away_score
      };
      
      notificationService.showMatchNotification(matchData, 'goal');
      
      store.dispatch(addNotification({
        type: 'info',
        title: '⚽ Goal!',
        message: `Live score update: ${update.home_score} - ${update.away_score}`,
        match_id: update.match_id,
      }));
    }
  }

  private handleMatchEvent(message: WebSocketMessage): void {
    const event = message.data;
    store.dispatch(addMatchEvent({ 
      matchId: event.match_id, 
      event 
    }));
    
    // Show notification for important events
    if (event.type === 'goal' || event.type === 'card') {
      const eventText = event.type === 'goal' ? '⚽ Goal!' : 
                       event.subtype === 'red_card' ? '🟥 Red Card!' : '🟨 Yellow Card';
      
      store.dispatch(addNotification({
        type: event.type === 'goal' ? 'success' : 'warning',
        title: eventText,
        message: `${event.player?.name || 'Player'} - ${event.time_minute}'`,
        match_id: event.match_id,
      }));
    }
  }

  private handleUserNotification(message: WebSocketMessage): void {
    const notification = message.data;
    store.dispatch(addNotification(notification));
  }

  private handleServerError(message: WebSocketMessage): void {
    store.dispatch(addNotification({
      type: 'error',
      title: 'Server Error',
      message: message.data.error || 'An error occurred with live updates',
    }));
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      
      store.dispatch(addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: 'Unable to connect to live updates. Please refresh the page.',
      }));
      return;
    }

    this.reconnectAttempts++;
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${this.reconnectInterval}ms`);

    setTimeout(() => {
      const state = store.getState();
      const token = state.auth.access_token;
      this.connect(token || undefined);
    }, this.reconnectInterval);

    // Exponential backoff with max of 30 seconds
    this.reconnectInterval = Math.min(this.reconnectInterval * 2, 30000);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          data: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString(),
        });
      }
    }, 30000); // Ping every 30 seconds
  }

  private send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }

  private resubscribeAll(): void {
    // Re-subscribe to all previous subscriptions
    this.subscriptions.forEach(subscription => {
      this.subscribe(subscription);
    });
  }

  // Public methods for subscriptions
  public subscribeToLiveScores(): void {
    this.subscriptions.add('live_scores');
    this.send({
      type: 'subscribe_live_scores',
      data: {},
      timestamp: new Date().toISOString(),
    });
  }

  public subscribeToMatch(matchId: number): void {
    const subscription = `match_${matchId}`;
    this.subscriptions.add(subscription);
    this.send({
      type: 'subscribe_match',
      data: { matchId },
      timestamp: new Date().toISOString(),
    });
  }

  public unsubscribeFromMatch(matchId: number): void {
    const subscription = `match_${matchId}`;
    this.subscriptions.delete(subscription);
    this.send({
      type: 'unsubscribe_match',
      data: { matchId },
      timestamp: new Date().toISOString(),
    });
  }

  public subscribeToUserNotifications(): void {
    if (!this.isAuthenticated) {
      console.warn('Cannot subscribe to user notifications - not authenticated');
      return;
    }
    
    this.subscriptions.add('user_notifications');
    this.send({
      type: 'subscribe_user_notifications',
      data: {},
      timestamp: new Date().toISOString(),
    });
  }

  private subscribe(subscription: string): void {
    if (subscription === 'live_scores') {
      this.subscribeToLiveScores();
    } else if (subscription.startsWith('match_')) {
      const matchId = parseInt(subscription.replace('match_', ''));
      this.subscribeToMatch(matchId);
    } else if (subscription === 'user_notifications') {
      this.subscribeToUserNotifications();
    }
  }

  public disconnect(): void {
    console.log('Disconnecting WebSocket');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Normal closure');
      this.ws = null;
    }
    
    this.subscriptions.clear();
    this.isAuthenticated = false;
    this.reconnectAttempts = 0;
  }

  public getConnectionStatus(): 'connecting' | 'open' | 'closed' | 'error' {
    if (!this.ws) return 'closed';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'open';
      case WebSocket.CLOSED: return 'closed';
      case WebSocket.CLOSING: return 'closed';
      default: return 'error';
    }
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// Auto-connect on import (will be called from main app)
export const connectWebSocket = (token?: string) => {
  websocketService.connect(token);
};

export const disconnectWebSocket = () => {
  websocketService.disconnect();
};

export default websocketService;