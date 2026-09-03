import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, Field, Header, Screen, SecondaryButton, StatusBadge } from '@/components/UI';
import { useApp } from '@/context/AppContext';
import type { SwapStatus } from '@/models';
import { colors } from '@/theme';
import { shortDate } from '@/utils/format';

const filters: Array<'Todas' | SwapStatus> = ['Todas', 'Pendente', 'Em análise', 'Aprovada', 'Aguardando estoque', 'Concluída', 'Reprovada'];

export default function SwapsScreen() {
  const { data, session, setSwapStatus } = useApp();
  const isAdmin = session?.role === 'admin';
  const [filter, setFilter] = useState<'Todas' | SwapStatus>('Todas');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const allSwaps = useMemo(() => (isAdmin ? data.swaps : data.swaps.filter(s => s.employeeId === session?.employeeId))
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [data.swaps, isAdmin, session?.employeeId]);
  const swaps = filter === 'Todas' ? allSwaps : allSwaps.filter(s => s.status === filter);
  const pending = allSwaps.filter(s => ['Pendente', 'Em análise'].includes(s.status)).length;
  const waiting = allSwaps.filter(s => s.status === 'Aguardando estoque').length;

  const act = async (id: string, action: 'approve' | 'reject' | 'analysis' | 'complete') => {
    const note = notes[id]?.trim();
    if (action === 'reject' && !note) {
      Alert.alert('Informe o motivo', 'Para reprovar uma troca, registre o motivo na observação do gestor.');
      return;
    }
    const ok = await setSwapStatus(id, action, note);
    if (!ok) {
      Alert.alert('Ação indisponível', action === 'complete'
        ? 'Não há estoque suficiente para concluir a quantidade solicitada, ou a troca ainda não foi aprovada.'
        : 'Não foi possível atualizar esta solicitação.');
      return;
    }
    setNotes(current => ({ ...current, [id]: '' }));
  };

  return <Screen safeTop>
    <Header title="Trocas" subtitle={isAdmin ? `${pending} em análise • ${waiting} aguardando estoque` : 'Acompanhe suas solicitações de troca.'} right={<Pressable onPress={() => router.push('/swap/new')} style={styles.add}><Ionicons name="add" size={17} color={colors.blue} /><Text style={styles.addText}>Nova</Text></Pressable>} />

    <View style={styles.filters}>{filters.map(item => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}</View>

    {swaps.length ? swaps.map(s => {
      const emp = data.employees.find(e => e.id === s.employeeId);
      const epi = data.epis.find(e => e.id === s.epiId);
      const quantity = s.quantity ?? 1;
      const active = !['Concluída', 'Reprovada'].includes(s.status);
      return <Card key={s.id} style={{ gap: 10 }}>
        <View style={styles.top}><View style={{ flex: 1 }}><Text style={styles.title}>{epi?.name ?? 'EPI'}</Text><Text style={styles.meta}>{emp?.name ?? 'Colaborador'} • {shortDate(s.createdAt)}</Text></View><StatusBadge label={s.status} /></View>
        <View style={styles.infoRow}><View style={styles.info}><Text style={styles.infoLabel}>Quantidade</Text><Text style={styles.infoValue}>{quantity}</Text></View><View style={styles.info}><Text style={styles.infoLabel}>Saldo atual</Text><Text style={styles.infoValue}>{epi?.stock ?? 0}</Text></View><View style={styles.info}><Text style={styles.infoLabel}>Motivo</Text><Text style={styles.infoValueSmall}>{s.reason}</Text></View></View>
        <Text style={styles.description}>{s.description}</Text>
        {s.photoUri ? <View style={styles.tag}><Ionicons name="image" size={15} color={colors.blue} /><Text style={styles.tagText}>Foto anexada</Text></View> : null}
        {s.adminNote ? <View style={styles.note}><Text style={styles.noteTitle}>Observação do gestor</Text><Text style={styles.noteText}>{s.adminNote}</Text></View> : null}
        {s.rejectionReason ? <View style={styles.rejectNote}><Text style={styles.rejectTitle}>Motivo da reprovação</Text><Text style={styles.noteText}>{s.rejectionReason}</Text></View> : null}
        {s.resolvedAt ? <Text style={styles.meta}>Encerrada em {shortDate(s.resolvedAt)}</Text> : null}

        {isAdmin && active ? <>
          <Field label="Observação do gestor" value={notes[s.id] ?? ''} onChangeText={value => setNotes(current => ({ ...current, [s.id]: value }))} placeholder="Opcional; obrigatória para reprovar" multiline />
          <View style={styles.actions}>
            {s.status === 'Pendente' ? <SecondaryButton label="Analisar" icon="search" onPress={() => act(s.id, 'analysis')} /> : null}
            {['Pendente', 'Em análise'].includes(s.status) ? <SecondaryButton label="Aprovar" icon="checkmark-circle" onPress={() => act(s.id, 'approve')} /> : null}
            {['Aprovada', 'Aguardando estoque'].includes(s.status) ? <SecondaryButton label={s.status === 'Aguardando estoque' ? 'Tentar concluir' : 'Concluir troca'} icon="checkmark-done" onPress={() => act(s.id, 'complete')} /> : null}
            <SecondaryButton label="Reprovar" icon="close-circle" danger onPress={() => act(s.id, 'reject')} />
          </View>
        </> : null}
      </Card>;
    }) : <EmptyState title="Nenhuma troca" body={filter === 'Todas' ? 'As solicitações aparecerão aqui.' : `Nenhuma solicitação com status ${filter}.`} />}
  </Screen>;
}

const styles = StyleSheet.create({
  add: { backgroundColor: '#EAF1FF', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }, addText: { color: colors.blue, fontWeight: '900' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, filter: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border }, filterActive: { backgroundColor: '#EAF1FF', borderColor: colors.blue }, filterText: { color: colors.muted, fontSize: 11, fontWeight: '800' }, filterTextActive: { color: colors.blue },
  top: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' }, title: { fontWeight: '900', fontSize: 16, color: colors.text }, meta: { color: colors.muted, fontSize: 12, lineHeight: 17 }, description: { color: colors.text, lineHeight: 20 },
  infoRow: { flexDirection: 'row', gap: 7 }, info: { flex: 1, backgroundColor: '#F7F8FA', borderRadius: 11, padding: 9, minHeight: 58 }, infoLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' }, infoValue: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 2 }, infoValueSmall: { color: colors.text, fontSize: 11, fontWeight: '900', marginTop: 4 },
  tag: { alignSelf: 'flex-start', flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: '#EAF1FF', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 }, tagText: { color: colors.blue, fontWeight: '800', fontSize: 11 },
  note: { backgroundColor: '#F5F8FF', borderRadius: 11, padding: 11 }, rejectNote: { backgroundColor: '#FFF1F2', borderRadius: 11, padding: 11 }, noteTitle: { color: colors.blue, fontWeight: '900', fontSize: 12 }, rejectTitle: { color: colors.red, fontWeight: '900', fontSize: 12 }, noteText: { color: colors.text, fontSize: 12, lineHeight: 18, marginTop: 3 }, actions: { gap: 8 },
});
