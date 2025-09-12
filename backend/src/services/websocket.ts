import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import url from 'url';
import { jwtManager } from '@/utils/jwt';
import { logger, loggerHelpers } from '@/utils/logger';
import { websocketRateLimit } from '@/middleware/rateLimit';
import { WebSocketMessage, LiveScoreUpdate } from '@/types';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  subscriptions?: Set<string>;
  lastPing?: Date;
  isAlive?: boolean;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private matchSubscriptions: Map<number, Set<AuthenticatedWebSocket>> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  public setupWebSocket(wss: WebSocketServer): void {
    this.wss = wss;

    wss.on('connection', (ws: AuthenticatedWebSocket, request: IncomingMessage) => {
      this.handleConnection(ws, request);
    });

    // Set up ping/pong heartbeat
    this.setupHeartbeat();

    logger.info('WebSocket server initialized');
  }

  private handleConnection(ws: AuthenticatedWebSocket, request: IncomingMessage): void {
    const queryParams = url.parse(request.url || '', true).query;
    const token = queryParams.token as string;

    // Initialize WebSocket properties
    ws.subscriptions = new Set();
    ws.lastPing = new Date();
    ws.isAlive = true;

    // Handle pong responses
    ws.on('pong', () => {
      ws.isAlive = true;
      ws.lastPing = new Date();
    });

    // Authenticate if token provided
    if (token) {
      try {
        const payload = jwtManager.verifyAccessToken(token);
        ws.userId = payload.userId;

        // Add to authenticated clients
        if (!this.clients.has(payload.userId)) {
          this.clients.set(payload.userId, new Set());
        }
        this.clients.get(payload.userId)!.add(ws);

        loggerHelpers.websocket('client_authenticated', payload.userId);

        // Send welcome message
        this.sendMessage(ws, {
          type: 'connection',
          data: {
            status: 'authenticated',
            userId: payload.userId,
            subscriptions: []
          },
          timestamp: new Date()
        });

      } catch (error) {
        loggerHelpers.security('websocket_auth_failed', 'medium', {
          token: token.substring(0, 20) + '...',
          error: (error as Error).message,
          ip: request.socket.remoteAddress
        });

        // Send authentication error
        this.sendMessage(ws, {
          type: 'error',
          data: { error: 'Authentication failed' },
          timestamp: new Date()
        });
      }
    } else {
      // Send welcome message for unauthenticated connection
      this.sendMessage(ws, {
        type: 'connection',
        data: {
          status: 'connected',
          message: 'Connected to OkayGoal WebSocket server'
        },
        timestamp: new Date()
      });
    }

    // Handle incoming messages
    ws.on('message', (data) => {
      this.handleMessage(ws, data);
    });

    // Handle disconnection
    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket error:', { error, userId: ws.userId });
      this.handleDisconnection(ws);
    });
  }

  private async handleMessage(ws: AuthenticatedWebSocket, data: any): Promise<void> {
    try {
      // Rate limiting check
      if (ws.userId) {
        const rateCheck = await websocketRateLimit.checkLimit(ws.userId);
        if (!rateCheck.allowed) {
          this.sendMessage(ws, {
            type: 'error',
            data: { 
              error: 'Rate limit exceeded',
              remaining: rateCheck.remaining 
            },
            timestamp: new Date()
          });
          return;
        }
      }

      const message = JSON.parse(data.toString());
      
      loggerHelpers.websocket('message_received', ws.userId, {
        type: message.type,
        hasData: !!message.data
      });

      switch (message.type) {
        case 'subscribe_live_scores':
          await this.handleSubscribeLiveScores(ws);
          break;

        case 'subscribe_match':
          await this.handleSubscribeMatch(ws, message.data?.matchId);
          break;

        case 'unsubscribe_match':
          await this.handleUnsubscribeMatch(ws, message.data?.matchId);
          break;

        case 'subscribe_user_notifications':
          await this.handleSubscribeUserNotifications(ws);
          break;

        case 'ping':
          this.sendMessage(ws, {
            type: 'pong',
            data: { timestamp: new Date() },
            timestamp: new Date()
          });
          break;

        default:
          this.sendMessage(ws, {
            type: 'error',
            data: { error: 'Unknown message type' },
            timestamp: new Date()
          });
      }

    } catch (error) {
      logger.error('WebSocket message handling error:', error);
      this.sendMessage(ws, {
        type: 'error',
        data: { error: 'Message processing failed' },
        timestamp: new Date()
      });
    }
  }

  private handleSubscribeLiveScores(ws: AuthenticatedWebSocket): void {
    ws.subscriptions!.add('live_scores');
    
    this.sendMessage(ws, {
      type: 'subscription_success',
      data: { 
        subscription: 'live_scores',
        message: 'Subscribed to live scores updates'
      },
      timestamp: new Date()
    });

    loggerHelpers.websocket('subscribed_live_scores', ws.userId);
  }

  private handleSubscribeMatch(ws: AuthenticatedWebSocket, matchId: number): void {
    if (!matchId) {
      this.sendMessage(ws, {
        type: 'error',
        data: { error: 'Match ID required' },
        timestamp: new Date()
      });
      return;
    }

    // Add to match subscriptions
    if (!this.matchSubscriptions.has(matchId)) {
      this.matchSubscriptions.set(matchId, new Set());
    }
    this.matchSubscriptions.get(matchId)!.add(ws);

    ws.subscriptions!.add(`match_${matchId}`);

    this.sendMessage(ws, {
      type: 'subscription_success',
      data: { 
        subscription: `match_${matchId}`,
        message: `Subscribed to match ${matchId} updates`
      },
      timestamp: new Date()
    });

    loggerHelpers.websocket('subscribed_match', ws.userId, { matchId });
  }

  private handleUnsubscribeMatch(ws: AuthenticatedWebSocket, matchId: number): void {
    if (!matchId) {
      this.sendMessage(ws, {
        type: 'error',
        data: { error: 'Match ID required' },
        timestamp: new Date()
      });
      return;
    }

    // Remove from match subscriptions
    if (this.matchSubscriptions.has(matchId)) {
      this.matchSubscriptions.get(matchId)!.delete(ws);
      if (this.matchSubscriptions.get(matchId)!.size === 0) {
        this.matchSubscriptions.delete(matchId);
      }
    }

    ws.subscriptions!.delete(`match_${matchId}`);

    this.sendMessage(ws, {
      type: 'unsubscription_success',
      data: { 
        subscription: `match_${matchId}`,
        message: `Unsubscribed from match ${matchId} updates`
      },
      timestamp: new Date()
    });

    loggerHelpers.websocket('unsubscribed_match', ws.userId, { matchId });
  }

  private handleSubscribeUserNotifications(ws: AuthenticatedWebSocket): void {
    if (!ws.userId) {
      this.sendMessage(ws, {
        type: 'error',
        data: { error: 'Authentication required for user notifications' },
        timestamp: new Date()
      });
      return;
    }

    ws.subscriptions!.add('user_notifications');

    this.sendMessage(ws, {
      type: 'subscription_success',
      data: { 
        subscription: 'user_notifications',
        message: 'Subscribed to user notifications'
      },
      timestamp: new Date()
    });

    loggerHelpers.websocket('subscribed_user_notifications', ws.userId);
  }

  private handleDisconnection(ws: AuthenticatedWebSocket): void {
    // Remove from authenticated clients
    if (ws.userId && this.clients.has(ws.userId)) {
      this.clients.get(ws.userId)!.delete(ws);
      if (this.clients.get(ws.userId)!.size === 0) {
        this.clients.delete(ws.userId);
      }
    }

    // Remove from match subscriptions
    for (const [matchId, subscribers] of this.matchSubscriptions.entries()) {
      subscribers.delete(ws);
      if (subscribers.size === 0) {
        this.matchSubscriptions.delete(matchId);
      }
    }

    loggerHelpers.websocket('client_disconnected', ws.userId);
  }

  private sendMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error('Failed to send WebSocket message:', error);
      }
    }
  }

  // Broadcast methods for external use
  public broadcastLiveScores(update: LiveScoreUpdate): void {
    const message: WebSocketMessage = {
      type: 'live_score',
      data: update,
      timestamp: new Date()
    };

    this.broadcastToSubscription('live_scores', message);
    this.broadcastToMatchSubscribers(update.match_id, message);
  }

  public broadcastMatchEvent(matchId: number, event: any): void {
    const message: WebSocketMessage = {
      type: 'match_event',
      data: event,
      timestamp: new Date()
    };

    this.broadcastToMatchSubscribers(matchId, message);
  }

  public sendUserNotification(userId: string, notification: any): void {
    if (this.clients.has(userId)) {
      const message: WebSocketMessage = {
        type: 'user_notification',
        data: notification,
        timestamp: new Date()
      };

      this.clients.get(userId)!.forEach(ws => {
        if (ws.subscriptions!.has('user_notifications')) {
          this.sendMessage(ws, message);
        }
      });
    }
  }

  private broadcastToSubscription(subscription: string, message: WebSocketMessage): void {
    for (const [userId, connections] of this.clients.entries()) {
      connections.forEach(ws => {
        if (ws.subscriptions!.has(subscription)) {
          this.sendMessage(ws, message);
        }
      });
    }
  }

  private broadcastToMatchSubscribers(matchId: number, message: WebSocketMessage): void {
    if (this.matchSubscriptions.has(matchId)) {
      this.matchSubscriptions.get(matchId)!.forEach(ws => {
        this.sendMessage(ws, message);
      });
    }
  }

  private setupHeartbeat(): void {
    this.pingInterval = setInterval(() => {
      if (this.wss) {
        this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
          if (!ws.isAlive) {
            loggerHelpers.websocket('client_timeout', ws.userId);
            return ws.terminate();
          }

          ws.isAlive = false;
          ws.ping();
        });
      }
    }, 30000); // 30 seconds
  }

  public getStats() {
    return {
      totalConnections: this.wss?.clients.size || 0,
      authenticatedClients: this.clients.size,
      matchSubscriptions: this.matchSubscriptions.size,
      totalSubscriptions: Array.from(this.clients.values()).reduce(
        (total, connections) => total + Array.from(connections).reduce(
          (connTotal, ws) => connTotal + (ws.subscriptions?.size || 0), 0
        ), 0
      )
    };
  }

  public cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }
}

// Create singleton instance
const wsManager = new WebSocketManager();

export const setupWebSocket = (wss: WebSocketServer) => {
  wsManager.setupWebSocket(wss);
};

export const broadcastLiveScores = (update: LiveScoreUpdate) => {
  wsManager.broadcastLiveScores(update);
};

export const broadcastMatchEvent = (matchId: number, event: any) => {
  wsManager.broadcastMatchEvent(matchId, event);
};

export const sendUserNotification = (userId: string, notification: any) => {
  wsManager.sendUserNotification(userId, notification);
};

export const getWebSocketStats = () => {
  return wsManager.getStats();
};