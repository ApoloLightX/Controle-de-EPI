import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Field, PrimaryButton, Screen, SectionTitle } from '@/components/UI';
import { useApp } from '@/context/AppContext';
import { colors, radius } from '@/theme';
import { calculatePurchaseTotal } from '@/domain/rules';
import type { PurchaseItem } from '@/models';
import { money } from '@/utils/format';

export default function PurchaseScreen() {
  const { data, session, registerPurchase } = useApp();
  const [supplier, setSupplier] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [invoice, setInvoice] = useState('');
  const [epiId, setEpiId] = useState(data.epis[0]?.id ?? '');
  const [quantity, setQuantity] = useState('1');
  const [unitValue, setUnitValue] = useState(String(data.epis[0]?.unitValue ?? 0));
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [documentUri, setDocumentUri] = useState<string | undefined>();
  const [documentName, setDocumentName] = useState('Nenhum documento anexado');
  const [saving, setSaving] = useState(false);

  const total = useMemo(() => {
    try { return calculatePurchaseTotal(items); } catch { return 0; }
  }, [items]);

  if (session?.role !== 'admin') return <Screen><Field label="Acesso" value="Somente administradores registram compras." editable={false} /></Screen>;

  const selectEpi = (id: string) => {
    const epi = data.epis.find(e => e.id === id);
    setEpiId(id);
    setUnitValue(String(epi?.unitValue ?? 0));
    setQuantity('1');
  };

  const addItem = () => {
    const qty = Number(quantity.replace(',', '.'));
    const value = Number(unitValue.replace(',', '.'));
    if (!epiId || !Number.isInteger(qty) || qty <= 0 || !Number.isFinite(value) || value < 0) {
      Alert.alert('Item inválido', 'Selecione o EPI e informe quantidade inteira e valor unitário válido.');
      return;
    }
    setItems(current => {
      const existing = current.find(item => item.epiId === epiId);
      if (existing) return current.map(item => item.epiId === epiId ? { ...item, quantity: item.quantity + qty, unitValue: value } : item);
      return [...current, { epiId, quantity: qty, unitValue: value }];
    });
    setQuantity('1');
  };

  const removeItem = (id: string) => setItems(current => current.filter(item => item.epiId !== id));

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (!result.canceled) {
      setDocumentUri(result.assets[0]?.uri);
      setDocumentName(result.assets[0]?.name ?? 'Documento anexado');
    }
  };

  const save = async () => {
    if (!supplier.trim() || !cnpj.trim() || !invoice.trim() || items.length === 0) {
      Alert.alert('Compra incompleta', 'Preencha fornecedor, CNPJ, nota fiscal e adicione pelo menos um item.');
      return;
    }
    setSaving(true);
    await registerPurchase({ supplier: supplier.trim(), cnpj: cnpj.trim(), invoice: invoice.trim(), items, documentUri });
    setSaving(false);
    const units = items.reduce((sum, item) => sum + item.quantity, 0);
    Alert.alert('Compra registrada', `${items.length} EPI(s), ${units} unidade(s). Total ${money(total)}.`, [{ text: 'OK', onPress: () => router.back() }]);
  };

  return <Screen>
    <Field label="Fornecedor" value={supplier} onChangeText={setSupplier} />
    <Field label="CNPJ" value={cnpj} onChangeText={setCnpj} />
    <Field label="Nota fiscal" value={invoice} onChangeText={setInvoice} />

    <SectionTitle>Adicionar itens</SectionTitle>
    {data.epis.length ? <View style={{ gap: 8 }}>{data.epis.map(e => <Pressable key={e.id} onPress={() => selectEpi(e.id)} style={[styles.choice, epiId === e.id && styles.active]}>
      <View style={{ flex: 1 }}><Text style={[styles.choiceText, epiId === e.id && styles.activeText]}>{e.name}</Text><Text style={styles.meta}>Saldo {e.stock} • atual {money(e.unitValue)}</Text></View>
      {epiId === e.id ? <Ionicons name="checkmark-circle" size={21} color={colors.blue} /> : null}
    </Pressable>)}</View> : <Card><Text style={styles.meta}>Cadastre um EPI antes de registrar uma compra.</Text></Card>}

    <View style={styles.row}><View style={{ flex: 1 }}><Field label="Quantidade" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" /></View><View style={{ flex: 1 }}><Field label="Valor unitário" value={unitValue} onChangeText={setUnitValue} keyboardType="decimal-pad" /></View></View>
    <PrimaryButton label="Adicionar item à nota" icon="add-circle" disabled={!epiId} onPress={addItem} />

    <SectionTitle>Itens da nota</SectionTitle>
    {items.length ? items.map(item => {
      const epi = data.epis.find(e => e.id === item.epiId);
      return <Card key={item.epiId} style={styles.itemCard}>
        <View style={{ flex: 1 }}><Text style={styles.itemTitle}>{epi?.name ?? 'EPI'}</Text><Text style={styles.meta}>{item.quantity} un. × {money(item.unitValue)} = {money(item.quantity * item.unitValue)}</Text></View>
        <Pressable accessibilityLabel={`Remover ${epi?.name ?? 'item'}`} onPress={() => removeItem(item.epiId)} style={styles.remove}><Ionicons name="trash-outline" size={20} color={colors.red} /></Pressable>
      </Card>;
    }) : <Card><Text style={styles.meta}>Nenhum item adicionado ainda.</Text></Card>}

    <Card style={styles.totalCard}><View><Text style={styles.meta}>Total da compra</Text><Text style={styles.total}>{money(total)}</Text></View><Text style={styles.units}>{items.reduce((sum, item) => sum + item.quantity, 0)} unidade(s)</Text></Card>

    <Pressable onPress={pick} style={styles.attach}><Ionicons name="attach" size={20} color={colors.blue} /><View style={{ flex: 1 }}><Text style={styles.attachText}>Anexar NF ou documento</Text><Text style={styles.meta}>{documentName}</Text></View></Pressable>
    <PrimaryButton label="Registrar compra e dar entrada" icon="cart" loading={saving} disabled={items.length === 0} onPress={save} />
  </Screen>;
}

const styles = StyleSheet.create({
  choice: { padding: 13, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 10 },
  active: { borderColor: colors.blue, backgroundColor: '#EAF1FF' }, choiceText: { fontWeight: '800', color: colors.text }, activeText: { color: colors.blue }, meta: { color: colors.muted, fontSize: 12, marginTop: 3, lineHeight: 17 },
  row: { flexDirection: 'row', gap: 10 }, itemCard: { flexDirection: 'row', alignItems: 'center', gap: 10 }, itemTitle: { fontWeight: '900', color: colors.text }, remove: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#FFF1F2', alignItems: 'center', justifyContent: 'center' },
  totalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, total: { fontWeight: '900', fontSize: 22, color: colors.text, marginTop: 3 }, units: { color: colors.green, fontWeight: '900' },
  attach: { padding: 14, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: '#AFC5FF', backgroundColor: '#F5F8FF', flexDirection: 'row', alignItems: 'center', gap: 10 }, attachText: { color: colors.blue, fontWeight: '900' },
});
