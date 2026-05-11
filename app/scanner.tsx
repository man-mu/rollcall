import * as React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { GlassCard, GlassToast } from '@/src/components/Glass';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ExpoDataScanner, {
  ExpoDataScannerView,
} from '@/modules/expo-data-scanner';
import { useAppState } from '@/src/store/appState';

type ScanMode = 'global' | 'rollcall';

export default function ScannerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: ScanMode; rollcallID?: string }>();
  const mode: ScanMode = params.mode === 'rollcall' ? 'rollcall' : 'global';
  const rollcallID = params.rollcallID ? parseInt(params.rollcallID, 10) : undefined;

  const submitGlobalQR = useAppState(s => s.submitGlobalQR);
  const checkinQR = useAppState(s => s.checkinQR);

  const [scannerSupported, setScannerSupported] = React.useState(false);
  const [scanned, setScanned] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    ExpoDataScanner.isSupported()
      .then(v => { if (!cancelled) setScannerSupported(v); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const submit = async (raw: string) => {
    if (mode === 'global') {
      await submitGlobalQR(raw);
    } else if (rollcallID) {
      await checkinQR(rollcallID, raw);
    }
    router.back();
  };

  const promptManual = () => {
    const RNAlert = require('react-native').Alert as typeof import('react-native').Alert;
    if (typeof (RNAlert as any).prompt === 'function') {
      (RNAlert as any).prompt(
        '手动输入二维码',
        '粘贴 42 位 hex 或包含 !3~ 的链接',
        [
          { text: '取消', style: 'cancel' },
          { text: '提交', onPress: (v: string) => v && submit(v) },
        ],
        'plain-text',
      );
    } else if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
      const v = window.prompt('手动输入二维码');
      if (v) void submit(v);
    } else {
      Alert.alert('暂不支持', '当前平台不支持手动输入弹窗');
    }
  };

  return (
    <View style={styles.root}>
      {/* Camera */}
      <View style={StyleSheet.absoluteFill}>
        {scannerSupported ? (
          <ExpoDataScannerView
            enabled={!scanned}
            style={StyleSheet.absoluteFill}
            onScan={(e) => {
              if (scanned) return;
              setScanned(e.nativeEvent.value);
            }}
          />
        ) : (
          <View style={styles.fallback}>
            <IconSymbol name="qrcode.viewfinder" size={64} color="rgba(255,255,255,0.5)" />
            <Text style={styles.fallbackTitle}>相机扫码不可用</Text>
            <Text style={styles.fallbackText}>请使用手动输入</Text>
          </View>
        )}
      </View>

      {/* Top bar (glass) */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <GlassCard borderRadius={999} style={styles.topGlass}>
          <View style={styles.topRow}>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text style={styles.topBtn}>取消</Text>
            </Pressable>
            <Text style={styles.topTitle}>
              {mode === 'global' ? '扫一扫签到' : '扫码签到'}
            </Text>
            <Pressable onPress={promptManual} hitSlop={8}>
              <Text style={[styles.topBtn, { color: '#3478f6' }]}>手动输入</Text>
            </Pressable>
          </View>
        </GlassCard>
      </SafeAreaView>

      {/* Bottom result panel (glass) */}
      {scanned && (
        <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
          <GlassCard borderRadius={18}>
            <View style={styles.scannedHeader}>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#34d399" />
              <Text style={styles.scannedTitle}>已识别二维码</Text>
            </View>
            <Text style={styles.scannedValue} numberOfLines={2}>
              {scanned.slice(0, 80)}{scanned.length > 80 ? '…' : ''}
            </Text>
            <View style={styles.actionRow}>
              <Pressable
                onPress={() => setScanned(null)}
                style={[styles.actionBtn, styles.actionBtnSecondary]}
              >
                <Text style={[styles.actionText, { color: '#fff' }]}>重新扫描</Text>
              </Pressable>
              <Pressable
                onPress={() => submit(scanned)}
                style={[styles.actionBtn, styles.actionBtnPrimary]}
              >
                <Text style={[styles.actionText, { color: '#fff' }]}>提交签到</Text>
              </Pressable>
            </View>
          </GlassCard>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1c1c1e',
  },
  fallbackTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  fallbackText: { color: 'rgba(235,235,245,0.6)', fontSize: 13 },

  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  topGlass: { padding: 0 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  topBtn: { color: '#fff', fontSize: 15 },
  topTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },

  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  scannedHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scannedTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  scannedValue: {
    color: 'rgba(235,235,245,0.7)',
    fontSize: 12,
    fontFamily: 'Menlo',
    marginTop: 8,
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnSecondary: { backgroundColor: 'rgba(120,120,128,0.4)' },
  actionBtnPrimary: { backgroundColor: '#3478f6' },
  actionText: { fontSize: 15, fontWeight: '600' },
});
