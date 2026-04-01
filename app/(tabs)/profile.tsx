import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Switch,
  Pressable,
  Animated,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LD } from '@/constants/Colors';

const BASE_URL = 'https://7eapc2dc4ufkh52uzd6nm5yazjg26qne.app.specular.dev';

const SERIF = 'PlayfairDisplay_400Regular';
const SANS = 'DMSans_400Regular';
const SANS_LIGHT = 'DMSans_300Light';
const SANS_MED = 'DMSans_500Medium';

const PRIVACY_POLICY_URL =
  'https://docs.google.com/document/d/e/2PACX-1vSvxzli30KXcF2MpOaBEKB87Knjz9fejkX1Qqq7aPP4K-pHCveVSKowLVTDDJixzHXrKAeQjIJYJ_oj/pub';
const SUPPORT_URL = 'https://helloelementalco.com/contact';

interface Settings {
  gradient_start: string;
  gradient_end: string;
  font_size_editorial: string;
  line_height_editorial: string;
  maintenance_mode: boolean;
  emergency_alert: string;
  briefing_override_text: string;
}

const DEFAULT_SETTINGS: Settings = {
  gradient_start: '#FF6B35',
  gradient_end: '#E63946',
  font_size_editorial: '18',
  line_height_editorial: '1.7',
  maintenance_mode: false,
  emergency_alert: '',
  briefing_override_text: '',
};

function SavedToast({ visible, opacity }: { visible: boolean; opacity: Animated.Value }) {
  if (!visible) return null;
  return (
    <Animated.Text
      style={{
        opacity,
        fontFamily: SANS,
        fontSize: 11,
        letterSpacing: 2,
        color: LD.primary,
        textTransform: 'lowercase',
        marginTop: 8,
      }}
    >
      saved
    </Animated.Text>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: SANS_MED,
        fontSize: 10,
        letterSpacing: 2,
        color: LD.textTertiary,
        textTransform: 'lowercase',
        marginBottom: 16,
      }}
    >
      {children}
    </Text>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: SANS,
        fontSize: 11,
        letterSpacing: 1,
        color: LD.textSecondary,
        textTransform: 'lowercase',
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}

