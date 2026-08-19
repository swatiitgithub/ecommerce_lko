import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';

// Import our Blinkit-style screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';

// Redux Integration
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './src/redux/store';

// Custom Blinkit Paper Theme
const blinkitTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0C831F',        // Blinkit Green
    secondary: '#F7D117',      // Blinkit Yellow
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
      <PaperProvider theme={blinkitTheme}>
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
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'login' | 'register' | 'home'>('splash');

  useEffect(() => {
    // Show splash screen for 3.5 seconds, then transition to login screen
    const timer = setTimeout(() => {
      setCurrentScreen('login');
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

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



