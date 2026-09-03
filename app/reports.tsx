import * as FileSystem from 'expo-file-system/legacy';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Card, PrimaryButton, Screen, SectionTitle } from '@/components/UI';
import { useApp } from '@/context/AppContext';
import { exportConsolidatedPdf } from '@/utils/report';
import { shareAsync } from 'expo-sharing';
import { money } from '@/utils/format';
import { getCaAlertLevel, getStockStatus } from '@/domain/rules';
import { colors } from '@/theme';

export default function Reports() {
  const { data, session } = useApp();
  if (session?.role !== 'admin') return <Screen><Card><Text style={{ color: colors.text }}>Relatórios consolidados são restritos ao administrador.</Text></Card></Screen>;

  const shareCsv = async (fileName: string, head: string[], rows: unknown[][]) => {
    const esc = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [head, ...rows].map(row => row.map(esc).join(';')).join('\n');
    const base = FileSystem.cacheDirectory;
    if (!base) throw new Error('Diretório temporário indisponível');
    const uri = `${base}${fileName}`;
    await FileSystem.writeAsStringAsync(uri, '\uFEFF' + csv);
    await shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Compartilhar relatório CSV' });
  };

  const exportStock = () => shareCsv('estoque-atc-controle-epi.csv', ['EPI', 'Categoria', 'Marca', 'Modelo', 'Tamanho', 'CA', 'Validade CA', 'Risco CA', 'Estoque atual', 'Estoque mínimo', 'Status', 'Valor unitário', 'Fornecedor'], data.epis.map(e => [e.name, e.category, e.brand, e.model, e.size, e.ca, e.caValidity, getCaAlertLevel(e.caValidity), e.stock, e.minStock, getStockStatus(e), e.unitValue, e.supplier]));
  const exportDeliveries = () => shareCsv('entregas-atc-controle-epi.csv', ['Data', 'Colaborador', 'Matrícula', 'EPI', 'Quantidade', 'Motivo'], data.deliveries.map(delivery => {
    const employee = data.employees.find(e => e.id === delivery.employeeId);
    const epi = data.epis.find(e => e.id === delivery.epiId);
    return [delivery.deliveredAt, employee?.name ?? '', employee?.registration ?? '', epi?.name ?? '', delivery.quantity, delivery.reason];
  }));
  const exportPurchases = () => shareCsv('compras-atc-controle-epi.csv', ['Data', 'Fornecedor', 'CNPJ', 'NF', 'EPI', 'Quantidade', 'Valor unitário', 'Total da linha'], data.purchases.flatMap(purchase => purchase.items.map(item => {
    const epi = data.epis.find(e => e.id === item.epiId);
    return [purchase.purchasedAt, purchase.supplier, purchase.cnpj, purchase.invoice, epi?.name ?? '', item.quantity, item.unitValue, item.quantity * item.unitValue];
  })));
  const exportSwaps = () => shareCsv('trocas-atc-controle-epi.csv', ['Abertura', 'Encerramento', 'Colaborador', 'Matrícula', 'EPI', 'Quantidade', 'Motivo', 'Descrição', 'Status', 'Observação gestor', 'Motivo reprovação'], data.swaps.map(swap => {
    const employee = data.employees.find(e => e.id === swap.employeeId);
    const epi = data.epis.find(e => e.id === swap.epiId);
    return [swap.createdAt, swap.resolvedAt ?? '', employee?.name ?? '', employee?.registration ?? '', epi?.name ?? '', swap.quantity ?? 1, swap.reason, swap.description, swap.status, swap.adminNote ?? '', swap.rejectionReason ?? ''];
  }));

  const inventoryValue = data.epis.reduce((sum, epi) => sum + epi.stock * epi.unitValue, 0);
  const caRisk = data.epis.filter(epi => getCaAlertLevel(epi.caValidity) !== 'Ok').length;
  const openSwaps = data.swaps.filter(swap => !['Concluída', 'Reprovada'].includes(swap.status)).length;

  return <Screen>
    <SectionTitle>Resumo operacional</SectionTitle>
    <View style={styles.grid}>
      <Card style={styles.metric}><Text style={styles.metricLabel}>Colaboradores ativos</Text><Text style={styles.big}>{data.employees.filter(e => e.status === 'Ativo').length}</Text></Card>
      <Card style={styles.metric}><Text style={styles.metricLabel}>Valor do estoque</Text><Text style={styles.big}>{money(inventoryValue)}</Text></Card>
      <Card style={styles.metric}><Text style={styles.metricLabel}>CA em risco</Text><Text style={styles.big}>{caRisk}</Text></Card>
      <Card style={styles.metric}><Text style={styles.metricLabel}>Trocas abertas</Text><Text style={styles.big}>{openSwaps}</Text></Card>
    </View>
    <Card><Text style={styles.big}>{money(data.purchases.reduce((sum, purchase) => sum + purchase.total, 0))} em compras</Text><Text style={styles.meta}>{data.purchases.length} compra(s) • {data.deliveries.reduce((sum, delivery) => sum + delivery.quantity, 0)} unidade(s) entregues • {data.epis.length} EPIs cadastrados</Text></Card>

    <SectionTitle>PDF gerencial</SectionTitle>
    <Text style={styles.explain}>Inclui indicadores, gráficos de gastos e uso, custo estimado por colaborador, riscos de CA/estoque, trocas abertas e tabelas detalhadas.</Text>
    <PrimaryButton label="Exportar PDF consolidado" icon="document-text" onPress={() => exportConsolidatedPdf(data).catch(() => Alert.alert('Falha na exportação', 'Não foi possível gerar o PDF.'))} />

    <SectionTitle>Planilhas CSV</SectionTitle>
    <PrimaryButton label="Exportar estoque e CA" icon="grid" onPress={() => exportStock().catch(() => Alert.alert('Falha na exportação'))} />
    <PrimaryButton label="Exportar entregas" icon="arrow-redo" onPress={() => exportDeliveries().catch(() => Alert.alert('Falha na exportação'))} />
    <PrimaryButton label="Exportar compras" icon="cart" onPress={() => exportPurchases().catch(() => Alert.alert('Falha na exportação'))} />
    <PrimaryButton label="Exportar trocas" icon="swap-horizontal" onPress={() => exportSwaps().catch(() => Alert.alert('Falha na exportação'))} />
  </Screen>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, metric: { minWidth: '47%', flex: 1 }, metricLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' }, big: { fontWeight: '900', fontSize: 18, color: colors.text, marginTop: 3 }, meta: { color: colors.muted, marginTop: 5, lineHeight: 19 }, explain: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: -8 },
});
