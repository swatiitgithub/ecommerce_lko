import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = '@auth_user';
const ACCESS_TOKEN_KEY = '@auth_access_token';
const REFRESH_TOKEN_KEY = '@auth_refresh_token';

export interface SavedSession {
  user: any | null;
  accessToken: string | null;
  refreshToken: string | null;
}

/**
 * Save user auth credentials to AsyncStorage
 */
export const saveAuthSession = async (session: {
  user?: any;
  accessToken?: string;
  refreshToken?: string;
}) => {
  try {
    if (session.user !== undefined) {
      if (session.user) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(session.user));
      } else {
        await AsyncStorage.removeItem(USER_KEY);
      }
    }
    if (session.accessToken !== undefined) {
      if (session.accessToken) {
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
      } else {
        await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      }
    }
    if (session.refreshToken !== undefined) {
      if (session.refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
      } else {
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    }
  } catch (err) {
    console.log('[AuthStorage] Failed to save session:', err);
  }
};

/**
 * Load user auth credentials from AsyncStorage
 */
export const loadAuthSession = async (): Promise<SavedSession> => {
  try {
    const userStr = await AsyncStorage.getItem(USER_KEY);
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

    const user = userStr ? JSON.parse(userStr) : null;
    return {
      user,
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
    };
  } catch (err) {
    console.log('[AuthStorage] Failed to load session:', err);
    return { user: null, accessToken: null, refreshToken: null };
  }
};

/**
 * Clear user auth credentials from AsyncStorage on logout
 */
export const clearAuthSession = async () => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (err) {
    console.log('[AuthStorage] Failed to clear session:', err);
  }
};
