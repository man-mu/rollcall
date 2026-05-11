import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard, GlassToast } from '@/src/components/Glass';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppState } from '@/src/store/appState';
import { useConfig } from '@/src/store/config';

export default function LoginScreen() {
  const cfg = useConfig();
  const isLoggingIn = useAppState(s => s.isLoggingIn);
  const loginError = useAppState(s => s.loginError);
  const login = useAppState(s => s.login);

  const [username, setUsername] = React.useState(cfg.username);
  const [password, setPassword] = React.useState(cfg.password);
  const [studentID, setStudentID] = React.useState(cfg.studentID);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const canSubmit = username.length > 0 && password.length > 0 && !isLoggingIn;

  const submit = async () => {
    cfg.set({ username, password, studentID });
    await login();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Logo */}
          <View style={styles.logo}>
            <IconSymbol name="checkmark.seal.fill" size={64} color="#3478f6" />
            <Text style={styles.title}>CQUPT 签到</Text>
            <Text style={styles.subtitle}>重庆邮电大学自动签到系统</Text>
          </View>

          {/* Credentials */}
          <GlassCard borderRadius={14} style={{ padding: 0 }}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>账号</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="IDS 账号"
                placeholderTextColor="rgba(235,235,245,0.4)"
                autoCorrect={false}
                autoCapitalize="none"
                textContentType="username"
                style={styles.input}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>密码</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="IDS 密码"
                placeholderTextColor="rgba(235,235,245,0.4)"
                secureTextEntry
                textContentType="password"
                style={styles.input}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>学号</Text>
              <TextInput
                value={studentID}
                onChangeText={setStudentID}
                placeholder="选填，用于读课表"
                placeholderTextColor="rgba(235,235,245,0.4)"
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
          </GlassCard>

          {/* Advanced */}
          <Pressable
            onPress={() => setShowAdvanced(v => !v)}
            style={styles.advancedToggle}
          >
            <Text style={styles.advancedToggleText}>
              {showAdvanced ? '隐藏高级设置' : '高级设置'}
            </Text>
            <IconSymbol
              name={showAdvanced ? 'chevron.up' : 'chevron.down'}
              size={14}
              color="rgba(235,235,245,0.6)"
            />
          </Pressable>
          {showAdvanced && (
            <GlassCard borderRadius={14} style={{ padding: 0 }}>
              <View style={styles.fieldColumn}>
                <Text style={styles.fieldCaption}>Center 服务器</Text>
                <TextInput
                  value={cfg.centerServerURL}
                  onChangeText={v => cfg.set({ centerServerURL: v })}
                  placeholder="wss://..."
                  placeholderTextColor="rgba(235,235,245,0.4)"
                  autoCorrect={false}
                  autoCapitalize="none"
                  style={styles.inputBlock}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.fieldColumn}>
                <Text style={styles.fieldCaption}>Center 密钥</Text>
                <TextInput
                  value={cfg.centerServerSecret}
                  onChangeText={v => cfg.set({ centerServerSecret: v })}
                  placeholder="可选"
                  placeholderTextColor="rgba(235,235,245,0.4)"
                  autoCorrect={false}
                  autoCapitalize="none"
                  style={styles.inputBlock}
                />
              </View>
            </GlassCard>
          )}

          {/* Error */}
          {loginError && (
            <View style={styles.errorWrap}>
              <IconSymbol name="exclamationmark.triangle" size={16} color="#ff453a" />
              <Text style={styles.errorText}>{loginError}</Text>
            </View>
          )}

          {/* Submit */}
          <Pressable
            onPress={submit}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.button,
              !canSubmit && styles.buttonDisabled,
              pressed && canSubmit && styles.buttonPressed,
            ]}
          >
            {isLoggingIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>登录</Text>
            )}
          </Pressable>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0b0e' },
  content: { padding: 20, gap: 18 },
  logo: { alignItems: 'center', gap: 6, marginTop: 24, marginBottom: 12 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 8 },
  subtitle: { color: 'rgba(235,235,245,0.6)', fontSize: 14 },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 48,
    gap: 12,
  },
  fieldColumn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
  },
  fieldLabel: { color: '#fff', fontSize: 15, width: 56 },
  fieldCaption: { color: 'rgba(235,235,245,0.6)', fontSize: 12 },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 6,
  },
  inputBlock: {
    color: '#fff',
    fontSize: 15,
    paddingVertical: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginLeft: 16,
  },

  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  advancedToggleText: { color: 'rgba(235,235,245,0.6)', fontSize: 13 },

  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  errorText: { color: '#ff453a', fontSize: 13, flexShrink: 1 },

  button: {
    backgroundColor: '#3478f6',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonDisabled: { backgroundColor: 'rgba(120,120,128,0.4)' },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
