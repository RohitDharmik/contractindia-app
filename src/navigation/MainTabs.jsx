import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Routes } from '@/constants/routes';
import { colors } from '@/constants/colors';
import { useNotificationsStore } from '@/store/notificationsStore';
import DashboardScreen from '@/screens/dashboard/DashboardScreen';
import CategoriesScreen from '@/screens/marketplace/CategoriesScreen';
import LeadInboxScreen from '@/screens/leads/LeadInboxScreen';
import ChatListScreen from '@/screens/chat/ChatListScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
const Tab = createBottomTabNavigator();
export default function MainTabs() {
    const unread = useNotificationsStore((s) => s.items.filter((n) => n.type === 'message' && !n.read).length);
    return (<Tab.Navigator screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 62, paddingBottom: 8, paddingTop: 6 },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            tabBarIcon: ({ color, size }) => {
                const map = {
                    [Routes.HomeTab]: 'home-outline',
                    [Routes.MarketplaceTab]: 'grid-outline',
                    [Routes.LeadsTab]: 'megaphone-outline',
                    // [Routes.ChatTab]: 'chatbubbles-outline',
                    [Routes.ProfileTab]: 'person-outline',
                };
                return <Ionicons name={map[route.name] ?? 'ellipse-outline'} size={size} color={color}/>;
            },
        })}>
      <Tab.Screen name={Routes.HomeTab} component={DashboardScreen} options={{ title: 'Home' }}/>
      <Tab.Screen name={Routes.MarketplaceTab} component={CategoriesScreen} options={{ title: 'Marketplace' }}/>
      <Tab.Screen name={Routes.LeadsTab} component={LeadInboxScreen} options={{ title: 'Leads' }}/>
        {/* <Tab.Screen name={Routes.ChatTab} component={ChatListScreen} options={{ title: 'Chat', tabBarBadge: unread > 0 ? unread : undefined }}/> */}
      <Tab.Screen name={Routes.ProfileTab} component={ProfileScreen} options={{ title: 'Profile' }}/>
    </Tab.Navigator>);
}
