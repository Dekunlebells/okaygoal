-- OkayGoal Database Schema
-- Based on PRD specifications for comprehensive football data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_active_at TIMESTAMP DEFAULT NOW()
);

-- Competitions table
CREATE TABLE competitions (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    logo_url TEXT,
    type VARCHAR(50) CHECK (type IN ('league', 'cup', 'international')),
    season VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    logo_url TEXT,
    country VARCHAR(100),
    founded INTEGER,
    venue_name VARCHAR(255),
    venue_capacity INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    age INTEGER,
    birth_date DATE,
    nationality VARCHAR(100),
    height VARCHAR(10),
    weight VARCHAR(10),
    position VARCHAR(50),
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Team-Player relationships (for transfers)
CREATE TABLE team_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    position VARCHAR(50),
    jersey_number INTEGER,
    is_active BOOLEAN DEFAULT true,
    joined_date DATE DEFAULT CURRENT_DATE,
    left_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(team_id, jersey_number, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Matches table
CREATE TABLE matches (
    id INTEGER PRIMARY KEY,
    competition_id INTEGER REFERENCES competitions(id) ON DELETE SET NULL,
    season VARCHAR(20),
    round VARCHAR(100),
    home_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    match_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished', 'postponed', 'cancelled')),
    minute INTEGER,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    venue_name VARCHAR(255),
    referee VARCHAR(255),
    attendance INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Match Events table
CREATE TABLE match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
    assist_player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
    type VARCHAR(50) CHECK (type IN ('goal', 'card', 'substitution', 'penalty', 'own_goal', 'var', 'offside')),
    subtype VARCHAR(50), -- yellow_card, red_card, penalty_goal, etc.
    time_minute INTEGER NOT NULL,
    time_extra INTEGER,
    detail TEXT,
    comments TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Match Statistics table
CREATE TABLE match_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    possession_percentage DECIMAL(5,2),
    shots_total INTEGER DEFAULT 0,
    shots_on_target INTEGER DEFAULT 0,
    shots_off_target INTEGER DEFAULT 0,
    shots_blocked INTEGER DEFAULT 0,
    corners INTEGER DEFAULT 0,
    offsides INTEGER DEFAULT 0,
    fouls INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    passes_total INTEGER DEFAULT 0,
    passes_accurate INTEGER DEFAULT 0,
    passes_percentage DECIMAL(5,2),
    expected_goals DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Player Statistics table
CREATE TABLE player_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    position VARCHAR(50),
    minutes_played INTEGER DEFAULT 0,
    rating DECIMAL(3,1),
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    shots_total INTEGER DEFAULT 0,
    shots_on_target INTEGER DEFAULT 0,
    passes_total INTEGER DEFAULT 0,
    passes_accurate INTEGER DEFAULT 0,
    passes_key INTEGER DEFAULT 0,
    dribbles_attempts INTEGER DEFAULT 0,
    dribbles_success INTEGER DEFAULT 0,
    tackles INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    interceptions INTEGER DEFAULT 0,
    duels_total INTEGER DEFAULT 0,
    duels_won INTEGER DEFAULT 0,
    fouls_drawn INTEGER DEFAULT 0,
    fouls_committed INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    penalties_won INTEGER DEFAULT 0,
    penalties_committed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- League Standings table
CREATE TABLE standings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id INTEGER REFERENCES competitions(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    season VARCHAR(20),
    position INTEGER NOT NULL,
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    drawn INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    form VARCHAR(10), -- Last 5 matches: WWDLL
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(competition_id, team_id, season)
);

-- User Preferences table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    followed_teams INTEGER[] DEFAULT '{}',
    followed_players INTEGER[] DEFAULT '{}',
    followed_competitions INTEGER[] DEFAULT '{}',
    notification_settings JSONB DEFAULT '{
        "goals": true,
        "cards": false,
        "lineups": true,
        "final_results": true,
        "news": true,
        "push_enabled": true,
        "email_enabled": false
    }',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User Analytics table
CREATE TABLE user_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    timestamp TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    country VARCHAR(100),
    device_type VARCHAR(50)
);

-- News Articles table
CREATE TABLE news_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    content TEXT,
    summary TEXT,
    author VARCHAR(255),
    source VARCHAR(255),
    source_url TEXT,
    image_url TEXT,
    category VARCHAR(100),
    tags TEXT[],
    related_teams INTEGER[],
    related_players INTEGER[],
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Push Notification Tokens table
CREATE TABLE push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    platform VARCHAR(20) CHECK (platform IN ('ios', 'android', 'web')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, token, platform)
);

-- API Rate Limiting table
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    requests_count INTEGER DEFAULT 1,
    window_start TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, endpoint, window_start)
);

-- Performance Indexes
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_teams ON matches(home_team_id, away_team_id);
CREATE INDEX idx_matches_competition_season ON matches(competition_id, season);
CREATE INDEX idx_match_events_match ON match_events(match_id);
CREATE INDEX idx_match_events_time ON match_events(time_minute, time_extra);
CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscription_tier);
CREATE INDEX idx_standings_competition_season ON standings(competition_id, season);
CREATE INDEX idx_standings_position ON standings(position);
CREATE INDEX idx_user_analytics_user_timestamp ON user_analytics(user_id, timestamp);
CREATE INDEX idx_user_analytics_event_type ON user_analytics(event_type);
CREATE INDEX idx_news_published ON news_articles(published_at DESC);
CREATE INDEX idx_news_category ON news_articles(category);
CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_tokens(is_active);

-- Composite indexes for common queries
CREATE INDEX idx_matches_live ON matches(status, match_date) WHERE status = 'live';
CREATE INDEX idx_matches_today ON matches(match_date) WHERE DATE(match_date) = CURRENT_DATE;
CREATE INDEX idx_team_players_active ON team_players(team_id, is_active) WHERE is_active = true;

-- Full-text search indexes
CREATE INDEX idx_teams_search ON teams USING GIN (to_tsvector('english', name || ' ' || COALESCE(short_name, '')));
CREATE INDEX idx_players_search ON players USING GIN (to_tsvector('english', name || ' ' || COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')));
CREATE INDEX idx_news_search ON news_articles USING GIN (to_tsvector('english', title || ' ' || COALESCE(summary, '')));

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_articles_updated_at BEFORE UPDATE ON news_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_tokens_updated_at BEFORE UPDATE ON push_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE VIEW live_matches AS
SELECT 
    m.*,
    ht.name as home_team_name,
    ht.logo_url as home_team_logo,
    at.name as away_team_name,
    at.logo_url as away_team_logo,
    c.name as competition_name,
    c.logo_url as competition_logo
FROM matches m
JOIN teams ht ON m.home_team_id = ht.id
JOIN teams at ON m.away_team_id = at.id
LEFT JOIN competitions c ON m.competition_id = c.id
WHERE m.status = 'live'
ORDER BY m.match_date;

CREATE VIEW today_matches AS
SELECT 
    m.*,
    ht.name as home_team_name,
    ht.logo_url as home_team_logo,
    at.name as away_team_name,
    at.logo_url as away_team_logo,
    c.name as competition_name,
    c.logo_url as competition_logo
FROM matches m
JOIN teams ht ON m.home_team_id = ht.id
JOIN teams at ON m.away_team_id = at.id
LEFT JOIN competitions c ON m.competition_id = c.id
WHERE DATE(m.match_date) = CURRENT_DATE
ORDER BY m.match_date;