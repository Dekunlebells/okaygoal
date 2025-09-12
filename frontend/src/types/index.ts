// Types matching the backend API
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  timezone: string;
  language: string;
  subscription_tier: 'free' | 'premium' | 'pro';
  created_at: string;
  updated_at: string;
  last_active_at: string;
}

export interface Competition {
  id: number;
  name: string;
  country?: string;
  logo_url?: string;
  type: 'league' | 'cup' | 'international';
  season: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: number;
  name: string;
  short_name?: string;
  logo_url?: string;
  country?: string;
  founded?: number;
  venue_name?: string;
  venue_capacity?: number;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  age?: number;
  birth_date?: string;
  nationality?: string;
  height?: string;
  weight?: string;
  position?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: number;
  competition_id: number;
  season: string;
  round?: string;
  home_team_id: number;
  away_team_id: number;
  match_date: string;
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';
  minute?: number;
  home_score: number;
  away_score: number;
  venue_name?: string;
  referee?: string;
  created_at: string;
  updated_at: string;
}

// Enhanced match with team and competition data
export interface MatchDetails extends Match {
  home_team: Team;
  away_team: Team;
  competition: Competition;
  events?: MatchEvent[];
  statistics?: MatchStatistics[];
}

export interface MatchEvent {
  id: string;
  match_id: number;
  team_id: number;
  player_id?: number;
  assist_player_id?: number;
  type: 'goal' | 'card' | 'substitution' | 'penalty' | 'own_goal' | 'var';
  subtype?: string;
  time_minute: number;
  time_extra?: number;
  detail?: string;
  comments?: string;
  created_at: string;
  player?: Player;
  assist_player?: Player;
  team?: Team;
}

export interface MatchStatistics {
  id: string;
  match_id: number;
  team_id: number;
  possession_percentage?: number;
  shots_total: number;
  shots_on_target: number;
  shots_off_target: number;
  shots_blocked: number;
  corners: number;
  offsides: number;
  fouls: number;
  yellow_cards: number;
  red_cards: number;
  passes_total: number;
  passes_accurate: number;
  passes_percentage?: number;
  expected_goals?: number;
  created_at: string;
  team?: Team;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  followed_teams: number[];
  followed_players: number[];
  followed_competitions: number[];
  notification_settings: {
    goals: boolean;
    cards: boolean;
    lineups: boolean;
    final_results: boolean;
    news: boolean;
    push_enabled: boolean;
    email_enabled: boolean;
  };
  created_at: string;
  updated_at: string;
}

// Auth types
export interface AuthState {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// WebSocket types
export interface WebSocketMessage {
  type: 'live_score' | 'match_event' | 'user_notification' | 'connection' | 'error' | 'subscription_success' | 'pong';
  data: any;
  timestamp: string;
}

export interface LiveScoreUpdate {
  match_id: number;
  home_score: number;
  away_score: number;
  status: Match['status'];
  minute?: number;
  events?: MatchEvent[];
  timestamp: string;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface AppState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  match_id?: number;
  team_id?: number;
}

// Search and Filter types
export interface SearchFilters {
  query?: string;
  competitions?: number[];
  teams?: number[];
  date_from?: string;
  date_to?: string;
  status?: Match['status'][];
}

export interface SearchResult {
  type: 'team' | 'player' | 'competition' | 'match';
  id: number;
  name: string;
  logo_url?: string;
  country?: string;
  competition_name?: string;
}

// Standing types
export interface Standing {
  id: string;
  competition_id: number;
  team_id: number;
  season: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  form?: string;
  team: Team;
  updated_at: string;
}

// News types
export interface NewsArticle {
  id: string;
  title: string;
  content?: string;
  summary?: string;
  author?: string;
  source?: string;
  source_url?: string;
  image_url?: string;
  category?: string;
  tags?: string[];
  related_teams?: number[];
  related_players?: number[];
  published_at: string;
  created_at: string;
}

// Component Props types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface MatchCardProps extends BaseComponentProps {
  match: MatchDetails;
  showCompetition?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  onClick?: (match: MatchDetails) => void;
}

export interface TeamBadgeProps extends BaseComponentProps {
  team: Team;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export interface CompetitionBadgeProps extends BaseComponentProps {
  competition: Competition;
  size?: 'sm' | 'md' | 'lg';
  showCountry?: boolean;
}

// Error types
export interface ApiError {
  status: number;
  message: string;
  details?: string[];
}

// Form types
export interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

// Route types
export interface RouteParams {
  matchId?: string;
  teamId?: string;
  competitionId?: string;
  playerId?: string;
}

// Storage types
export interface StoredUser {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Export utility type helpers
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type RequireOnly<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;