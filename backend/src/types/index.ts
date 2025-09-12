// Core database entity types based on PRD schema
export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  timezone: string;
  language: string;
  subscription_tier: 'free' | 'premium' | 'pro';
  created_at: Date;
  updated_at: Date;
  last_active_at: Date;
}

export interface Competition {
  id: number;
  name: string;
  country?: string;
  logo_url?: string;
  type: 'league' | 'cup' | 'international';
  season: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

export interface Player {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  age?: number;
  birth_date?: Date;
  nationality?: string;
  height?: string;
  weight?: string;
  position?: string;
  photo_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Match {
  id: number;
  competition_id: number;
  season: string;
  round?: string;
  home_team_id: number;
  away_team_id: number;
  match_date: Date;
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';
  minute?: number;
  home_score: number;
  away_score: number;
  venue_name?: string;
  referee?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MatchEvent {
  id: string;
  match_id: number;
  team_id: number;
  player_id?: number;
  assist_player_id?: number;
  type: 'goal' | 'card' | 'substitution' | 'penalty' | 'own_goal' | 'var';
  time_minute: number;
  time_extra?: number;
  detail?: string;
  subtype?: string;
  comments?: string;
  created_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

// API Request/Response types
export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends AuthRequest {
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LiveScoreUpdate {
  match_id: number;
  home_score: number;
  away_score: number;
  status: Match['status'];
  minute?: number;
  events?: MatchEvent[];
  timestamp: Date;
}

// API-Football.com integration types
export interface ApiFootballMatch {
  fixture: {
    id: number;
    date: string;
    status: {
      long: string;
      short: string;
      elapsed?: number;
    };
    venue?: {
      id: number;
      name: string;
      city: string;
    };
    referee?: string;
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    season: number;
    round: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number;
    away: number;
  };
  score: {
    halftime: {
      home: number;
      away: number;
    };
    fulltime: {
      home: number;
      away: number;
    };
  };
}

export interface ApiFootballEvent {
  time: {
    elapsed: number;
    extra?: number;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  player: {
    id: number;
    name: string;
  };
  assist?: {
    id: number;
    name: string;
  };
  type: string;
  detail: string;
  comments?: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: Date;
}

// Utility types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Database connection types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

// Rate limiting types
export interface RateLimitInfo {
  tier: 'free' | 'premium';
  limit: number;
  remaining: number;
  reset: Date;
}