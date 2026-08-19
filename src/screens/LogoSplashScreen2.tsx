import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  StatusBar,
} from 'react-native';

export default function LogoSplashScreen2() {
  const cardScale = useRef(new Animated.Value(0.75)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [cardOpacity, cardScale, pulseAnim]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#080711" barStyle="light-content" />

      {/* Cyberpunk Neon Glow Circles */}
      <View style={styles.neonYellowGlow} />
      <View style={styles.neonGreenGlow} />

      {/* Glassmorphic Centered Card */}
      <Animated.View
        style={[
          styles.glassCard,
          {
            opacity: cardOpacity,
            transform: [{ scale: cardScale }],
          },
        ]}
      >
        <Animated.View style={[styles.ambientGlowBehind, { opacity: pulseAnim }]} />
        
        <View style={styles.logoRow}>
          <Text style={styles.blinkText}>blink</Text>
          <Text style={styles.itText}>it</Text>
        </View>

        <Text style={styles.tagline}>INSTANT COMMERCE</Text>
      </Animated.View>

      <View style={styles.loadingDots}>
        <View style={[styles.dot, styles.dotYellow]} />
        <View style={[styles.dot, styles.dotGreen]} />
        <View style={[styles.dot, styles.dotWhite]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080711', // Very dark night blue/black
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  neonYellowGlow: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F7D117',
    opacity: 0.15,
  },
  neonGreenGlow: {
    position: 'absolute',
    bottom: '30%',
    right: '15%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#10B981',
    opacity: 0.12,
  },
  glassCard: {
    width: 280,
    paddingVertical: 45,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#F7D117',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  ambientGlowBehind: {
    position: 'absolute',
    width: 140,
    height: 60,
    backgroundColor: '#F7D117',
    borderRadius: 30,
    top: 50,
    opacity: 0.25,
    filter: 'blur(35px)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  blinkText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#F7D117',
    letterSpacing: -1.5,
    textShadowColor: 'rgba(247, 209, 23, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  itText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#00FF87', // High neon green
    letterSpacing: -1.5,
    textShadowColor: 'rgba(0, 255, 135, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 4,
    opacity: 0.8,
  },
  loadingDots: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  dotYellow: {
    backgroundColor: '#F7D117',
  },
  dotGreen: {
    backgroundColor: '#00FF87',
  },
  dotWhite: {
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
  },
});
