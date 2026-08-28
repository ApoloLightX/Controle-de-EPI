import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';

export function Screen({ children, scroll = true, safeTop = false }: { children: React.ReactNode; scroll?: boolean; safeTop?: boolean }) {
  const body = scroll
    ? <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    : <View style={styles.screen}>{children}</View>;
  if (!safeTop) return body;
  return <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>{body}</SafeAreaView>;
}

export function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return <View style={styles.header}><View style={{ flex: 1 }}><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>{right}</View>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function DemoBanner() {
  return <View style={styles.demo}><Ionicons name="information-circle" size={18} color="#9A6700" /><Text style={styles.demoText}>Dados demonstrativos e editáveis neste dispositivo.</Text></View>;
}

export function SearchField({ value, onChangeText, placeholder = 'Buscar...' }: { value: string; onChangeText: (value: string) => void; placeholder?: string }) {
  return <View style={styles.search}><Ionicons name="search" size={18} color={colors.muted} /><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#98A2B3" style={styles.searchInput} /></View>;
}

export function Field(props: TextInputProps & { label: string }) {
  return <View style={{ gap: 6 }}><Text style={styles.label}>{props.label}</Text><TextInput {...props} placeholderTextColor="#98A2B3" style={[styles.input, props.multiline && { minHeight: 90, textAlignVertical: 'top' }, props.style]} /></View>;
}

export function PrimaryButton({ label, onPress, icon, danger, loading, disabled }: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; danger?: boolean; loading?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.primary, danger && { backgroundColor: colors.red }, (disabled || loading) && { opacity: .5 }, pressed && { opacity: .8 }]}>
    {loading ? <ActivityIndicator color="#fff" /> : <>{icon ? <Ionicons name={icon} size={19} color="#fff" /> : null}<Text style={styles.primaryText}>{label}</Text></>}
  </Pressable>;
}

export function SecondaryButton({ label, onPress, icon }: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.secondary, pressed && { opacity: .7 }]}>{icon ? <Ionicons name={icon} size={18} color={colors.blue} /> : null}<Text style={styles.secondaryText}>{label}</Text></Pressable>;
}

export function StatusBadge({ label }: { label: string }) {
  const palette = label === 'Normal' || label === 'Ativo' || label === 'Aprovada' || label === 'Concluída' ? [colors.greenSoft, colors.green]
    : label === 'Estoque baixo' || label === 'Pendente' || label === 'Em análise' || label === 'Aguardando estoque' ? [colors.orangeSoft, '#9A6700']
    : [colors.redSoft, colors.red];
  return <View style={[styles.badge, { backgroundColor: palette[0] }]}><Text style={[styles.badgeText, { color: palette[1] }]}>{label}</Text></View>;
}

export function Metric({ label, value, icon, tone = 'blue' }: { label: string; value: string | number; icon: keyof typeof Ionicons.glyphMap; tone?: 'blue' | 'green' | 'orange' | 'red' }) {
  const toneColor = tone === 'green' ? colors.green : tone === 'orange' ? colors.orange : tone === 'red' ? colors.red : colors.blue;
  return <Card style={styles.metric}><View style={[styles.iconCircle,{ backgroundColor: `${toneColor}18` }]}><Ionicons name={icon} size={20} color={toneColor} /></View><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></Card>;
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return <View style={styles.sectionTitle}><Text style={styles.sectionTitleText}>{children}</Text>{action}</View>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 26 }}><Ionicons name="file-tray-outline" size={30} color={colors.muted} /><Text style={{ fontWeight: '800', color: colors.text }}>{title}</Text><Text style={{ color: colors.muted, textAlign: 'center' }}>{body}</Text></Card>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.md, paddingBottom: 42, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 4 }, title: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: colors.text, letterSpacing: -0.6 }, subtitle: { fontSize: 14, lineHeight: 20, color: colors.muted, marginTop: 3 },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, shadowColor: '#101828', shadowOpacity: .04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  demo: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: colors.orangeSoft, alignItems: 'center' }, demoText: { flex: 1, color: '#7A4E00', fontWeight: '600', fontSize: 13 },
  search: { height: 48, borderRadius: radius.md, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9 }, searchInput: { flex: 1, color: colors.text, fontSize: 15 },
  label: { color: colors.text, fontWeight: '700', fontSize: 13 }, input: { minHeight: 48, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, color: colors.text, fontSize: 15 },
  primary: { minHeight: 50, borderRadius: radius.md, backgroundColor: colors.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 }, primaryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  secondary: { minHeight: 44, borderRadius: radius.md, borderWidth: 1, borderColor: '#C9D8FF', backgroundColor: colors.blueSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 14 }, secondaryText: { color: colors.blue, fontWeight: '800' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill }, badgeText: { fontSize: 11, fontWeight: '800' },
  metric: { minWidth: '47%', flex: 1, gap: 6 }, iconCircle: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, metricLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' }, metricValue: { color: colors.text, fontSize: 20, fontWeight: '900' },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }, sectionTitleText: { fontSize: 18, fontWeight: '800', color: colors.text },
});
