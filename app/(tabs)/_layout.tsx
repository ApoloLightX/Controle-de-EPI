import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme';

export default function TabsLayout() {
  const { session } = useApp();
  const employee = session?.role === 'employee';
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.blue, tabBarInactiveTintColor: '#7A8491', tabBarStyle: { height: 68, paddingTop: 7, paddingBottom: 8, borderTopColor: colors.border, backgroundColor: '#fff' }, tabBarLabelStyle: { fontSize: 11, fontWeight: '700' } }}>
    <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }} />
    <Tabs.Screen name="pessoas" options={{ title: employee ? 'Meu perfil' : 'Pessoas', tabBarIcon: ({ color, size }) => <Ionicons name={employee ? 'person-circle' : 'people'} color={color} size={size} /> }} />
    <Tabs.Screen name="estoque" options={{ title: employee ? 'Meus EPIs' : 'Estoque', tabBarIcon: ({ color, size }) => <Ionicons name={employee ? 'shield-checkmark' : 'cube'} color={color} size={size} /> }} />
    <Tabs.Screen name="trocas" options={{ title: 'Trocas', tabBarIcon: ({ color, size }) => <Ionicons name="swap-horizontal" color={color} size={size} /> }} />
    <Tabs.Screen name="mais" options={{ title: 'Mais', tabBarIcon: ({ color, size }) => <Ionicons name="ellipsis-horizontal" color={color} size={size} /> }} />
  </Tabs>;
}
