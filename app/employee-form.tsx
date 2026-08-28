import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Field, PrimaryButton, Screen } from '@/components/UI';
import { useApp } from '@/context/AppContext';
import { EmployeeStatus } from '@/models';

export default function EmployeeForm() {
  const { id } = useLocalSearchParams<{id?:string}>();
  const { data, session, addEmployee, updateEmployee } = useApp();
  const existing = data.employees.find(e=>e.id===id);
  const [name,setName]=useState(''); const [registration,setRegistration]=useState(''); const [sector,setSector]=useState(''); const [jobTitle,setJobTitle]=useState(''); const [email,setEmail]=useState(''); const [phone,setPhone]=useState(''); const [admissionDate,setAdmissionDate]=useState('2026-08-28'); const [pin,setPin]=useState('1234'); const [status,setStatus]=useState<EmployeeStatus>('Ativo'); const [saving,setSaving]=useState(false);
  useEffect(()=>{if(existing){setName(existing.name);setRegistration(existing.registration);setSector(existing.sector);setJobTitle(existing.jobTitle);setEmail(existing.email??'');setPhone(existing.phone??'');setAdmissionDate(existing.admissionDate);setPin(existing.pin);setStatus(existing.status);}},[existing]);
  if(session?.role!=='admin') return <Screen><Field label="Acesso" value="Somente administradores podem alterar colaboradores." editable={false}/></Screen>;
  const save=async()=>{if(!name.trim()||!registration.trim()||!sector.trim()||!jobTitle.trim())return Alert.alert('Campos obrigatórios','Preencha nome, matrícula, setor e cargo.');setSaving(true);if(existing) await updateEmployee({...existing,name,registration,sector,jobTitle,email,phone,admissionDate,pin,status}); else await addEmployee({name,registration,sector,jobTitle,email,phone,admissionDate,pin,status});setSaving(false);router.back();};
  return <Screen><View style={{gap:14}}><Field label="Nome" value={name} onChangeText={setName}/><Field label="Matrícula" value={registration} onChangeText={setRegistration} keyboardType="number-pad"/><Field label="Setor" value={sector} onChangeText={setSector}/><Field label="Cargo" value={jobTitle} onChangeText={setJobTitle}/><Field label="Status (Ativo, Inativo ou Afastado)" value={status} onChangeText={v=>setStatus((['Ativo','Inativo','Afastado'].includes(v)?v:'Ativo') as EmployeeStatus)}/><Field label="Admissão (AAAA-MM-DD)" value={admissionDate} onChangeText={setAdmissionDate}/><Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none"/><Field label="Telefone" value={phone} onChangeText={setPhone}/><Field label="PIN do funcionário" value={pin} onChangeText={setPin} keyboardType="number-pad"/><PrimaryButton label={existing?'Salvar alterações':'Cadastrar colaborador'} icon="checkmark" loading={saving} onPress={save}/></View></Screen>;
}
