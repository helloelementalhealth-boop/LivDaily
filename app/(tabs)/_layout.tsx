import React from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';
import FloatingTabBar from '@/components/FloatingTabBar';
import { LD } from '@/constants/Colors';
import { Sun, AlignJustify, User } from 'lucide-react-native';

const TABS = [
  {
    name: 'home',
    route: '/(tabs)/home' as const,
    renderIcon: (color: string) => <Sun size={24} color={color} />,
  },
  {
    name: '(collective)',
    route: '/(tabs)/(collective)' as const,
    renderIcon: (color: string) => <AlignJustify size={24} color={color} />,
  },
  {
    name: 'profile',
    route: '/(tabs)/profile' as const,
    renderIcon: (color: string) => <User size={24} color={color} />,
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
