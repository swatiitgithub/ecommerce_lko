import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';

const { height } = Dimensions.get('window');

export default function LogoSplashScreen3() {
  const logoBounce = useRef(new Animated.Value(height)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoBounce, {
        toValue: 0,
        friction: 6,
        tension: 35,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoBounce, textOpacity]);

  return (
    <View style={styles.container}>
      {/* Light status bar for clean background */}
      <StatusBar backgroundColor="#F4FBF7" barStyle="dark-content" />

      {/* Decorative clean light accent grids */}
      <View style={styles.topAccent} />
      <View style={styles.bottomAccent} />

      {/* Logo Wrapper */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            transform: [{ translateY: logoBounce }],
          },
        ]}
      >
        <View style={styles.greenBox}>
          {/* Stylized shopping bag handle drawn via view */}
          <View style={styles.bagHandle} />
          <Text style={styles.boxText}>b</Text>
        </View>
      </Animated.View>

      {/* Text Wrapper */}
      <Animated.View style={[styles.textWrapper, { opacity: textOpacity }]}>
        <View style={styles.logoRow}>
          <Text style={styles.blinkText}>blink</Text>
          <Text style={styles.itText}>it</Text>
        </View>
        <Text style={styles.brandSubtitle}>Groceries & Essentials in 10 mins</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FBF7', // Very light mint green / off-white
    justifyContent: 'center',
    alignItems: 'center',
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 6,
    backgroundColor: '#0C831F', // Blinkit Green
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '100%',
    height: 6,
    backgroundColor: '#F7D117', // Blinkit Yellow
  },
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  greenBox: {
    width: 80,
    height: 80,
    backgroundColor: '#0C831F', // Blinkit Green
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#0C831F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  bagHandle: {
    position: 'absolute',
    top: -8,
    width: 32,
    height: 18,
    borderWidth: 3,
    borderColor: '#0C831F',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: 'transparent',
  },
  boxText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: -2,
  },
  textWrapper: {
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blinkText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E293B', // Slate 900
    letterSpacing: -1,
  },
  itText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0C831F', // Green
    letterSpacing: -1,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#64748B', // Slate 500
    marginTop: 6,
    fontWeight: '600',
  },
});
