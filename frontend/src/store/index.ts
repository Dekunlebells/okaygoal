import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import slice reducers
import authSlice from './slices/authSlice';
import appSlice from './slices/appSlice';
import matchesSlice from './slices/matchesSlice';
import userSlice from './slices/userSlice';

// Combine reducers
const rootReducer = combineReducers({
  auth: authSlice,
  app: appSlice,
  matches: matchesSlice,
  user: userSlice,
});

// Persist config
const persistConfig = {
  key: 'okaygoal',
  version: 1,
  storage,
  whitelist: ['auth', 'app', 'user'], // Only persist these slices
  blacklist: ['matches'], // Don't persist matches (they update frequently)
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
      immutableCheck: {
        warnAfter: 128,
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;