import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, Field, PrimaryButton, Screen, SectionTitle, StatusBadge } from '@/components/UI';
import { useApp } from '@/context/AppContext';
import { daysUntil, getCaAlertLevel, getStockStatus } from '@/domain/rules';
import { colors } from '@/theme';
import { money, shortDate } from '@/utils/format';

export default function EpiEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, session, updateEpi, deleteEpi } = useApp();
  const epi = data.epis.find(item => item.id === id);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(epi?.name ?? '');
  const [category, setCategory] = useState(epi?.category ?? '');
  const [brand, setBrand] = useState(epi?.brand ?? '');
  const [model, setModel] = useState(epi?.model ?? '');
  const [size, setSize] = useState(epi?.size ?? '');
  const [ca, setCa] = useState(epi?.ca ?? '');
  const [caValidity, setCaValidity] = useState(epi?.caValidity ?? '');
  const [minStock, setMinStock] = useState(String(epi?.minStock ?? 0));
  const [unitValue, setUnitValue] = useState(String(epi?.unitValue ?? 0));
  const [supplier, setSupplier] = useState(epi?.supplier ?? '');

  if (session?.role !== 'admin') return <Screen><EmptyState title="Acesso limitado" body="Somente administradores podem editar EPIs." /></Screen>;
  if (!epi) return <Screen><EmptyState title="EPI não encontrado" body="Este cadastro não existe mais." /></Screen>;

  const deliveries = data.deliveries.filter(item => item.epiId === epi.id);
  const swaps = data.swaps.filter(item => item.epiId === epi.id);
  const purchases = data.purchases.filter(p => p.items.some(item => item.epiId === epi.id));
  const deliveredQty = deliveries.reduce((sum, item) => sum + item.quantity, 0);
  const purchasedQty = purchases.reduce((sum, purchase) => sum + purchase.items.filter(item => item.epiId === epi.id).reduce((sub, item) => sub + item.quantity, 0), 0);
  const caLevel = getCaAlertLevel(epi.caValidity);
  const caDays = daysUntil(epi.caValidity);

  const save = async () => {
    if (!name.trim() || !category.trim() || !brand.trim() || !ca.trim() || !supplier.trim()) return Alert.alert('Campos obrigatórios', 'Preencha nome, categoria, marca, CA e fornecedor.');
    const minimum = Number(minStock.replace(',', '.'));
    const value = Number(unitValue.replace(',', '.'));
    if (!Number.isInteger(minimum) || minimum < 0 || !Number.isFinite(value) || value < 0) return Alert.alert('Valores inválidos', 'Confira estoque mínimo e valor unitário.');
    if (Number.isNaN(new Date(`${caValidity}T12:00:00`).getTime())) return Alert.alert('Data inválida', 'Use a validade do CA no formato AAAA-MM-DD.');
    setSaving(true);
    await updateEpi({ ...epi, name: name.trim(), category: category.trim(), brand: brand.trim(), model: model.trim(), size: size.trim(), ca: ca.trim(), caValidity, minStock: minimum, unitValue: value, supplier: supplier.trim() });
    setSaving(false);
    Alert.alert('EPI atualizado', 'As alterações foram salvas neste dispositivo.');
  };

  const remove = () => Alert.alert('Excluir EPI?', 'EPIs com histórico não podem ser excluídos.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: async () => {
      const ok = await deleteEpi(epi.id);
      if (!ok) return Alert.alert('Exclusão bloqueada', 'Há entregas, trocas, compras ou movimentos vinculados a este EPI.');
      router.back();
    } },
  ]);

  return <Screen>
    <View style={styles.heading}><View style={styles.icon}><Ionicons name="shield-checkmark" size={24} color={colors.blue} /></View><View style={{ flex: 1 }}><Text style={styles.title}>{epi.name}</Text><Text style={styles.meta}>{epi.category} • CA {epi.ca}</Text></View><StatusBadge label={getStockStatus(epi)} /></View>
    <View style={styles.metrics}><Card style={styles.metric}><Text style={styles.metricLabel}>Estoque</Text><Text style={styles.metricValue}>{epi.stock}</Text></Card><Card style={styles.metric}><Text style={styles.metricLabel}>Entregues</Text><Text style={styles.metricValue}>{deliveredQty}</Text></Card><Card style={styles.metric}><Text style={styles.metricLabel}>Comprados</Text><Text style={styles.metricValue}>{purchasedQty}</Text></Card><Card style={styles.metric}><Text style={styles.metricLabel}>Trocas</Text><Text style={styles.metricValue}>{swaps.length}</Text></Card></View>
    <Card style={{ gap: 8 }}><View style={styles.statusLine}><Text style={styles.cardTitle}>Certificado de Aprovação</Text><StatusBadge label={caLevel} /></View><Text style={styles.meta}>CA {epi.ca} • validade {shortDate(epi.caValidity)}</Text><Text style={styles.meta}>{Number.isFinite(caDays) ? caDays < 0 ? `Vencido há ${Math.abs(caDays)} dia(s)` : `${caDays} dia(s) restantes` : 'Validade inválida'}</Text></Card>
    <SectionTitle>Editar cadastro</SectionTitle>
    <Field label="Nome do EPI" value={name} onChangeText={setName} /><Field label="Categoria" value={category} onChangeText={setCategory} /><Field label="Marca" value={brand} onChangeText={setBrand} /><Field label="Modelo" value={model} onChangeText={setModel} /><Field label="Tamanho" value={size} onChangeText={setSize} /><Field label="CA" value={ca} onChangeText={setCa} keyboardType="number-pad" /><Field label="Validade do CA (AAAA-MM-DD)" value={caValidity} onChangeText={setCaValidity} /><Field label="Estoque atual" value={String(epi.stock)} editable={false} /><Text style={styles.helper}>O estoque é alterado por compras, entregas e trocas para manter o histórico íntegro.</Text><Field label="Estoque mínimo" value={minStock} onChangeText={setMinStock} keyboardType="number-pad" /><Field label="Valor unitário" value={unitValue} onChangeText={setUnitValue} keyboardType="decimal-pad" /><Field label="Fornecedor" value={supplier} onChangeText={setSupplier} /><PrimaryButton label="Salvar alterações" icon="save" loading={saving} onPress={save} />
    <SectionTitle>Histórico</SectionTitle><Card style={{ gap: 7 }}><Text style={styles.cardTitle}>Última compra</Text><Text style={styles.meta}>{shortDate(epi.lastPurchase)} • {money(epi.unitValue)} por unidade • {epi.supplier}</Text><Text style={styles.meta}>{deliveries.length} entrega(s) • {purchases.length} compra(s) • {swaps.length} solicitação(ões) de troca</Text></Card>
    <PrimaryButton label="Excluir EPI" icon="trash" danger onPress={remove} />
  </Screen>;
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 }, icon: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#EAF1FF', alignItems: 'center', justifyContent: 'center' }, title: { color: colors.text, fontWeight: '900', fontSize: 20 }, meta: { color: colors.muted, fontSize: 12, lineHeight: 18 }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, metric: { minWidth: '47%', flex: 1, gap: 3 }, metricLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' }, metricValue: { color: colors.text, fontSize: 22, fontWeight: '900' }, statusLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, cardTitle: { color: colors.text, fontWeight: '900' }, helper: { color: colors.muted, fontSize: 12, marginTop: -8, lineHeight: 17 },
});
