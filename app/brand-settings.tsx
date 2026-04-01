import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBrandSettings, BrandSettings } from '@/contexts/BrandSettingsContext';
import { LD } from '@/constants/Colors';

const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

function isValidHex(val: string): boolean {
  return HEX_REGEX.test(val.trim());
}

export default function BrandSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { brandSettings, updateSettings } = useBrandSettings();

  const [primaryHex, setPrimaryHex] = useState(brandSettings.primaryHex);
  const [secondaryHex, setSecondaryHex] = useState(brandSettings.secondaryHex);
  const [fontSize, setFontSize] = useState(String(brandSettings.fontSize));
  const [lineHeightMultiplier, setLineHeightMultiplier] = useState(String(brandSettings.lineHeightMultiplier));
  const [manualOverride, setManualOverride] = useState(brandSettings.manualOverride);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const previewPrimary = isValidHex(primaryHex) ? primaryHex.trim() : '#FFD580';
  const previewSecondary = isValidHex(secondaryHex) ? secondaryHex.trim() : '#FF6B35';

  const handleSave = async () => {
    console.log('[BrandSettings] Save button pressed');
    setSaving(true);
    const parsedFontSize = parseFloat(fontSize);
    const parsedLineHeight = parseFloat(lineHeightMultiplier);

    const partial: Partial<BrandSettings> = {
      primaryHex: isValidHex(primaryHex) ? primaryHex.trim() : brandSettings.primaryHex,
      secondaryHex: isValidHex(secondaryHex) ? secondaryHex.trim() : brandSettings.secondaryHex,
      fontSize: isNaN(parsedFontSize) ? brandSettings.fontSize : parsedFontSize,
      lineHeightMultiplier: isNaN(parsedLineHeight) ? brandSettings.lineHeightMultiplier : parsedLineHeight,
      manualOverride,
    };

    await updateSettings(partial);
    setSaving(false);
    setSaved(true);

    setTimeout(() => {
      router.back();
    }, 1000);
  };

  const handleDismiss = () => {
    console.log('[BrandSettings] Dismiss button pressed');
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>brand settings</Text>
          <Pressable
            onPress={handleDismiss}
            style={styles.dismissBtn}
            accessibilityLabel="Dismiss brand settings"
            accessibilityRole="button"
          >
            <Text style={styles.dismissText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Gradient Colors */}
          <Text style={styles.sectionLabel}>gradient colors</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>primary hex</Text>
            <TextInput
              style={styles.input}
              value={primaryHex}
              onChangeText={(v) => {
                console.log('[BrandSettings] Primary hex changed:', v);
                setPrimaryHex(v);
              }}
              placeholder="#FFD580"
              placeholderTextColor={LD.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>secondary hex</Text>
            <TextInput
              style={styles.input}
              value={secondaryHex}
              onChangeText={(v) => {
                console.log('[BrandSettings] Secondary hex changed:', v);
                setSecondaryHex(v);
              }}
              placeholder="#FF6B35"
              placeholderTextColor={LD.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Live gradient preview */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>preview</Text>
            <LinearGradient
              colors={[previewPrimary, previewSecondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientStrip}
            />
          </View>

          {/* Typography */}
          <Text style={[styles.sectionLabel, { marginTop: 32 }]}>typography</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>font size</Text>
            <TextInput
              style={styles.input}
              value={fontSize}
              onChangeText={(v) => {
                console.log('[BrandSettings] Font size changed:', v);
                setFontSize(v);
              }}
              placeholder="17"
              placeholderTextColor={LD.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>line height multiplier</Text>
            <TextInput
              style={styles.input}
              value={lineHeightMultiplier}
              onChangeText={(v) => {
                console.log('[BrandSettings] Line height multiplier changed:', v);
                setLineHeightMultiplier(v);
              }}
              placeholder="1.65"
              placeholderTextColor={LD.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Manual Briefing Override */}
          <Text style={[styles.sectionLabel, { marginTop: 32 }]}>manual briefing override</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>manual override</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={manualOverride}
              onChangeText={(v) => {
                console.log('[BrandSettings] Manual override updated, length:', v.length);
                setManualOverride(v);
              }}
              placeholder="paste today's briefing here to override the AI..."
              placeholderTextColor={LD.textTertiary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Save button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
          {saved && (
            <Text style={styles.savedText}>saved.</Text>
          )}
          <Pressable
            onPress={handleSave}
            disabled={saving || saved}
            style={[styles.saveBtn, (saving || saved) && styles.saveBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Save brand settings"
          >
            <Text style={styles.saveBtnText}>
              {saving ? 'saving...' : saved ? 'saved.' : 'save settings'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LD.background,
  },
  container: {
    flex: 1,
    backgroundColor: LD.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: LD.border,
  },
  headerTitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: LD.text,
    letterSpacing: 0.5,
  },
  dismissBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: 16,
    color: LD.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  sectionLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: LD.textTertiary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: LD.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: LD.surfaceSecondary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: LD.text,
    borderWidth: 1,
    borderColor: LD.border,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  previewContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  previewLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: LD.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  gradientStrip: {
    height: 12,
    borderRadius: 6,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: LD.border,
    backgroundColor: LD.background,
  },
  savedText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: LD.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  saveBtn: {
    backgroundColor: LD.surface,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LD.border,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: LD.text,
    letterSpacing: 0.8,
  },
});
