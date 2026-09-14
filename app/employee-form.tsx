import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Field, PrimaryButton, Screen, SectionTitle } from '@/components/UI';
import { useApp } from '@/context/AppContext';
import { isValidIsoDate, isValidPin } from '@/domain/rules';
import type { EmployeeStatus } from '@/models';
import { colors, radius } from '@/theme';
import { nowDate } from '@/utils/format';

const statuses: EmployeeStatus[] = ['Ativo', 'Inativo', 'Afastado'];

export default function EmployeeForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, session, addEmployee, updateEmployee } = useApp();
  const existing = data.employees.find(employee => employee.id === id);
  const [name, setName] = useState('');
  const [registration, setRegistration] = useState('');
  const [sector, setSector] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [admissionDate, setAdmissionDate] = useState(nowDate());
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<EmployeeStatus>('Ativo');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setRegistration(existing.registration);
    setSector(existing.sector);
    setJobTitle(existing.jobTitle);
    setEmail(existing.email ?? '');
    setPhone(existing.phone ?? '');
    setAdmissionDate(existing.admissionDate);
    setPin(existing.pin);
    setStatus(existing.status);
  }, [existing]);

  if (session?.role !== 'admin') {
    return <Screen><Field label="Acesso" value="Somente administradores podem alterar colaboradores." editable={false} /></Screen>;
  }

  const save = async () => {
    const normalizedRegistration = registration.trim();
    if (!name.trim() || !normalizedRegistration || !sector.trim() || !jobTitle.trim()) {
      return Alert.alert('Campos obrigatórios', 'Preencha nome, matrícula, setor e cargo.');
    }
    if (data.employees.some(employee => employee.id !== existing?.id && employee.registration === normalizedRegistration)) {
      return Alert.alert('Matrícula já cadastrada', 'Use uma matrícula única para evitar conflito no login do funcionário.');
    }
    if (!isValidIsoDate(admissionDate.trim())) {
      return Alert.alert('Data inválida', 'Use a admissão no formato AAAA-MM-DD.');
    }
    if (!isValidPin(pin.trim())) {
      return Alert.alert('PIN inválido', 'Use de 4 a 8 dígitos numéricos.');
    }

    setSaving(true);
    const ok = existing
      ? await updateEmployee({ ...existing, name, registration, sector, jobTitle, email, phone, admissionDate, pin, status })
      : await addEmployee({ name, registration, sector, jobTitle, email, phone, admissionDate, pin, status });
    setSaving(false);

    if (!ok) return Alert.alert('Não foi possível salvar', 'Revise os dados e tente novamente.');
    router.back();
  };

  return <Screen>
    <View style={{ gap: 14 }}>
      <Field label="Nome" value={name} onChangeText={setName} />
      <Field label="Matrícula" value={registration} onChangeText={setRegistration} keyboardType="number-pad" />
      <Field label="Setor" value={sector} onChangeText={setSector} />
      <Field label="Cargo" value={jobTitle} onChangeText={setJobTitle} />
      <SectionTitle>Status</SectionTitle>
      <View style={styles.statusRow} accessibilityRole="radiogroup">
        {statuses.map(item => <Pressable
          key={item}
          accessibilityRole="radio"
          accessibilityState={{ checked: status === item }}
          onPress={() => setStatus(item)}
          style={[styles.statusOption, status === item && styles.statusActive]}
        >
          <Text style={[styles.statusText, status === item && styles.statusTextActive]}>{item}</Text>
        </Pressable>)}
      </View>
      <Field label="Admissão (AAAA-MM-DD)" value={admissionDate} onChangeText={setAdmissionDate} />
      <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Field label="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Field label="PIN do funcionário" value={pin} onChangeText={setPin} keyboardType="number-pad" secureTextEntry maxLength={8} />
      <PrimaryButton label={existing ? 'Salvar alterações' : 'Cadastrar colaborador'} icon="checkmark" loading={saving} onPress={save} />
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', gap: 8 },
  statusOption: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', paddingHorizontal: 8 },
  statusActive: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  statusText: { color: colors.muted, fontWeight: '800', fontSize: 12 },
  statusTextActive: { color: colors.blue },
});
