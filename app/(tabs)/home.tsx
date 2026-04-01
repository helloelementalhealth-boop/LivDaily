import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  Pressable,
  Image,
  ImageSourcePropType,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LD } from '@/constants/Colors';
import { useBrandSettings } from '@/contexts/BrandSettingsContext';

const BASE_URL = 'https://7eapc2dc4ufkh52uzd6nm5yazjg26qne.app.specular.dev';

const SERIF = 'PlayfairDisplay_400Regular';
const SANS = 'DMSans_400Regular';
const SANS_LIGHT = 'DMSans_300Light';

const STORAGE_STREAK = 'ld_streak';
const STORAGE_LAST_OPEN = 'ld_last_open';

const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
function isValidHex(val: string): boolean {
  return HEX_REGEX.test((val || '').trim());
}

interface DailyBriefing {
  id: string;
  briefing_date: string;
  headline: string;
  body: string;
  cta_label: string;
  is_override: boolean;
  created_at: string;
}

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

function getTodayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateLine(): string {
  const d = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const dayName = days[d.getDay()];
  const monthName = months[d.getMonth()];
  const date = d.getDate();
  return `${dayName}, ${monthName} ${date}`;
}

function SkeletonLine({ width, height = 14 }: { width: number | string; height?: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius: height / 2,
        backgroundColor: LD.surfaceSecondary,
        opacity,
      }}
    />
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { brandSettings } = useBrandSettings();

  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [streak, setStreak] = useState(1);
  const [ctaConfirm, setCtaConfirm] = useState(false);
  const [emergencyAlert, setEmergencyAlert] = useState('');

  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const bodyOpacity = useRef(new Animated.Value(0)).current;
  const ctaConfirmOpacity = useRef(new Animated.Value(0)).current;

  const dateDisplay = formatDateLine();

  // Brand settings derived values
  const horizontalPadding = width * 0.12;
  const baseFontSize = brandSettings.fontSize > 0 ? brandSettings.fontSize : 17;
  const lineHeightMultiplier = brandSettings.lineHeightMultiplier > 0 ? brandSettings.lineHeightMultiplier : 1.65;
  const briefingLineHeight = baseFontSize * lineHeightMultiplier;
  const hasManualOverride = brandSettings.manualOverride && brandSettings.manualOverride.trim().length > 0;

  // Streak logic
  const updateStreak = useCallback(async () => {
    try {
      const today = getTodayKey();
      const lastOpen = await AsyncStorage.getItem(STORAGE_LAST_OPEN);
      const storedStreak = await AsyncStorage.getItem(STORAGE_STREAK);
      let currentStreak = storedStreak ? parseInt(storedStreak, 10) : 1;

      if (lastOpen) {
        const last = new Date(lastOpen);
        const now = new Date(today);
        const diffMs = now.getTime() - last.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak = currentStreak + 1;
        } else if (diffDays === 0) {
          // same day, keep
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      await AsyncStorage.setItem(STORAGE_STREAK, String(currentStreak));
      await AsyncStorage.setItem(STORAGE_LAST_OPEN, today);
      setStreak(currentStreak);
      console.log('[livdaily] streak updated:', currentStreak, 'last_open:', today);
    } catch (e) {
      console.warn('[livdaily] streak error:', e);
    }
  }, []);

  // Load emergency alert from local settings
  const loadEmergencyAlert = useCallback(async () => {
    try {
      const val = await AsyncStorage.getItem('ld_settings_emergency_alert');
      if (val) setEmergencyAlert(val);
    } catch (_) {}
  }, []);

  // Animate content in
  const animateContent = useCallback(() => {
    Animated.sequence([
      Animated.delay(300),
      Animated.timing(headlineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.delay(500),
      Animated.timing(bodyOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [headlineOpacity, bodyOpacity]);

  // Fetch briefing
  const fetchBriefing = useCallback(async (forceRefresh = false) => {
    // If manual override is set, skip API fetch
    if (hasManualOverride) {
      console.log('[livdaily] manual override active, skipping API fetch');
      setLoading(false);
      animateContent();
      return;
    }

    const today = getTodayKey();
    const cacheKey = `ld_briefing_cache_${today}`;

    if (!forceRefresh) {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const parsed: DailyBriefing = JSON.parse(cached);
          setBriefing(parsed);
          setLoading(false);
          animateContent();
          console.log('[livdaily] briefing loaded from cache');
          return;
        }
      } catch (_) {}
    }

    console.log('[livdaily] fetching briefing from API:', `${BASE_URL}/api/briefings/today`);
    try {
      const res = await fetch(`${BASE_URL}/api/briefings/today`);
      if (!res.ok) {
        const text = await res.text();
        console.warn('[livdaily] briefing API error:', res.status, text.slice(0, 200));
        setError(true);
        setLoading(false);
        return;
      }
      const data: DailyBriefing = await res.json();
      console.log('[livdaily] briefing fetched:', data.headline);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      setBriefing(data);
      setLoading(false);
      setError(false);
      animateContent();
    } catch (e) {
      console.warn('[livdaily] briefing fetch failed:', e);
      setError(true);
      setLoading(false);
    }
  }, [animateContent, hasManualOverride]);

  useEffect(() => {
    updateStreak();
    loadEmergencyAlert();
    fetchBriefing();
  }, []);

  const handleLogoLongPress = () => {
    console.log('[livdaily] logo long-pressed — opening brand settings');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/brand-settings');
  };

  const handleCtaPress = () => {
    const label = briefing?.cta_label ?? 'commence protocol';
    console.log('[livdaily] CTA button pressed:', label);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCtaConfirm(true);
    ctaConfirmOpacity.setValue(1);
    Animated.sequence([
      Animated.delay(1500),
      Animated.timing(ctaConfirmOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => setCtaConfirm(false));
  };

  const handleRetry = () => {
    console.log('[livdaily] retry button pressed');
    setError(false);
    setLoading(true);
    fetchBriefing(true);
  };

  const ctaLabel = briefing?.cta_label ?? 'commence protocol';
  const streakText = `sequence: day ${streak}`;

  // Determine body text to display
  const bodyText = hasManualOverride
    ? brandSettings.manualOverride.trim()
    : briefing?.body ?? '';

  // Determine headline to display
  const headlineText = hasManualOverride ? '' : briefing?.headline ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: LD.background }}>
      {/* Emergency alert banner */}
      {emergencyAlert.length > 0 && (
        <View
          style={{
            position: 'absolute',
            top: insets.top,
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: LD.amberBg,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(245,158,11,0.2)',
            paddingHorizontal: 20,
            paddingVertical: 10,
          }}
        >
          <Text
            style={{
              fontFamily: SANS,
              fontSize: 12,
              color: LD.amber,
              letterSpacing: 1,
              textAlign: 'center',
            }}
          >
            {emergencyAlert}
          </Text>
        </View>
      )}

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + (emergencyAlert.length > 0 ? 48 : 0) + 48,
          paddingBottom: insets.bottom + 120,
          alignItems: 'center',
        }}
      >
        {/* Sunrise glow background hint */}
        <View
          style={{
            position: 'absolute',
            top: -60,
            width: 320,
            height: 320,
            borderRadius: 160,
            backgroundColor: LD.primary,
            opacity: 0.06,
            alignSelf: 'center',
          }}
          pointerEvents="none"
        />

        {/* LD Logo — long-press 800ms opens brand settings */}
        <Pressable
          onLongPress={handleLogoLongPress}
          delayLongPress={800}
          style={{ alignItems: 'center', marginBottom: 24 }}
          accessibilityLabel="livdaily logo — long press for brand settings"
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              overflow: 'hidden',
              boxShadow: `0 0 24px rgba(255,107,53,0.45), 0 0 48px rgba(255,107,53,0.18)`,
            }}
          >
            <Image
              source={resolveImageSource(require('@/assets/images/cad4a61d-3476-4898-80c0-6c21caf0c549.jpeg'))}
              style={{ width: 80, height: 80, borderRadius: 40 }}
              resizeMode="cover"
              accessibilityLabel="livdaily logo"
            />
          </View>
        </Pressable>

        {/* Streak counter */}
        <Text
          style={{
            fontFamily: SANS,
            fontSize: 12,
            color: 'rgba(240,237,232,0.4)',
            letterSpacing: 2,
            textTransform: 'lowercase',
            marginBottom: 12,
          }}
        >
          {streakText}
        </Text>

        {/* Date line */}
        <Text
          style={{
            fontFamily: SANS,
            fontSize: 13,
            color: LD.textTertiary,
            letterSpacing: 2,
            textTransform: 'lowercase',
            marginBottom: 48,
          }}
        >
          {dateDisplay}
        </Text>

        {/* Content area */}
        {loading && !hasManualOverride && (
          <View style={{ width: '100%', alignItems: 'center', gap: 16, paddingHorizontal: 32 }}>
            <SkeletonLine width="85%" height={28} />
            <SkeletonLine width="70%" height={28} />
            <View style={{ height: 24 }} />
            <SkeletonLine width="90%" height={16} />
            <SkeletonLine width="80%" height={16} />
            <SkeletonLine width="75%" height={16} />
          </View>
        )}

        {error && !loading && !hasManualOverride && (
          <View style={{ alignItems: 'center', gap: 20, paddingHorizontal: 32 }}>
            <Text
              style={{
                fontFamily: SERIF,
                fontSize: 22,
                fontWeight: '400',
                color: LD.textSecondary,
                textAlign: 'center',
                lineHeight: 32,
              }}
            >
              the signal is quiet today
            </Text>
            <Pressable
              onPress={handleRetry}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 24,
              }}
            >
              <View style={{ height: 1, backgroundColor: LD.border, marginBottom: 10 }} />
              <Text
                style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  letterSpacing: 3,
                  color: 'rgba(240,237,232,0.5)',
                  textTransform: 'lowercase',
                  textAlign: 'center',
                }}
              >
                try again
              </Text>
              <View style={{ height: 1, backgroundColor: LD.border, marginTop: 10 }} />
            </Pressable>
          </View>
        )}

        {/* Manual override display */}
        {hasManualOverride && (
          <Animated.Text
            style={{
              opacity: bodyOpacity,
              fontFamily: SANS_LIGHT,
              fontSize: baseFontSize,
              color: 'rgba(240,237,232,0.75)',
              lineHeight: briefingLineHeight,
              textAlign: 'center',
              paddingHorizontal: horizontalPadding,
              marginBottom: 56,
            }}
          >
            {bodyText}
          </Animated.Text>
        )}

        {/* API briefing display */}
        {!loading && !error && briefing && !hasManualOverride && (
          <>
            {/* Editorial headline */}
            <Animated.Text
              style={{
                opacity: headlineOpacity,
                fontFamily: SERIF,
                fontSize: 28,
                fontWeight: '400',
                color: LD.text,
                lineHeight: 36,
                textAlign: 'center',
                marginHorizontal: 32,
                marginBottom: 32,
              }}
            >
              {headlineText}
            </Animated.Text>

            {/* Briefing body */}
            <Animated.Text
              style={{
                opacity: bodyOpacity,
                fontFamily: SANS_LIGHT,
                fontSize: baseFontSize,
                fontWeight: '300',
                color: 'rgba(240,237,232,0.75)',
                lineHeight: briefingLineHeight,
                textAlign: 'center',
                paddingHorizontal: horizontalPadding,
                marginBottom: 56,
              }}
            >
              {bodyText}
            </Animated.Text>
          </>
        )}

        {/* CTA — plain text link, no border, no background */}
        {(!loading || hasManualOverride) && !error && (
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Pressable
              onPress={handleCtaPress}
              style={{ alignItems: 'center', paddingHorizontal: 32, paddingVertical: 8 }}
              accessibilityRole="button"
              accessibilityLabel={ctaLabel}
            >
              <Text
                style={{
                  fontFamily: SANS,
                  fontSize: 13,
                  letterSpacing: 1,
                  color: '#888',
                }}
              >
                {ctaLabel}
              </Text>
            </Pressable>

            {/* CTA confirmation */}
            {ctaConfirm && (
              <Animated.Text
                style={{
                  opacity: ctaConfirmOpacity,
                  fontFamily: SANS,
                  fontSize: 11,
                  letterSpacing: 2,
                  color: LD.primary,
                  textTransform: 'lowercase',
                  marginTop: 16,
                }}
              >
                protocol initiated
              </Animated.Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
