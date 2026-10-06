import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';

// Import our screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';

// Redux Integration
import { Provider as ReduxProvider, useDispatch, useSelector } from 'react-redux';
import { store } from './src/redux/store';
import { loadAuthSession } from './src/utils/authStorage';
import { loginSuccess } from './src/redux/authSlice';

// Custom App Paper Theme
const appTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0C831F',        // Primary Green
    secondary: '#F7D117',      // Primary Yellow
    surface: '#FFFFFF',
    background: '#F8FAFC',
    onPrimary: '#FFFFFF',
    onSecondary: '#000000',
    outline: '#CBD5E1',
    surfaceVariant: '#F8FAFC',
  },
};

function App() {
  return (
    <ReduxProvider store={store}>
      <PaperProvider theme={appTheme}>
        <SafeAreaProvider>
          <NavigationContainer>
            <AppContent />
          </NavigationContainer>
        </SafeAreaProvider>
      </PaperProvider>
    </ReduxProvider>
  );
}

function AppContent() {
  const dispatch = useDispatch();
  const auth = useSelector((state: any) => state.auth);
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'login' | 'register' | 'home'>('splash');
  const [isSessionChecked, setIsSessionChecked] = useState(false);

  useEffect(() => {
    let hasSession = false;
    // Restore persistent session from AsyncStorage
    const restoreSession = async () => {
      try {
        const { user, accessToken, refreshToken } = await loadAuthSession();
        console.log('[AppContent] Restoring session. Token present:', !!accessToken);
        if (accessToken) {
          hasSession = true;
          dispatch(
            loginSuccess({
              message: 'Session restored',
              user: user || { name: 'User' },
              accessToken,
              refreshToken: refreshToken || '',
            })
          );
        }
      } catch (e) {
        console.log('Error restoring session:', e);
      } finally {
        setIsSessionChecked(true);
        // Show splash screen for 2.5 seconds, then transition to home if logged in, or login if not
        setTimeout(() => {
          if (hasSession) {
            setCurrentScreen('home');
          } else {
            setCurrentScreen('login');
          }
        }, 2500);
      }
    };
    restoreSession();
  }, [dispatch]);

  // Handle logout transition
  useEffect(() => {
    if (isSessionChecked && currentScreen === 'home' && !auth?.accessToken) {
      setCurrentScreen('login');
    }
  }, [auth?.accessToken, currentScreen, isSessionChecked]);

  const handleLoginSuccess = () => {
    setCurrentScreen('home');
  };

  switch (currentScreen) {
    case 'splash':
      return <SplashScreen />;
    case 'login':
      return (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onNavigateToRegister={() => setCurrentScreen('register')}
        />
      );
    case 'register':
      return (
        <RegisterScreen
          onRegisterSuccess={() => setCurrentScreen('login')}
          onNavigateToLogin={() => setCurrentScreen('login')}
        />
      );
    case 'home':
      return <BottomTabNavigator />;
    default:
      return <SplashScreen />;
  }
}

export default App;



