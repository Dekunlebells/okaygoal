import React, { useState } from 'react';
import { FotmobLayout } from '@/components/layout/FotmobLayout';
import { FotmobMainContent } from '@/components/matches/FotmobMainContent';

export const HomePage: React.FC = () => {
  const [selectedLeague, setSelectedLeague] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleLeagueChange = (leagueId: number) => {
    setSelectedLeague(leagueId);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <FotmobLayout
      selectedLeague={selectedLeague}
      onLeagueChange={handleLeagueChange}
      searchQuery={searchQuery}
      onSearchChange={handleSearchChange}
    >
      <FotmobMainContent 
        selectedLeague={selectedLeague}
      />
    </FotmobLayout>
  );
};