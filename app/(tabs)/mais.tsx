import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, DemoBanner, Header, Screen } from '@/components/UI';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme';

const rows=[
  {label:'EPIs',icon:'shield-checkmark-outline' as const,route:'/(tabs)/estoque'},
  {label:'Compras',icon:'cart-outline' as const,route:'/purchases',admin:true},
  {label:'Relatórios',icon:'bar-chart-outline' as const,route:'/reports',admin:true},
  {label:'Alertas',icon:'notifications-outline' as const,route:'/alerts'},
  {label:'Configurações',icon:'settings-outline' as const,route:'/settings'}
];
export default function MoreScreen(){const{session,logout}=useApp();const isAdmin=session?.role==='admin';return <Screen safeTop><Header title="Mais" subtitle={isAdmin?'Ferramentas administrativas e configurações.':'Acesso pessoal e configurações.'}/><DemoBanner/><Card style={{padding:0,overflow:'hidden'}}>{rows.filter(r=>!r.admin||isAdmin).map((r,i)=><Pressable key={r.label} onPress={()=>router.push(r.route as never)} style={[styles.row,i>0&&styles.border]}><View style={styles.icon}><Ionicons name={r.icon} size={20} color={colors.blue}/></View><Text style={styles.label}>{r.label}</Text><Ionicons name="chevron-forward" size={18} color={colors.muted}/></Pressable>)}</Card><Pressable onPress={async()=>{await logout();router.replace('/login')}} style={styles.logout}><Ionicons name="log-out-outline" size={20} color={colors.red}/><Text style={styles.logoutText}>Sair da conta</Text></Pressable></Screen>}
const styles=StyleSheet.create({row:{minHeight:58,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:12},border:{borderTopWidth:1,borderTopColor:colors.border},icon:{width:34,height:34,borderRadius:11,backgroundColor:'#EAF1FF',alignItems:'center',justifyContent:'center'},label:{flex:1,color:colors.text,fontWeight:'800'},logout:{minHeight:50,borderRadius:14,borderWidth:1,borderColor:'#F3C5C7',backgroundColor:'#FDECEC',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},logoutText:{color:colors.red,fontWeight:'900'}});
