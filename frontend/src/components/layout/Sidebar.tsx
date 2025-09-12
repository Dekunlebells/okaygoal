import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Activity, 
  Trophy, 
  Users, 
  User, 
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';

import { useAppSelector, useAppDispatch } from '@/store';
import { 
  selectSidebarOpen, 
  setSidebarOpen, 
  toggleSidebar 
} from '@/store/slices/appSlice';
import { selectUser } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  premium?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Live Matches', href: '/matches', icon: Activity, badge: 'Live' },
  { name: 'Competitions', href: '/competitions', icon: Trophy },
  { name: 'Teams', href: '/teams', icon: Users },
  { name: 'Following', href: '/following', icon: Star, premium: true },
  { name: 'Profile', href: '/profile', icon: User },
];

export const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const sidebarOpen = useAppSelector(selectSidebarOpen);
  const user = useAppSelector(selectUser);

  const isPremium = user?.subscription_tier === 'premium' || user?.subscription_tier === 'pro';

  return (
    <>
      {/* Desktop sidebar */}
      <div className={clsx(
        'hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:flex-col transition-all duration-300 bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-gray-700',
        sidebarOpen ? 'lg:w-64' : 'lg:w-16'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className={clsx(
            'flex items-center transition-all duration-300',
            sidebarOpen ? 'space-x-3' : 'justify-center'
          )}>
            <div className="text-2xl">⚽</div>
            {sidebarOpen && (
              <span className="text-xl font-bold gradient-text">
                OkayGoal
              </span>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch(toggleSidebar())}
            className="p-1"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            const isDisabled = item.premium && !isPremium;

            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => clsx(
                  'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors group',
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : isDisabled
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800',
                  sidebarOpen ? 'justify-start space-x-3' : 'justify-center'
                )}
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                  }
                }}
              >
                <Icon className={clsx(
                  'w-5 h-5 flex-shrink-0',
                  isDisabled && 'opacity-50'
                )} />
                
                {sidebarOpen && (
                  <>
                    <span className={clsx(
                      'flex-1 truncate',
                      isDisabled && 'opacity-50'
                    )}>
                      {item.name}
                    </span>
                    
                    {item.badge && (
                      <Badge 
                        variant={item.badge === 'Live' ? 'danger' : 'default'} 
                        size="xs"
                        dot={item.badge === 'Live'}
                      >
                        {item.badge}
                      </Badge>
                    )}
                    
                    {item.premium && !isPremium && (
                      <Badge variant="warning" size="xs">
                        Pro
                      </Badge>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Subscription tier */}
        {sidebarOpen && (
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                user?.subscription_tier === 'pro' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : user?.subscription_tier === 'premium'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              )}>
                {user?.subscription_tier?.[0]?.toUpperCase() || 'F'}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {user?.subscription_tier || 'Free'} Plan
                </div>
                {!isPremium && (
                  <button className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                    Upgrade to Pro
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile sidebar */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 lg:hidden',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">⚽</div>
            <span className="text-xl font-bold gradient-text">
              OkayGoal
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch(setSidebarOpen(false))}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            const isDisabled = item.premium && !isPremium;

            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => dispatch(setSidebarOpen(false))}
                className={({ isActive }) => clsx(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : isDisabled
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={clsx(
                    'w-5 h-5',
                    isDisabled && 'opacity-50'
                  )} />
                  <span className={isDisabled ? 'opacity-50' : ''}>
                    {item.name}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {item.badge && (
                    <Badge 
                      variant={item.badge === 'Live' ? 'danger' : 'default'} 
                      size="xs"
                      dot={item.badge === 'Live'}
                    >
                      {item.badge}
                    </Badge>
                  )}
                  
                  {item.premium && !isPremium && (
                    <Badge variant="warning" size="xs">
                      Pro
                    </Badge>
                  )}
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Subscription tier */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
              user?.subscription_tier === 'pro' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : user?.subscription_tier === 'premium'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            )}>
              {user?.subscription_tier?.[0]?.toUpperCase() || 'F'}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {user?.subscription_tier || 'Free'} Plan
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {user?.email}
              </div>
              {!isPremium && (
                <button className="text-xs text-primary-600 dark:text-primary-400 hover:underline mt-1">
                  Upgrade to Pro →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};