import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger, loggerHelpers, performanceLogger } from '@/utils/logger';
import { db } from '@/database/connection';
import { ApiFootballMatch, ApiFootballEvent, Match, MatchEvent, Team, Competition } from '@/types';
import { broadcastLiveScores, broadcastMatchEvent } from './websocket';

interface ApiFootballResponse<T> {
  get: string;
  parameters: Record<string, any>;
  errors: any[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T;
}

class ApiFootballService {
  private client: AxiosInstance;
  private readonly baseURL: string = 'https://v3.football.api-sports.io';
  private readonly apiKey: string;
  private requestCount: number = 0;
  private lastReset: Date = new Date();

  constructor() {
    this.apiKey = process.env.API_FOOTBALL_KEY || '';
    
    if (!this.apiKey) {
      logger.error('API-Football API key not configured');
      throw new Error('API_FOOTBALL_KEY environment variable is required');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      }
    });

    // Request interceptor for logging and rate limiting
    this.client.interceptors.request.use(
      (config) => {
        this.requestCount++;
        loggerHelpers.apiCall('api-football', config.url || '', 0, 0);
        return config;
      },
      (error) => {
        logger.error('API-Football request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiFootballResponse<any>>) => {
        const duration = Date.now() - (response.config as any).metadata?.startTime;
        loggerHelpers.apiCall(
          'api-football',
          response.config.url || '',
          response.status,
          duration || 0
        );

        // Check for API errors
        if (response.data.errors && response.data.errors.length > 0) {
          logger.error('API-Football API errors:', response.data.errors);
        }

        return response;
      },
      (error) => {
        const duration = Date.now() - (error.config as any)?.metadata?.startTime;
        loggerHelpers.apiCall(
          'api-football',
          error.config?.url || '',
          error.response?.status || 0,
          duration || 0
        );

        logger.error('API-Football response error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });

        return Promise.reject(error);
      }
    );
  }

  // Get live matches
  public async getLiveMatches(): Promise<Match[]> {
    const timer = performanceLogger.start('api_football_live_matches');
    
    try {
      const response = await this.client.get<ApiFootballResponse<ApiFootballMatch[]>>('/fixtures', {
        params: { live: 'all' }
      });

      if (response.data.errors.length > 0) {
        throw new Error(`API errors: ${response.data.errors.join(', ')}`);
      }

      const matches = await this.processMatches(response.data.response);
      
      timer.end();
      logger.info(`Fetched ${matches.length} live matches from API-Football`);
      
      return matches;

    } catch (error) {
      timer.end();
      logger.error('Failed to fetch live matches:', error);
      throw error;
    }
  }

  // Get matches for a specific date
  public async getMatchesByDate(date: string): Promise<Match[]> {
    const timer = performanceLogger.start('api_football_matches_by_date');
    
    try {
      const response = await this.client.get<ApiFootballResponse<ApiFootballMatch[]>>('/fixtures', {
        params: { date }
      });

      if (response.data.errors.length > 0) {
        throw new Error(`API errors: ${response.data.errors.join(', ')}`);
      }

      const matches = await this.processMatches(response.data.response);
      
      timer.end();
      logger.info(`Fetched ${matches.length} matches for date ${date}`);
      
      return matches;

    } catch (error) {
      timer.end();
      logger.error('Failed to fetch matches by date:', error);
      throw error;
    }
  }

  // Get match details with events
  public async getMatchDetails(fixtureId: number): Promise<{ match: Match; events: MatchEvent[] }> {
    const timer = performanceLogger.start('api_football_match_details');
    
    try {
      // Get match data
      const [matchResponse, eventsResponse] = await Promise.all([
        this.client.get<ApiFootballResponse<ApiFootballMatch[]>>('/fixtures', {
          params: { id: fixtureId }
        }),
        this.client.get<ApiFootballResponse<ApiFootballEvent[]>>('/fixtures/events', {
          params: { fixture: fixtureId }
        })
      ]);

      if (matchResponse.data.errors.length > 0 || eventsResponse.data.errors.length > 0) {
        throw new Error('API errors occurred while fetching match details');
      }

      const matches = await this.processMatches(matchResponse.data.response);
      const events = await this.processMatchEvents(eventsResponse.data.response, fixtureId);

      if (matches.length === 0) {
        throw new Error('Match not found');
      }

      timer.end();
      
      return {
        match: matches[0],
        events
      };

    } catch (error) {
      timer.end();
      logger.error('Failed to fetch match details:', error);
      throw error;
    }
  }

  // Get competitions/leagues
  public async getCompetitions(season?: number): Promise<Competition[]> {
    const timer = performanceLogger.start('api_football_competitions');
    
    try {
      const response = await this.client.get<ApiFootballResponse<any[]>>('/leagues', {
        params: season ? { season } : {}
      });

      if (response.data.errors.length > 0) {
        throw new Error(`API errors: ${response.data.errors.join(', ')}`);
      }

      const competitions = await this.processCompetitions(response.data.response);
      
      timer.end();
      logger.info(`Fetched ${competitions.length} competitions`);
      
      return competitions;

    } catch (error) {
      timer.end();
      logger.error('Failed to fetch competitions:', error);
      throw error;
    }
  }

  // Get teams for a competition
  public async getTeamsByCompetition(leagueId: number, season: number): Promise<Team[]> {
    const timer = performanceLogger.start('api_football_teams_by_competition');
    
    try {
      const response = await this.client.get<ApiFootballResponse<any[]>>('/teams', {
        params: { league: leagueId, season }
      });

      if (response.data.errors.length > 0) {
        throw new Error(`API errors: ${response.data.errors.join(', ')}`);
      }

      const teams = await this.processTeams(response.data.response);
      
      timer.end();
      logger.info(`Fetched ${teams.length} teams for competition ${leagueId}`);
      
      return teams;

    } catch (error) {
      timer.end();
      logger.error('Failed to fetch teams by competition:', error);
      throw error;
    }
  }

  // Process and store matches in database
  private async processMatches(apiMatches: ApiFootballMatch[]): Promise<Match[]> {
    const matches: Match[] = [];

    for (const apiMatch of apiMatches) {
      try {
        // Ensure teams exist in database
        await this.ensureTeamExists(apiMatch.teams.home);
        await this.ensureTeamExists(apiMatch.teams.away);

        // Ensure competition exists
        await this.ensureCompetitionExists(apiMatch.league);

        // Map API match to our Match interface
        const match: Match = {
          id: apiMatch.fixture.id,
          competition_id: apiMatch.league.id,
          season: apiMatch.league.season.toString(),
          round: apiMatch.league.round,
          home_team_id: apiMatch.teams.home.id,
          away_team_id: apiMatch.teams.away.id,
          match_date: new Date(apiMatch.fixture.date),
          status: this.mapMatchStatus(apiMatch.fixture.status.short),
          minute: apiMatch.fixture.status.elapsed || undefined,
          home_score: apiMatch.goals.home || 0,
          away_score: apiMatch.goals.away || 0,
          venue_name: apiMatch.fixture.venue?.name,
          referee: apiMatch.fixture.referee,
          created_at: new Date(),
          updated_at: new Date()
        };

        // Upsert match in database
        await this.upsertMatch(match);
        matches.push(match);

        // Broadcast live score updates for live matches
        if (match.status === 'live') {
          broadcastLiveScores({
            match_id: match.id,
            home_score: match.home_score,
            away_score: match.away_score,
            status: match.status,
            minute: match.minute,
            timestamp: new Date()
          });
        }

      } catch (error) {
        logger.error('Error processing match:', { apiMatch: apiMatch.fixture.id, error });
      }
    }

    return matches;
  }

  // Process match events
  private async processMatchEvents(apiEvents: ApiFootballEvent[], matchId: number): Promise<MatchEvent[]> {
    const events: MatchEvent[] = [];

    for (const apiEvent of apiEvents) {
      try {
        const event: MatchEvent = {
          id: require('crypto').randomUUID(),
          match_id: matchId,
          team_id: apiEvent.team.id,
          player_id: apiEvent.player.id,
          assist_player_id: apiEvent.assist?.id,
          type: this.mapEventType(apiEvent.type),
          subtype: apiEvent.detail,
          time_minute: apiEvent.time.elapsed,
          time_extra: apiEvent.time.extra,
          detail: apiEvent.detail,
          comments: apiEvent.comments,
          created_at: new Date()
        };

        await this.upsertMatchEvent(event);
        events.push(event);

        // Broadcast match event
        broadcastMatchEvent(matchId, event);

      } catch (error) {
        logger.error('Error processing match event:', { matchId, apiEvent, error });
      }
    }

    return events;
  }

  // Ensure team exists in database
  private async ensureTeamExists(apiTeam: any): Promise<void> {
    const existingTeam = await db.queryOne(
      'SELECT id FROM teams WHERE id = $1',
      [apiTeam.id]
    );

    if (!existingTeam) {
      await db.query(
        `INSERT INTO teams (id, name, short_name, logo_url, country)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         short_name = EXCLUDED.short_name,
         logo_url = EXCLUDED.logo_url,
         updated_at = NOW()`,
        [apiTeam.id, apiTeam.name, apiTeam.name, apiTeam.logo, null]
      );
    }
  }

  // Ensure competition exists in database
  private async ensureCompetitionExists(apiLeague: any): Promise<void> {
    const existingCompetition = await db.queryOne(
      'SELECT id FROM competitions WHERE id = $1',
      [apiLeague.id]
    );

    if (!existingCompetition) {
      await db.query(
        `INSERT INTO competitions (id, name, country, logo_url, type, season, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         country = EXCLUDED.country,
         logo_url = EXCLUDED.logo_url,
         season = EXCLUDED.season,
         updated_at = NOW()`,
        [
          apiLeague.id,
          apiLeague.name,
          apiLeague.country,
          apiLeague.logo,
          'league', // Default type
          apiLeague.season.toString(),
          true
        ]
      );
    }
  }

  // Upsert match in database
  private async upsertMatch(match: Match): Promise<void> {
    await db.query(
      `INSERT INTO matches (id, competition_id, season, round, home_team_id, away_team_id, 
                           match_date, status, minute, home_score, away_score, venue_name, referee)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET
       status = EXCLUDED.status,
       minute = EXCLUDED.minute,
       home_score = EXCLUDED.home_score,
       away_score = EXCLUDED.away_score,
       updated_at = NOW()`,
      [
        match.id,
        match.competition_id,
        match.season,
        match.round,
        match.home_team_id,
        match.away_team_id,
        match.match_date,
        match.status,
        match.minute,
        match.home_score,
        match.away_score,
        match.venue_name,
        match.referee
      ]
    );
  }

  // Upsert match event in database
  private async upsertMatchEvent(event: MatchEvent): Promise<void> {
    await db.query(
      `INSERT INTO match_events (id, match_id, team_id, player_id, assist_player_id, type, 
                                subtype, time_minute, time_extra, detail, comments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
      [
        event.id,
        event.match_id,
        event.team_id,
        event.player_id,
        event.assist_player_id,
        event.type,
        event.subtype,
        event.time_minute,
        event.time_extra,
        event.detail,
        event.comments
      ]
    );
  }

  // Process competitions from API
  private async processCompetitions(apiCompetitions: any[]): Promise<Competition[]> {
    const competitions: Competition[] = [];

    for (const item of apiCompetitions) {
      const league = item.league;
      const seasons = item.seasons || [];

      const competition: Competition = {
        id: league.id,
        name: league.name,
        country: item.country?.name,
        logo_url: league.logo,
        type: league.type === 'Cup' ? 'cup' : 'league',
        season: seasons.length > 0 ? seasons[seasons.length - 1].year.toString() : '2023',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      await this.ensureCompetitionExists({ ...league, season: competition.season });
      competitions.push(competition);
    }

    return competitions;
  }

  // Process teams from API
  private async processTeams(apiTeams: any[]): Promise<Team[]> {
    const teams: Team[] = [];

    for (const item of apiTeams) {
      const team = item.team;
      const venue = item.venue;

      const teamData: Team = {
        id: team.id,
        name: team.name,
        short_name: team.code,
        logo_url: team.logo,
        country: team.country,
        founded: team.founded,
        venue_name: venue?.name,
        venue_capacity: venue?.capacity,
        created_at: new Date(),
        updated_at: new Date()
      };

      await this.ensureTeamExists(team);
      teams.push(teamData);
    }

    return teams;
  }

  // Map API match status to our status
  private mapMatchStatus(apiStatus: string): Match['status'] {
    const statusMap: Record<string, Match['status']> = {
      'TBD': 'scheduled',
      'NS': 'scheduled',
      '1H': 'live',
      'HT': 'live',
      '2H': 'live',
      'ET': 'live',
      'BT': 'live',
      'P': 'live',
      'SUSP': 'live',
      'INT': 'live',
      'FT': 'finished',
      'AET': 'finished',
      'PEN': 'finished',
      'PST': 'postponed',
      'CANC': 'cancelled',
      'ABD': 'cancelled',
      'AWD': 'finished',
      'WO': 'finished'
    };

    return statusMap[apiStatus] || 'scheduled';
  }

  // Map API event type to our event type
  private mapEventType(apiType: string): MatchEvent['type'] {
    const typeMap: Record<string, MatchEvent['type']> = {
      'Goal': 'goal',
      'Card': 'card',
      'subst': 'substitution',
      'Var': 'var'
    };

    return typeMap[apiType] || 'goal';
  }

  // Get API usage statistics
  public getApiUsage() {
    return {
      requestCount: this.requestCount,
      lastReset: this.lastReset,
      dailyLimit: 75000, // API-Football Ultra plan limit
      remaining: 75000 - this.requestCount
    };
  }

  // Reset daily request counter
  public resetDailyCounter() {
    this.requestCount = 0;
    this.lastReset = new Date();
    logger.info('API-Football request counter reset');
  }
}

// Create singleton instance
export const apiFootballService = new ApiFootballService();