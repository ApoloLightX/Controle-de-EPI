import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Field, PrimaryButton } from '@/components/UI';
import { useApp } from '@/context/AppContext';
import { colors, radius, spacing } from '@/theme';

export default function LoginScreen() {
  const { session, loginAdmin, loginEmployee } = useApp();
  const [mode, setMode] = useState<'admin' | 'employee'>('admin');
  const [identifier, setIdentifier] = useState('admin');
  const [pin, setPin] = useState('0000');
  const [loading, setLoading] = useState(false);
  if (session) return <Redirect href="/(tabs)" />;

  const changeMode = (next: 'admin' | 'employee') => {
    setMode(next);
    if (next === 'admin') { setIdentifier('admin'); setPin('0000'); }
    else { setIdentifier('000123'); setPin('1234'); }
  };

  const submit = async () => {
    setLoading(true);
    const ok = mode === 'admin' ? await loginAdmin(identifier, pin) : await loginEmployee(identifier, pin);
    setLoading(false);
    if (!ok) return Alert.alert('Acesso não autorizado', mode === 'admin' ? 'Confira o usuário e o PIN.' : 'Confira a matrícula, PIN e se o colaborador está ativo.');
    router.replace('/(tabs)');
  };

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
    <View style={styles.hero}>
      <View style={styles.logo}><Ionicons name="shield-checkmark" size={36} color="#fff" /></View>
      <Text style={styles.title}>ATC Controle EPI</Text>
      <Text style={styles.subtitle}>Controle operacional de pessoas, EPIs, entregas, trocas, compras e estoque.</Text>
    </View>
    <View style={styles.sheet}>
      <View style={styles.segment}>
        <Pressable onPress={() => changeMode('admin')} style={[styles.segmentItem, mode === 'admin' && styles.segmentActive]}><Text style={[styles.segmentText, mode === 'admin' && styles.segmentTextActive]}>Administrador</Text></Pressable>
        <Pressable onPress={() => changeMode('employee')} style={[styles.segmentItem, mode === 'employee' && styles.segmentActive]}><Text style={[styles.segmentText, mode === 'employee' && styles.segmentTextActive]}>Funcionário</Text></Pressable>
      </View>
      <View style={{ gap: 14 }}>
        <Field label={mode === 'admin' ? 'Usuário' : 'Matrícula'} value={identifier} autoCapitalize="none" onChangeText={setIdentifier} keyboardType={mode === 'employee' ? 'number-pad' : 'default'} />
        <Field label="PIN" value={pin} onChangeText={setPin} secureTextEntry keyboardType="number-pad" maxLength={8} />
        <PrimaryButton label="Entrar" icon="log-in-outline" loading={loading} onPress={submit} />
      </View>
      <View style={styles.demoBox}>
        <Text style={styles.demoTitle}>Acessos demonstrativos visíveis</Text>
        <Text style={styles.demoText}>ADM: usuário admin • PIN 0000</Text>
        <Text style={styles.demoText}>Funcionário: matrícula 000123 • PIN 1234</Text>
        <Text style={styles.demoHint}>Neste MVP o login é local e não deve ser usado como autenticação corporativa definitiva.</Text>
      </View>
    </View>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.blue, justifyContent: 'flex-end' }, hero: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: 80, justifyContent: 'center' }, logo: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.18)', marginBottom: 20 }, title: { color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: -.7 }, subtitle: { color: 'rgba(255,255,255,.84)', fontSize: 16, lineHeight: 23, marginTop: 9, maxWidth: 430 },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: spacing.xl, gap: 20 }, segment: { flexDirection: 'row', backgroundColor: '#E9ECF2', borderRadius: radius.md, padding: 4 }, segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 12 }, segmentActive: { backgroundColor: '#fff' }, segmentText: { color: colors.muted, fontWeight: '700' }, segmentTextActive: { color: colors.text },
  demoBox: { backgroundColor: colors.orangeSoft, borderRadius: radius.md, padding: 14, gap: 4 }, demoTitle: { color: '#7A4E00', fontWeight: '900' }, demoText: { color: '#7A4E00', fontSize: 13 }, demoHint: { color: '#7A4E00', fontSize: 11, marginTop: 5, lineHeight: 16 }
});
