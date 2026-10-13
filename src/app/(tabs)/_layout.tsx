import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/navigation/FloatingTabBar';
import { colors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Bóveda' }} />
      <Tabs.Screen name="files" options={{ title: 'Archivos' }} />
      <Tabs.Screen name="time" options={{ title: 'Tiempo' }} />
    </Tabs>
  );
}
