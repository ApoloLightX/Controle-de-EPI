import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, DemoBanner, Header, Metric, PrimaryButton, Screen, SearchField, SectionTitle, StatusBadge } from '@/components/UI';
import { useApp } from '@/context/AppContext';
import { getStockStatus } from '@/domain/rules';
import { colors, radius } from '@/theme';
import { money, shortDate } from '@/utils/format';
import { exportConsolidatedPdf } from '@/utils/report';

function Shortcut({ icon, label, onPress, tone = colors.blue }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; tone?: string }) {
  return <Pressable onPress={onPress} style={({pressed}) => [styles.shortcut, pressed && { opacity: .65 }]}><View style={[styles.shortcutIcon,{ backgroundColor: `${tone}16` }]}><Ionicons name={icon} size={22} color={tone} /></View><Text style={styles.shortcutText}>{label}</Text></Pressable>;
}

export default function HomeScreen() {
  const { data, session } = useApp();
  const [query, setQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  const isAdmin = session?.role === 'admin';
  const me = session?.employeeId ? data.employees.find(e => e.id === session.employeeId) : undefined;
  const myDeliveries = me ? data.deliveries.filter(d => d.employeeId === me.id) : [];
  const mySwaps = me ? data.swaps.filter(s => s.employeeId === me.id) : [];
  const active = data.employees.filter(e => e.status === 'Ativo').length;
  const balance = data.epis.reduce((sum, epi) => sum + epi.stock, 0);
  const attention = data.epis.filter(e => getStockStatus(e) !== 'Normal');
  const spend = data.purchases.reduce((sum, p) => sum + p.total, 0);
  const pending = data.swaps.filter(s => ['Pendente','Em análise','Aguardando estoque'].includes(s.status));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const people = isAdmin ? data.employees.filter(e => `${e.name} ${e.registration} ${e.sector}`.toLowerCase().includes(q)).slice(0,3).map(e => ({ label: e.name, meta: `${e.registration} • ${e.sector}`, action: () => router.push(`/person/${e.id}` as never) })) : [];
    const epis = data.epis.filter(e => `${e.name} ${e.category} ${e.brand} ${e.ca}`.toLowerCase().includes(q)).slice(0,3).map(e => ({ label: e.name, meta: `${e.brand} • CA ${e.ca}`, action: () => router.push('/(tabs)/estoque') }));
    return [...people, ...epis];
  }, [query, data, isAdmin]);

  const exportPdf = async () => {
    setExporting(true);
    try { await exportConsolidatedPdf(data); }
    catch { Alert.alert('Não foi possível exportar', 'Tente novamente. Em Android/iOS o arquivo é gerado localmente e aberto no compartilhamento do sistema.'); }
    finally { setExporting(false); }
  };

  if (!isAdmin) {
    return <Screen safeTop>
      <Header title="Controle EPI" subtitle={`Olá, ${me?.name.split(' ')[0] ?? 'colaborador'}. Consulte seus EPIs e solicite trocas.`} />
      <DemoBanner />
      <View style={styles.metrics}><Metric label="EPIs recebidos" value={myDeliveries.reduce((s,d)=>s+d.quantity,0)} icon="shield-checkmark" /><Metric label="Trocas abertas" value={mySwaps.filter(s=>!['Concluída','Reprovada'].includes(s.status)).length} icon="swap-horizontal" tone="orange" /></View>
      <SectionTitle>Ações</SectionTitle>
      <View style={styles.shortcuts}><Shortcut icon="swap-horizontal" label="Solicitar troca" onPress={() => router.push('/swap/new')} tone={colors.orange} /><Shortcut icon="person-circle" label="Minha ficha" onPress={() => me && router.push(`/person/${me.id}` as never)} /><Shortcut icon="shield-checkmark" label="Meus EPIs" onPress={() => router.push('/(tabs)/estoque')} tone={colors.green} /><Shortcut icon="notifications" label="Alertas" onPress={() => router.push('/alerts')} tone={colors.red} /></View>
      <SectionTitle>Últimas entregas</SectionTitle>
      {myDeliveries.slice(0,4).map(delivery => { const epi = data.epis.find(e=>e.id===delivery.epiId); return <Card key={delivery.id}><Text style={styles.rowTitle}>{epi?.name ?? 'EPI'}</Text><Text style={styles.rowMeta}>{delivery.quantity} un. • {shortDate(delivery.deliveredAt)} • {delivery.reason}</Text></Card>; })}
    </Screen>;
  }

  return <Screen safeTop>
    <Header title="Controle EPI" subtitle="Bom trabalho. Aqui está o panorama operacional de hoje." />
    <DemoBanner />
    <SearchField value={query} onChangeText={setQuery} placeholder="Buscar pessoas, EPI, CA, setor..." />
    {results.length > 0 ? <Card style={{ gap: 10 }}>{results.map((r,i)=><Pressable key={`${r.label}-${i}`} onPress={r.action} style={styles.searchResult}><Ionicons name="search" size={16} color={colors.blue}/><View style={{flex:1}}><Text style={styles.rowTitle}>{r.label}</Text><Text style={styles.rowMeta}>{r.meta}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.muted}/></Pressable>)}</Card> : null}
    <View style={styles.metrics}><Metric label="Colaboradores ativos" value={active} icon="people" /><Metric label="EPIs cadastrados" value={data.epis.length} icon="shield-checkmark" tone="green" /><Metric label="Saldo disponível" value={balance} icon="cube" tone="green" /><Metric label="Estoque em atenção" value={attention.length} icon="warning" tone="orange" /></View>
    <SectionTitle>Ações rápidas</SectionTitle>
    <View style={styles.shortcuts}><Shortcut icon="add-circle" label="Cadastrar EPI" onPress={() => router.push('/epi/new')} /><Shortcut icon="log-out-outline" label="Registrar entrega" onPress={() => router.push('/delivery/new')} tone={colors.green} /><Shortcut icon="cart" label="Registrar compra" onPress={() => router.push('/purchase/new')} tone={colors.orange} /><Shortcut icon="bar-chart" label="Relatórios" onPress={() => router.push('/reports')} /></View>
    <SectionTitle>Indicadores</SectionTitle>
    <View style={styles.metrics}><Metric label="Solicitações de troca" value={pending.length} icon="swap-horizontal" tone="orange" /><Metric label="Gastos com EPI" value={money(spend)} icon="cash" tone="green" /><Metric label="Alertas de estoque" value={attention.length} icon="alert-circle" tone="red" /><Metric label="Trocas recentes" value={data.swaps.filter(s=>new Date(s.createdAt)>=new Date('2026-08-21')).length} icon="time" /></View>
    <SectionTitle>Estoque em atenção</SectionTitle>
    {attention.slice(0,4).map(epi => <Card key={epi.id} style={styles.alertCard}><View style={{flex:1}}><Text style={styles.rowTitle}>{epi.name}</Text><Text style={styles.rowMeta}>Atual {epi.stock} • mínimo {epi.minStock} • CA {epi.ca}</Text></View><StatusBadge label={getStockStatus(epi)} /></Card>)}
    <PrimaryButton label="Exportar PDF" icon="document-text" loading={exporting} onPress={exportPdf} />
  </Screen>;
}

const styles = StyleSheet.create({ metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, shortcut: { width: '48%', minHeight: 104, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, justifyContent: 'space-between' }, shortcutIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, shortcutText: { color: colors.text, fontWeight: '800', lineHeight: 18 }, rowTitle: { color: colors.text, fontWeight: '800', fontSize: 15 }, rowMeta: { color: colors.muted, marginTop: 3, fontSize: 12, lineHeight: 17 }, alertCard: { flexDirection: 'row', gap: 12, alignItems: 'center' }, searchResult: { flexDirection:'row', alignItems:'center', gap:10, paddingVertical:4, minHeight:44 } });
