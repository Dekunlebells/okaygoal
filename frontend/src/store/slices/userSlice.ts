import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserPreferences, LoadingState } from '@/types';
import { userApi } from '@/services/api';

interface UserState extends LoadingState {
  preferences: UserPreferences | null;
  followedTeamsData: any[];
  followedPlayersData: any[];
  followedCompetitionsData: any[];
}

const initialState: UserState = {
  preferences: null,
  followedTeamsData: [],
  followedPlayersData: [],
  followedCompetitionsData: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchUserPreferences = createAsyncThunk(
  'user/fetchPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApi.getPreferences();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch preferences');
    }
  }
);

export const updateUserPreferences = createAsyncThunk(
  'user/updatePreferences',
  async (preferences: Partial<UserPreferences>, { rejectWithValue }) => {
    try {
      const response = await userApi.updatePreferences(preferences);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update preferences');
    }
  }
);

export const followTeam = createAsyncThunk(
  'user/followTeam',
  async (teamId: number, { rejectWithValue }) => {
    try {
      const response = await userApi.follow({ type: 'team', id: teamId });
      return { teamId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to follow team');
    }
  }
);

export const unfollowTeam = createAsyncThunk(
  'user/unfollowTeam',
  async (teamId: number, { rejectWithValue }) => {
    try {
      const response = await userApi.unfollow({ type: 'team', id: teamId });
      return { teamId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to unfollow team');
    }
  }
);

export const followPlayer = createAsyncThunk(
  'user/followPlayer',
  async (playerId: number, { rejectWithValue }) => {
    try {
      const response = await userApi.follow({ type: 'player', id: playerId });
      return { playerId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to follow player');
    }
  }
);

export const unfollowPlayer = createAsyncThunk(
  'user/unfollowPlayer',
  async (playerId: number, { rejectWithValue }) => {
    try {
      const response = await userApi.unfollow({ type: 'player', id: playerId });
      return { playerId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to unfollow player');
    }
  }
);

export const followCompetition = createAsyncThunk(
  'user/followCompetition',
  async (competitionId: number, { rejectWithValue }) => {
    try {
      const response = await userApi.follow({ type: 'competition', id: competitionId });
      return { competitionId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to follow competition');
    }
  }
);

export const unfollowCompetition = createAsyncThunk(
  'user/unfollowCompetition',
  async (competitionId: number, { rejectWithValue }) => {
    try {
      const response = await userApi.unfollow({ type: 'competition', id: competitionId });
      return { competitionId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to unfollow competition');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    updateNotificationSettings: (state, action: PayloadAction<Partial<UserPreferences['notification_settings']>>) => {
      if (state.preferences) {
        state.preferences.notification_settings = {
          ...state.preferences.notification_settings,
          ...action.payload,
        };
      }
    },
    
    addFollowedTeam: (state, action: PayloadAction<number>) => {
      if (state.preferences && !state.preferences.followed_teams.includes(action.payload)) {
        state.preferences.followed_teams.push(action.payload);
      }
    },
    
    removeFollowedTeam: (state, action: PayloadAction<number>) => {
      if (state.preferences) {
        state.preferences.followed_teams = state.preferences.followed_teams.filter(
          id => id !== action.payload
        );
      }
    },
    
    addFollowedPlayer: (state, action: PayloadAction<number>) => {
      if (state.preferences && !state.preferences.followed_players.includes(action.payload)) {
        state.preferences.followed_players.push(action.payload);
      }
    },
    
    removeFollowedPlayer: (state, action: PayloadAction<number>) => {
      if (state.preferences) {
        state.preferences.followed_players = state.preferences.followed_players.filter(
          id => id !== action.payload
        );
      }
    },
    
    addFollowedCompetition: (state, action: PayloadAction<number>) => {
      if (state.preferences && !state.preferences.followed_competitions.includes(action.payload)) {
        state.preferences.followed_competitions.push(action.payload);
      }
    },
    
    removeFollowedCompetition: (state, action: PayloadAction<number>) => {
      if (state.preferences) {
        state.preferences.followed_competitions = state.preferences.followed_competitions.filter(
          id => id !== action.payload
        );
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch preferences
    builder
      .addCase(fetchUserPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserPreferences.fulfilled, (state, action) => {
        state.isLoading = false;
        state.preferences = action.payload;
      })
      .addCase(fetchUserPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update preferences
    builder
      .addCase(updateUserPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.isLoading = false;
        state.preferences = action.payload;
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Follow team
    builder
      .addCase(followTeam.fulfilled, (state, action) => {
        if (state.preferences && !state.preferences.followed_teams.includes(action.payload.teamId)) {
          state.preferences.followed_teams.push(action.payload.teamId);
        }
      })
      .addCase(followTeam.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Unfollow team
    builder
      .addCase(unfollowTeam.fulfilled, (state, action) => {
        if (state.preferences) {
          state.preferences.followed_teams = state.preferences.followed_teams.filter(
            id => id !== action.payload.teamId
          );
        }
      })
      .addCase(unfollowTeam.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Follow player
    builder
      .addCase(followPlayer.fulfilled, (state, action) => {
        if (state.preferences && !state.preferences.followed_players.includes(action.payload.playerId)) {
          state.preferences.followed_players.push(action.payload.playerId);
        }
      })
      .addCase(followPlayer.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Unfollow player
    builder
      .addCase(unfollowPlayer.fulfilled, (state, action) => {
        if (state.preferences) {
          state.preferences.followed_players = state.preferences.followed_players.filter(
            id => id !== action.payload.playerId
          );
        }
      })
      .addCase(unfollowPlayer.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Follow competition
    builder
      .addCase(followCompetition.fulfilled, (state, action) => {
        if (state.preferences && !state.preferences.followed_competitions.includes(action.payload.competitionId)) {
          state.preferences.followed_competitions.push(action.payload.competitionId);
        }
      })
      .addCase(followCompetition.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Unfollow competition
    builder
      .addCase(unfollowCompetition.fulfilled, (state, action) => {
        if (state.preferences) {
          state.preferences.followed_competitions = state.preferences.followed_competitions.filter(
            id => id !== action.payload.competitionId
          );
        }
      })
      .addCase(unfollowCompetition.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  updateNotificationSettings,
  addFollowedTeam,
  removeFollowedTeam,
  addFollowedPlayer,
  removeFollowedPlayer,
  addFollowedCompetition,
  removeFollowedCompetition,
} = userSlice.actions;

// Selectors
export const selectUser = (state: { user: UserState }) => state.user;
export const selectUserPreferences = (state: { user: UserState }) => state.user.preferences;
export const selectFollowedTeams = (state: { user: UserState }) => state.user.preferences?.followed_teams || [];
export const selectFollowedPlayers = (state: { user: UserState }) => state.user.preferences?.followed_players || [];
export const selectFollowedCompetitions = (state: { user: UserState }) => state.user.preferences?.followed_competitions || [];
export const selectNotificationSettings = (state: { user: UserState }) => state.user.preferences?.notification_settings;
export const selectUserLoading = (state: { user: UserState }) => state.user.isLoading;
export const selectUserError = (state: { user: UserState }) => state.user.error;

// Helper selectors
export const selectIsTeamFollowed = (teamId: number) => (state: { user: UserState }) => 
  state.user.preferences?.followed_teams.includes(teamId) || false;

export const selectIsPlayerFollowed = (playerId: number) => (state: { user: UserState }) => 
  state.user.preferences?.followed_players.includes(playerId) || false;

export const selectIsCompetitionFollowed = (competitionId: number) => (state: { user: UserState }) => 
  state.user.preferences?.followed_competitions.includes(competitionId) || false;

export default userSlice.reducer;