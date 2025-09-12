-- OkayGoal Initial Database Schema
-- Migration: 001_initial_schema
-- Created: 2024-01-20

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_theme AS ENUM ('light', 'dark', 'system');
CREATE TYPE notification_frequency AS ENUM ('immediate', 'hourly', 'daily', 'weekly', 'never');
CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'finished', 'postponed', 'cancelled');
CREATE TYPE event_type AS ENUM ('goal', 'yellow_card', 'red_card', 'substitution', 'penalty', 'own_goal', 'var');

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    theme user_theme DEFAULT 'system',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notification_settings JSONB DEFAULT '{
        "match_updates": true,
        "goal_alerts": true,
        "team_news": true,
        "frequency": "immediate"
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitions table
CREATE TABLE competitions (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10),
    type VARCHAR(50),
    logo_url TEXT,
    country_name VARCHAR(100),
    country_code VARCHAR(3),
    country_flag_url TEXT,
    season_start DATE,
    season_end DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10),
    logo_url TEXT,
    venue_name VARCHAR(255),
    venue_address TEXT,
    venue_city VARCHAR(100),
    venue_capacity INTEGER,
    country_name VARCHAR(100),
    country_code VARCHAR(3),
    founded INTEGER,
    is_national BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    firstname VARCHAR(100),
    lastname VARCHAR(100),
    age INTEGER,
    birth_date DATE,
    birth_place VARCHAR(255),
    birth_country VARCHAR(100),
    nationality VARCHAR(100),
    height VARCHAR(10),
    weight VARCHAR(10),
    injured BOOLEAN DEFAULT FALSE,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
    id INTEGER PRIMARY KEY,
    competition_id INTEGER REFERENCES competitions(id),
    season INTEGER,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    round VARCHAR(100),
    status match_status DEFAULT 'scheduled',
    status_short VARCHAR(10),
    status_elapsed INTEGER,
    timezone VARCHAR(50),
    home_team_id INTEGER REFERENCES teams(id),
    away_team_id INTEGER REFERENCES teams(id),
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    home_score_ht INTEGER DEFAULT 0,
    away_score_ht INTEGER DEFAULT 0,
    home_score_ft INTEGER DEFAULT 0,
    away_score_ft INTEGER DEFAULT 0,
    home_score_et INTEGER DEFAULT 0,
    away_score_et INTEGER DEFAULT 0,
    home_score_pen INTEGER DEFAULT 0,
    away_score_pen INTEGER DEFAULT 0,
    venue_id INTEGER,
    venue_name VARCHAR(255),
    venue_city VARCHAR(100),
    referee VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match events table
