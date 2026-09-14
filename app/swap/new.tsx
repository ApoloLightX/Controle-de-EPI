import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, Field, PrimaryButton, Screen, SectionTitle } from '@/components/UI';
import { useApp } from '@/context/AppContext';
import { colors, radius } from '@/theme';
import { persistPickedFile } from '@/utils/files';

const reasons = ['Desgaste', 'Dano', 'Extravio', 'Tamanho incorreto', 'Vencimento'];

export default function SwapNew() {
  const params = useLocalSearchParams<{ employeeId?: string }>();
  const { data, session, createSwap } = useApp();
  const isAdmin = session?.role === 'admin';
  const fixedEmployee = session?.role === 'employee' ? session.employeeId : params.employeeId;
  const [employeeId, setEmployeeId] = useState(fixedEmployee ?? data.employees.find(e => e.status === 'Ativo')?.id ?? '');
  const [epiId, setEpiId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('Desgaste');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [photoName, setPhotoName] = useState('Sem foto');
  const [saving, setSaving] = useState(false);

  const eligibleEpis = useMemo(() => {
    const deliveredIds = new Set(data.deliveries.filter(d => d.employeeId === employeeId).map(d => d.epiId));
    return data.epis.filter(epi => deliveredIds.has(epi.id));
  }, [data.deliveries, data.epis, employeeId]);

  if (!session) return <Screen><EmptyState title="Sessão necessária" body="Entre novamente para solicitar uma troca." /></Screen>;

  const chooseEmployee = (id: string) => {
    setEmployeeId(id);
    setEpiId('');
  };

  const pick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.uri) return;
      const persistedUri = await persistPickedFile(asset.uri, asset.name ?? 'foto.jpg', 'troca');
      setPhotoUri(persistedUri);
      setPhotoName(asset.name ?? 'Foto anexada');
    } catch {
      Alert.alert('Falha no anexo', 'Não foi possível salvar a foto selecionada.');
    }
  };

  const save = async () => {
    const qty = Number(quantity);
    if (!employeeId || !epiId || !reason.trim() || !description.trim() || !Number.isInteger(qty) || qty <= 0) {
      Alert.alert('Solicitação incompleta', 'Informe EPI, quantidade, motivo e descrição.');
      return;
    }
    if (!eligibleEpis.some(epi => epi.id === epiId)) {
      Alert.alert('EPI inválido', 'Selecione um EPI que já tenha sido entregue a este colaborador.');
      return;
    }
    setSaving(true);
    const ok = await createSwap({ employeeId, epiId, quantity: qty, reason, description: description.trim(), photoUri });
    setSaving(false);
    if (!ok) return Alert.alert('Não foi possível criar a troca', 'Confira a sessão, o colaborador e o histórico do EPI.');
    Alert.alert('Solicitação criada', 'A troca foi registrada como Pendente.', [{ text: 'OK', onPress: () => router.back() }]);
  };

  return <Screen>
    {isAdmin ? <><SectionTitle>Colaborador</SectionTitle><View style={{ gap: 8 }}>{data.employees.filter(e => e.status === 'Ativo').map(e => <Pressable accessibilityRole="radio" accessibilityState={{ checked: employeeId === e.id }} key={e.id} onPress={() => chooseEmployee(e.id)} style={[styles.choice, employeeId === e.id && styles.active]}><View style={{ flex: 1 }}><Text style={[styles.choiceText, employeeId === e.id && styles.activeText]}>{e.name}</Text><Text style={styles.meta}>{e.registration} • {e.sector}</Text></View>{employeeId === e.id ? <Ionicons name="checkmark-circle" size={20} color={colors.blue} /> : null}</Pressable>)}</View></> : null}

    <SectionTitle>EPI para troca</SectionTitle>
    {eligibleEpis.length ? <View style={{ gap: 8 }}>{eligibleEpis.map(e => <Pressable accessibilityRole="radio" accessibilityState={{ checked: epiId === e.id }} key={e.id} onPress={() => setEpiId(e.id)} style={[styles.choice, epiId === e.id && styles.active]}><View style={{ flex: 1 }}><Text style={[styles.choiceText, epiId === e.id && styles.activeText]}>{e.name}</Text><Text style={styles.meta}>CA {e.ca} • saldo para reposição {e.stock}</Text></View>{epiId === e.id ? <Ionicons name="checkmark-circle" size={20} color={colors.blue} /> : null}</Pressable>)}</View> : <EmptyState title="Sem EPI elegível" body="Este colaborador ainda não possui EPI entregue no histórico para solicitar troca." />}

    <Field label="Quantidade" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
    <SectionTitle>Motivo</SectionTitle>
    <View style={styles.reasonWrap}>{reasons.map(item => <Pressable accessibilityRole="radio" accessibilityState={{ checked: reason === item }} key={item} onPress={() => setReason(item)} style={[styles.reason, reason === item && styles.reasonActive]}><Text style={[styles.reasonText, reason === item && styles.reasonTextActive]}>{item}</Text></Pressable>)}</View>
    <Field label="Descrição do problema" value={description} onChangeText={setDescription} multiline placeholder="Ex.: luva rasgada na palma durante operação..." />

    <Pressable accessibilityRole="button" onPress={pick} style={styles.photo}><Ionicons name="camera-outline" size={21} color="#9A6700" /><View style={{ flex: 1 }}><Text style={styles.photoTitle}>Adicionar foto opcional</Text><Text style={styles.meta}>{photoName}</Text></View></Pressable>
    <Card style={{ gap: 5 }}><Text style={styles.noteTitle}>Como funciona</Text><Text style={styles.meta}>O gestor analisa a solicitação. Se houver saldo, pode aprovar e concluir. Sem saldo, a troca fica aguardando estoque e é liberada automaticamente após uma compra suficiente.</Text></Card>
    <PrimaryButton label="Criar solicitação" icon="swap-horizontal" loading={saving} disabled={!epiId} onPress={save} />
  </Screen>;
}

const styles = StyleSheet.create({
  choice: { padding: 13, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 8 }, active: { borderColor: colors.blue, backgroundColor: '#EAF1FF' }, choiceText: { fontWeight: '800', color: colors.text }, activeText: { color: colors.blue }, meta: { color: colors.muted, fontSize: 12, marginTop: 3, lineHeight: 17 },
  reasonWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, reason: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' }, reasonActive: { borderColor: colors.blue, backgroundColor: '#EAF1FF' }, reasonText: { color: colors.text, fontWeight: '700', fontSize: 12 }, reasonTextActive: { color: colors.blue },
  photo: { padding: 14, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: '#F3C279', backgroundColor: '#FFF9EE', flexDirection: 'row', alignItems: 'center', gap: 10 }, photoTitle: { color: '#9A6700', fontWeight: '900' }, noteTitle: { fontWeight: '900', color: colors.text },
});
