import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
  setError,
  clearState,
} = authSlice.actions;
export default authSlice.reducer;
