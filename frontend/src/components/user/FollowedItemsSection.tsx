import React, { useState, useEffect } from 'react';
import { Heart, X, Search, Users, Trophy, Star } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectFollowedTeams, 
  selectFollowedPlayers, 
  selectFollowedCompetitions,
  unfollowTeam,
  unfollowPlayer,
  unfollowCompetition
} from '@/store/slices/userSlice';
import { teamApi, playerApi, competitionsApi } from '@/services/api';
import { Team, Player, Competition } from '@/types';
import { TeamBadge } from '@/components/common/TeamBadge';
import { CompetitionBadge } from '@/components/common/CompetitionBadge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface FollowedItemsSectionProps {
  className?: string;
}

export const FollowedItemsSection: React.FC<FollowedItemsSectionProps> = ({ className = '' }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const followedTeamIds = useAppSelector(selectFollowedTeams);
  const followedPlayerIds = useAppSelector(selectFollowedPlayers);
  const followedCompetitionIds = useAppSelector(selectFollowedCompetitions);

  const [followedTeams, setFollowedTeams] = useState<Team[]>([]);
  const [followedPlayers, setFollowedPlayers] = useState<Player[]>([]);
  const [followedCompetitions, setFollowedCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unfollowingIds, setUnfollowingIds] = useState<{
    teams: number[];
    players: number[];
    competitions: number[];
  }>({
    teams: [],
    players: [],
    competitions: []
  });

  const [searchQueries, setSearchQueries] = useState({
    teams: '',
    players: '',
    competitions: ''
  });

  useEffect(() => {
    loadFollowedItems();
  }, [followedTeamIds, followedPlayerIds, followedCompetitionIds]);

  const loadFollowedItems = async () => {
    setIsLoading(true);
    try {
      const [teamsData, playersData, competitionsData] = await Promise.all([
        loadTeamsData(),
        loadPlayersData(),
        loadCompetitionsData()
      ]);

      setFollowedTeams(teamsData);
      setFollowedPlayers(playersData);
      setFollowedCompetitions(competitionsData);
    } catch (error) {
      console.error('Failed to load followed items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamsData = async (): Promise<Team[]> => {
    if (followedTeamIds.length === 0) return [];
    
    try {
      const promises = followedTeamIds.map(id => teamApi.getTeamById(id));
      const responses = await Promise.all(promises);
      return responses
        .filter(response => response.data.success)
        .map(response => response.data.data);
    } catch (error) {
      console.error('Failed to load teams data:', error);
      return [];
    }
  };

  const loadPlayersData = async (): Promise<Player[]> => {
    if (followedPlayerIds.length === 0) return [];
    
    try {
      const promises = followedPlayerIds.map(id => playerApi.getPlayerById(id));
      const responses = await Promise.all(promises);
      return responses
        .filter(response => response.data.success)
        .map(response => response.data.data);
    } catch (error) {
      console.error('Failed to load players data:', error);
      return [];
    }
  };

  const loadCompetitionsData = async (): Promise<Competition[]> => {
    if (followedCompetitionIds.length === 0) return [];
    
    try {
      const promises = followedCompetitionIds.map(id => competitionsApi.getCompetitionDetails(id));
      const responses = await Promise.all(promises);
      return responses
        .filter(response => response.data.success)
        .map(response => response.data.data);
    } catch (error) {
      console.error('Failed to load competitions data:', error);
      return [];
    }
  };

  const handleUnfollowTeam = async (teamId: number) => {
    setUnfollowingIds(prev => ({
      ...prev,
      teams: [...prev.teams, teamId]
    }));

    try {
      await dispatch(unfollowTeam(teamId)).unwrap();
      setFollowedTeams(prev => prev.filter(team => team.id !== teamId));
      toast.success('Team unfollowed successfully');
    } catch (error) {
      console.error('Failed to unfollow team:', error);
      toast.error('Failed to unfollow team');
    } finally {
      setUnfollowingIds(prev => ({
        ...prev,
        teams: prev.teams.filter(id => id !== teamId)
      }));
    }
  };

  const handleUnfollowPlayer = async (playerId: number) => {
    setUnfollowingIds(prev => ({
      ...prev,
      players: [...prev.players, playerId]
    }));

    try {
      await dispatch(unfollowPlayer(playerId)).unwrap();
      setFollowedPlayers(prev => prev.filter(player => player.id !== playerId));
      toast.success('Player unfollowed successfully');
    } catch (error) {
      console.error('Failed to unfollow player:', error);
      toast.error('Failed to unfollow player');
    } finally {
      setUnfollowingIds(prev => ({
        ...prev,
        players: prev.players.filter(id => id !== playerId)
      }));
    }
  };

  const handleUnfollowCompetition = async (competitionId: number) => {
    setUnfollowingIds(prev => ({
      ...prev,
      competitions: [...prev.competitions, competitionId]
    }));

    try {
      await dispatch(unfollowCompetition(competitionId)).unwrap();
      setFollowedCompetitions(prev => prev.filter(comp => comp.id !== competitionId));
      toast.success('Competition unfollowed successfully');
    } catch (error) {
      console.error('Failed to unfollow competition:', error);
      toast.error('Failed to unfollow competition');
    } finally {
      setUnfollowingIds(prev => ({
        ...prev,
        competitions: prev.competitions.filter(id => id !== competitionId)
      }));
    }
  };

  const filterItems = <T extends { name: string }>(items: T[], query: string): T[] => {
    if (!query.trim()) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  };

  const filteredTeams = filterItems(followedTeams, searchQueries.teams);
  const filteredPlayers = filterItems(followedPlayers, searchQueries.players);
  const filteredCompetitions = filterItems(followedCompetitions, searchQueries.competitions);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Followed Teams */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Followed Teams ({followedTeams.length})
            </h3>
          </div>
          {followedTeams.length > 3 && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQueries.teams}
                onChange={(e) => setSearchQueries(prev => ({ ...prev, teams: e.target.value }))}
                placeholder="Search teams..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )}
        </div>

        {followedTeams.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>You're not following any teams yet</p>
            <p className="text-sm mt-1">Find teams to follow by using the search feature</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTeams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div 
                  className="flex items-center space-x-3 cursor-pointer flex-1"
                  onClick={() => navigate(`/teams/${team.id}`)}
                >
                  <TeamBadge team={team} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {team.name}
                    </p>
                    {team.country && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {team.country}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => handleUnfollowTeam(team.id)}
                  disabled={unfollowingIds.teams.includes(team.id)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  {unfollowingIds.teams.includes(team.id) ? (
                    <LoadingSpinner size="xs" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Followed Players */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Followed Players ({followedPlayers.length})
            </h3>
          </div>
          {followedPlayers.length > 3 && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQueries.players}
                onChange={(e) => setSearchQueries(prev => ({ ...prev, players: e.target.value }))}
                placeholder="Search players..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )}
        </div>

        {followedPlayers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>You're not following any players yet</p>
            <p className="text-sm mt-1">Find players to follow by using the search feature</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div 
                  className="flex items-center space-x-3 cursor-pointer flex-1"
                  onClick={() => navigate(`/players/${player.id}`)}
                >
                  {player.photo_url ? (
                    <img
                      src={player.photo_url}
                      alt={player.name}
                      className="w-10 h-10 rounded-full object-cover bg-gray-200 dark:bg-gray-600"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <Star className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {player.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {player.position && player.position}
                      {player.current_team && ` • ${player.current_team.name}`}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleUnfollowPlayer(player.id)}
                  disabled={unfollowingIds.players.includes(player.id)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  {unfollowingIds.players.includes(player.id) ? (
                    <LoadingSpinner size="xs" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Followed Competitions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Followed Competitions ({followedCompetitions.length})
            </h3>
          </div>
          {followedCompetitions.length > 3 && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQueries.competitions}
                onChange={(e) => setSearchQueries(prev => ({ ...prev, competitions: e.target.value }))}
                placeholder="Search competitions..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )}
        </div>

        {followedCompetitions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>You're not following any competitions yet</p>
            <p className="text-sm mt-1">Find competitions to follow by using the search feature</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredCompetitions.map((competition) => (
              <div
                key={competition.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div 
                  className="flex items-center space-x-3 cursor-pointer flex-1"
                  onClick={() => navigate(`/competitions/${competition.id}`)}
                >
                  <CompetitionBadge competition={competition} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {competition.name}
                    </p>
                    {competition.country && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {competition.country}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => handleUnfollowCompetition(competition.id)}
                  disabled={unfollowingIds.competitions.includes(competition.id)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  {unfollowingIds.competitions.includes(competition.id) ? (
                    <LoadingSpinner size="xs" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};