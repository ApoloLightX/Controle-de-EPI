import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, Header, Screen } from '@/components/UI';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme';
import { money, shortDate } from '@/utils/format';

export default function PurchasesScreen() {
  const { data, session } = useApp();
  if (session?.role !== 'admin') return <Screen><EmptyState title="Acesso limitado" body="Compras são visíveis apenas para administradores." /></Screen>;
  return <Screen>
    <Header title="Compras" subtitle={`${data.purchases.length} compras registradas`} right={<Pressable accessibilityLabel="Registrar compra" onPress={() => router.push('/purchase/new')} style={styles.add}><Ionicons name="add" size={24} color="#fff" /></Pressable>} />
    {data.purchases.length ? data.purchases.map(purchase => <Card key={purchase.id} style={{ gap: 8 }}>
      <View style={styles.top}><View style={{ flex: 1 }}><Text style={styles.title}>{purchase.supplier}</Text><Text style={styles.meta}>{purchase.cnpj} • NF {purchase.invoice}</Text></View><Text style={styles.total}>{money(purchase.total)}</Text></View>
      <Text style={styles.meta}>{shortDate(purchase.purchasedAt)} • {purchase.items.length} item(ns) • {purchase.documentUri ? 'documento anexado' : 'sem anexo'}</Text>
      {purchase.items.map((item, index) => <Text key={`${purchase.id}-${index}`} style={styles.item}>{data.epis.find(e => e.id === item.epiId)?.name ?? 'EPI'} • {item.quantity} un. × {money(item.unitValue)}</Text>)}
    </Card>) : <EmptyState title="Nenhuma compra" body="Registre a primeira compra para gerar entradas de estoque." />}
  </Screen>;
}

const styles = StyleSheet.create({ add: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' }, top: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' }, title: { color: colors.text, fontWeight: '900', fontSize: 16 }, total: { color: colors.green, fontWeight: '900' }, meta: { color: colors.muted, fontSize: 12, lineHeight: 17 }, item: { color: colors.text, fontSize: 12, fontWeight: '700' } });
