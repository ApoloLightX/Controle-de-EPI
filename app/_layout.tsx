import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '@/context/AppContext';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerShadowVisible: false, headerTintColor: colors.text, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="person/[id]" options={{ title: 'Ficha do colaborador' }} />
        <Stack.Screen name="employee-form" options={{ title: 'Colaborador' }} />
        <Stack.Screen name="epi/new" options={{ title: 'Cadastrar EPI' }} />
        <Stack.Screen name="delivery/new" options={{ title: 'Registrar entrega' }} />
        <Stack.Screen name="purchases" options={{ title: 'Compras' }} />
        <Stack.Screen name="purchase/new" options={{ title: 'Registrar compra' }} />
        <Stack.Screen name="swap/new" options={{ title: 'Solicitar troca' }} />
        <Stack.Screen name="reports" options={{ title: 'Relatórios' }} />
        <Stack.Screen name="alerts" options={{ title: 'Alertas' }} />
        <Stack.Screen name="settings" options={{ title: 'Configurações' }} />
      </Stack>
    </AppProvider>
  );
}
