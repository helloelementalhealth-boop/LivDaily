import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useBrandSettings } from '@/contexts/BrandSettingsContext';
import { LD } from '@/constants/Colors';

const DEFAULT_BRIEFING =
  'the morning light arrives quietly, carrying with it the weight of everything that happened while you slept. markets shifted. conversations began. somewhere, a decision was made that will ripple outward for years. this is your moment to orient.';

const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
function isValidHex(val: string): boolean {
  return HEX_REGEX.test((val || '').trim());
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { brandSettings } = useBrandSettings();

  const horizontalPadding = width * 0.12;

  const primaryColor = isValidHex(brandSettings.primaryHex)
    ? brandSettings.primaryHex.trim()
    : '#FFD580';
  const secondaryColor = isValidHex(brandSettings.secondaryHex)
    ? brandSettings.secondaryHex.trim()
    : '#FF6B35';

  const baseFontSize = brandSettings.fontSize > 0 ? brandSettings.fontSize : 17;
  const lineHeightMultiplier =
    brandSettings.lineHeightMultiplier > 0 ? brandSettings.lineHeightMultiplier : 1.65;
  const briefingLineHeight = baseFontSize * lineHeightMultiplier;

  const briefingText =
    brandSettings.manualOverride && brandSettings.manualOverride.trim().length > 0
      ? brandSettings.manualOverride.trim()
      : DEFAULT_BRIEFING;

  const handleLogoLongPress = () => {
    console.log('[Home] LD logo long-pressed — opening brand settings');
    router.push('/brand-settings');
  };

  const handleCommence = () => {
    console.log('[Home] Commence protocol tapped');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[primaryColor, secondaryColor, LD.background]}
        locations={[0, 0.35, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Logo — long-press triggers brand settings */}
      <View style={[styles.logoContainer, { paddingTop: insets.top + 24 }]}>
        <TouchableOpacity
          onLongPress={handleLogoLongPress}
          delayLongPress={800}
          activeOpacity={0.7}
          accessibilityLabel="livdaily logo"
          accessibilityRole="button"
        >
          <Text style={styles.logoText}>ld</Text>
        </TouchableOpacity>
      </View>

      {/* Briefing text */}
      <View style={[styles.briefingContainer, { paddingHorizontal: horizontalPadding }]}>
        <Text
          style={[
            styles.briefingText,
            { fontSize: baseFontSize, lineHeight: briefingLineHeight },
          ]}
        >
          {briefingText}
        </Text>
      </View>

      {/* CTA — absolute bottom, plain text link */}
      <Pressable
        onPress={handleCommence}
        style={[styles.ctaContainer, { bottom: insets.bottom + 60 }]}
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
  },
  briefingText: {
    fontFamily: 'DMSans_300Light',
    color: LD.text,
    textAlign: 'left',
  },
  ctaContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 0,
  },
  ctaText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#888',
    letterSpacing: 1,
  },
});
