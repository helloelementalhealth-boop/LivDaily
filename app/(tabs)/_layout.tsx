import React from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';
import FloatingTabBar from '@/components/FloatingTabBar';
import { LD } from '@/constants/Colors';

const TABS = [
  {
    name: 'home',
    route: '/(tabs)/home' as const,
    icon: 'wb-sunny' as const,
    label: '',
  },
  {
    name: '(collective)',
    route: '/(tabs)/(collective)' as const,
    icon: 'menu' as const,
    label: '',
  },
  {
    name: 'profile',
    route: '/(tabs)/profile' as const,
    icon: 'settings' as const,
    label: '',
  },
];

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: LD.background }}>
      <Slot />
      <FloatingTabBar
        tabs={TABS}
        containerWidth={280}
        borderRadius={35}
        bottomMargin={20}
      />
    </View>
  );
}
