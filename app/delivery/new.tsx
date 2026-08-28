import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Field, PrimaryButton, Screen, SectionTitle } from '@/components/UI';
import { useApp } from '@/context/AppContext';
import { colors, radius } from '@/theme';

export default function DeliveryScreen(){
  const params=useLocalSearchParams<{employeeId?:string}>(); const {data,session,registerDelivery}=useApp();
  const [employeeId,setEmployeeId]=useState(params.employeeId??data.employees.find(e=>e.status==='Ativo')?.id??''); const [epiId,setEpiId]=useState(data.epis.find(e=>e.stock>0)?.id??''); const [quantity,setQuantity]=useState('1'); const [reason,setReason]=useState('Entrega operacional'); const [saving,setSaving]=useState(false);
  const employee=data.employees.find(e=>e.id===employeeId); const epi=data.epis.find(e=>e.id===epiId); const qty=Number(quantity);
  const valid=!!employee&&!!epi&&Number.isInteger(qty)&&qty>0&&epi.stock>=qty&&!!reason.trim();
  if(session?.role!=='admin') return <Screen><Field label="Acesso" value="Somente administradores registram entregas." editable={false}/></Screen>;
  const save=async()=>{if(!valid)return Alert.alert('Entrega inválida','Selecione colaborador e EPI, informe quantidade válida e confira a disponibilidade.');setSaving(true);const ok=await registerDelivery(employeeId,epiId,qty,reason);setSaving(false);if(!ok)return Alert.alert('Estoque insuficiente','O saldo mudou ou não há quantidade suficiente.');Alert.alert('Entrega registrada','O estoque foi reduzido e o histórico do colaborador foi atualizado.',[{text:'OK',onPress:()=>router.back()}]);};
  return <Screen><SectionTitle>Colaborador</SectionTitle><View style={styles.choices}>{data.employees.filter(e=>e.status==='Ativo').map(e=><Pressable key={e.id} onPress={()=>setEmployeeId(e.id)} style={[styles.choice,employeeId===e.id&&styles.active]}><Text style={[styles.choiceText,employeeId===e.id&&styles.activeText]}>{e.name}</Text><Text style={styles.meta}>{e.registration} • {e.sector}</Text></Pressable>)}</View><SectionTitle>EPI</SectionTitle><View style={styles.choices}>{data.epis.map(e=><Pressable key={e.id} onPress={()=>setEpiId(e.id)} style={[styles.choice,epiId===e.id&&styles.active]}><Text style={[styles.choiceText,epiId===e.id&&styles.activeText]}>{e.name}</Text><Text style={styles.meta}>Saldo {e.stock} • CA {e.ca}</Text></Pressable>)}</View><Card><Text style={styles.summary}>Selecionado: {employee?.name??'—'} • {epi?.name??'—'}</Text><Text style={styles.meta}>Saldo atual: {epi?.stock??0}</Text></Card><Field label="Quantidade" value={quantity} onChangeText={setQuantity} keyboardType="number-pad"/><Field label="Motivo" value={reason} onChangeText={setReason}/><PrimaryButton label="Registrar entrega" icon="checkmark" loading={saving} disabled={!valid} onPress={save}/></Screen>;
}
const styles=StyleSheet.create({choices:{gap:8},choice:{padding:13,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:'#fff'},active:{borderColor:colors.blue,backgroundColor:'#EAF1FF'},choiceText:{fontWeight:'800',color:colors.text},activeText:{color:colors.blue},meta:{color:colors.muted,fontSize:12,marginTop:3},summary:{fontWeight:'900',color:colors.text}});
