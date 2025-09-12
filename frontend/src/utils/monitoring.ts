// Monitoring and Analytics utilities

interface PerformanceMetrics {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface UserEvent {
  event: string;
  properties: Record<string, any>;
  userId?: string;
  timestamp: number;
}

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  line?: number;
  column?: number;
  userAgent: string;
  userId?: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

class MonitoringService {
  private isInitialized = false;
  private userId?: string;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  init(userId?: string) {
    this.userId = userId;
    this.isInitialized = true;
    
    // Initialize performance monitoring
    this.initPerformanceMonitoring();
    
    // Initialize error monitoring
    this.initErrorMonitoring();
    
    // Initialize user activity monitoring
    this.initUserActivityMonitoring();
    
    console.log('Monitoring service initialized', { userId, sessionId: this.sessionId });
  }

  private initPerformanceMonitoring() {
    // Core Web Vitals monitoring
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          this.reportMetric({
            name: 'LCP',
            value: entry.startTime,
            rating: this.getLCPRating(entry.startTime),
            timestamp: Date.now(),
          });
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          this.reportMetric({
            name: 'FID',
            value: entry.processingStart - entry.startTime,
            rating: this.getFIDRating(entry.processingStart - entry.startTime),
            timestamp: Date.now(),
          });
        }
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.reportMetric({
          name: 'CLS',
          value: clsValue,
          rating: this.getCLSRating(clsValue),
          timestamp: Date.now(),
        });
      }).observe({ entryTypes: ['layout-shift'] });
    }

    // Page load times
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        this.reportMetric({
          name: 'TTFB',
          value: navigation.responseStart - navigation.requestStart,
          rating: this.getTTFBRating(navigation.responseStart - navigation.requestStart),
          timestamp: Date.now(),
        });

        this.reportMetric({
          name: 'Load',
          value: navigation.loadEventEnd - navigation.navigationStart,
          rating: this.getLoadRating(navigation.loadEventEnd - navigation.navigationStart),
          timestamp: Date.now(),
        });
      }, 0);
    });
  }

  private initErrorMonitoring() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        line: event.lineno,
        column: event.colno,
        userAgent: navigator.userAgent,
        userId: this.userId,
        timestamp: Date.now(),
        severity: 'high',
        context: {
          type: 'javascript-error',
          sessionId: this.sessionId,
        },
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.userId,
        timestamp: Date.now(),
        severity: 'high',
        context: {
          type: 'unhandled-promise-rejection',
          sessionId: this.sessionId,
          reason: event.reason,
        },
      });
    });
  }

  private initUserActivityMonitoring() {
    // Track user interactions
    ['click', 'keydown', 'scroll'].forEach(eventType => {
      document.addEventListener(eventType, this.throttle((event) => {
        if (event.target) {
          const element = event.target as HTMLElement;
          this.trackEvent(`user_${eventType}`, {
            element: element.tagName.toLowerCase(),
            className: element.className,
            id: element.id,
            innerText: element.innerText?.substring(0, 100),
          });
        }
      }, 1000));
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('visibility_change', {
        hidden: document.hidden,
      });
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('page_unload', {
        timeSpent: Date.now() - this.getSessionStartTime(),
      });
    });
  }

  private reportMetric(metric: PerformanceMetrics) {
    if (!this.isInitialized) return;

    console.log('Performance Metric:', metric);
    
    // In production, send to your analytics service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics('performance', metric);
    }
  }

  reportError(error: ErrorReport) {
    console.error('Error Report:', error);
    
    // In production, send to your error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(error);
    }
  }

  trackEvent(event: string, properties: Record<string, any> = {}) {
    if (!this.isInitialized) return;

    const eventData: UserEvent = {
      event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        url: window.location.href,
        referrer: document.referrer,
        timestamp: Date.now(),
      },
      userId: this.userId,
      timestamp: Date.now(),
    };

    console.log('User Event:', eventData);
    
    // In production, send to your analytics service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics('event', eventData);
    }
  }

  // Track specific application events
  trackMatchView(matchId: number) {
    this.trackEvent('match_viewed', { matchId });
  }

  trackTeamView(teamId: number) {
    this.trackEvent('team_viewed', { teamId });
  }

  trackPlayerView(playerId: number) {
    this.trackEvent('player_viewed', { playerId });
  }

  trackSearch(query: string, results: number) {
    this.trackEvent('search_performed', { query, results });
  }

  trackNotificationPermission(granted: boolean) {
    this.trackEvent('notification_permission', { granted });
  }

  trackUserAction(action: string, context?: Record<string, any>) {
    this.trackEvent('user_action', { action, ...context });
  }

  private sendToAnalytics(type: string, data: any) {
    // Example integration with Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', type, data);
    }

    // Example integration with custom analytics endpoint
    fetch('/api/v1/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        data,
        timestamp: Date.now(),
      }),
    }).catch(error => {
      console.warn('Failed to send analytics:', error);
    });
  }

  private sendToErrorService(error: ErrorReport) {
    // Example integration with Sentry
    if (typeof Sentry !== 'undefined') {
      Sentry.captureException(new Error(error.message), {
        extra: error.context,
        user: { id: error.userId },
      });
    }

    // Example integration with custom error endpoint
    fetch('/api/v1/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(error),
    }).catch(err => {
      console.warn('Failed to send error report:', err);
    });
  }

  // Performance rating helpers
  private getLCPRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
  }

  private getFIDRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
  }

  private getCLSRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
  }

  private getTTFBRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
  }

  private getLoadRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 3000 ? 'good' : value <= 5000 ? 'needs-improvement' : 'poor';
  }

  // Utility functions
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionStartTime(): number {
    const stored = sessionStorage.getItem('okaygoal-session-start');
    if (stored) return parseInt(stored);
    const startTime = Date.now();
    sessionStorage.setItem('okaygoal-session-start', startTime.toString());
    return startTime;
  }

  private throttle<T extends (...args: any[]) => void>(func: T, delay: number): T {
    let lastCall = 0;
    return ((...args: any[]) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    }) as T;
  }
}

// Create singleton instance
export const monitoring = new MonitoringService();

// Initialize monitoring when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      monitoring.init();
    });
  } else {
    monitoring.init();
  }
}