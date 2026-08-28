import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme';

export default function Index() {
  const { ready, session } = useApp();
  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator size="large" color={colors.blue} /></View>;
  return <Redirect href={session ? '/(tabs)' : '/login'} />;
}
