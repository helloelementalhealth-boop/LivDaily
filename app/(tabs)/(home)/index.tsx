import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LD } from '@/constants/Colors';

const DEFAULT_BRIEFING =
  'the morning light arrives quietly, carrying with it the weight of everything that happened while you slept. markets shifted. conversations began. somewhere, a decision was made that will ripple outward for years. this is your moment to orient.';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const handleCommence = () => {
    console.log('[Home] Commence protocol tapped');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#FFD580', '#FF6B35', LD.background]}
        locations={[0, 0.35, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Logo */}
      <View style={[styles.logoContainer, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.logoText}>ld</Text>
      </View>

      {/* Briefing text */}
      <View style={styles.briefingContainer}>
        <Text style={styles.briefingText}>
          {DEFAULT_BRIEFING}
        </Text>
      </View>

      {/* CTA */}
      <Pressable
        onPress={handleCommence}
        style={[styles.ctaContainer, { bottom: insets.bottom + 40 }]}
        accessibilityRole="button"
        accessibilityLabel="commence protocol"
      >
        <Text style={styles.ctaText}>commence protocol</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LD.background,
  },
  logoContainer: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  logoText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: LD.text,
    letterSpacing: 3,
  },
  briefingContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  briefingText: {
    fontFamily: 'DMSans_300Light',
    fontSize: 17,
    lineHeight: 28,
    color: LD.text,
    textAlign: 'left',
  },
  ctaContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#888',
    letterSpacing: 1,
  },
});
