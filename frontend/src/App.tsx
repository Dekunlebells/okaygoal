import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { useAppSelector, useAppDispatch } from '@/store';
import { selectIsAuthenticated, selectUser, getCurrentUser } from '@/store/slices/authSlice';
import { selectTheme, setTheme } from '@/store/slices/appSlice';

// Import components
import { Layout } from '@/components/layout/Layout';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { HomePage } from '@/components/pages/HomePage';
import { MatchDetailsPage } from '@/components/matches/MatchDetailsPage';
import { TeamProfilePage } from '@/components/teams/TeamProfilePage';
import { PlayerProfilePage } from '@/components/players/PlayerProfilePage';
import { UserPreferencesPage } from '@/components/user/UserPreferencesPage';
import { CompetitionsListPage } from '@/components/competitions/CompetitionsListPage';
import { CompetitionDetailsPage } from '@/components/competitions/CompetitionDetailsPage';
import { NotificationPermissionBanner } from '@/components/notifications/NotificationPermissionBanner';
import { CriticalErrorBoundary } from '@/components/ui/ErrorBoundary';

// Import services
import { connectWebSocket } from '@/services/websocket';
import { notificationService } from '@/services/notifications';

// Protected route wrapper
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public route wrapper (redirect to home if authenticated)
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Auth layout for login/register pages
interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {children}
      </div>
    </div>
  );
};

function App() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  // Apply theme on app load
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleThemeChange = (e: MediaQueryListEvent) => {
        if (theme === 'system') {
          if (e.matches) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      };
      
      mediaQuery.addEventListener('change', handleThemeChange);
      return () => mediaQuery.removeEventListener('change', handleThemeChange);
    }
  }, [theme]);

  // Initialize app on load
  useEffect(() => {
    // Check if user is authenticated from localStorage
    const token = localStorage.getItem('okaygoal-token');
    const storedUser = localStorage.getItem('okaygoal-user');
    
    if (token && storedUser && !user) {
      // Verify token and get current user
      dispatch(getCurrentUser());
    }
  }, [dispatch, user]);

  // Connect WebSocket and initialize notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Temporarily disable WebSocket connection until backend WebSocket server is implemented
      // const token = localStorage.getItem('okaygoal-token');
      // if (token) {
      //   connectWebSocket(token);
      // }
      
      // Initialize notification service (but disable WebSocket features)
      notificationService.initialize();
    }
  }, [isAuthenticated]);

  return (
    <CriticalErrorBoundary>
      <div className="App">
        {/* Notification Permission Banner */}
        {isAuthenticated && <NotificationPermissionBanner />}
        
        <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthLayout>
                <LoginForm />
              </AuthLayout>
            </PublicRoute>
          }
        />
        
        <Route
          path="/register"
          element={
            <PublicRoute>
              <AuthLayout>
                <RegisterForm />
              </AuthLayout>
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/matches"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/matches/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <MatchDetailsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/competitions"
          element={
            <ProtectedRoute>
              <Layout>
                <CompetitionsListPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/competitions/:competitionId"
          element={
            <ProtectedRoute>
              <Layout>
                <CompetitionDetailsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/teams"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Teams
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Team listings coming soon...
                  </p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/teams/:teamId"
          element={
            <ProtectedRoute>
              <Layout>
                <TeamProfilePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/players/:playerId"
          element={
            <ProtectedRoute>
              <Layout>
                <PlayerProfilePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <UserPreferencesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            border: '1px solid var(--toast-border)',
          },
          success: {
            iconTheme: {
              primary: '#00C851',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* CSS variables for toast theming */}
      <style>{`
        :root {
          --toast-bg: ${theme === 'dark' ? '#1f2937' : '#ffffff'};
          --toast-color: ${theme === 'dark' ? '#ffffff' : '#111827'};
          --toast-border: ${theme === 'dark' ? '#374151' : '#e5e7eb'};
        }
      `}</style>
      </div>
    </CriticalErrorBoundary>
  );
}

export default App;