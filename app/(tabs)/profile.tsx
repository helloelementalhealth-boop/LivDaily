import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Linking,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LD } from '@/constants/Colors';

const SERIF = 'PlayfairDisplay_400Regular';
const SANS = 'DMSans_400Regular';

const PRIVACY_POLICY_URL =
  'https://helloelementalco.com/home/livdaily-co/livdailyapp_privacypolicy/';
const SUPPORT_URL = 'https://helloelementalco.com/contact/';

const FONT_SIZE_KEY = 'font_size_editorial';
const LINE_HEIGHT_KEY = 'line_height_editorial';

const VERSION = '1.0.0';
const BUILD = '1';

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function Divider() {
  return <View style={styles.divider} />;
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.chevron}>{'›'}</Text>
    </Pressable>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [fontSize, setFontSize] = useState('18');
  const [lineHeight, setLineHeight] = useState('1.7');

  useEffect(() => {
    async function loadPrefs() {
      try {
        const [fs, lh] = await Promise.all([
          AsyncStorage.getItem(FONT_SIZE_KEY),
          AsyncStorage.getItem(LINE_HEIGHT_KEY),
        ]);
        if (fs !== null) setFontSize(fs);
        if (lh !== null) setLineHeight(lh);
      } catch (e) {
        console.log('[Settings] Failed to load preferences:', e);
      }
    }
    loadPrefs();
  }, []);

  async function handleFontSizeChange(val: string) {
    console.log('[Settings] Font size changed:', val);
    setFontSize(val);
    try {
      await AsyncStorage.setItem(FONT_SIZE_KEY, val);
    } catch (e) {
      console.log('[Settings] Failed to save font size:', e);
    }
  }

  async function handleLineHeightChange(val: string) {
    console.log('[Settings] Line height changed:', val);
    setLineHeight(val);
    try {
      await AsyncStorage.setItem(LINE_HEIGHT_KEY, val);
    } catch (e) {
      console.log('[Settings] Failed to save line height:', e);
    }
  }

  function handlePrivacyPolicy() {
    console.log('[Settings] Opening privacy policy');
    Linking.openURL(PRIVACY_POLICY_URL);
  }

  function handleSupport() {
    console.log('[Settings] Opening support');
    Linking.openURL(SUPPORT_URL);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Settings</Text>

      {/* Reading preferences */}
      <SectionLabel label="Reading preferences" />
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Font size</Text>
          <TextInput
            style={styles.numericInput}
            value={fontSize}
            onChangeText={handleFontSizeChange}
            keyboardType="decimal-pad"
            selectTextOnFocus
            placeholderTextColor={LD.textTertiary}
          />
        </View>
        <Divider />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Line height</Text>
          <TextInput
            style={styles.numericInput}
            value={lineHeight}
            onChangeText={handleLineHeightChange}
            keyboardType="decimal-pad"
            selectTextOnFocus
            placeholderTextColor={LD.textTertiary}
          />
        </View>
      </View>

      {/* About */}
      <SectionLabel label="About" />
      <View style={styles.card}>
        <InfoRow label="Version" value={VERSION} />
        <Divider />
        <InfoRow label="Build" value={BUILD} />
      </View>

      {/* Legal and support */}
      <SectionLabel label="Legal and support" />
      <View style={styles.card}>
        <LinkRow label="Privacy policy" onPress={handlePrivacyPolicy} />
        <Divider />
        <LinkRow label="Support" onPress={handleSupport} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LD.background,
  },
  content: {
    paddingHorizontal: 20,
  },
  screenTitle: {
    fontFamily: SERIF,
    fontSize: 34,
    color: LD.text,
    marginBottom: 32,
  },
  sectionLabel: {
    fontFamily: SANS,
    fontSize: 11,
    color: LD.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 24,
    marginLeft: 4,
  },
  card: {
    backgroundColor: LD.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  rowPressed: {
    backgroundColor: LD.surfaceSecondary,
  },
  rowLabel: {
    fontFamily: SANS,
    fontSize: 16,
    color: LD.text,
  },
  rowValue: {
    fontFamily: SANS,
    fontSize: 16,
    color: LD.textSecondary,
  },
  chevron: {
    fontSize: 20,
    color: LD.textTertiary,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: LD.divider,
    marginLeft: 16,
  },
  numericInput: {
    fontFamily: SANS,
    fontSize: 16,
    color: LD.text,
    backgroundColor: LD.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 64,
    textAlign: 'center',
  },
});