CREATE TABLE match_events (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    time_elapsed INTEGER,
    time_extra INTEGER,
    team_id INTEGER REFERENCES teams(id),
    player_id INTEGER REFERENCES players(id),
    assist_player_id INTEGER REFERENCES players(id),
    type event_type NOT NULL,
    detail VARCHAR(100),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match statistics table
CREATE TABLE match_statistics (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL REFERENCES teams(id),
    shots_on_goal INTEGER DEFAULT 0,
    shots_off_goal INTEGER DEFAULT 0,
    total_shots INTEGER DEFAULT 0,
    blocked_shots INTEGER DEFAULT 0,
    shots_inside_box INTEGER DEFAULT 0,
    shots_outside_box INTEGER DEFAULT 0,
    fouls INTEGER DEFAULT 0,
    corner_kicks INTEGER DEFAULT 0,
    offsides INTEGER DEFAULT 0,
    ball_possession INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    goalkeeper_saves INTEGER DEFAULT 0,
    total_passes INTEGER DEFAULT 0,
    passes_accurate INTEGER DEFAULT 0,
    passes_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match lineups table
CREATE TABLE match_lineups (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL REFERENCES teams(id),
    formation VARCHAR(10),
    coach_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match lineup players table
CREATE TABLE match_lineup_players (
    id SERIAL PRIMARY KEY,
    lineup_id INTEGER NOT NULL REFERENCES match_lineups(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id),
    position VARCHAR(50),
    grid VARCHAR(10),
    is_starter BOOLEAN DEFAULT TRUE,
    substitute_in INTEGER,
    substitute_out INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- League standings table
CREATE TABLE league_standings (
    id SERIAL PRIMARY KEY,
    competition_id INTEGER NOT NULL REFERENCES competitions(id),
    season INTEGER NOT NULL,
    team_id INTEGER NOT NULL REFERENCES teams(id),
    rank INTEGER NOT NULL,
    points INTEGER DEFAULT 0,
    goals_diff INTEGER DEFAULT 0,
    group_name VARCHAR(50),
    form VARCHAR(10),
    status VARCHAR(50),
    description TEXT,
    all_played INTEGER DEFAULT 0,
    all_win INTEGER DEFAULT 0,
    all_draw INTEGER DEFAULT 0,
    all_lose INTEGER DEFAULT 0,
    all_goals_for INTEGER DEFAULT 0,
    all_goals_against INTEGER DEFAULT 0,
    home_played INTEGER DEFAULT 0,
    home_win INTEGER DEFAULT 0,
    home_draw INTEGER DEFAULT 0,
    home_lose INTEGER DEFAULT 0,
    home_goals_for INTEGER DEFAULT 0,
    home_goals_against INTEGER DEFAULT 0,
    away_played INTEGER DEFAULT 0,
    away_win INTEGER DEFAULT 0,
    away_draw INTEGER DEFAULT 0,
    away_lose INTEGER DEFAULT 0,
    away_goals_for INTEGER DEFAULT 0,
    away_goals_against INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(competition_id, season, team_id)
);

-- User following table (for teams, competitions, players)
CREATE TABLE user_following (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(20) NOT NULL, -- 'team', 'competition', 'player'
    entity_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, entity_type, entity_id)
);

-- User notifications table
CREATE TABLE user_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'match_goal', 'match_start', 'team_news', etc.
    entity_type VARCHAR(20),
    entity_id INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- User sessions table (for tracking active sessions)
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    device_info JSONB,
    ip_address INET,
    location_info JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_matches_date ON matches(date);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_home_team ON matches(home_team_id);
CREATE INDEX idx_matches_away_team ON matches(away_team_id);
CREATE INDEX idx_matches_competition ON matches(competition_id);
CREATE INDEX idx_match_events_match_id ON match_events(match_id);
CREATE INDEX idx_match_events_type ON match_events(type);
CREATE INDEX idx_match_statistics_match_id ON match_statistics(match_id);
CREATE INDEX idx_league_standings_competition_season ON league_standings(competition_id, season);
CREATE INDEX idx_league_standings_rank ON league_standings(rank);
CREATE INDEX idx_user_following_user_id ON user_following(user_id);
CREATE INDEX idx_user_following_entity ON user_following(entity_type, entity_id);
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON competitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_league_standings_updated_at BEFORE UPDATE ON league_standings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default data
-- Insert default competitions (major leagues)
INSERT INTO competitions (id, name, code, type, country_name, country_code) VALUES
(39, 'Premier League', 'PL', 'League', 'England', 'GB'),
(140, 'La Liga', 'PD', 'League', 'Spain', 'ES'),
(78, 'Bundesliga', 'BL1', 'League', 'Germany', 'DE'),
(135, 'Serie A', 'SA', 'League', 'Italy', 'IT'),
(61, 'Ligue 1', 'FL1', 'League', 'France', 'FR'),
(2, 'UEFA Champions League', 'CL', 'Cup', 'Europe', 'EU'),
(3, 'UEFA Europa League', 'EL', 'Cup', 'Europe', 'EU');

-- Create function to clean up old refresh tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM refresh_tokens WHERE expires_at < NOW();
    DELETE FROM user_sessions WHERE last_activity < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id INTEGER)
RETURNS TABLE(
    following_teams INTEGER,
    following_competitions INTEGER,
    following_players INTEGER,
    unread_notifications INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*)::INTEGER FROM user_following WHERE user_id = p_user_id AND entity_type = 'team'),
        (SELECT COUNT(*)::INTEGER FROM user_following WHERE user_id = p_user_id AND entity_type = 'competition'),
        (SELECT COUNT(*)::INTEGER FROM user_following WHERE user_id = p_user_id AND entity_type = 'player'),
        (SELECT COUNT(*)::INTEGER FROM user_notifications WHERE user_id = p_user_id AND is_read = FALSE);
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE users IS 'User accounts and profile information';
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for authentication';
COMMENT ON TABLE competitions IS 'Football competitions and leagues';
COMMENT ON TABLE teams IS 'Football teams';
COMMENT ON TABLE players IS 'Football players';
COMMENT ON TABLE matches IS 'Football matches and fixtures';
COMMENT ON TABLE match_events IS 'Match events (goals, cards, etc.)';
COMMENT ON TABLE match_statistics IS 'Match statistics for each team';
COMMENT ON TABLE league_standings IS 'League table standings';
COMMENT ON TABLE user_following IS 'Entities that users follow';
COMMENT ON TABLE user_notifications IS 'User notifications';
COMMENT ON TABLE user_sessions IS 'Active user sessions';

-- Migration completed
INSERT INTO schema_migrations (version, applied_at) VALUES ('001_initial_schema', NOW())
ON CONFLICT (version) DO NOTHING;