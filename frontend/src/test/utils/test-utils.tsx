import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { Toaster } from 'react-hot-toast';

// Import all slices
import authSlice from '@/store/slices/authSlice';
import appSlice from '@/store/slices/appSlice';
import matchesSlice from '@/store/slices/matchesSlice';
import userSlice from '@/store/slices/userSlice';

// Mock store configuration
const createMockStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      app: appSlice,
      matches: matchesSlice,
      user: userSlice,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: any;
  store?: ReturnType<typeof createMockStore>;
  route?: string;
}

const customRender = (
  ui: ReactElement,
  {
    preloadedState = {},
    store = createMockStore(preloadedState),
    route = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  window.history.pushState({}, 'Test page', route);

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Provider store={store}>
      <BrowserRouter>
        {children}
        <Toaster />
      </BrowserRouter>
    </Provider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

// Mock user data
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  subscription_tier: 'free',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock match data
export const mockMatch = {
  id: 1,
  competition_id: 1,
  season: '2024',
  home_team_id: 1,
  away_team_id: 2,
  match_date: new Date().toISOString(),
  status: 'live',
  home_score: 2,
  away_score: 1,
  home_team: {
    id: 1,
    name: 'Liverpool',
    logo_url: '/logos/liverpool.png',
    country: 'England',
  },
  away_team: {
    id: 2,
    name: 'Arsenal',
    logo_url: '/logos/arsenal.png',
    country: 'England',
  },
  competition: {
    id: 1,
    name: 'Premier League',
    logo_url: '/logos/premier-league.png',
    country: 'England',
  },
};

// Mock team data
export const mockTeam = {
  id: 1,
  name: 'Liverpool',
  full_name: 'Liverpool Football Club',
  logo_url: '/logos/liverpool.png',
  country: 'England',
  founded: 1892,
  venue_name: 'Anfield',
  venue_capacity: 54074,
  venue_city: 'Liverpool',
  coach_name: 'Jurgen Klopp',
};

// Mock player data
export const mockPlayer = {
  id: 1,
  name: 'Mohamed Salah',
  full_name: 'Mohamed Salah Hamed Mahrous Ghaly',
  photo_url: '/photos/salah.jpg',
  nationality: 'Egypt',
  birth_date: '1992-06-15',
  birth_place: 'Nagrig, Egypt',
  height: 175,
  weight: 71,
  position: 'forward',
  jersey_number: 11,
  current_team: mockTeam,
};

// Mock API responses
export const mockApiResponse = <T>(data: T, success = true) => ({
  data: {
    success,
    data,
    message: success ? 'Success' : 'Error',
  },
});

// Mock fetch responses
export const mockFetch = (data: any, status = 200) => {
  const mockResponse = {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  };
  
  (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
  return mockResponse;
};

// Export everything
export * from '@testing-library/react';
export { customRender as render, createMockStore };
export { default as userEvent } from '@testing-library/user-event';