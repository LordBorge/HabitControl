import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Chrome as Home, History, Info, PhoneIncoming as HomeIcon } from 'lucide-react-native';
import { HabitProvider } from '@/contexts/HabitContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { Platform, TextInput } from 'react-native';
import { useHabits } from '@/contexts/HabitContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { StatusBar } from 'expo-status-bar';

export default function TabLayout() {
  useFrameworkReady();
  const { theme } = useTheme();
  const { deleteHabit } = useHabits();

  const handleDeleteHabit = (habitId: string) => {
    deleteHabit(habitId);
  };

  return (
    <ProfileProvider>
      <HabitProvider>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: theme.colors.card,
              borderTopColor: theme.colors.border,
              height: Platform.OS === 'ios' ? 85 : 65,
              paddingBottom: Platform.OS === 'ios' ? 25 : 10,
              paddingTop: 4,
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
            },
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.inactive,
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
              marginTop: 0,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Início',
              tabBarIcon: ({ color, size }) => (
                <HomeIcon size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="historico"
            options={{
              title: 'Histórico',
              tabBarIcon: ({ color, size }) => (
                <History size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="informacoes"
            options={{
              title: 'Informações',
              tabBarIcon: ({ color, size }) => (
                <Info size={size} color={color} />
              ),
            }}
          />
        </Tabs>
      </HabitProvider>
    </ProfileProvider>
  );
}