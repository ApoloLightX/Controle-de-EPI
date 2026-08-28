import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, PrimaryButton, Screen, SectionTitle, SecondaryButton, StatusBadge } from '@/components/UI';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme';
import { money, shortDate } from '@/utils/format';

export default function PersonDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, session, deleteEmployee } = useApp();
  const employee = data.employees.find(e => e.id === id);
  const isAdmin = session?.role === 'admin';
  if (!employee) return <Screen><EmptyState title="Colaborador não encontrado" body="A ficha pode ter sido excluída."/></Screen>;
  if (!isAdmin && session?.employeeId !== employee.id) return <Screen><EmptyState title="Acesso limitado" body="Funcionários podem consultar apenas a própria ficha."/></Screen>;

  const deliveries = data.deliveries.filter(d => d.employeeId === employee.id);
  const episInUse = Array.from(new Set(deliveries.map(d => d.epiId))).map(epiId => data.epis.find(e => e.id === epiId)).filter(Boolean);
  const cost = deliveries.reduce((sum,d) => sum + (data.epis.find(e=>e.id===d.epiId)?.unitValue ?? 0) * d.quantity, 0);
  const remove = () => Alert.alert('Excluir colaborador', `Excluir ${employee.name}?`, [{text:'Cancelar',style:'cancel'},{text:'Excluir',style:'destructive',onPress:async()=>{await deleteEmployee(employee.id);router.back();}}]);

  return <Screen>
    <Card style={{ gap: 14 }}>
      <View style={styles.top}><View style={styles.avatar}><Text style={styles.avatarText}>{employee.avatarInitials}</Text></View><View style={{flex:1}}><Text style={styles.name}>{employee.name}</Text><Text style={styles.meta}>Matrícula: {employee.registration}</Text><Text style={styles.meta}>{employee.sector} • {employee.jobTitle}</Text></View><StatusBadge label={employee.status}/></View>
      <View style={styles.infoGrid}><Info label="Admissão" value={shortDate(employee.admissionDate)}/><Info label="E-mail" value={employee.email ?? 'Não informado'}/><Info label="Telefone" value={employee.phone ?? 'Não informado'}/><Info label="Custo acumulado" value={money(cost)}/></View>
      {isAdmin ? <View style={styles.actions}><SecondaryButton label="Editar" icon="create-outline" onPress={()=>router.push({pathname:'/employee-form',params:{id:employee.id}})}/><Pressable onPress={remove} style={styles.delete}><Ionicons name="trash-outline" size={18} color={colors.red}/><Text style={styles.deleteText}>Excluir</Text></Pressable></View>:null}
    </Card>

    <SectionTitle>EPIs em uso</SectionTitle>
    {episInUse.length ? episInUse.map(epi => epi ? <Card key={epi.id}><Text style={styles.itemTitle}>{epi.name}</Text><Text style={styles.meta}>{epi.brand} {epi.model} • CA {epi.ca} • Tam. {epi.size}</Text></Card> : null) : <EmptyState title="Nenhum EPI registrado" body="As entregas aparecerão aqui."/>}

    <SectionTitle>Histórico de entregas</SectionTitle>
    {deliveries.map(d=>{const epi=data.epis.find(e=>e.id===d.epiId);return <Card key={d.id}><Text style={styles.itemTitle}>{epi?.name ?? 'EPI'}</Text><Text style={styles.meta}>{d.quantity} un. • {shortDate(d.deliveredAt)} • {d.reason}</Text></Card>})}

    {isAdmin ? <PrimaryButton label="Entregar EPI" icon="log-out-outline" onPress={()=>router.push({pathname:'/delivery/new',params:{employeeId:employee.id}})}/> : null}
    <PrimaryButton label="Solicitar troca" icon="swap-horizontal" onPress={()=>router.push({pathname:'/swap/new',params:{employeeId:employee.id}})}/>
  </Screen>;
}

function Info({label,value}:{label:string;value:string}){return <View style={{width:'48%',gap:3}}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>}
const styles = StyleSheet.create({top:{flexDirection:'row',alignItems:'center',gap:12},avatar:{width:64,height:64,borderRadius:20,backgroundColor:'#EAF1FF',alignItems:'center',justifyContent:'center'},avatarText:{fontSize:20,fontWeight:'900',color:colors.blue},name:{fontSize:20,fontWeight:'900',color:colors.text},meta:{color:colors.muted,fontSize:12,lineHeight:17},infoGrid:{flexDirection:'row',flexWrap:'wrap',gap:12},infoLabel:{fontSize:11,color:colors.muted,fontWeight:'700'},infoValue:{fontSize:13,color:colors.text,fontWeight:'700'},actions:{flexDirection:'row',gap:10},delete:{flex:1,minHeight:44,flexDirection:'row',gap:6,alignItems:'center',justifyContent:'center',borderRadius:14,borderWidth:1,borderColor:'#F3C5C7',backgroundColor:'#FDECEC'},deleteText:{color:colors.red,fontWeight:'800'},itemTitle:{color:colors.text,fontWeight:'900'}});
