import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Header, Screen, SearchField, SecondaryButton, StatusBadge } from '@/components/UI';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme';

export default function PeopleScreen() {
  const { data, session } = useApp();
  const [query, setQuery] = useState('');
  const isAdmin = session?.role === 'admin';
  const q = query.trim().toLowerCase();
  const filtered = data.employees.filter(e => !q || `${e.name} ${e.registration} ${e.sector} ${e.jobTitle} ${e.status}`.toLowerCase().includes(q));

  if (!isAdmin) {
    const me = data.employees.find(e => e.id === session?.employeeId);
    return <Screen safeTop>
      <Header title="Meu perfil" subtitle="Seus dados operacionais e acesso à ficha individual." />
      {me ? <Card style={{ gap: 14 }}>
        <View style={styles.personRow}><View style={styles.avatar}><Text style={styles.avatarText}>{me.avatarInitials}</Text></View><View style={{flex:1}}><Text style={styles.name}>{me.name}</Text><Text style={styles.meta}>{me.registration} • {me.sector}</Text><Text style={styles.meta}>{me.jobTitle}</Text></View><StatusBadge label={me.status}/></View>
        <SecondaryButton label="Abrir minha ficha" icon="person-circle" onPress={() => router.push(`/person/${me.id}` as never)} />
      </Card> : null}
    </Screen>;
  }

  return <Screen safeTop>
    <Header title="Pessoas" subtitle={`${data.employees.length} colaboradores cadastrados`} right={<Pressable accessibilityLabel="Cadastrar colaborador" onPress={() => router.push('/employee-form')} style={styles.add}><Ionicons name="add" size={24} color="#fff"/></Pressable>} />
    <SearchField value={query} onChangeText={setQuery} placeholder="Buscar nome, matrícula, setor ou cargo" />
    {filtered.map(emp => <Pressable key={emp.id} onPress={() => router.push(`/person/${emp.id}` as never)}>
      <Card style={styles.personRow}><View style={styles.avatar}><Text style={styles.avatarText}>{emp.avatarInitials}</Text></View><View style={{ flex: 1 }}><Text style={styles.name}>{emp.name}</Text><Text style={styles.meta}>Matrícula {emp.registration} • {emp.sector}</Text><Text style={styles.meta}>{emp.jobTitle}</Text></View><View style={{alignItems:'flex-end',gap:8}}><StatusBadge label={emp.status}/><Ionicons name="chevron-forward" size={18} color={colors.muted}/></View></Card>
    </Pressable>)}
  </Screen>;
}

const styles = StyleSheet.create({ add:{width:42,height:42,borderRadius:14,backgroundColor:colors.blue,alignItems:'center',justifyContent:'center'}, personRow:{flexDirection:'row',alignItems:'center',gap:12}, avatar:{width:48,height:48,borderRadius:16,backgroundColor:'#EAF1FF',alignItems:'center',justifyContent:'center'}, avatarText:{color:colors.blue,fontWeight:'900'}, name:{color:colors.text,fontWeight:'900',fontSize:16}, meta:{color:colors.muted,fontSize:12,marginTop:2} });
