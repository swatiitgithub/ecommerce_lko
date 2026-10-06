import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  StatusBar,
  Dimensions,
  Easing,
  Image,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineSlide = useRef(new Animated.Value(15)).current;
  const scooterX = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    // Logo entrance animation (spring zoom + fade)
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Once logo completes, animate the tagline in
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(taglineSlide, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Loop scooter animation every 3.5 seconds
    const startScooterAnimation = () => {
      scooterX.setValue(-120);
      Animated.timing(scooterX, {
        toValue: width + 120,
        duration: 2200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }).start(() => {
        // Wait 1.5 seconds and trigger again
        setTimeout(startScooterAnimation, 1500);
      });
    };

    // Delay the first scooter start slightly for visual pacing
    const timeoutId = setTimeout(startScooterAnimation, 800);

    return () => clearTimeout(timeoutId);
  }, [logoScale, logoOpacity, taglineOpacity, taglineSlide, scooterX]);

  return (
    <View style={styles.container}>
      {/* Bright Yellow Status Bar matching background */}
      <StatusBar barStyle="dark-content" />

      {/* Main Branding Section */}
      <View style={styles.brandContainer}>
        {/* Wordmark logo: logo image */}
        <Animated.View
          style={[
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('../assest/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Tagline: [2-3 DAYS] delivery */}
        <Animated.View
          style={[
            styles.taglineRow,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineSlide }],
            },
          ]}
        >
          <View style={styles.minutesBadge}>
            <Text style={styles.badgeText}>2-3 DAYS</Text>
          </View>
          <Text style={styles.deliveryText}>delivery</Text>
        </Animated.View>
      </View>

      {/* Animated scooter path at the bottom */}
      <View style={styles.scooterTrackContainer}>
        <View style={styles.roadLine} />
        
        <Animated.View
          style={[
            styles.scooterWrapper,
            {
              transform: [{ translateX: scooterX }],
            },
          ]}
        >
          {/* Dust / Speed trails behind the scooter */}
          <View style={styles.speedLine1} />
          <View style={styles.speedLine2} />
          <Text style={styles.scooterEmoji}>🛵</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7D117', // Signature Primary Yellow
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoTextBlink: {
    fontSize: 56,
    fontWeight: '900',
    color: '#000000', // Black
    letterSpacing: -1.5,
  },
  logoTextIt: {
    fontSize: 56,
    fontWeight: '900',
    color: '#0C831F', // Primary Green
    letterSpacing: -1.5,
  },
  logoImage: {
    width: 240,
    height: 120,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  minutesBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  deliveryText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scooterTrackContainer: {
    position: 'absolute',
    bottom: 80,
    width: '100%',
    height: 40,
    justifyContent: 'center',
  },
  roadLine: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    position: 'absolute',
  },
  scooterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
  },
  scooterEmoji: {
    fontSize: 32,
  },
  speedLine1: {
    width: 20,
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 2,
    marginRight: 4,
    marginTop: 4,
  },
  speedLine2: {
    width: 14,
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 2,
    marginRight: 6,
    marginTop: 12,
  },
});
