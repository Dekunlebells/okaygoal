import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger } from '@/utils/logger';

interface ApiFootballConfig {
  apiKey: string;
  baseURL: string;
  timeout: number;
}

interface Match {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    periods: {
      first: number | null;
      second: number | null;
    };
    venue: {
      id: number | null;
      name: string | null;
      city: string | null;
    };
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    round: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
    extratime: {
      home: number | null;
      away: number | null;
    };
    penalty: {
      home: number | null;
      away: number | null;
    };
  };
}

interface League {
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
  };
  country: {
    name: string;
    code: string;
    flag: string;
  };
  seasons: Array<{
    year: number;
    start: string;
    end: string;
    current: boolean;
  }>;
}

interface Team {
  team: {
    id: number;
    name: string;
    code: string;
    country: string;
    founded: number;
    national: boolean;
    logo: string;
  };
  venue: {
    id: number;
    name: string;
    address: string;
    city: string;
    capacity: number;
    surface: string;
    image: string;
  };
}

class FootballApiService {
  private api: AxiosInstance;
  private readonly config: ApiFootballConfig;

  constructor() {
    this.config = {
      apiKey: process.env.FOOTBALL_API_KEY || '',
      baseURL: 'https://v3.football.api-sports.io',
      timeout: 15000,
    };

    if (!this.config.apiKey) {
      logger.warn('FOOTBALL_API_KEY not found in environment variables');
    }

    this.api = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'X-RapidAPI-Key': this.config.apiKey,
        'X-RapidAPI-Host': 'v3.football.api-sports.io',
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        logger.info(`Football API request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Football API request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        logger.info(`Football API response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('Football API response error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  // Live matches
  async getLiveMatches(): Promise<Match[]> {
    try {
      const response: AxiosResponse = await this.api.get('/fixtures', {
        params: { live: 'all' },
      });
      return response.data.response || [];
    } catch (error) {
      logger.error('Error fetching live matches:', error);
      throw new Error('Failed to fetch live matches');
    }
  }

  // Today's matches
  async getTodayMatches(): Promise<Match[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response: AxiosResponse = await this.api.get('/fixtures', {
        params: { date: today },
      });
      return response.data.response || [];
    } catch (error) {
      logger.error('Error fetching today matches:', error);
      throw new Error('Failed to fetch today matches');
    }
  }

  // Matches by date
  async getMatchesByDate(date: string): Promise<Match[]> {
    try {
      const response: AxiosResponse = await this.api.get('/fixtures', {
        params: { date },
      });
      return response.data.response || [];
    } catch (error) {
      logger.error(`Error fetching matches for ${date}:`, error);
      throw new Error(`Failed to fetch matches for ${date}`);
    }
  }

  // Matches by league
  async getMatchesByLeague(leagueId: number, season: number): Promise<Match[]> {
    try {
      const response: AxiosResponse = await this.api.get('/fixtures', {
        params: { league: leagueId, season },
      });
      return response.data.response || [];
    } catch (error) {
      logger.error(`Error fetching matches for league ${leagueId}:`, error);
      throw new Error(`Failed to fetch matches for league ${leagueId}`);
    }
  }

  // Matches by team
  async getMatchesByTeam(teamId: number, season: number): Promise<Match[]> {
    try {
      const response: AxiosResponse = await this.api.get('/fixtures', {
        params: { team: teamId, season },
      });
      return response.data.response || [];
    } catch (error) {
      logger.error(`Error fetching matches for team ${teamId}:`, error);
      throw new Error(`Failed to fetch matches for team ${teamId}`);
    }
  }

  // Get leagues
  async getLeagues(): Promise<League[]> {
    try {
      const response: AxiosResponse = await this.api.get('/leagues');
      return response.data.response || [];
    } catch (error) {
      logger.error('Error fetching leagues:', error);
      throw new Error('Failed to fetch leagues');
    }
  }

  // Get teams
  async getTeams(leagueId?: number, season?: number): Promise<Team[]> {
    try {
      const params: any = {};
      if (leagueId) params.league = leagueId;
      if (season) params.season = season;

      const response: AxiosResponse = await this.api.get('/teams', { params });
      return response.data.response || [];
    } catch (error) {
      logger.error('Error fetching teams:', error);
      throw new Error('Failed to fetch teams');
    }
  }

  // Get team by ID
  async getTeamById(teamId: number): Promise<Team | null> {
    try {
      const response: AxiosResponse = await this.api.get('/teams', {
        params: { id: teamId },
      });
      return response.data.response[0] || null;
    } catch (error) {
      logger.error(`Error fetching team ${teamId}:`, error);
      throw new Error(`Failed to fetch team ${teamId}`);
    }
  }

  // Get league standings
  async getStandings(leagueId: number, season: number): Promise<any[]> {
    try {
      const response: AxiosResponse = await this.api.get('/standings', {
        params: { league: leagueId, season },
      });
      return response.data.response || [];
    } catch (error) {
      logger.error(`Error fetching standings for league ${leagueId}:`, error);
      throw new Error(`Failed to fetch standings for league ${leagueId}`);
    }
  }

  // Get match statistics
  async getMatchStatistics(fixtureId: number): Promise<any[]> {
    try {
      const response: AxiosResponse = await this.api.get('/fixtures/statistics', {
        params: { fixture: fixtureId },
      });
      return response.data.response || [];
    } catch (error) {
      logger.error(`Error fetching statistics for fixture ${fixtureId}:`, error);
      throw new Error(`Failed to fetch statistics for fixture ${fixtureId}`);
    }
  }

  // Get match events
  async getMatchEvents(fixtureId: number): Promise<any[]> {
    try {
      const response: AxiosResponse = await this.api.get('/fixtures/events', {
        params: { fixture: fixtureId },
      });
      return response.data.response || [];
    } catch (error) {
      logger.error(`Error fetching events for fixture ${fixtureId}:`, error);
      throw new Error(`Failed to fetch events for fixture ${fixtureId}`);
    }
  }

  // Get API status (useful for monitoring)
  async getApiStatus(): Promise<any> {
    try {
      const response: AxiosResponse = await this.api.get('/status');
      return response.data.response;
    } catch (error) {
      logger.error('Error fetching API status:', error);
      throw new Error('Failed to fetch API status');
    }
  }

  // Check if API key is configured
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }
}

// Export singleton instance
export const footballApi = new FootballApiService();
export default footballApi;