function StyledInput({
  value,
  onChangeText,
  onBlur,
  placeholder,
  multiline,
  keyboardType,
  numberOfLines,
}: {
  value: string;
  onChangeText: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
  numberOfLines?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onBlur={() => { setFocused(false); onBlur?.(); }}
      onFocus={() => setFocused(true)}
      placeholder={placeholder}
      placeholderTextColor={LD.textTertiary}
      multiline={multiline}
      keyboardType={keyboardType ?? 'default'}
      numberOfLines={numberOfLines}
      style={{
        fontFamily: SANS_LIGHT,
        fontSize: 14,
        color: LD.text,
        backgroundColor: LD.surfaceSecondary,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: focused ? LD.primary : LD.border,
        paddingHorizontal: 14,
        paddingVertical: 12,
        minHeight: multiline ? (numberOfLines ?? 4) * 24 : 44,
        textAlignVertical: multiline ? 'top' : 'center',
      }}
    />
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const savedOpacity = useRef(new Animated.Value(0)).current;

  const showSaved = useCallback((key: string) => {
    setSavedKey(key);
    savedOpacity.setValue(1);
    Animated.sequence([
      Animated.delay(1200),
      Animated.timing(savedOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setSavedKey(null));
  }, [savedOpacity]);

  // Load settings from AsyncStorage (with API fallback attempt)
  const loadSettings = useCallback(async () => {
    console.log('[livdaily] loading settings from local storage');
    try {
      const keys = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[];
      const loaded: Partial<Settings> = {};
      for (const key of keys) {
        const val = await AsyncStorage.getItem(`ld_settings_${key}`);
        if (val !== null) {
          if (key === 'maintenance_mode') {
            (loaded as Record<string, unknown>)[key] = val === 'true';
          } else {
            (loaded as Record<string, unknown>)[key] = val;
          }
        }
      }
      setSettings(prev => ({ ...prev, ...loaded }));
    } catch (e) {
      console.warn('[livdaily] settings load error:', e);
    }

    // Try API (graceful fallback)
    try {
      console.log('[livdaily] attempting to fetch settings from API');
      const res = await fetch(`${BASE_URL}/api/settings`);
      if (res.ok) {
        const data = await res.json();
        console.log('[livdaily] settings fetched from API:', data);
        if (data && typeof data === 'object') {
          const merged: Partial<Settings> = {};
          if (data.gradient_start) merged.gradient_start = String(data.gradient_start);
          if (data.gradient_end) merged.gradient_end = String(data.gradient_end);
          if (data.font_size_editorial) merged.font_size_editorial = String(data.font_size_editorial);
          if (data.line_height_editorial) merged.line_height_editorial = String(data.line_height_editorial);
          if (typeof data.maintenance_mode === 'boolean') merged.maintenance_mode = data.maintenance_mode;
          if (data.emergency_alert !== undefined) merged.emergency_alert = String(data.emergency_alert ?? '');
          if (data.briefing_override_text !== undefined) merged.briefing_override_text = String(data.briefing_override_text ?? '');
          setSettings(prev => ({ ...prev, ...merged }));
        }
      }
    } catch (_) {
      // silently ignore — no auth token available
    }
  }, []);

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSetting = useCallback(async (key: keyof Settings, value: string | boolean) => {
    console.log('[livdaily] saving setting:', key, '=', value);
    try {
      await AsyncStorage.setItem(`ld_settings_${key}`, String(value));
      showSaved(key);
    } catch (e) {
      console.warn('[livdaily] save setting error:', e);
    }
  }, [showSaved]);

  const updateField = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handlePublishOverride = async () => {
    console.log('[livdaily] publish override pressed, text length:', settings.briefing_override_text.length);
    await saveSetting('briefing_override_text', settings.briefing_override_text);
    // Try API
    try {
      const res = await fetch(`${BASE_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefing_override_text: settings.briefing_override_text }),
      });
      if (res.ok) {
        console.log('[livdaily] override published to API');
      }
    } catch (_) {}
  };

  const handlePrivacyPolicy = () => {
    console.log('[livdaily] privacy policy link tapped');
    Linking.openURL(PRIVACY_POLICY_URL);
  };

  const handleSupport = () => {
    console.log('[livdaily] support link tapped');
    Linking.openURL(SUPPORT_URL);
  };

  const gradientStart = settings.gradient_start || '#FF6B35';
  const gradientEnd = settings.gradient_end || '#E63946';

  return (
    <View style={{ flex: 1, backgroundColor: LD.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 48,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: 24,
        }}
      >
        {/* Header */}
        <View style={{ marginBottom: 48 }}>
          <Text
            style={{
              fontFamily: SERIF,
              fontSize: 24,
              fontWeight: '400',
              color: LD.text,
              textTransform: 'lowercase',
              marginBottom: 8,
            }}
          >
            brand settings
          </Text>
          <Text
            style={{
              fontFamily: SANS,
              fontSize: 11,
              letterSpacing: 2,
              color: LD.textTertiary,
              textTransform: 'lowercase',
            }}
          >
            founder control panel
          </Text>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: LD.border, marginBottom: 40 }} />

        {/* Section: gradient colors */}
        <View style={{ marginBottom: 40 }}>
          <SectionLabel>sunrise gradient</SectionLabel>

          {/* Gradient preview swatch */}
          <View
            style={{
              height: 4,
              borderRadius: 2,
              marginBottom: 20,
              backgroundColor: gradientStart,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: gradientEnd,
                opacity: 0.5,
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <FieldLabel>gradient start</FieldLabel>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    backgroundColor: gradientStart,
                    borderWidth: 1,
                    borderColor: LD.border,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <StyledInput
                    value={settings.gradient_start}
                    onChangeText={v => updateField('gradient_start', v)}
                    onBlur={() => saveSetting('gradient_start', settings.gradient_start)}
                    placeholder="#FF6B35"
                  />
                </View>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel>gradient end</FieldLabel>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    backgroundColor: gradientEnd,
                    borderWidth: 1,
                    borderColor: LD.border,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <StyledInput
                    value={settings.gradient_end}
                    onChangeText={v => updateField('gradient_end', v)}
                    onBlur={() => saveSetting('gradient_end', settings.gradient_end)}
                    placeholder="#E63946"
                  />
                </View>
              </View>
            </View>
          </View>
          {savedKey === 'gradient_start' || savedKey === 'gradient_end' ? (
            <SavedToast visible opacity={savedOpacity} />
          ) : null}
        </View>

        <View style={{ height: 1, backgroundColor: LD.divider, marginBottom: 40 }} />

        {/* Section: typography */}
        <View style={{ marginBottom: 40 }}>
          <SectionLabel>editorial scale</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FieldLabel>font size</FieldLabel>
              <StyledInput
                value={settings.font_size_editorial}
                onChangeText={v => updateField('font_size_editorial', v)}
                onBlur={() => saveSetting('font_size_editorial', settings.font_size_editorial)}
                placeholder="18"
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel>line height</FieldLabel>
              <StyledInput
                value={settings.line_height_editorial}
                onChangeText={v => updateField('line_height_editorial', v)}
                onBlur={() => saveSetting('line_height_editorial', settings.line_height_editorial)}
                placeholder="1.7"
                keyboardType="numeric"
              />
            </View>
          </View>
          {savedKey === 'font_size_editorial' || savedKey === 'line_height_editorial' ? (
            <SavedToast visible opacity={savedOpacity} />
          ) : null}
        </View>

        <View style={{ height: 1, backgroundColor: LD.divider, marginBottom: 40 }} />

        {/* Section: system controls */}
        <View style={{ marginBottom: 40 }}>
          <SectionLabel>system controls</SectionLabel>

          {/* Maintenance mode toggle */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: LD.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: LD.border,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontFamily: SANS,
                fontSize: 14,
                color: LD.text,
                textTransform: 'lowercase',
              }}
            >
              maintenance mode
            </Text>
            <Switch
              value={settings.maintenance_mode}
              onValueChange={v => {
                console.log('[livdaily] maintenance mode toggled:', v);
                updateField('maintenance_mode', v);
                saveSetting('maintenance_mode', v);
              }}
              trackColor={{ false: LD.surfaceSecondary, true: LD.primary }}
              thumbColor={LD.text}
            />
          </View>

          {/* Emergency alert */}
          <FieldLabel>emergency alert</FieldLabel>
          <StyledInput
            value={settings.emergency_alert}
            onChangeText={v => updateField('emergency_alert', v)}
            onBlur={() => saveSetting('emergency_alert', settings.emergency_alert)}
            placeholder="leave empty to hide"
          />
          {savedKey === 'emergency_alert' || savedKey === 'maintenance_mode' ? (
            <SavedToast visible opacity={savedOpacity} />
          ) : null}
        </View>

        <View style={{ height: 1, backgroundColor: LD.divider, marginBottom: 40 }} />

        {/* Section: briefing override */}
        <View style={{ marginBottom: 40 }}>
          <SectionLabel>manual briefing override</SectionLabel>
          <Text
            style={{
              fontFamily: SANS_LIGHT,
              fontSize: 12,
              color: LD.textTertiary,
              textTransform: 'lowercase',
              letterSpacing: 0.5,
              marginBottom: 16,
            }}
          >
            overrides ai generation when non-empty
          </Text>
          <StyledInput
            value={settings.briefing_override_text}
            onChangeText={v => updateField('briefing_override_text', v)}
            placeholder="enter override briefing text..."
            multiline
            numberOfLines={6}
          />
          <Pressable
            onPress={handlePublishOverride}
            style={{ marginTop: 16, alignSelf: 'flex-start' }}
            accessibilityRole="button"
            accessibilityLabel="publish override"
          >
            <View style={{ height: 1, backgroundColor: 'rgba(240,237,232,0.15)', width: 140, marginBottom: 10 }} />
            <Text
              style={{
                fontFamily: SANS,
                fontSize: 11,
                letterSpacing: 3,
                color: 'rgba(240,237,232,0.5)',
                textTransform: 'lowercase',
              }}
            >
              publish override
            </Text>
            <View style={{ height: 1, backgroundColor: 'rgba(240,237,232,0.15)', width: 140, marginTop: 10 }} />
          </Pressable>
          {savedKey === 'briefing_override_text' ? (
            <SavedToast visible opacity={savedOpacity} />
          ) : null}
        </View>

        {/* Footer links */}
        <View style={{ height: 1, backgroundColor: LD.divider, marginBottom: 40 }} />
        <View style={{ flexDirection: 'row', gap: 32, paddingBottom: 8 }}>
          <Pressable
            onPress={handlePrivacyPolicy}
            accessibilityRole="link"
            accessibilityLabel="privacy policy"
          >
            <Text
              style={{
                fontFamily: SANS,
                fontSize: 12,
                color: '#888',
                textTransform: 'lowercase',
                letterSpacing: 0.5,
              }}
            >
              privacy policy
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSupport}
            accessibilityRole="link"
            accessibilityLabel="support"
          >
            <Text
              style={{
                fontFamily: SANS,
                fontSize: 12,
                color: '#888',
                textTransform: 'lowercase',
                letterSpacing: 0.5,
              }}
            >
              support
            </Text>
          </Pressable>
        </View>

        {/* Hidden premium section — exists in tree but invisible */}
        <View style={{ display: 'none' }}>
          <Pressable accessibilityLabel="login">
            <Text>login</Text>
          </Pressable>
          <View>
            <Text>vault access</Text>
            <Text>premium</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
