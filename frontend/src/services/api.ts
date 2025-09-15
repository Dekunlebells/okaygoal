import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { 
  ApiResponse, 
  AuthResponse, 
  LoginCredentials, 
  RegisterCredentials, 
  User, 
  MatchDetails, 
  UserPreferences,
  SearchFilters,
  PaginatedResponse
} from '@/types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://okaygoal-production.up.railway.app/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('okaygoal-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('okaygoal-refresh-token');
        if (refreshToken) {
          const response = await axios.post(`${import.meta.env.VITE_API_URL || 'https://okaygoal-production.up.railway.app/api/v1'}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: newRefreshToken } = response.data.data;
          
          localStorage.setItem('okaygoal-token', access_token);
          localStorage.setItem('okaygoal-refresh-token', newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('okaygoal-token');
        localStorage.removeItem('okaygoal-refresh-token');
        localStorage.removeItem('okaygoal-user');
        
        // Dispatch logout action if store is available
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (credentials: LoginCredentials): Promise<AxiosResponse<ApiResponse<AuthResponse>>> =>
    api.post('/auth/login', credentials),

  register: (credentials: RegisterCredentials): Promise<AxiosResponse<ApiResponse<AuthResponse>>> =>
    api.post('/auth/register', credentials),

  refresh: (refresh_token: string): Promise<AxiosResponse<ApiResponse<{ access_token: string; refresh_token: string }>>> =>
    api.post('/auth/refresh', { refresh_token }),

  logout: (refresh_token: string): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.delete('/auth/logout', { data: { refresh_token } }),

  me: (): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.get('/auth/me'),

  verify: (token: string): Promise<AxiosResponse<ApiResponse<{ valid: boolean; user: User }>>> =>
    api.post('/auth/verify', {}, {
      headers: { Authorization: `Bearer ${token}` }
    }),
};

// Matches API
export const matchesApi = {
  getLiveMatches: (): Promise<AxiosResponse<ApiResponse<MatchDetails[]>>> =>
    api.get('/matches/live'),

  getTodayMatches: (): Promise<AxiosResponse<ApiResponse<MatchDetails[]>>> =>
    api.get('/matches/today'),

  getUpcomingMatches: (days: number = 7): Promise<AxiosResponse<ApiResponse<MatchDetails[]>>> =>
    api.get('/matches/upcoming', { params: { days } }),

  getRecentMatches: (days: number = 7): Promise<AxiosResponse<ApiResponse<MatchDetails[]>>> =>
    api.get('/matches/recent', { params: { days } }),

  getMatchDetails: (matchId: number): Promise<AxiosResponse<ApiResponse<MatchDetails>>> =>
    api.get(`/matches/${matchId}`),

  getMatchEvents: (matchId: number): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get(`/matches/${matchId}/events`),

  getMatchStatistics: (matchId: number): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get(`/matches/${matchId}/statistics`),

  searchMatches: (filters: SearchFilters): Promise<AxiosResponse<ApiResponse<PaginatedResponse<MatchDetails>>>> =>
    api.get('/matches/search', { params: filters }),

  getMatchesByDate: (date: string): Promise<AxiosResponse<ApiResponse<MatchDetails[]>>> =>
    api.get('/matches/date', { params: { date } }),

  getTeamMatches: (teamId: number, params?: { limit?: number; status?: string }): Promise<AxiosResponse<ApiResponse<MatchDetails[]>>> =>
    api.get(`/matches/team/${teamId}`, { params }),

  getPlayerMatches: (playerId: number, params?: { limit?: number }): Promise<AxiosResponse<ApiResponse<MatchDetails[]>>> =>
    api.get(`/matches/player/${playerId}`, { params }),

  getMatchesByCompetition: (competitionId: number, limit: number = 20): Promise<AxiosResponse<ApiResponse<MatchDetails[]>>> =>
    api.get(`/matches/competition/${competitionId}`, { params: { limit } }),
};

// Competitions API
export const competitionsApi = {
  getCompetitions: (): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get('/competitions'),

  getCompetitionDetails: (competitionId: number): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get(`/competitions/${competitionId}`),

  getCompetitionFixtures: (competitionId: number): Promise<AxiosResponse<ApiResponse<MatchDetails[]>>> =>
    api.get(`/competitions/${competitionId}/fixtures`),

  getCompetitionStandings: (competitionId: number): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get(`/competitions/${competitionId}/standings`),

  getCompetitionTopScorers: (competitionId: number): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get(`/competitions/${competitionId}/topscorers`),
};

// Teams API
export const teamApi = {
  getTeams: (search?: string): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get('/teams', { params: search ? { q: search } : {} }),

  getTeamById: (teamId: number): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get(`/teams/${teamId}`),

  getTeamPlayers: (teamId: number): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get(`/teams/${teamId}/players`),

  getTeamMatches: (teamId: number, params?: { limit?: number; status?: string }): Promise<AxiosResponse<ApiResponse<MatchDetails[]>>> =>
    api.get(`/teams/${teamId}/matches`, { params }),

  getTeamStatistics: (teamId: number): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get(`/teams/${teamId}/statistics`),
};

// Backward compatibility
export const teamsApi = teamApi;

// Players API
export const playerApi = {
  getPlayers: (search?: string): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get('/players', { params: search ? { q: search } : {} }),

  getPlayerById: (playerId: number): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get(`/players/${playerId}`),

  getPlayerStatistics: (playerId: number): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get(`/players/${playerId}/statistics`),

  getPlayerTransfers: (playerId: number): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get(`/players/${playerId}/transfers`),
};

// Backward compatibility
export const playersApi = playerApi;

// User API
export const userApi = {
  getProfile: (): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.get('/users/profile'),

  updateProfile: (data: Partial<User>): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.put('/users/profile', data),

  getPreferences: (): Promise<AxiosResponse<ApiResponse<UserPreferences>>> =>
    api.get('/users/preferences'),

  updatePreferences: (data: Partial<UserPreferences>): Promise<AxiosResponse<ApiResponse<UserPreferences>>> =>
    api.put('/users/preferences', data),

  follow: (data: { type: 'team' | 'player' | 'competition'; id: number }): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.post('/users/follow', data),

  unfollow: (data: { type: 'team' | 'player' | 'competition'; id: number }): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.delete('/users/follow', { data }),
};

// Search API
export const searchApi = {
  searchAll: (query: string, limit: number = 10): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get('/search', { params: { q: query, limit } }),

  searchTeams: (query: string, limit: number = 10): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get('/search/teams', { params: { q: query, limit } }),

  searchPlayers: (query: string, limit: number = 10): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get('/search/players', { params: { q: query, limit } }),

  searchCompetitions: (query: string, limit: number = 10): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get('/search/competitions', { params: { q: query, limit } }),
};

// Admin API (for premium/pro users)
export const adminApi = {
  getSystemStats: (): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get('/admin/stats'),

  getApiUsage: (): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get('/admin/api-usage'),

  syncData: (type: string): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.post('/admin/sync', { type }),
};

// Export main api instance for custom requests
export default api;