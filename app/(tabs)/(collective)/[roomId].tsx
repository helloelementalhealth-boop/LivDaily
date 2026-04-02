import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LD } from '@/constants/Colors';

const BACKEND_URL = 'https://7eapc2dc4ufkh52uzd6nm5yazjg26qne.app.specular.dev';

type Ritual = {
  id: string;
  room_id: string;
  title: string;
  duration: number;
  thumbnail_url: string;
  tag: 'Movement' | 'Rest' | 'Sleep';
  audio_url: string | null;
  content: unknown;
  sort_order: number;
  created_at: string;
};

function resolveImageSource(source: string | undefined) {
  if (!source) return { uri: '' };
  return { uri: source };
}

export default function RitualListScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roomId) {
      fetchRituals(roomId);
    }
  }, [roomId]);

  async function fetchRituals(id: string) {
    console.log('[Collective] Fetching rituals for room:', id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/${id}/rituals`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`);
      }
      const data = await res.json();
      console.log('[Collective] Rituals loaded:', data.rituals?.length ?? 0);
      const sorted: Ritual[] = (data.rituals ?? []).sort(
        (a: Ritual, b: Ritual) => a.sort_order - b.sort_order
      );
      setRituals(sorted);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load rituals';
      console.error('[Collective] Error fetching rituals:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleRitualPress(ritual: Ritual) {
    console.log('[Collective] Ritual tapped:', ritual.id, ritual.title);
    router.push(`/(tabs)/(collective)/ritual/${ritual.id}`);
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator color={LD.textSecondary} />
          </View>
        )}

        {!loading && error && (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Unable to load rituals.</Text>
            <Text style={styles.errorDetail}>{error}</Text>
          </View>
        )}

        {!loading && !error && (
          <View style={styles.cardList}>
            {rituals.map((ritual) => (
              <RitualCard key={ritual.id} ritual={ritual} onPress={handleRitualPress} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function RitualCard({ ritual, onPress }: { ritual: Ritual; onPress: (r: Ritual) => void }) {
  const durationText = `${ritual.duration} min`;
  const imageSource = resolveImageSource(ritual.thumbnail_url);

  return (
    <Pressable
      onPress={() => onPress(ritual)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Image
        source={imageSource}
        style={styles.cardImage}
        contentFit="cover"
      />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{ritual.title}</Text>
        <Text style={styles.cardDuration}>{durationText}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LD.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  cardList: {
    gap: 20,
  },
  card: {
    backgroundColor: LD.surface,
    borderRadius: 16,
    overflow: 'hidden',
    // @ts-expect-error borderCurve is a valid iOS style prop
    borderCurve: 'continuous',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardBody: {
    backgroundColor: LD.surface,
    padding: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  cardTitle: {
    fontFamily: 'PlayfairDisplay_500Medium',
    fontSize: 18,
    color: LD.text,
    fontWeight: '500',
  },
  cardDuration: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: LD.text,
    opacity: 0.45,
    marginTop: 6,
  },
  centered: {
    paddingTop: 60,
    alignItems: 'center',
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
    paddingHorizontal: 24,
  },
});
