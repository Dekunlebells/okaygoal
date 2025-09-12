import React from 'react';
import { render, screen, fireEvent } from '@/test/utils/test-utils';
import { MatchCard } from '../MatchCard';
import { mockMatch } from '@/test/utils/test-utils';

describe('MatchCard', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders match information correctly', () => {
    render(
      <MatchCard 
        match={mockMatch} 
        onClick={mockOnClick} 
      />
    );

    expect(screen.getByText('Liverpool')).toBeInTheDocument();
    expect(screen.getByText('Arsenal')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // home score
    expect(screen.getByText('1')).toBeInTheDocument(); // away score
    expect(screen.getByText('Premier League')).toBeInTheDocument();
  });

  test('displays live indicator for live matches', () => {
    render(
      <MatchCard 
        match={{ ...mockMatch, status: 'live' }} 
        onClick={mockOnClick} 
      />
    );

    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  test('displays finished status for completed matches', () => {
    render(
      <MatchCard 
        match={{ ...mockMatch, status: 'finished' }} 
        onClick={mockOnClick} 
      />
    );

    expect(screen.getByText('FT')).toBeInTheDocument();
  });

  test('displays match time for scheduled matches', () => {
    const scheduledMatch = {
      ...mockMatch,
      status: 'scheduled',
      match_date: '2024-01-15T15:00:00Z'
    };

    render(
      <MatchCard 
        match={scheduledMatch} 
        onClick={mockOnClick} 
      />
    );

    // Should display time (format may vary based on locale)
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', () => {
    render(
      <MatchCard 
        match={mockMatch} 
        onClick={mockOnClick} 
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledWith(mockMatch);
  });

  test('renders compact variant correctly', () => {
    const { container } = render(
      <MatchCard 
        match={mockMatch} 
        variant="compact"
        onClick={mockOnClick} 
      />
    );

    // Compact variant should have smaller styling
    expect(container.firstChild).toHaveClass('p-3');
  });

  test('renders detailed variant correctly', () => {
    const { container } = render(
      <MatchCard 
        match={mockMatch} 
        variant="detailed"
        onClick={mockOnClick} 
      />
    );

    // Detailed variant should show more information
    expect(container.firstChild).toHaveClass('p-4');
  });

  test('renders without onClick handler', () => {
    render(
      <MatchCard match={mockMatch} />
    );

    expect(screen.getByText('Liverpool')).toBeInTheDocument();
    expect(screen.getByText('Arsenal')).toBeInTheDocument();
  });

  test('handles missing team logos gracefully', () => {
    const matchWithoutLogos = {
      ...mockMatch,
      home_team: { ...mockMatch.home_team, logo_url: undefined },
      away_team: { ...mockMatch.away_team, logo_url: undefined }
    };

    render(
      <MatchCard match={matchWithoutLogos} onClick={mockOnClick} />
    );

    // Should still render team names
    expect(screen.getByText('Liverpool')).toBeInTheDocument();
    expect(screen.getByText('Arsenal')).toBeInTheDocument();
  });

  test('displays correct match status styling', () => {
    const liveMatch = { ...mockMatch, status: 'live' };
    const { rerender } = render(
      <MatchCard match={liveMatch} onClick={mockOnClick} />
    );

    // Live match should have live indicator
    expect(screen.getByText('LIVE')).toHaveClass('bg-red-500');

    // Change to finished match
    const finishedMatch = { ...mockMatch, status: 'finished' };
    rerender(
      <MatchCard match={finishedMatch} onClick={mockOnClick} />
    );

    expect(screen.getByText('FT')).toBeInTheDocument();
  });
});