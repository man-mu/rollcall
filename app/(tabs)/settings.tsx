import * as React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '@/src/components/Glass';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { liquidGlassAvailable } from '@/src/components/Glass';
import { useAppState } from '@/src/store/appState';
import { useConfig } from '@/src/store/config';

export default function SettingsScreen() {
  const cfg = useConfig();
  const logout = useAppState(s => s.logout);
  const centerConnected = useAppState(s => s.centerConnected);

  const confirmLogout = () => {
    Alert.alert('确定退出登录？', '这会清空你的密码缓存和会话 Cookie。', [
      { text: '取消', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>设置</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SectionLabel>账号信息</SectionLabel>
        <GlassCard borderRadius={14} style={{ padding: 0 }}>
          <Row label="账号" value={cfg.username || '(未设置)'} />
          <Divider />
          <Row label="学号" value={cfg.studentID || '(未设置)'} />
          <Divider />
          <Row label="Client ID" value={cfg.clientID.slice(0, 8) + '...'} />
        </GlassCard>

        <SectionLabel>签到设置</SectionLabel>
        <GlassCard borderRadius={14} style={{ padding: 0 }}>
          <Row
            label="自动定位签到"
            right={
              <Switch
                value={cfg.autoLocationCheckin}
                onValueChange={v => cfg.set({ autoLocationCheckin: v })}
              />
            }
          />
          <Divider />
          <Row
            label="暂停接收共享签到"
            right={
              <Switch
                value={cfg.pauseSharedRollcall}
                onValueChange={v => cfg.set({ pauseSharedRollcall: v })}
              />
            }
          />
          <Divider />
          <Stepper
            label="课前轮询"
            value={cfg.curriculumPreMinutes}
            min={1}
            max={30}
            unit="分钟"
            onChange={v => cfg.set({ curriculumPreMinutes: v })}
          />
        </GlassCard>

        <SectionLabel>服务器</SectionLabel>
        <GlassCard borderRadius={14} style={{ padding: 0 }}>
          <Row label="Center" value={cfg.centerServerURL} valueMono />
          <Divider />
          <Row
            label="状态"
            right={
              <Text style={[styles.value, { color: centerConnected ? '#34d399' : '#ff453a' }]}>
                {centerConnected ? '已连接' : '未连接'}
              </Text>
            }
          />
        </GlassCard>

        <SectionLabel>关于</SectionLabel>
        <GlassCard borderRadius={14} style={{ padding: 0 }}>
          <Row label="iOS 26 Liquid Glass" value={liquidGlassAvailable ? '已启用' : '降级模式'} />
        </GlassCard>

        <Pressable
          onPress={confirmLogout}
          style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.85 }]}
        >
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={18} color="#ff453a" />
          <Text style={styles.logoutText}>退出登录</Text>
        </Pressable>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function Row({
  label,
  value,
  right,
  valueMono,
}: {
  label: string;
  value?: string;
  right?: React.ReactNode;
  valueMono?: boolean;
}) {
  return (
    <View style={styles.rowItem}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ flex: 1 }} />
      {right ?? (
        <Text
          style={[styles.value, valueMono && { fontFamily: 'Menlo', fontSize: 12 }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function Stepper({
  label, value, min, max, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.rowItem}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.value}>{value} {unit}</Text>
      <View style={styles.stepperBox}>
        <Pressable
          onPress={() => onChange(Math.max(min, value - 1))}
          style={styles.stepperBtn}
        >
          <Text style={styles.stepperText}>−</Text>
        </Pressable>
        <View style={styles.stepperDivider} />
        <Pressable
          onPress={() => onChange(Math.min(max, value + 1))}
          style={styles.stepperBtn}
        >
          <Text style={styles.stepperText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0b0e' },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { color: '#fff', fontSize: 32, fontWeight: '700' },
  content: { paddingHorizontal: 20, gap: 6 },

  sectionLabel: {
    color: 'rgba(235,235,245,0.6)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 6,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },

  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    gap: 8,
  },
  label: { color: '#fff', fontSize: 15 },
  value: { color: 'rgba(235,235,245,0.7)', fontSize: 14, maxWidth: 220 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginLeft: 16,
  },

  stepperBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(120,120,128,0.36)',
    borderRadius: 8,
    overflow: 'hidden',
    marginLeft: 12,
  },
  stepperBtn: { paddingHorizontal: 14, paddingVertical: 5 },
  stepperText: { color: '#fff', fontSize: 18, fontWeight: '500' },
  stepperDivider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.2)' },

  logoutButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,69,58,0.15)',
    borderRadius: 14,
  },
  logoutText: { color: '#ff453a', fontSize: 16, fontWeight: '600' },
});
