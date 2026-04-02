import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { LD } from '@/constants/Colors';

const BACKEND_URL = 'https://7eapc2dc4ufkh52uzd6nm5yazjg26qne.app.specular.dev';

type Room = {
  id: string;
  slug: string;
  title: string;
  sort_order: number;
  created_at: string;
};

export default function RoomsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    console.log('[Collective] Fetching rooms from /api/rooms');
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`);
      }
      const data = await res.json();
      console.log('[Collective] Rooms loaded:', data.rooms?.length ?? 0);
      setRooms(data.rooms ?? []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load rooms';
      console.error('[Collective] Error fetching rooms:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleRoomPress(room: Room) {
    console.log('[Collective] Room tapped:', room.id, room.title);
    router.push(`/(tabs)/(collective)/${room.id}`);
  }

  const topPadding = insets.top + 32;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionMarker}>space</Text>

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator color={LD.textSecondary} />
          </View>
        )}

        {!loading && error && (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Unable to load rooms.</Text>
            <Text style={styles.errorDetail}>{error}</Text>
          </View>
        )}

        {!loading && !error && (
          <View style={styles.cardList}>
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} onPress={handleRoomPress} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function RoomCard({ room, onPress }: { room: Room; onPress: (r: Room) => void }) {
  return (
    <Pressable
      onPress={() => onPress(room)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Text style={styles.cardTitle}>{room.title}</Text>
      <ChevronRight size={16} color={LD.text} style={{ opacity: 0.3 }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LD.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  sectionMarker: {
    fontSize: 11,
    letterSpacing: 4,
    color: LD.text,
    opacity: 0.4,
    textTransform: 'lowercase',
    marginBottom: 28,
    fontFamily: 'DMSans_400Regular',
  },
  cardList: {
    gap: 12,
  },
  card: {
    backgroundColor: LD.surface,
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // @ts-expect-error borderCurve is a valid iOS style prop
    borderCurve: 'continuous',
    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardTitle: {
    fontFamily: 'PlayfairDisplay_500Medium',
    fontSize: 22,
    color: LD.text,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
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
