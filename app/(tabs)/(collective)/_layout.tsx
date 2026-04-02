import React from 'react';
import { Stack } from 'expo-router';
import { LD } from '@/constants/Colors';

export default function CollectiveLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: LD.background },
        headerTintColor: LD.text,
        headerTitleStyle: {
          fontFamily: 'PlayfairDisplay_500Medium',
          fontSize: 17,
          color: LD.text,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: LD.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[roomId]" />
      <Stack.Screen name="ritual/[id]" />
    </Stack>
  );
}
