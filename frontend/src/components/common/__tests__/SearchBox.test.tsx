import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/test/utils/test-utils';
import { SearchBox } from '../SearchBox';
import { mockApiResponse, mockFetch } from '@/test/utils/test-utils';

// Mock the API
jest.mock('@/services/api', () => ({
  searchApi: {
    searchAll: jest.fn(),
  },
}));

import { searchApi } from '@/services/api';
const mockSearchApi = searchApi as jest.Mocked<typeof searchApi>;

describe('SearchBox', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders search input with placeholder', () => {
    render(<SearchBox placeholder="Search teams..." />);
    
    const input = screen.getByPlaceholderText('Search teams...');
    expect(input).toBeInTheDocument();
  });

  test('shows search results when typing', async () => {
    const mockResults = [
      {
        type: 'team',
        id: 1,
        name: 'Liverpool',
        country: 'England',
        logo_url: '/logos/liverpool.png'
      },
      {
        type: 'player',
        id: 2,
        name: 'Mohamed Salah',
        current_team: { name: 'Liverpool' }
      }
    ];

    mockSearchApi.searchAll.mockResolvedValue(mockApiResponse(mockResults));

    render(<SearchBox />);
    
    const input = screen.getByPlaceholderText('Search teams, players, competitions...');
    fireEvent.change(input, { target: { value: 'liver' } });

    await waitFor(() => {
      expect(mockSearchApi.searchAll).toHaveBeenCalledWith('liver', 8);
    });

    await waitFor(() => {
      expect(screen.getByText('Liverpool')).toBeInTheDocument();
      expect(screen.getByText('Mohamed Salah')).toBeInTheDocument();
    });
  });

  test('calls onSelect when result is clicked', async () => {
    const mockResult = {
      type: 'team',
      id: 1,
      name: 'Liverpool',
      country: 'England'
    };

    mockSearchApi.searchAll.mockResolvedValue(mockApiResponse([mockResult]));

    render(<SearchBox onSelect={mockOnSelect} />);
    
    const input = screen.getByPlaceholderText('Search teams, players, competitions...');
    fireEvent.change(input, { target: { value: 'liverpool' } });

    await waitFor(() => {
      expect(screen.getByText('Liverpool')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Liverpool'));
    expect(mockOnSelect).toHaveBeenCalledWith(mockResult);
  });

  test('shows recent searches when input is focused without query', () => {
    // Set up localStorage with recent searches
    localStorage.setItem('okaygoal-recent-searches', JSON.stringify(['Liverpool', 'Arsenal']));

    render(<SearchBox />);
    
    const input = screen.getByPlaceholderText('Search teams, players, competitions...');
    fireEvent.focus(input);

    expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    expect(screen.getByText('Liverpool')).toBeInTheDocument();
    expect(screen.getByText('Arsenal')).toBeInTheDocument();
  });

  test('shows popular searches when no recent searches', () => {
    render(<SearchBox />);
    
    const input = screen.getByPlaceholderText('Search teams, players, competitions...');
    fireEvent.focus(input);

    expect(screen.getByText('Popular Searches')).toBeInTheDocument();
    expect(screen.getByText('Barcelona')).toBeInTheDocument();
    expect(screen.getByText('Premier League')).toBeInTheDocument();
  });

  test('handles keyboard navigation', async () => {
    const mockResults = [
      { type: 'team', id: 1, name: 'Liverpool', country: 'England' },
      { type: 'team', id: 2, name: 'Arsenal', country: 'England' }
    ];

    mockSearchApi.searchAll.mockResolvedValue(mockApiResponse(mockResults));

    render(<SearchBox />);
    
    const input = screen.getByPlaceholderText('Search teams, players, competitions...');
    fireEvent.change(input, { target: { value: 'london' } });

    await waitFor(() => {
      expect(screen.getByText('Liverpool')).toBeInTheDocument();
    });

    // Press arrow down
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    
    // First result should be highlighted
    const firstResult = screen.getByText('Liverpool').closest('button');
    expect(firstResult).toHaveClass('bg-gray-50');

    // Press arrow down again
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    
    // Second result should be highlighted
    const secondResult = screen.getByText('Arsenal').closest('button');
    expect(secondResult).toHaveClass('bg-gray-50');
  });

  test('clears search when clear button is clicked', () => {
    render(<SearchBox />);
    
    const input = screen.getByPlaceholderText('Search teams, players, competitions...');
    fireEvent.change(input, { target: { value: 'liverpool' } });

    expect(input).toHaveValue('liverpool');
    
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);

    expect(input).toHaveValue('');
  });

  test('closes dropdown when clicking outside', async () => {
    const mockResults = [
      { type: 'team', id: 1, name: 'Liverpool', country: 'England' }
    ];

    mockSearchApi.searchAll.mockResolvedValue(mockApiResponse(mockResults));

    render(
      <div>
        <SearchBox />
        <div data-testid="outside">Outside element</div>
      </div>
    );
    
    const input = screen.getByPlaceholderText('Search teams, players, competitions...');
    fireEvent.change(input, { target: { value: 'liverpool' } });

    await waitFor(() => {
      expect(screen.getByText('Liverpool')).toBeInTheDocument();
    });

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));

    await waitFor(() => {
      expect(screen.queryByText('Liverpool')).not.toBeInTheDocument();
    });
  });

  test('shows loading state while searching', async () => {
    // Mock delayed API response
    mockSearchApi.searchAll.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockApiResponse([])), 100))
    );

    render(<SearchBox />);
    
    const input = screen.getByPlaceholderText('Search teams, players, competitions...');
    fireEvent.change(input, { target: { value: 'liverpool' } });

    // Should show loading indicator
    expect(screen.getByText('Searching...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
    });
  });

  test('shows no results message when search returns empty', async () => {
    mockSearchApi.searchAll.mockResolvedValue(mockApiResponse([]));

    render(<SearchBox />);
    
    const input = screen.getByPlaceholderText('Search teams, players, competitions...');
    fireEvent.change(input, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No results found for "nonexistent"')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    mockSearchApi.searchAll.mockRejectedValue(new Error('API Error'));

    render(<SearchBox />);
    
    const input = screen.getByPlaceholderText('Search teams, players, competitions...');
    fireEvent.change(input, { target: { value: 'liverpool' } });

    await waitFor(() => {
      // Should not crash and should show no results
      expect(screen.queryByText('Liverpool')).not.toBeInTheDocument();
    });
  });
});