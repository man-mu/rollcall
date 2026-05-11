// Liquid Glass primitives, used everywhere for the iOS 26 look.
//
//   <GlassCard>      — rounded glass container, padded content
//   <GlassSection>   — Form-style grouped row container with internal dividers
//   <GlassRow>       — single row inside a GlassSection
//   <GlassToast>     — pill-shaped overlay used for quick feedback
//
// On iOS 26 these render real UIGlassEffect via expo-glass-effect.
// On older iOS they fall back to UIVisualEffectView (system blur).
// On web/Android expo-glass-effect emits a translucent View; we additionally
// apply backdrop-filter via inline style on web to get a real blur.

import * as React from 'react';
import { Platform, StyleSheet, Text, View, ViewProps, ViewStyle } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

const isWeb = Platform.OS === 'web';

interface GlassBaseProps extends ViewProps {
  tint?: 'regular' | 'clear';
  borderRadius?: number;
}

const baseGlassStyle = (radius: number): ViewStyle => ({
  borderRadius: radius,
  overflow: 'hidden',
  ...(isWeb
    ? ({
        // RN-Web passes unknown style props through to CSS. backdrop-filter gives
        // us a "real" frosted blur on browsers that support it (all modern).
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        backgroundColor: 'rgba(28,28,30,0.55)',
      } as ViewStyle)
    : {}),
});

export function GlassCard({
  tint = 'regular',
  borderRadius = 18,
  style,
  children,
  ...rest
}: GlassBaseProps) {
  return (
    <GlassView
      glassEffectStyle={tint}
      style={[baseGlassStyle(borderRadius), style]}
      {...rest}
    >
      <View style={styles.cardInner}>{children}</View>
    </GlassView>
  );
}

export function GlassSection({
  tint = 'regular',
  borderRadius = 14,
  style,
  children,
  ...rest
}: GlassBaseProps) {
  // Add internal dividers between children so it looks like a Form section
  const arr = React.Children.toArray(children).filter(Boolean);
  return (
    <GlassView
      glassEffectStyle={tint}
      style={[baseGlassStyle(borderRadius), style]}
      {...rest}
    >
      <View>
        {arr.map((child, i) => (
          <React.Fragment key={i}>
            {i > 0 && <View style={styles.divider} />}
            <View style={styles.row}>{child}</View>
          </React.Fragment>
        ))}
      </View>
    </GlassView>
  );
}

export function GlassRow({
  label,
  value,
  right,
  style,
}: {
  label: string;
  value?: string | null;
  right?: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.kvRow, style]}>
      <Text style={styles.kvLabel}>{label}</Text>
      {right ?? <Text style={styles.kvValue} numberOfLines={1}>{value ?? ''}</Text>}
    </View>
  );
}

export function GlassToast({ message }: { message: string }) {
  const isSuccess = message.includes('成功') || message.includes('已共享');
  return (
    <GlassView
      glassEffectStyle="regular"
      style={[
        baseGlassStyle(999),
        styles.toast,
      ]}
    >
      <Text style={styles.toastText}>
        {isSuccess ? '✅  ' : '⚠️  '}{message}
      </Text>
    </GlassView>
  );
}

export const liquidGlassAvailable = isLiquidGlassAvailable();

const styles = StyleSheet.create({
  cardInner: { padding: 16 },
  row: { paddingHorizontal: 16, paddingVertical: 12 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginLeft: 16,
  },
  kvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  kvLabel: { color: '#e5e5e7', fontSize: 15 },
  kvValue: { color: '#fff', fontSize: 15, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  toast: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignSelf: 'center',
  },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
