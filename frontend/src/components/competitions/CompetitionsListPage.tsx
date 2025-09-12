import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Globe, Star, Trophy, Calendar, Users } from 'lucide-react';
import { competitionsApi } from '@/services/api';
import { Competition } from '@/types';
import { CompetitionBadge } from '@/components/common/CompetitionBadge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useAppSelector } from '@/store/hooks';
import { selectFollowedCompetitions } from '@/store/slices/userSlice';

interface CompetitionsListPageProps {
  className?: string;
}

export const CompetitionsListPage: React.FC<CompetitionsListPageProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const followedCompetitionIds = useAppSelector(selectFollowedCompetitions);
  
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [filteredCompetitions, setFilteredCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showFollowedOnly, setShowFollowedOnly] = useState(false);

  useEffect(() => {
    loadCompetitions();
  }, []);

  useEffect(() => {
    filterCompetitions();
  }, [competitions, searchQuery, selectedCountry, selectedType, showFollowedOnly, followedCompetitionIds]);

  const loadCompetitions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await competitionsApi.getCompetitions();
      if (response.data.success) {
        setCompetitions(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load competitions:', error);
      setError('Failed to load competitions');
    } finally {
      setIsLoading(false);
    }
  };

  const filterCompetitions = () => {
    let filtered = competitions;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(competition =>
        competition.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        competition.country?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Country filter
    if (selectedCountry !== 'all') {
      filtered = filtered.filter(competition => competition.country === selectedCountry);
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(competition => competition.type === selectedType);
    }

    // Followed only filter
    if (showFollowedOnly) {
      filtered = filtered.filter(competition => followedCompetitionIds.includes(competition.id));
    }

    // Sort by popularity/importance
    filtered.sort((a, b) => {
      // Prioritize followed competitions
      const aFollowed = followedCompetitionIds.includes(a.id) ? 1 : 0;
      const bFollowed = followedCompetitionIds.includes(b.id) ? 1 : 0;
      if (aFollowed !== bFollowed) return bFollowed - aFollowed;
      
      // Then by name
      return a.name.localeCompare(b.name);
    });

    setFilteredCompetitions(filtered);
  };

  const getUniqueCountries = () => {
    const countries = competitions
      .map(comp => comp.country)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return countries;
  };

  const getCompetitionTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'league':
        return Trophy;
      case 'cup':
        return Star;
      case 'international':
        return Globe;
      default:
        return Trophy;
    }
  };

  const getCompetitionTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'league':
        return 'League';
      case 'cup':
        return 'Cup';
      case 'international':
        return 'International';
      default:
        return 'Competition';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <ErrorMessage 
          message={error}
          onRetry={loadCompetitions}
        />
      </div>
    );
  }

  const uniqueCountries = getUniqueCountries();
  const competitionTypes = [...new Set(competitions.map(c => c.type).filter(Boolean))];

  return (
    <div className={`max-w-6xl mx-auto p-4 space-y-6 ${className}`}>
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Competitions</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Explore football competitions from around the world
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Trophy className="w-4 h-4" />
            <span>{filteredCompetitions.length} competitions</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search competitions..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Country Filter */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Countries</option>
            {uniqueCountries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Types</option>
            {competitionTypes.map((type) => (
              <option key={type} value={type}>
                {getCompetitionTypeLabel(type)}
              </option>
            ))}
          </select>

          {/* Followed Only Toggle */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFollowedOnly}
              onChange={(e) => setShowFollowedOnly(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Followed only
            </span>
          </label>
        </div>
      </div>

      {/* Competitions Grid */}
      {filteredCompetitions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompetitions.map((competition) => {
            const isFollowed = followedCompetitionIds.includes(competition.id);
            const TypeIcon = getCompetitionTypeIcon(competition.type);
            
            return (
              <div
                key={competition.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/competitions/${competition.id}`)}
              >
                {/* Competition Header */}
                <div className="relative p-6 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <CompetitionBadge competition={competition} size="lg" />
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {competition.name}
                        </h3>
                        {competition.country && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {competition.country}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {isFollowed && (
                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                          <Star className="w-3 h-3 text-white fill-current" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Competition Details */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <TypeIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {getCompetitionTypeLabel(competition.type)}
                      </span>
                    </div>
                    {competition.season && (
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {competition.season}
                      </span>
                    )}
                  </div>

                  {competition.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                      {competition.description}
                    </p>
                  )}

                  {/* Competition Stats */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {competition.teams_count || '-'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Teams</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {competition.matches_count || '-'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Matches</div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/competitions/${competition.id}`);
                      }}
                      variant="secondary"
                      size="sm"
                      className="w-full"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No competitions found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {showFollowedOnly 
              ? "You haven't followed any competitions yet" 
              : "No competitions match your current filters"
            }
          </p>
          {showFollowedOnly && (
            <Button
              onClick={() => setShowFollowedOnly(false)}
              variant="primary"
              size="sm"
            >
              Show All Competitions
            </Button>
          )}
        </div>
      )}
    </div>
  );
};