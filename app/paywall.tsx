import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PurchasesPackage } from 'react-native-purchases';

const BG = '#0D1117';
const TEXT_PRIMARY = '#F0EDE8';
const TEXT_SECONDARY = 'rgba(240,237,232,0.55)';
const TEXT_TERTIARY = 'rgba(240,237,232,0.3)';
const ACCENT = '#FF6B35';
const ACCENT_END = '#E63946';
const SURFACE = 'rgba(240,237,232,0.05)';
const BORDER = 'rgba(240,237,232,0.08)';
const BORDER_ACTIVE = 'rgba(255,107,53,0.45)';

const SERIF = 'Georgia';
const SANS = 'DMSans_400Regular';
const SANS_LIGHT = 'DMSans_300Light';
const SANS_MED = 'DMSans_500Medium';

const FEATURES = [
  {
    icon: '◈',
    title: 'the full report',
    description: 'access the complete daily intelligence brief, unabridged',
  },
  {
    icon: '◉',
    title: 'vault archive',
    description: 'every report, every day — searchable and indexed',
  },
  {
    icon: '◎',
    title: 'editorial intelligence',
    description: 'deeper ai-generated analysis tailored to your protocol',
  },
  {
    icon: '◐',
    title: 'founder access',
    description: 'direct line to the livdaily editorial team',
  },
];

