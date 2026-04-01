import "react-native-reanimated";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Alert } from "react-native";
import { useNetworkState } from "expo-network";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { BrandSettingsProvider } from "@/contexts/BrandSettingsContext";
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
} from "@expo-google-fonts/dm-sans";
import { LD } from "@/constants/Colors";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

const LDDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: LD.background,
    card: LD.surface,
    text: LD.text,
    border: LD.border,
    primary: LD.primary,
    notification: LD.primary,
  },
};

export default function RootLayout() {
  const networkState = useNetworkState();
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "you are offline",
        "your changes will be saved locally and synced when you are back online."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" animated />
      <ThemeProvider value={LDDarkTheme}>
        <SafeAreaProvider>
          <BrandSettingsProvider>
            <WidgetProvider>
              <SubscriptionProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen
                      name="paywall"
                      options={{
                        presentation: 'modal',
                        headerShown: false,
                        animation: 'slide_from_bottom',
                      }}
                    />
                    <Stack.Screen
                      name="brand-settings"
                      options={{
                        presentation: 'modal',
                        headerShown: false,
                        animation: 'slide_from_bottom',
                      }}
                    />
                  </Stack>
                  <SystemBars style="light" />
                </GestureHandlerRootView>
              </SubscriptionProvider>
            </WidgetProvider>
          </BrandSettingsProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </>
  );
}
