import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function LogoSplashScreen1() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2200,
      useNativeDriver: false,
    }).start();
  }, [fadeAnim, scaleAnim, progressAnim]);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0F172A" barStyle="light-content" />

      {/* Subtle top corner ambient yellow glow */}
      <View style={styles.ambientGlow} />

      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoRow}>
          <Text style={styles.blinkText}>blink</Text>
          <Text style={styles.itText}>it</Text>
        </View>
        <Text style={styles.subtitle}>10 MINUTES DELIVERY</Text>
      </Animated.View>

      <View style={styles.progressBarWrapper}>
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressFill, { width: barWidth }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Slate 900
    justifyContent: 'center',
    alignItems: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    top: -120,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(247, 209, 23, 0.08)', // Faint Blinkit yellow glow
  },
  contentContainer: {
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  blinkText: {
    fontSize: 52,
    fontWeight: '900',
    color: '#F7D117', // Bright Yellow
    letterSpacing: -1.5,
  },
  itText: {
    fontSize: 52,
    fontWeight: '900',
    color: '#10B981', // Emerald Green
    letterSpacing: -1.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8', // Slate 400
    fontWeight: '700',
    letterSpacing: 3,
  },
  progressBarWrapper: {
    position: 'absolute',
    bottom: 80,
    width: width * 0.45,
  },
  progressBg: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F7D117', // Yellow loading line
  },
});