function FeatureRow({ icon, title, description, delay }: { icon: string; title: string; description: string; delay: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [opacity, translateY, delay]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          color: ACCENT,
          width: 24,
          textAlign: 'center',
          marginTop: 1,
        }}
      >
        {icon}
      </Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: SANS_MED,
            fontSize: 13,
            color: TEXT_PRIMARY,
            textTransform: 'lowercase',
            letterSpacing: 0.5,
            marginBottom: 4,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: SANS_LIGHT,
            fontSize: 12,
            color: TEXT_SECONDARY,
            lineHeight: 18,
            letterSpacing: 0.3,
          }}
        >
          {description}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentOffering, purchasePackage, restorePurchases, isLoading } = useSubscription();

  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslate = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(headerTranslate, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [headerOpacity, headerTranslate]);

  useEffect(() => {
    if (currentOffering?.availablePackages?.length) {
      setSelectedPackage(currentOffering.availablePackages[0]);
    }
  }, [currentOffering]);

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    console.log('[livdaily] paywall — purchase button pressed:', selectedPackage.identifier);
    setPurchasing(true);
    const success = await purchasePackage(selectedPackage);
    setPurchasing(false);
    if (success) {
      console.log('[livdaily] paywall — purchase succeeded, dismissing');
      router.back();
    }
  };

  const handleRestore = async () => {
    console.log('[livdaily] paywall — restore purchases pressed');
    setRestoring(true);
    const success = await restorePurchases();
    setRestoring(false);
    if (success) {
      console.log('[livdaily] paywall — restore succeeded, dismissing');
      router.back();
    }
  };

  const handleDismiss = () => {
    console.log('[livdaily] paywall — dismissed');
    router.back();
  };

  const packages = currentOffering?.availablePackages ?? [];

  const priceText = selectedPackage
    ? String(selectedPackage.product.priceString)
    : '—';

  const periodText = selectedPackage
    ? String(selectedPackage.packageType).toLowerCase().replace('_', ' ')
    : '';

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Ambient glow */}
      <View
        style={{
          position: 'absolute',
          top: -80,
          alignSelf: 'center',
          width: 360,
          height: 360,
          borderRadius: 180,
          backgroundColor: ACCENT,
          opacity: 0.07,
        }}
        pointerEvents="none"
      />

      {/* Dismiss button */}
      <Pressable
        onPress={handleDismiss}
        style={{
          position: 'absolute',
          top: insets.top + 12,
          right: 20,
          zIndex: 10,
          padding: 8,
        }}
        accessibilityRole="button"
        accessibilityLabel="close"
      >
        <Text
          style={{
            fontFamily: SANS,
            fontSize: 11,
            letterSpacing: 2,
            color: TEXT_TERTIARY,
            textTransform: 'lowercase',
          }}
        >
          close
        </Text>
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 56,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 28,
        }}
      >
        {/* Header */}
        <Animated.View
          style={{
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslate }],
            alignItems: 'center',
            marginBottom: 48,
          }}
        >
          {/* Accent rule */}
          <View
            style={{
              width: 32,
              height: 1,
              backgroundColor: ACCENT,
              marginBottom: 24,
              opacity: 0.7,
            }}
          />

          <Text
            style={{
              fontFamily: SERIF,
              fontSize: 36,
              fontWeight: '400',
              color: TEXT_PRIMARY,
              textAlign: 'center',
              letterSpacing: -0.5,
              marginBottom: 12,
            }}
          >
            the vault
          </Text>

          <Text
            style={{
              fontFamily: SANS_LIGHT,
              fontSize: 13,
              color: TEXT_SECONDARY,
              letterSpacing: 3,
              textTransform: 'lowercase',
              textAlign: 'center',
            }}
          >
            intelligence, unfiltered
          </Text>
        </Animated.View>

        {/* Features */}
        <View style={{ marginBottom: 40 }}>
          {FEATURES.map((f, i) => (
            <FeatureRow
              key={f.title}
              icon={f.icon}
              title={f.title}
              description={f.description}
              delay={300 + i * 80}
            />
          ))}
        </View>

        {/* Package selector */}
        {isLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <ActivityIndicator color={ACCENT} />
          </View>
        ) : packages.length > 0 ? (
          <View style={{ gap: 10, marginBottom: 28 }}>
            {packages.map((pkg) => {
              const isSelected = selectedPackage?.identifier === pkg.identifier;
              const pkgPrice = String(pkg.product.priceString);
              const pkgPeriod = String(pkg.packageType).toLowerCase().replace('_', ' ');
              return (
                <Pressable
                  key={pkg.identifier}
                  onPress={() => {
                    console.log('[livdaily] paywall — package selected:', pkg.identifier);
                    setSelectedPackage(pkg);
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: isSelected ? BORDER_ACTIVE : BORDER,
                    borderRadius: 12,
                    backgroundColor: isSelected ? 'rgba(255,107,53,0.06)' : SURFACE,
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        borderWidth: 1.5,
                        borderColor: isSelected ? ACCENT : TEXT_TERTIARY,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSelected && (
                        <View
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: 4.5,
                            backgroundColor: ACCENT,
                          }}
                        />
                      )}
                    </View>
                    <Text
                      style={{
                        fontFamily: SANS,
                        fontSize: 13,
                        color: isSelected ? TEXT_PRIMARY : TEXT_SECONDARY,
                        textTransform: 'lowercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      {pkgPeriod}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: SANS_MED,
                      fontSize: 15,
                      color: isSelected ? TEXT_PRIMARY : TEXT_SECONDARY,
                    }}
                  >
                    {pkgPrice}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View
            style={{
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: 12,
              backgroundColor: SURFACE,
              paddingHorizontal: 20,
              paddingVertical: 16,
              marginBottom: 28,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: SANS_LIGHT,
                fontSize: 12,
                color: TEXT_TERTIARY,
                letterSpacing: 1,
                textTransform: 'lowercase',
              }}
            >
              no plans available
            </Text>
          </View>
        )}

        {/* CTA Button */}
        <Pressable
          onPress={handlePurchase}
          disabled={purchasing || !selectedPackage}
          style={({ pressed }) => ({
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 16,
            opacity: pressed || !selectedPackage ? 0.75 : 1,
          })}
          accessibilityRole="button"
          accessibilityLabel="unlock the vault"
        >
          <View
            style={{
              backgroundColor: ACCENT,
              paddingVertical: 17,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 10,
            }}
          >
            {purchasing ? (
              <ActivityIndicator color={TEXT_PRIMARY} size="small" />
            ) : (
              <>
                <Text
                  style={{
                    fontFamily: SANS_MED,
                    fontSize: 13,
                    color: TEXT_PRIMARY,
                    letterSpacing: 2,
                    textTransform: 'lowercase',
                  }}
                >
                  unlock the vault
                </Text>
                {selectedPackage && (
                  <Text
                    style={{
                      fontFamily: SANS_LIGHT,
                      fontSize: 12,
                      color: 'rgba(240,237,232,0.7)',
                      letterSpacing: 0.5,
                    }}
                  >
                    {priceText}
                  </Text>
                )}
              </>
            )}
          </View>
        </Pressable>

        {/* Restore */}
        <Pressable
          onPress={handleRestore}
          disabled={restoring}
          style={{ alignItems: 'center', paddingVertical: 12 }}
          accessibilityRole="button"
          accessibilityLabel="restore purchases"
        >
          {restoring ? (
            <ActivityIndicator color={TEXT_TERTIARY} size="small" />
          ) : (
            <Text
              style={{
                fontFamily: SANS_LIGHT,
                fontSize: 11,
                color: TEXT_TERTIARY,
                letterSpacing: 1.5,
                textTransform: 'lowercase',
              }}
            >
              restore purchases
            </Text>
          )}
        </Pressable>

        {/* Legal */}
        <Text
          style={{
            fontFamily: SANS_LIGHT,
            fontSize: 10,
            color: TEXT_TERTIARY,
            textAlign: 'center',
            lineHeight: 16,
            letterSpacing: 0.3,
            marginTop: 8,
            paddingHorizontal: 16,
          }}
        >
          {`subscription renews automatically. cancel anytime in your ${Platform.OS === 'ios' ? 'app store' : 'play store'} settings.`}
        </Text>
      </ScrollView>
    </View>
  );
}
