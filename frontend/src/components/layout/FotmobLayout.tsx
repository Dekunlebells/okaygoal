import React, { useState } from 'react';
import { Search, Settings, Menu, X } from 'lucide-react';

interface FotmobLayoutProps {
  children: React.ReactNode;
  selectedLeague?: number;
  onLeagueChange?: (leagueId: number) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const topLeagues = [
  { id: 39, name: 'Premier League', logo: '⚽', country: 'England' },
  { id: 140, name: 'Championship', logo: '⚽', country: 'England' },
  { id: 2, name: 'Champions League', logo: '⚽', country: 'Europe' },
  { id: 146, name: 'FA Cup', logo: '⚽', country: 'England' },
  { id: 3, name: 'Europa League', logo: '⚽', country: 'Europe' },
  { id: 5, name: 'FIFA World Cup', logo: '⚽', country: 'International' },
  { id: 144, name: 'League One', logo: '⚽', country: 'England' },
  { id: 135, name: 'LaLiga', logo: '⚽', country: 'Spain' },
  { id: 145, name: 'League Two', logo: '⚽', country: 'England' },
  { id: 143, name: 'EFL Cup', logo: '⚽', country: 'England' },
];

const newsItems = [
  {
    title: "Supercomputer Delivers Shocking Man Utd Relegation Prediction After Derby Defeat",
    time: "12 hr ago",
    source: "SI",
    image: "/api/placeholder/300/200"
  },
  {
    title: "'Change the Man'—Ruben Amorim Makes Man Utd Sack Admission After New...",
    time: "3 hr ago", 
    source: "SI",
    image: "/api/placeholder/300/200"
  }
];

export const FotmobLayout: React.FC<FotmobLayoutProps> = ({ 
  children, 
  selectedLeague = 0, 
  onLeagueChange,
  searchQuery = '',
  onSearchChange
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                OKAYGOAL
              </h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Navigation */}
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                News
              </button>
              <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                About us
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out mt-16 lg:mt-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="h-full overflow-y-auto py-6 px-4">
            {/* Top leagues section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top leagues
              </h3>
              <nav className="space-y-1">
                {topLeagues.map((league) => (
                  <button
                    key={league.id}
                    onClick={() => onLeagueChange?.(league.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      selectedLeague === league.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="mr-3 text-base">{league.logo}</span>
                    <span className="flex-1 text-left">{league.name}</span>
                  </button>
                ))}
              </nav>

              {/* All leagues dropdown */}
              <button 
                onClick={() => onLeagueChange?.(0)}
                className={`w-full flex items-center px-3 py-2 mt-4 text-sm font-medium rounded-lg transition-colors ${
                  selectedLeague === 0
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="flex-1 text-left">All leagues</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>

        {/* Right Sidebar */}
        <aside className="hidden xl:block w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
          <div className="h-full overflow-y-auto py-6 px-4">
            {/* Build your own XI */}
            <div className="mb-8">
              <div className="bg-green-500 rounded-lg p-6 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold mb-2">Build your own XI</h3>
                  <p className="text-green-100 text-sm mb-4">Try our lineup builder</p>
                  
                  {/* Formation dots */}
                  <div className="space-y-3">
                    <div className="flex justify-center space-x-3">
                      <div className="w-6 h-6 bg-white rounded-full opacity-80"></div>
                    </div>
                    <div className="flex justify-center space-x-6">
                      <div className="w-6 h-6 bg-white rounded-full opacity-80"></div>
                      <div className="w-6 h-6 bg-white rounded-full opacity-80"></div>
                      <div className="w-6 h-6 bg-white rounded-full opacity-80"></div>
                    </div>
                    <div className="flex justify-center space-x-4">
                      <div className="w-6 h-6 bg-white rounded-full opacity-80"></div>
                      <div className="w-6 h-6 bg-white rounded-full opacity-80"></div>
                      <div className="w-6 h-6 bg-white rounded-full opacity-80"></div>
                    </div>
                    <div className="flex justify-center space-x-8">
                      <div className="w-6 h-6 bg-white rounded-full opacity-80"></div>
                      <div className="w-6 h-6 bg-white rounded-full opacity-80"></div>
                      <div className="w-6 h-6 bg-white rounded-full opacity-80"></div>
                      <div className="w-6 h-6 bg-white rounded-full opacity-80"></div>
                    </div>
                  </div>
                </div>
                
                {/* Background pattern */}
                <div className="absolute top-0 right-0 w-16 h-16 opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* News section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                News
              </h3>
              <div className="space-y-4">
                {newsItems.map((news, index) => (
                  <div key={index} className="flex space-x-3">
                    <img 
                      src={`https://picsum.photos/80/60?random=${index}`}
                      alt=""
                      className="w-20 h-15 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-3 leading-tight mb-2">
                        {news.title}
                      </h4>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium">{news.source}</span>
                        <span>•</span>
                        <span>{news.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
};