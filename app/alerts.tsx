import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, Header, Screen, SectionTitle, StatusBadge } from '@/components/UI';
import { useApp } from '@/context/AppContext';
import { daysUntil, getCaAlertLevel, getStockStatus } from '@/domain/rules';
import { colors } from '@/theme';
import { shortDate } from '@/utils/format';

export default function Alerts() {
  const { data, session } = useApp();
  const isAdmin = session?.role === 'admin';
  const ruptures = isAdmin ? data.epis.filter(e => getStockStatus(e) === 'Sem estoque') : [];
  const lowStock = isAdmin ? data.epis.filter(e => getStockStatus(e) === 'Estoque baixo') : [];
  const caExpired = isAdmin ? data.epis.filter(e => getCaAlertLevel(e.caValidity) === 'Vencido') : [];
  const caCritical = isAdmin ? data.epis.filter(e => getCaAlertLevel(e.caValidity) === 'Crítico') : [];
  const caAttention = isAdmin ? data.epis.filter(e => getCaAlertLevel(e.caValidity) === 'Atenção') : [];
  const swaps = (isAdmin ? data.swaps : data.swaps.filter(s => s.employeeId === session?.employeeId)).filter(s => !['Concluída', 'Reprovada'].includes(s.status));
  const waiting = swaps.filter(s => s.status === 'Aguardando estoque');
  const totalAdminAlerts = ruptures.length + lowStock.length + caExpired.length + caCritical.length + caAttention.length + swaps.length;

  return <Screen>
    <Header title="Alertas" subtitle={isAdmin ? `${totalAdminAlerts} ponto(s) para acompanhar` : `${swaps.length} solicitação(ões) em andamento`} />

    {isAdmin ? <>
      <View style={styles.summary}>
        <Summary icon="alert-circle" label="Rupturas" value={ruptures.length} tone="red" />
        <Summary icon="trending-down" label="Estoque baixo" value={lowStock.length} tone="orange" />
        <Summary icon="calendar" label="CA crítico" value={caExpired.length + caCritical.length} tone="red" />
        <Summary icon="hourglass" label="Trocas sem saldo" value={waiting.length} tone="orange" />
      </View>

      <SectionTitle>Ruptura de estoque</SectionTitle>
      {ruptures.length ? ruptures.map(e => <AlertCard key={e.id} title={e.name} meta={`Saldo ${e.stock} • mínimo ${e.minStock}`} status="Sem estoque" detail="Reposição necessária antes de novas entregas ou conclusões de troca." />) : <EmptyState title="Sem ruptura" body="Nenhum EPI está zerado." />}

      <SectionTitle>Estoque abaixo do mínimo</SectionTitle>
      {lowStock.length ? lowStock.map(e => <AlertCard key={e.id} title={e.name} meta={`Saldo ${e.stock} • mínimo ${e.minStock}`} status="Estoque baixo" detail={`Faltam ${Math.max(0, e.minStock + 1 - e.stock)} unidade(s) para voltar ao nível normal.`} />) : <EmptyState title="Níveis mínimos atendidos" body="Nenhum item está abaixo ou igual ao mínimo." />}

      <SectionTitle>CA vencido</SectionTitle>
      {caExpired.length ? caExpired.map(e => <AlertCard key={e.id} title={e.name} meta={`CA ${e.ca} • validade ${shortDate(e.caValidity)}`} status="Vencido" detail={`Vencido há ${Math.abs(daysUntil(e.caValidity))} dia(s). Revisar cadastro e uso imediatamente.`} />) : <EmptyState title="Nenhum CA vencido" body="Os certificados cadastrados estão dentro da validade." />}

      <SectionTitle>CA em até 30 dias</SectionTitle>
      {caCritical.length ? caCritical.map(e => <AlertCard key={e.id} title={e.name} meta={`CA ${e.ca} • validade ${shortDate(e.caValidity)}`} status="Crítico" detail={`${daysUntil(e.caValidity)} dia(s) restantes.`} />) : <EmptyState title="Sem vencimento crítico" body="Nenhum CA vence nos próximos 30 dias." />}

      <SectionTitle>CA em até 90 dias</SectionTitle>
      {caAttention.length ? caAttention.map(e => <AlertCard key={e.id} title={e.name} meta={`CA ${e.ca} • validade ${shortDate(e.caValidity)}`} status="Atenção" detail={`${daysUntil(e.caValidity)} dia(s) restantes.`} />) : <EmptyState title="Sem CA em atenção" body="Nenhum CA vence entre 31 e 90 dias." />}
    </> : null}

    <SectionTitle>Trocas em andamento</SectionTitle>
    {swaps.length ? swaps.map(s => {
      const epi = data.epis.find(e => e.id === s.epiId);
      const employee = data.employees.find(e => e.id === s.employeeId);
      return <Card key={s.id} style={{ gap: 7 }}><View style={styles.cardTop}><View style={{ flex: 1 }}><Text style={styles.title}>{epi?.name ?? 'EPI'}</Text><Text style={styles.meta}>{isAdmin ? `${employee?.name ?? 'Colaborador'} • ` : ''}{s.reason} • {s.quantity ?? 1} un.</Text></View><StatusBadge label={s.status} /></View>{s.status === 'Aguardando estoque' ? <Text style={styles.warning}>Saldo atual {epi?.stock ?? 0}. A solicitação será liberada automaticamente após reposição suficiente.</Text> : null}</Card>;
    }) : <EmptyState title="Sem trocas pendentes" body="Nenhuma ação necessária agora." />}
  </Screen>;
}

function Summary({ icon, label, value, tone }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number; tone: 'red' | 'orange' }) {
  const color = tone === 'red' ? colors.red : colors.orange;
  return <Card style={styles.summaryCard}><Ionicons name={icon} size={19} color={color} /><Text style={styles.summaryLabel}>{label}</Text><Text style={[styles.summaryValue, { color }]}>{value}</Text></Card>;
}

function AlertCard({ title, meta, status, detail }: { title: string; meta: string; status: string; detail: string }) {
  return <Card style={{ gap: 7 }}><View style={styles.cardTop}><View style={{ flex: 1 }}><Text style={styles.title}>{title}</Text><Text style={styles.meta}>{meta}</Text></View><StatusBadge label={status} /></View><Text style={styles.detail}>{detail}</Text></Card>;
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, summaryCard: { minWidth: '47%', flex: 1, gap: 4 }, summaryLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' }, summaryValue: { fontSize: 22, fontWeight: '900' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, title: { fontWeight: '900', color: colors.text, marginBottom: 3 }, meta: { color: colors.muted, fontSize: 12, lineHeight: 17 }, detail: { color: colors.text, fontSize: 12, lineHeight: 18 }, warning: { color: '#9A6700', backgroundColor: '#FFF9EE', borderRadius: 10, padding: 10, fontSize: 12, lineHeight: 18 },
});
