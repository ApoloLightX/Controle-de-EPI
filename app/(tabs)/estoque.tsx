import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, Header, Screen, SearchField, StatusBadge } from '@/components/UI';
import { useApp } from '@/context/AppContext';
import { getStockStatus } from '@/domain/rules';
import { colors, radius } from '@/theme';
import { money, shortDate } from '@/utils/format';

type FilterStatus = 'Todos' | 'Normal' | 'Estoque baixo' | 'Sem estoque';
type Criticality = 'Todos' | 'Crítico' | 'Atenção' | 'Regular';

function getCriticality(stock: number, minStock: number): Exclude<Criticality, 'Todos'> {
  if (stock <= 0) return 'Crítico';
  if (stock <= minStock) return 'Atenção';
  return 'Regular';
}

export default function StockScreen() {
  const { data, session } = useApp();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<FilterStatus>('Todos');
  const [criticality, setCriticality] = useState<Criticality>('Todos');
  const categories = ['Todas', ...Array.from(new Set(data.epis.map(e => e.category)))];
  const [category, setCategory] = useState('Todas');
  const isAdmin = session?.role === 'admin';
  const q = query.trim().toLowerCase();
  const filtered = data.epis.filter(epi => {
    const okQ = !q || `${epi.name} ${epi.category} ${epi.brand} ${epi.model} ${epi.ca} ${epi.supplier}`.toLowerCase().includes(q);
    const okStatus = status === 'Todos' || getStockStatus(epi) === status;
    const okCriticality = criticality === 'Todos' || getCriticality(epi.stock, epi.minStock) === criticality;
    const okCategory = category === 'Todas' || epi.category === category;
    return okQ && okStatus && okCriticality && okCategory;
  });

  if (!isAdmin) {
    const deliveries = data.deliveries.filter(d => d.employeeId === session?.employeeId);
    const byEpi = Array.from(new Set(deliveries.map(d => d.epiId))).map(epiId => ({
      epi: data.epis.find(e => e.id === epiId),
      qty: deliveries.filter(d => d.epiId === epiId).reduce((s, d) => s + d.quantity, 0),
    })).filter(x => x.epi);
    return <Screen safeTop>
      <Header title="Meus EPIs" subtitle="Equipamentos registrados no seu histórico de entrega." />
      {byEpi.length ? byEpi.map(({ epi, qty }) => epi ? <Card key={epi.id} style={{ gap: 8 }}>
        <View style={styles.top}><View style={{ flex: 1 }}><Text style={styles.name}>{epi.name}</Text><Text style={styles.meta}>{epi.brand} {epi.model} • Tam. {epi.size}</Text></View><View style={styles.qty}><Text style={styles.qtyText}>{qty}</Text></View></View>
        <Text style={styles.meta}>CA {epi.ca} • validade {shortDate(epi.caValidity)}</Text>
      </Card> : null) : <EmptyState title="Nenhum EPI recebido" body="Suas entregas aparecerão aqui." />}
    </Screen>;
  }

  const cycleStatus = () => setStatus(s => s === 'Todos' ? 'Normal' : s === 'Normal' ? 'Estoque baixo' : s === 'Estoque baixo' ? 'Sem estoque' : 'Todos');
  const cycleCriticality = () => setCriticality(s => s === 'Todos' ? 'Crítico' : s === 'Crítico' ? 'Atenção' : s === 'Atenção' ? 'Regular' : 'Todos');
  const cycleCategory = () => setCategory(current => {
    const index = categories.indexOf(current);
    return categories[(index + 1) % categories.length] ?? 'Todas';
  });

  return <Screen safeTop>
    <Header title="Estoque" subtitle={`${data.epis.length} EPIs cadastrados`} right={<Pressable accessibilityLabel="Cadastrar EPI" onPress={() => router.push('/epi/new')} style={styles.add}><Ionicons name="add" size={24} color="#fff" /></Pressable>} />
    <SearchField value={query} onChangeText={setQuery} placeholder="Buscar EPI, marca, CA ou fornecedor" />
    <View style={styles.filters}>
      <FilterPill label={`Categoria: ${category}`} onPress={cycleCategory} />
      <FilterPill label={`Status: ${status}`} onPress={cycleStatus} />
      <FilterPill label={`Criticidade: ${criticality}`} onPress={cycleCriticality} />
    </View>
    {filtered.length ? filtered.map(epi => <Card key={epi.id} style={{ gap: 10 }}>
      <View style={styles.top}><View style={{ flex: 1 }}><Text style={styles.name}>{epi.name}</Text><Text style={styles.meta}>{epi.category} • {epi.brand} {epi.model} • Tam. {epi.size}</Text></View><StatusBadge label={getStockStatus(epi)} /></View>
      <View style={styles.line}><Text style={styles.stock}>Estoque {epi.stock}</Text><Text style={styles.meta}>Mínimo {epi.minStock}</Text><Text style={styles.meta}>Criticidade {getCriticality(epi.stock, epi.minStock)}</Text></View>
      <Text style={styles.meta}>CA {epi.ca} • validade {shortDate(epi.caValidity)} • última compra {shortDate(epi.lastPurchase)}</Text>
      <Text style={styles.meta}>{money(epi.unitValue)} • {epi.supplier}</Text>
    </Card>) : <EmptyState title="Nenhum item encontrado" body="Ajuste os filtros ou a busca para ver outros EPIs." />}
  </Screen>;
}

function FilterPill({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.filter, pressed && { opacity: .7 }]}><Ionicons name="filter" size={16} color={colors.blue} /><Text style={styles.filterText} numberOfLines={1}>{label}</Text><Ionicons name="chevron-down" size={15} color={colors.blue} /></Pressable>;
}

const styles = StyleSheet.create({
  add: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { fontWeight: '900', color: colors.text, fontSize: 16 },
  meta: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  line: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, alignItems: 'center' }, stock: { fontWeight: '900', color: colors.text },
  filters: { gap: 8 },
  filter: { minHeight: 40, paddingHorizontal: 13, borderRadius: radius.pill, backgroundColor: '#EAF1FF', flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', maxWidth: '100%' },
  filterText: { fontWeight: '800', color: colors.blue, fontSize: 13, flexShrink: 1 },
  qty: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#E8F5EF', alignItems: 'center', justifyContent: 'center' }, qtyText: { fontWeight: '900', color: colors.green }
});
