import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import { Routes } from '@/constants/routes';
// Detail screens
import ServiceDetailScreen from '@/screens/marketplace/ServiceDetailScreen';
import SearchScreen from '@/screens/marketplace/SearchScreen';
import FiltersScreen from '@/screens/marketplace/FiltersScreen';
import CompareScreen from '@/screens/marketplace/CompareScreen';
import FavoritesScreen from '@/screens/marketplace/FavoritesScreen';
import ServiceListScreen from '@/screens/marketplace/ServiceListScreen';
import CategoriesScreen from '@/screens/marketplace/CategoriesScreen';
import VendorProfileScreen from '@/screens/vendors/VendorProfileScreen';
import CompanyProfileScreen from '@/screens/vendors/CompanyProfileScreen';
import VendorDashboardScreen from '@/screens/vendors/VendorDashboardScreen';
import VendorListScreen from '@/screens/vendors/VendorListScreen';
import LeadDetailScreen from '@/screens/leads/LeadDetailScreen';
import ChatRoomScreen from '@/screens/chat/ChatRoomScreen';
import NotificationsScreen from '@/screens/notifications/NotificationsScreen';
import PlansScreen from '@/screens/billing/PlansScreen';
import CreditsScreen from '@/screens/billing/CreditsScreen';
import PurchaseHistoryScreen from '@/screens/billing/PurchaseHistoryScreen';
import CheckoutScreen from '@/screens/billing/CheckoutScreen';
import AnalyticsScreen from '@/screens/analytics/AnalyticsScreen';
import SupportTicketsScreen from '@/screens/support/SupportTicketsScreen';
import TicketDetailScreen from '@/screens/support/TicketDetailScreen';
import FAQScreen from '@/screens/support/FAQScreen';
import KnowledgeBaseScreen from '@/screens/support/KnowledgeBaseScreen';
import LiveChatScreen from '@/screens/support/LiveChatScreen';
import EditProfileScreen from '@/screens/profile/EditProfileScreen';
import KYCScreen from '@/screens/profile/KYCScreen';
import SettingsScreen from '@/screens/profile/SettingsScreen';
import NotificationSettingsScreen from '@/screens/profile/NotificationSettingsScreen';
import PrivacySettingsScreen from '@/screens/profile/PrivacySettingsScreen';
import ChangePasswordScreen from '@/screens/profile/ChangePasswordScreen';
import InquiryScreen from '@/screens/marketplace/InquiryScreen';
import BookConsultationScreen from '@/screens/marketplace/BookConsultationScreen';
import AIAssistantScreen from '@/screens/marketplace/AIAssistantScreen';
import AdminDashboardScreen from '@/screens/admin/AdminDashboardScreen';
import UserManagementScreen from '@/screens/admin/UserManagementScreen';
import ListingApprovalsScreen from '@/screens/admin/ListingApprovalsScreen';
import CategoryManagementScreen from '@/screens/admin/CategoryManagementScreen';
import PaymentsScreen from '@/screens/admin/PaymentsScreen';
import PlansManagementScreen from '@/screens/admin/PlansManagementScreen';
import ReportsScreen from '@/screens/admin/ReportsScreen';
import FormBuilderScreen from '@/screens/admin/FormBuilderScreen';
import AnnouncementsScreen from '@/screens/admin/AnnouncementsScreen';
import VendorApprovalsScreen from '@/screens/admin/VendorApprovalsScreen';
import VendorApprovalDetailScreen from '@/screens/admin/VendorApprovalDetailScreen';
const Stack = createNativeStackNavigator();
export default function AppStack() {
    return (<Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={Routes.MainTabs} component={MainTabs}/>

      {/* Marketplace */}
      <Stack.Screen name={Routes.Categories} component={CategoriesScreen}/>
      <Stack.Screen name={Routes.ServiceList} component={ServiceListScreen}/>
      <Stack.Screen name={Routes.ServiceDetail} component={ServiceDetailScreen}/>
      <Stack.Screen name={Routes.Search} component={SearchScreen}/>
      <Stack.Screen name={Routes.Filters} component={FiltersScreen} options={{ presentation: 'modal' }}/>
      <Stack.Screen name={Routes.Compare} component={CompareScreen}/>
      <Stack.Screen name={Routes.Favorites} component={FavoritesScreen}/>
      <Stack.Screen name={Routes.Inquiry} component={InquiryScreen} options={{ presentation: 'modal' }}/>
      <Stack.Screen name={Routes.BookConsultation} component={BookConsultationScreen} options={{ presentation: 'modal' }}/>
      <Stack.Screen name={Routes.AIAssistant} component={AIAssistantScreen}/>

      {/* Vendors */}
      <Stack.Screen name={Routes.VendorList} component={VendorListScreen}/>
      <Stack.Screen name={Routes.VendorProfile} component={VendorProfileScreen}/>
      <Stack.Screen name={Routes.CompanyProfile} component={CompanyProfileScreen}/>
      <Stack.Screen name={Routes.VendorDashboard} component={VendorDashboardScreen}/>

      {/* Leads & Chat */}
      <Stack.Screen name={Routes.LeadDetail} component={LeadDetailScreen}/>
      <Stack.Screen name={Routes.ChatRoom} component={ChatRoomScreen}/>
      <Stack.Screen name={Routes.Notifications} component={NotificationsScreen}/>

      {/* Billing */}
      <Stack.Screen name={Routes.Plans} component={PlansScreen}/>
      <Stack.Screen name={Routes.Credits} component={CreditsScreen}/>
      <Stack.Screen name={Routes.PurchaseHistory} component={PurchaseHistoryScreen}/>
      <Stack.Screen name={Routes.Checkout} component={CheckoutScreen} options={{ presentation: 'modal' }}/>

      {/* Analytics */}
      <Stack.Screen name={Routes.Analytics} component={AnalyticsScreen}/>

      {/* Support */}
      <Stack.Screen name={Routes.SupportTickets} component={SupportTicketsScreen}/>
      <Stack.Screen name={Routes.TicketDetail} component={TicketDetailScreen}/>
      <Stack.Screen name={Routes.FAQ} component={FAQScreen}/>
      <Stack.Screen name={Routes.KnowledgeBase} component={KnowledgeBaseScreen}/>
      <Stack.Screen name={Routes.LiveChat} component={LiveChatScreen}/>

      {/* Profile */}
      <Stack.Screen name={Routes.EditProfile} component={EditProfileScreen}/>
      <Stack.Screen name={Routes.KYC} component={KYCScreen}/>
      <Stack.Screen name={Routes.Settings} component={SettingsScreen}/>
      <Stack.Screen name={Routes.NotificationSettings} component={NotificationSettingsScreen}/>
      <Stack.Screen name={Routes.PrivacySettings} component={PrivacySettingsScreen}/>
      <Stack.Screen name={Routes.ChangePassword} component={ChangePasswordScreen}/>

      {/* Admin */}
      <Stack.Screen name={Routes.AdminDashboard} component={AdminDashboardScreen}/>
      <Stack.Screen name={Routes.AdminVendorApprovals} component={VendorApprovalsScreen}/>
      <Stack.Screen name={Routes.AdminUsers} component={UserManagementScreen}/>
      <Stack.Screen name={Routes.AdminListings} component={ListingApprovalsScreen}/>
      <Stack.Screen name={Routes.AdminCategories} component={CategoryManagementScreen}/>
      <Stack.Screen name={Routes.AdminPlans} component={PlansManagementScreen}/>
      <Stack.Screen name={Routes.AdminPayments} component={PaymentsScreen}/>
      <Stack.Screen name={Routes.AdminReports} component={ReportsScreen}/>
      <Stack.Screen name={Routes.AdminFormBuilder} component={FormBuilderScreen}/>
      <Stack.Screen name={Routes.AdminAnnouncements} component={AnnouncementsScreen}/>
      <Stack.Screen name={Routes.AdminVendorApprovalDetail} component={VendorApprovalDetailScreen}/>
 
    </Stack.Navigator>);
}
