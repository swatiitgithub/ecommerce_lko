import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { saveAuthSession, clearAuthSession } from '../utils/authStorage';

interface UserData {
  id?: string;
  admin_id?: string;
  name?: string;
  fullName?: string;
  email: string;
  mobile: string;
  role?: string;
  createdAt?: string;
}

interface AuthState {
  user: UserData | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
  successMessage: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setSuccess: (state, action: PayloadAction<{ message: string; user: UserData }>) => {
      state.loading = false;
      state.user = action.payload.user;
      state.successMessage = action.payload.message;
      state.error = null;
      saveAuthSession({ user: action.payload.user });
    },
    loginSuccess: (
      state,
      action: PayloadAction<{
        message: string;
        user: UserData;
        accessToken: string;
        refreshToken: string;
      }>
    ) => {
      state.loading = false;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.successMessage = action.payload.message;
      state.error = null;
      saveAuthSession({
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
      });
    },
    tokenRefreshed: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
      }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.successMessage = 'Token refreshed successfully';
      state.error = null;
      saveAuthSession({
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
      });
    },
    logoutAction: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.loading = false;
      state.error = null;
      state.successMessage = null;
      clearAuthSession();
    },
    setError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.successMessage = null;
    },
    clearState: (state) => {
      state.error = null;
      state.successMessage = null;
      state.loading = false;
    },
  },
});

export const {
  setLoading,
  setSuccess,
  loginSuccess,
  tokenRefreshed,
  logoutAction,
  setError,
  clearState,
} = authSlice.actions;
export default authSlice.reducer;
