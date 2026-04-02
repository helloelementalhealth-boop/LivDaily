import React from 'react';
// SDK 54 — NativeTabs from expo-router/unstable-native-tabs
import { NativeTabs, Icon } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="home">
        <Icon sf="sun.max" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(collective)">
        <Icon sf="line.3.horizontal" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
