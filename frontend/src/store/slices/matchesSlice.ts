import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MatchDetails, LiveScoreUpdate, LoadingState, SearchFilters } from '@/types';
import { matchesApi } from '@/services/api';

interface MatchesState extends LoadingState {
  liveMatches: MatchDetails[];
  todayMatches: MatchDetails[];
  upcomingMatches: MatchDetails[];
  recentMatches: MatchDetails[];
  selectedMatch: MatchDetails | null;
  lastUpdated: string | null;
  filters: SearchFilters;
}

const initialState: MatchesState = {
  liveMatches: [],
  todayMatches: [],
  upcomingMatches: [],
  recentMatches: [],
  selectedMatch: null,
  lastUpdated: null,
  isLoading: false,
  error: null,
  filters: {},
};

// Async thunks
export const fetchLiveMatches = createAsyncThunk(
  'matches/fetchLiveMatches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await matchesApi.getLiveMatches();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch live matches');
    }
  }
);

export const fetchTodayMatches = createAsyncThunk(
  'matches/fetchTodayMatches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await matchesApi.getTodayMatches();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch today matches');
    }
  }
);

export const fetchUpcomingMatches = createAsyncThunk(
  'matches/fetchUpcomingMatches',
  async (days: number = 7, { rejectWithValue }) => {
    try {
      const response = await matchesApi.getUpcomingMatches(days);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch upcoming matches');
    }
  }
);

export const fetchMatchDetails = createAsyncThunk(
  'matches/fetchMatchDetails',
  async (matchId: number, { rejectWithValue }) => {
    try {
      const response = await matchesApi.getMatchDetails(matchId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch match details');
    }
  }
);

export const searchMatches = createAsyncThunk(
  'matches/searchMatches',
  async (filters: SearchFilters, { rejectWithValue }) => {
    try {
      const response = await matchesApi.searchMatches(filters);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to search matches');
    }
  }
);

const matchesSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {
    updateLiveScore: (state, action: PayloadAction<LiveScoreUpdate>) => {
      const update = action.payload;
      
      // Update live matches
      const liveMatchIndex = state.liveMatches.findIndex(m => m.id === update.match_id);
      if (liveMatchIndex !== -1) {
        state.liveMatches[liveMatchIndex] = {
          ...state.liveMatches[liveMatchIndex],
          home_score: update.home_score,
          away_score: update.away_score,
          status: update.status,
          minute: update.minute,
        };
      }
      
      // Update today matches
      const todayMatchIndex = state.todayMatches.findIndex(m => m.id === update.match_id);
      if (todayMatchIndex !== -1) {
        state.todayMatches[todayMatchIndex] = {
          ...state.todayMatches[todayMatchIndex],
          home_score: update.home_score,
          away_score: update.away_score,
          status: update.status,
          minute: update.minute,
        };
      }
      
      // Update selected match if it's the same
      if (state.selectedMatch && state.selectedMatch.id === update.match_id) {
        state.selectedMatch = {
          ...state.selectedMatch,
          home_score: update.home_score,
          away_score: update.away_score,
          status: update.status,
          minute: update.minute,
        };
      }
      
      state.lastUpdated = new Date().toISOString();
    },
    
    addMatchEvent: (state, action: PayloadAction<{ matchId: number; event: any }>) => {
      const { matchId, event } = action.payload;
      
      // Add event to selected match if it's the same
      if (state.selectedMatch && state.selectedMatch.id === matchId) {
        if (!state.selectedMatch.events) {
          state.selectedMatch.events = [];
        }
        state.selectedMatch.events.unshift(event);
        
        // Sort events by time
        state.selectedMatch.events.sort((a, b) => {
          const timeA = a.time_minute + (a.time_extra || 0);
          const timeB = b.time_minute + (b.time_extra || 0);
          return timeB - timeA; // Newest first
        });
      }
    },
    
    setSelectedMatch: (state, action: PayloadAction<MatchDetails | null>) => {
      state.selectedMatch = action.payload;
    },
    
    clearSelectedMatch: (state) => {
      state.selectedMatch = null;
    },
    
    setFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.filters = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    moveFinishedMatches: (state) => {
      // Move finished matches from live to recent
      const finishedMatches = state.liveMatches.filter(m => m.status === 'finished');
      const stillLive = state.liveMatches.filter(m => m.status === 'live');
      
      state.liveMatches = stillLive;
      state.recentMatches = [...finishedMatches, ...state.recentMatches].slice(0, 20); // Keep latest 20
    },
    
    sortMatchesByTime: (state) => {
      state.liveMatches.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
      state.todayMatches.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
      state.upcomingMatches.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
      state.recentMatches.sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());
    },
  },
  extraReducers: (builder) => {
    // Fetch live matches
    builder
      .addCase(fetchLiveMatches.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLiveMatches.fulfilled, (state, action) => {
        state.isLoading = false;
        state.liveMatches = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchLiveMatches.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch today matches
    builder
      .addCase(fetchTodayMatches.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTodayMatches.fulfilled, (state, action) => {
        state.isLoading = false;
        state.todayMatches = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchTodayMatches.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch upcoming matches
    builder
      .addCase(fetchUpcomingMatches.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUpcomingMatches.fulfilled, (state, action) => {
        state.isLoading = false;
        state.upcomingMatches = action.payload;
      })
      .addCase(fetchUpcomingMatches.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch match details
    builder
      .addCase(fetchMatchDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMatchDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedMatch = action.payload;
      })
      .addCase(fetchMatchDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Search matches
    builder
      .addCase(searchMatches.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchMatches.fulfilled, (state, action) => {
        state.isLoading = false;
        // Could add search results to a separate field if needed
      })
      .addCase(searchMatches.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  updateLiveScore,
  addMatchEvent,
  setSelectedMatch,
  clearSelectedMatch,
  setFilters,
  clearError,
  moveFinishedMatches,
  sortMatchesByTime,
} = matchesSlice.actions;

// Selectors
export const selectMatches = (state: { matches: MatchesState }) => state.matches;
export const selectLiveMatches = (state: { matches: MatchesState }) => state.matches.liveMatches;
export const selectTodayMatches = (state: { matches: MatchesState }) => state.matches.todayMatches;
export const selectUpcomingMatches = (state: { matches: MatchesState }) => state.matches.upcomingMatches;
export const selectRecentMatches = (state: { matches: MatchesState }) => state.matches.recentMatches;
export const selectSelectedMatch = (state: { matches: MatchesState }) => state.matches.selectedMatch;
export const selectMatchesLoading = (state: { matches: MatchesState }) => state.matches.isLoading;
export const selectMatchesError = (state: { matches: MatchesState }) => state.matches.error;
export const selectLastUpdated = (state: { matches: MatchesState }) => state.matches.lastUpdated;

export default matchesSlice.reducer;