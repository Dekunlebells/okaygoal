import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '@/services/api';
import { SearchResult } from '@/types';
import { TeamBadge } from './TeamBadge';
import { CompetitionBadge } from './CompetitionBadge';
import { Button } from '@/components/ui/Button';

interface SearchBoxProps {
  className?: string;
  placeholder?: string;
  onSelect?: (result: SearchResult) => void;
  autoFocus?: boolean;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  className = '',
  placeholder = 'Search teams, players, competitions...',
  onSelect,
  autoFocus = false,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('okaygoal-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
  }, []);

  // Auto focus input
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query.trim());
      } else {
        setResults([]);
        setIsOpen(query.length > 0 || recentSearches.length > 0);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const response = await searchApi.searchAll(searchQuery, 8);
      setResults(response.data.data || []);
      setIsOpen(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addToRecentSearches = (searchTerm: string) => {
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('okaygoal-recent-searches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('okaygoal-recent-searches');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (value.length === 0) {
      setResults([]);
      setIsOpen(recentSearches.length > 0);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(query.length > 0 || results.length > 0 || recentSearches.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const totalItems = results.length + (recentSearches.length > 0 ? recentSearches.length : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < results.length) {
            handleResultSelect(results[selectedIndex]);
          } else if (recentSearches.length > 0) {
            const recentIndex = selectedIndex - results.length;
            const recentQuery = recentSearches[recentIndex];
            setQuery(recentQuery);
            performSearch(recentQuery);
          }
        } else if (query.trim()) {
          addToRecentSearches(query.trim());
          // Perform global search
          navigate(`/search?q=${encodeURIComponent(query.trim())}`);
          setIsOpen(false);
        }
        break;
        
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    addToRecentSearches(query);
    
    if (onSelect) {
      onSelect(result);
    } else {
      // Navigate to appropriate page based on result type
      switch (result.type) {
        case 'team':
          navigate(`/teams/${result.id}`);
          break;
        case 'player':
          navigate(`/players/${result.id}`);
          break;
        case 'competition':
          navigate(`/competitions/${result.id}`);
          break;
        case 'match':
          navigate(`/matches/${result.id}`);
          break;
      }
    }
    
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleRecentSearchSelect = (recentQuery: string) => {
    setQuery(recentQuery);
    performSearch(recentQuery);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'team':
        return '👥';
      case 'player':
        return '⚽';
      case 'competition':
        return '🏆';
      case 'match':
        return '📅';
      default:
        return '🔍';
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''} text-gray-400`} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
        
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div 
          ref={resultsRef}
          className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center">
              <div className="animate-spin w-5 h-5 mx-auto mb-2 border-2 border-primary-500 border-t-transparent rounded-full"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Searching...</p>
            </div>
          )}

          {/* Search Results */}
          {!isLoading && results.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                Search Results
              </div>
              {results.map((result, index) => (
                <SearchResultItem
                  key={`${result.type}-${result.id}`}
                  result={result}
                  isSelected={index === selectedIndex}
                  onClick={() => handleResultSelect(result)}
                />
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {!isLoading && query.length === 0 && recentSearches.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <span>Recent Searches</span>
                <button
                  onClick={clearRecentSearches}
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((recentQuery, index) => {
                const adjustedIndex = results.length + index;
                return (
                  <button
                    key={recentQuery}
                    onClick={() => handleRecentSearchSelect(recentQuery)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors ${
                      adjustedIndex === selectedIndex ? 'bg-gray-50 dark:bg-gray-700' : ''
                    }`}
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{recentQuery}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {!isLoading && query.length >= 2 && results.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No results found for "{query}"
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Try different keywords or check spelling
              </p>
            </div>
          )}

          {/* Popular Searches (when empty) */}
          {!isLoading && query.length === 0 && recentSearches.length === 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                Popular Searches
              </div>
              {['Liverpool', 'Barcelona', 'Premier League', 'Messi', 'Champions League'].map((popular, index) => (
                <button
                  key={popular}
                  onClick={() => handleRecentSearchSelect(popular)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                >
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{popular}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Search Result Item Component
interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ result, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors ${
        isSelected ? 'bg-gray-50 dark:bg-gray-700' : ''
      }`}
    >
      <div className="text-lg">{getResultIcon(result.type)}</div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {result.name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {result.type}
          </span>
        </div>
        
        {result.country && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {result.country}
          </p>
        )}
        
        {result.competition_name && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {result.competition_name}
          </p>
        )}
      </div>
      
      {result.logo_url && (
        <img
          src={result.logo_url}
          alt={result.name}
          className="w-6 h-6 rounded object-contain bg-white"
          loading="lazy"
        />
      )}
    </button>
  );
};

const getResultIcon = (type: SearchResult['type']) => {
  switch (type) {
    case 'team':
      return '👥';
    case 'player':
      return '⚽';
    case 'competition':
      return '🏆';
    case 'match':
      return '📅';
    default:
      return '🔍';
  }
};