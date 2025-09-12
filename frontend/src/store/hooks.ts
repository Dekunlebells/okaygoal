import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Export convenience hooks for common state selections
export const useAuthState = () => useAppSelector((state) => state.auth);
export const useAppState = () => useAppSelector((state) => state.app);

export default {
  useAppDispatch,
  useAppSelector,
  useAuthState,
  useAppState,
};