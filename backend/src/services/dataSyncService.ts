import cron from 'node-cron';
import { apiFootballService } from './apiFootball';
import { logger, performanceLogger } from '@/utils/logger';
import { db } from '@/database/connection';

class DataSyncService {
  private isRunning: boolean = false;
  private syncTasks: Map<string, cron.ScheduledTask> = new Map();

  public startSyncServices(): void {
    logger.info('Starting data synchronization services...');

    // Sync live matches every 30 seconds during match hours (typically 10:00-23:00 UTC)
    const liveMatchSync = cron.schedule('*/30 * * * * *', async () => {
      if (this.shouldSyncLiveMatches()) {
        await this.syncLiveMatches();
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Sync today's fixtures every 5 minutes
    const todayFixturesSync = cron.schedule('*/5 * * * *', async () => {
      await this.syncTodayFixtures();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Sync competitions and teams daily at 02:00 UTC
    const dailyDataSync = cron.schedule('0 2 * * *', async () => {
      await this.syncCompetitionsAndTeams();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Weekly full data sync every Sunday at 03:00 UTC
    const weeklySync = cron.schedule('0 3 * * 0', async () => {
      await this.fullDataSync();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Reset API counter daily at midnight UTC
    const counterReset = cron.schedule('0 0 * * *', () => {
      apiFootballService.resetDailyCounter();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Store tasks for management
    this.syncTasks.set('liveMatches', liveMatchSync);
    this.syncTasks.set('todayFixtures', todayFixturesSync);
    this.syncTasks.set('dailyData', dailyDataSync);
    this.syncTasks.set('weeklySync', weeklySync);
    this.syncTasks.set('counterReset', counterReset);

    // Start all tasks
    this.syncTasks.forEach((task, name) => {
      task.start();
      logger.info(`Started ${name} sync task`);
    });

    this.isRunning = true;
    logger.info('All data synchronization services started successfully');
  }

  public stopSyncServices(): void {
    logger.info('Stopping data synchronization services...');

    this.syncTasks.forEach((task, name) => {
      task.stop();
      logger.info(`Stopped ${name} sync task`);
    });

    this.syncTasks.clear();
    this.isRunning = false;

    logger.info('All data synchronization services stopped');
  }

  // Sync live matches
  private async syncLiveMatches(): Promise<void> {
    const timer = performanceLogger.start('sync_live_matches');
    
    try {
      logger.info('Starting live matches synchronization...');
      
      const liveMatches = await apiFootballService.getLiveMatches();
      
      logger.info(`Synchronized ${liveMatches.length} live matches`);
      
      // Update cache with live match count
      await db.set('live_matches_count', liveMatches.length.toString(), 60);
      
    } catch (error) {
      logger.error('Live matches sync failed:', error);
    } finally {
      timer.end();
    }
  }

  // Sync today's fixtures
  private async syncTodayFixtures(): Promise<void> {
    const timer = performanceLogger.start('sync_today_fixtures');
    
    try {
      logger.info('Starting today fixtures synchronization...');
      
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const todayMatches = await apiFootballService.getMatchesByDate(today);
      
      logger.info(`Synchronized ${todayMatches.length} fixtures for today`);
      
      // Update cache
      await db.setInCache(`fixtures_${today}`, todayMatches, 300); // 5 minutes cache
      
    } catch (error) {
      logger.error('Today fixtures sync failed:', error);
    } finally {
      timer.end();
    }
  }

  // Sync competitions and teams
  private async syncCompetitionsAndTeams(): Promise<void> {
    const timer = performanceLogger.start('sync_competitions_teams');
    
    try {
      logger.info('Starting competitions and teams synchronization...');
      
      // Get current season year
      const currentYear = new Date().getFullYear();
      const currentSeason = new Date().getMonth() >= 6 ? currentYear : currentYear - 1;
      
      // Sync competitions
      const competitions = await apiFootballService.getCompetitions(currentSeason);
      logger.info(`Synchronized ${competitions.length} competitions`);
      
      // Sync teams for major competitions
      const majorLeagueIds = [39, 140, 78, 135, 61, 2, 3]; // Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League, Europa League
      
      for (const leagueId of majorLeagueIds) {
        try {
          const teams = await apiFootballService.getTeamsByCompetition(leagueId, currentSeason);
          logger.info(`Synchronized ${teams.length} teams for league ${leagueId}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          logger.error(`Failed to sync teams for league ${leagueId}:`, error);
        }
      }
      
    } catch (error) {
      logger.error('Competitions and teams sync failed:', error);
    } finally {
      timer.end();
    }
  }

  // Full data synchronization (weekly)
  private async fullDataSync(): Promise<void> {
    const timer = performanceLogger.start('full_data_sync');
    
    try {
      logger.info('Starting full data synchronization...');
      
      // Clean up old matches (older than 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      await db.query(
        'DELETE FROM matches WHERE match_date < $1 AND status = $2',
        [sixMonthsAgo, 'finished']
      );
      
      // Clean up old analytics data (older than 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      await db.query(
        'DELETE FROM user_analytics WHERE timestamp < $1',
        [threeMonthsAgo]
      );
      
      // Update database statistics
      await db.query('ANALYZE');
      
      // Sync recent competitions and teams data
      await this.syncCompetitionsAndTeams();
      
      // Sync next week's fixtures
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];
      
      try {
        await apiFootballService.getMatchesByDate(nextWeekStr);
        logger.info('Synchronized next week fixtures');
      } catch (error) {
        logger.error('Failed to sync next week fixtures:', error);
      }
      
      logger.info('Full data synchronization completed');
      
    } catch (error) {
      logger.error('Full data sync failed:', error);
    } finally {
      timer.end();
    }
  }

  // Check if we should sync live matches (during typical match hours)
  private shouldSyncLiveMatches(): boolean {
    const now = new Date();
    const utcHour = now.getUTCHours();
    
    // Sync during typical European match hours (10:00-23:00 UTC)
    // This covers most European leagues and some American leagues
    return utcHour >= 10 && utcHour <= 23;
  }

  // Manual sync methods for testing/admin use
  public async manualSyncLiveMatches(): Promise<void> {
    if (this.isRunning) {
      await this.syncLiveMatches();
    } else {
      throw new Error('Data sync service is not running');
    }
  }

  public async manualSyncTodayFixtures(): Promise<void> {
    if (this.isRunning) {
      await this.syncTodayFixtures();
    } else {
      throw new Error('Data sync service is not running');
    }
  }

  public async manualFullSync(): Promise<void> {
    if (this.isRunning) {
      await this.fullDataSync();
    } else {
      throw new Error('Data sync service is not running');
    }
  }

  // Get sync service status
  public getStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: Array.from(this.syncTasks.keys()),
      apiUsage: apiFootballService.getApiUsage(),
      lastSyncTimes: {
        // These would be stored in Redis/database in a real implementation
        liveMatches: null,
        todayFixtures: null,
        dailySync: null,
        weeklySync: null
      }
    };
  }

  // Health check for data freshness
  public async checkDataHealth(): Promise<{
    liveMatchesCount: number;
    todayMatchesCount: number;
    lastUpdateTime: Date | null;
    apiUsage: any;
  }> {
    try {
      const [liveCount, todayCount] = await Promise.all([
        db.query('SELECT COUNT(*) FROM matches WHERE status = $1', ['live']),
        db.query('SELECT COUNT(*) FROM matches WHERE DATE(match_date) = CURRENT_DATE'),
      ]);

      const lastUpdate = await db.queryOne(
        'SELECT MAX(updated_at) as last_update FROM matches WHERE updated_at > NOW() - INTERVAL \'1 hour\''
      );

      return {
        liveMatchesCount: parseInt(liveCount.rows[0].count),
        todayMatchesCount: parseInt(todayCount.rows[0].count),
        lastUpdateTime: lastUpdate?.last_update || null,
        apiUsage: apiFootballService.getApiUsage()
      };
    } catch (error) {
      logger.error('Data health check failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const dataSyncService = new DataSyncService();

// Auto-start sync services when module is imported in production
if (process.env.NODE_ENV === 'production' || process.env.AUTO_START_SYNC === 'true') {
  dataSyncService.startSyncServices();
}