import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught an Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }

    // In production, you would send this to your error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // This is where you'd integrate with error reporting services like:
    // - Sentry
    // - Bugsnag  
    // - LogRocket
    // - Custom logging service
    
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getUserId(),
      errorId: this.state.errorId,
      level: this.props.level || 'component',
    };

    // Example: Send to your logging service
    // loggerService.error('React Error Boundary', errorReport);
    
    console.error('Error reported:', errorReport);
  };

  private getUserId = (): string | null => {
    // Get user ID from your auth system
    try {
      const user = localStorage.getItem('okaygoal-user');
      return user ? JSON.parse(user).id : null;
    } catch {
      return null;
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = 'component' } = this.props;
      const { error, errorInfo, errorId } = this.state;

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {level === 'critical' ? 'Application Error' : 'Something went wrong'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {level === 'critical' 
                  ? 'A critical error occurred that prevented the application from working properly.'
                  : level === 'page'
                  ? 'This page encountered an error and could not be displayed.'
                  : 'This component encountered an error and could not be displayed.'
                }
              </p>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded border text-left">
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-red-700 dark:text-red-300 mb-2">
                    Error Details
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong className="text-red-700 dark:text-red-300">Message:</strong>
                      <p className="text-red-600 dark:text-red-400 font-mono text-xs mt-1">
                        {error.message}
                      </p>
                    </div>
                    {error.stack && (
                      <div>
                        <strong className="text-red-700 dark:text-red-300">Stack:</strong>
                        <pre className="text-red-600 dark:text-red-400 font-mono text-xs mt-1 whitespace-pre-wrap max-h-32 overflow-auto">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            {/* Error ID for Support */}
            {errorId && (
              <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                <span className="text-gray-600 dark:text-gray-400">Error ID: </span>
                <code className="text-gray-800 dark:text-gray-200 font-mono">{errorId}</code>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {level === 'component' && (
                <Button
                  onClick={this.handleRetry}
                  className="flex items-center justify-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
              
              {level === 'page' && (
                <>
                  <Button
                    onClick={this.handleReload}
                    className="flex items-center justify-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Page
                  </Button>
                  <Button
                    onClick={this.handleGoHome}
                    variant="secondary"
                    className="flex items-center justify-center"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </>
              )}

              {level === 'critical' && (
                <Button
                  onClick={this.handleReload}
                  className="flex items-center justify-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Application
                </Button>
              )}
            </div>

            {/* Help Text */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              If this problem persists, please contact support with the error ID above.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Convenience components for different error levels
export const PageErrorBoundary: React.FC<Omit<Props, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="page" />
);

export const ComponentErrorBoundary: React.FC<Omit<Props, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="component" />
);

export const CriticalErrorBoundary: React.FC<Omit<Props, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="critical" />
);

// HOC for wrapping components with error boundaries
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} ref={ref} />
    </ErrorBoundary>
  ));

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};