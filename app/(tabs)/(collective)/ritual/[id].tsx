import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Image } from 'expo-image';
import { LD } from '@/constants/Colors';

const BACKEND_URL = 'https://7eapc2dc4ufkh52uzd6nm5yazjg26qne.app.specular.dev';

type StepItem = { step: number; text: string };

type RitualContent =
  | { format: 'steps'; steps: StepItem[]; closing_breath?: string }
  | { format: 'restorative'; steps: StepItem[]; self_care_lines: string[] }
  | { format: 'flow'; paragraphs: string[] };

type Ritual = {
  id: string;
  room_id: string;
  title: string;
  duration: number;
  thumbnail_url: string;
  tag: 'Movement' | 'Rest' | 'Sleep';
  audio_url: string | null;
  content: RitualContent;
  sort_order: number;
  created_at: string;
};

function resolveImageSource(source: string | undefined) {
  if (!source) return { uri: '' };
  return { uri: source };
}

function padStep(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export default function RitualDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [ritual, setRitual] = useState<Ritual | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchRitual(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchRitual(ritualId: string) {
    console.log('[Collective] Fetching ritual detail:', ritualId);
    try {
      const res = await fetch(`${BACKEND_URL}/api/rituals/${ritualId}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`);
      }
      const data = await res.json();
      console.log('[Collective] Ritual detail loaded:', data.title ?? data.id);
      setRitual(data);
      navigation.setOptions({ title: data.title ?? '' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load ritual';
      console.error('[Collective] Error fetching ritual:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={LD.textSecondary} />
      </View>
    );
  }

  if (error || !ritual) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Unable to load ritual.</Text>
        {error ? <Text style={styles.errorDetail}>{error}</Text> : null}
      </View>
    );
  }

  const imageSource = resolveImageSource(ritual.thumbnail_url);
  const durationText = `${ritual.duration} min`;

  return (
    <ScrollView
      style={styles.root}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <Image
        source={imageSource}
        style={styles.heroImage}
        contentFit="cover"
      />

      <View style={styles.contentArea}>
        <View style={styles.durationBadge}>
          <Text style={styles.durationBadgeText}>{durationText}</Text>
        </View>

        <Text style={styles.title}>{ritual.title}</Text>

        <View style={styles.divider} />

        <RitualContentBlock content={ritual.content} />
      </View>
    </ScrollView>
  );
}

function RitualContentBlock({ content }: { content: RitualContent }) {
  if (content.format === 'steps') {
    const hasClosingBreath = Boolean(content.closing_breath);
    return (
      <View>
        {content.steps.map((s) => {
          const stepLabel = padStep(s.step);
          return (
            <View key={s.step} style={styles.stepBlock}>
              <Text style={styles.stepNumber}>{stepLabel}</Text>
              <Text style={styles.stepText}>{s.text}</Text>
            </View>
          );
        })}
        {hasClosingBreath ? (
          <Text style={styles.closingBreath}>{content.closing_breath}</Text>
        ) : null}
      </View>
    );
  }

  if (content.format === 'restorative') {
    const hasSelfCare = content.self_care_lines.length > 0;
    return (
      <View>
        {content.steps.map((s) => {
          const stepLabel = padStep(s.step);
          return (
            <View key={s.step} style={styles.stepBlock}>
              <Text style={styles.stepNumber}>{stepLabel}</Text>
              <Text style={styles.stepTextSoft}>{s.text}</Text>
            </View>
          );
        })}
        {hasSelfCare ? (
          <View style={styles.selfCareContainer}>
            {content.self_care_lines.map((line, i) => (
              <Text key={i} style={styles.selfCareLine}>{line}</Text>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  if (content.format === 'flow') {
    return (
      <View>
        {content.paragraphs.map((para, i) => (
          <Text key={i} style={styles.flowParagraph}>{para}</Text>
        ))}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LD.background,
  },
  centered: {
    flex: 1,
    backgroundColor: LD.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: LD.text,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    opacity: 0.7,
  },
  errorDetail: {
    color: LD.textSecondary,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  heroImage: {
    width: '100%',
    height: 260,
  },
  contentArea: {
    padding: 24,
    paddingBottom: 60,
  },
  durationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  durationBadgeText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: LD.textSecondary,
  },
  title: {
    fontFamily: 'PlayfairDisplay_600Bold',
    fontSize: 26,
    color: LD.text,
    fontWeight: '600',
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 24,
  },
  stepBlock: {
    marginBottom: 20,
  },
  stepNumber: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    letterSpacing: 2,
    color: LD.text,
    opacity: 0.4,
  },
  stepText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: LD.text,
    opacity: 0.85,
    lineHeight: 26,
    marginTop: 6,
  },
  stepTextSoft: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: LD.text,
    opacity: 0.85,
    lineHeight: 28,
    marginTop: 6,
  },
  closingBreath: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: LD.text,
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 28,
    fontStyle: 'italic',
  },
  selfCareContainer: {
    marginTop: 32,
    gap: 8,
  },
  selfCareLine: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: LD.text,
    opacity: 0.55,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  flowParagraph: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 17,
    color: LD.text,
    opacity: 0.8,
    lineHeight: 30,
    marginBottom: 24,
  },
});
