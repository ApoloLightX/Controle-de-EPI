import { Alert, StyleSheet, Text } from 'react-native';
import { Card, PrimaryButton, Screen, SectionTitle } from '@/components/UI';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme';
export default function Settings(){const{session,resetDemo}=useApp();return <Screen><SectionTitle>Aplicativo</SectionTitle><Card><Text style={styles.title}>ATC Controle EPI</Text><Text style={styles.meta}>Persistência local com AsyncStorage. Sem banco remoto ou integrações externas.</Text><Text style={styles.meta}>Perfil atual: {session?.role==='admin'?'Administrador':'Funcionário'}</Text></Card>{session?.role==='admin'?<PrimaryButton label="Restaurar dados demonstrativos" danger icon="refresh" onPress={()=>Alert.alert('Restaurar dados?','Todas as alterações locais serão substituídas pelos dados demonstrativos.',[{text:'Cancelar',style:'cancel'},{text:'Restaurar',style:'destructive',onPress:()=>resetDemo()}])}/>:null}</Screen>}
const styles=StyleSheet.create({title:{fontWeight:'900',fontSize:17,color:colors.text},meta:{color:colors.muted,lineHeight:20,marginTop:5}});
