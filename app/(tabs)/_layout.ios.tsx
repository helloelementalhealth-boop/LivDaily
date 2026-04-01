import React from 'react';
// SDK 54 — NativeTabs from expo-router/unstable-native-tabs
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="home">
        <Icon sf="sun.max" />
        <Label>home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf="gearshape" />
        <Label>settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
