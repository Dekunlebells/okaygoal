import React from 'react';
import { clsx } from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { Match } from '@/types';

interface MatchStatusBadgeProps {
  status: Match['status'];
  minute?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTime?: boolean;
}

export const MatchStatusBadge: React.FC<MatchStatusBadgeProps> = ({
  status,
  minute,
  size = 'sm',
  showTime = true,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'live':
        return {
          variant: 'danger' as const,
          text: showTime && minute ? `${minute}'` : 'LIVE',
          dot: true,
        };
      case 'finished':
        return {
          variant: 'default' as const,
          text: 'FT',
          dot: false,
        };
      case 'scheduled':
        return {
          variant: 'info' as const,
          text: 'Scheduled',
          dot: false,
        };
      case 'postponed':
        return {
          variant: 'warning' as const,
          text: 'Postponed',
          dot: false,
        };
      case 'cancelled':
        return {
          variant: 'default' as const,
          text: 'Cancelled',
          dot: false,
        };
      default:
        return {
          variant: 'default' as const,
          text: status,
          dot: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={config.dot}
      className={clsx({
        'live-indicator animate-pulse': status === 'live',
      })}
    >
      {config.text}
    </Badge>
  );
};