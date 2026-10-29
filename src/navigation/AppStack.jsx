import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "@/store/authStore";
import AppDrawer from "@/components/navigation/AppDrawer";
import { Routes } from "@/constants/routes";
// Detail screens
import ServiceDetailScreen from "@/screens/marketplace/ServiceDetailScreen";
import SearchScreen from "@/screens/marketplace/SearchScreen";
import FiltersScreen from "@/screens/marketplace/FiltersScreen";
import CompareScreen from "@/screens/marketplace/CompareScreen";
import FavoritesScreen from "@/screens/marketplace/FavoritesScreen";
import ServiceListScreen from "@/screens/marketplace/ServiceListScreen";
import CategoriesScreen from "@/screens/marketplace/CategoriesScreen";
import VendorProfileScreen from "@/screens/vendors/VendorProfileScreen";
import CompanyProfileScreen from "@/screens/vendors/CompanyProfileScreen";
import VendorDashboardScreen from "@/screens/vendors/VendorDashboardScreen";
import VendorListScreen from "@/screens/vendors/VendorListScreen";
import LeadInboxScreen from "@/screens/leads/LeadInboxScreen";
import LeadDetailScreen from "@/screens/leads/LeadDetailScreen";
import ChatListScreen from "@/screens/chat/ChatListScreen";
import ChatRoomScreen from "@/screens/chat/ChatRoomScreen";
import NotificationsScreen from "@/screens/notifications/NotificationsScreen";
import PlansScreen from "@/screens/billing/PlansScreen";
import {
  CheckoutScreen,
  CreditsScreen,
  PurchaseHistoryScreen,
} from "@/screens/billing/BillingFeatureScreens";
import AnalyticsScreen from "@/screens/analytics/AnalyticsScreen";
import SupportTicketsScreen from "@/screens/support/SupportTicketsScreen";
import TicketDetailScreen from "@/screens/support/TicketDetailScreen";
import FAQScreen from "@/screens/support/FAQScreen";
import KnowledgeBaseScreen from "@/screens/support/KnowledgeBaseScreen";
import LiveChatScreen from "@/screens/support/LiveChatScreen";
import EditProfileScreen from "@/screens/profile/EditProfileScreen";
import KYCScreen from "@/screens/profile/KYCScreen";
import SettingsScreen from "@/screens/profile/SettingsScreen";
import NotificationSettingsScreen from "@/screens/profile/NotificationSettingsScreen";
import PrivacySettingsScreen from "@/screens/profile/PrivacySettingsScreen";
import ChangePasswordScreen from "@/screens/profile/ChangePasswordScreen";
import ProfileScreen from "@/screens/profile/ProfileScreen";
import AccountRecordsScreen from "@/screens/dashboard/AccountRecordsScreen";
import {
  UserReviewScreen,
  SecurityScreen,
  DocumentSubcategoriesScreen,
} from "@/screens/admin/AdminFeatureScreens";
import {
  CompanyProfileWizardScreen,
  ClientHistoryScreen,
  InvoicesScreen,
} from "@/screens/vendors/CommercialFeatureScreens";
import InquiryScreen from "@/screens/marketplace/InquiryScreen";
import BookConsultationScreen from "@/screens/marketplace/BookConsultationScreen";
import AIAssistantScreen from "@/screens/marketplace/AIAssistantScreen";
import AdminDashboardScreen from "@/screens/admin/AdminDashboardScreen";
import UserManagementScreen from "@/screens/admin/UserManagementScreen";
import ListingApprovalsScreen from "@/screens/admin/ListingApprovalsScreen";
import CategoryManagementScreen from "@/screens/admin/CategoryManagementScreen";
import PaymentsScreen from "@/screens/admin/PaymentsScreen";
import PlansManagementScreen from "@/screens/admin/PlansManagementScreen";
import ReportsScreen from "@/screens/admin/ReportsScreen";
import FormBuilderScreen from "@/screens/admin/FormBuilderScreen";
import AnnouncementsScreen from "@/screens/admin/AnnouncementsScreen";
import VendorApprovalsScreen from "@/screens/admin/VendorApprovalsScreen";
import VendorApprovalDetailScreen from "@/screens/admin/VendorApprovalDetailScreen";
import UserVerificationScreen from "../screens/admin/UserVerificationScreen";
import BusinessPlansScreen from "../screens/admin/BusinessPlansScreen";
import ServiceManagement from "../screens/admin/ServiceManagement";
import PlansAndSubscriptionsScreen from "../screens/plans/PlansAndSubscriptionsScreen";
import IndividualMyServicesScreen from "../screens/Individual/IndividualMyServices";
import CompanySubServices from "../screens/public/CompanySubServices";
import CompanyListScreen from "../screens/companies/CompanyListScreen";
import CompanyDetailScreen from "../screens/companies/CompanyDetailScreen";
const Stack = createNativeStackNavigator();

export default function AppStack() {
  console.log(useAuthStore.user, "useAuthStore");

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={Routes.MainTabs} component={AppDrawer} />

      {/* Marketplace */}
      <Stack.Screen name={Routes.Categories} component={CategoriesScreen} />
      <Stack.Screen name={Routes.ServiceList} component={ServiceListScreen} />
      <Stack.Screen
        name={Routes.ServiceDetail}
        component={ServiceDetailScreen}
      />
      <Stack.Screen name={Routes.Search} component={SearchScreen} />
      <Stack.Screen
        name={Routes.Filters}
        component={FiltersScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen name={Routes.Compare} component={CompareScreen} />
      <Stack.Screen name={Routes.Favorites} component={FavoritesScreen} />
      <Stack.Screen
        name={Routes.Inquiry}
        component={InquiryScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name={Routes.BookConsultation}
        component={BookConsultationScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen name={Routes.AIAssistant} component={AIAssistantScreen} />

      {/* Vendors */}
      <Stack.Screen name={Routes.VendorList} component={VendorListScreen} />
      <Stack.Screen
        name={Routes.VendorProfile}
        component={VendorProfileScreen}
      />
      <Stack.Screen
        name={Routes.CompanyProfile}
        component={CompanyProfileScreen}
      />
      <Stack.Screen
        name={Routes.VendorDashboard}
        component={VendorDashboardScreen}
      />
      <Stack.Screen name="CompanyList" component={CompanyListScreen} />
      <Stack.Screen name="CompanyDetail" component={CompanyDetailScreen} />
      <Stack.Screen
        name={Routes.VendorServices}
        component={AccountRecordsScreen}
        initialParams={{ type: "services" }}
      />
      <Stack.Screen
        name={Routes.VendorProfileWizard}
        component={CompanyProfileWizardScreen}
      />
      <Stack.Screen
        name={Routes.ClientHistory}
        component={ClientHistoryScreen}
      />
      <Stack.Screen name={Routes.Invoices} component={InvoicesScreen} />
      <Stack.Screen
        name={Routes.IndividualServices}
        component={AccountRecordsScreen}
        initialParams={{ type: "services" }}
      />
      <Stack.Screen
        name={Routes.SubscriptionHistory}
        component={AccountRecordsScreen}
        initialParams={{ type: "subscriptions" }}
      />
      <Stack.Screen
        name={Routes.PlansAndSubscriptionsScreen}
        component={PlansAndSubscriptionsScreen}
        initialParams={{ type: "PlansAndSubscriptionsScreen" }}
      />
      <Stack.Screen
        name={Routes.IndividualMyServicesScreen}
        component={IndividualMyServicesScreen}
        initialParams={{ type: "IndividualMyServicesScreen" }}
      />
      <Stack.Screen
        name={Routes.CompanySubServices}
        component={CompanySubServices}
        initialParams={{ type: "CompanySubServices" }}
      />

      {/* Leads & Chat */}
      <Stack.Screen name={Routes.LeadInbox} component={LeadInboxScreen} />
      <Stack.Screen name={Routes.LeadDetail} component={LeadDetailScreen} />
      <Stack.Screen name={Routes.ChatList} component={ChatListScreen} />
      <Stack.Screen name={Routes.ChatRoom} component={ChatRoomScreen} />
      <Stack.Screen
        name={Routes.Notifications}
        component={NotificationsScreen}
      />

      {/* Billing */}
      <Stack.Screen
        name={Routes.BusinessPlansScreen}
        component={BusinessPlansScreen}
      />
      <Stack.Screen name={Routes.Plans} component={PlansScreen} />
      <Stack.Screen name={Routes.Credits} component={CreditsScreen} />
      <Stack.Screen
        name={Routes.PurchaseHistory}
        component={PurchaseHistoryScreen}
      />
      <Stack.Screen
        name={Routes.Checkout}
        component={CheckoutScreen}
        options={{ presentation: "modal" }}
      />

      {/* Analytics */}
      <Stack.Screen name={Routes.Analytics} component={AnalyticsScreen} />

      {/* Support */}
      <Stack.Screen
        name={Routes.SupportTickets}
        component={SupportTicketsScreen}
      />
      <Stack.Screen name={Routes.TicketDetail} component={TicketDetailScreen} />
      <Stack.Screen name={Routes.FAQ} component={FAQScreen} />
      <Stack.Screen
        name={Routes.KnowledgeBase}
        component={KnowledgeBaseScreen}
      />
      <Stack.Screen name={Routes.LiveChat} component={LiveChatScreen} />

      {/* Profile */}
      <Stack.Screen name={Routes.Profile} component={ProfileScreen} />
      <Stack.Screen name={Routes.EditProfile} component={EditProfileScreen} />
      <Stack.Screen name={Routes.KYC} component={KYCScreen} />
      <Stack.Screen name={Routes.Settings} component={SettingsScreen} />
      <Stack.Screen
        name={Routes.NotificationSettings}
        component={NotificationSettingsScreen}
      />
      <Stack.Screen
        name={Routes.PrivacySettings}
        component={PrivacySettingsScreen}
      />
      <Stack.Screen
        name={Routes.ChangePassword}
        component={ChangePasswordScreen}
      />
      <Stack.Screen
        name={Routes.AdminUserVerification}
        component={UserVerificationScreen}
      />

      <Stack.Screen
        name={Routes.AdminDashboard}
        component={AdminDashboardScreen}
      />
      <Stack.Screen
        name={Routes.AdminUserAction}
        component={UserReviewScreen}
      />
      <Stack.Screen
        name={Routes.ServiceManagement}
        component={ServiceManagement}
      />
      <Stack.Screen name={Routes.AdminSecurity} component={SecurityScreen} />
      <Stack.Screen
        name={Routes.AdminDocumentSubcategories}
        component={DocumentSubcategoriesScreen}
      />
      <Stack.Screen
        name={Routes.AdminVendorApprovals}
        component={VendorApprovalsScreen}
      />
      <Stack.Screen name={Routes.AdminUsers} component={UserManagementScreen} />
      <Stack.Screen
        name={Routes.AdminListings}
        component={ListingApprovalsScreen}
      />
      <Stack.Screen
        name={Routes.AdminCategories}
        component={CategoryManagementScreen}
      />
      <Stack.Screen
        name={Routes.AdminPlans}
        component={PlansManagementScreen}
      />
      <Stack.Screen name={Routes.AdminPayments} component={PaymentsScreen} />
      <Stack.Screen name={Routes.AdminReports} component={ReportsScreen} />
      <Stack.Screen
        name={Routes.AdminFormBuilder}
        component={FormBuilderScreen}
      />
      <Stack.Screen
        name={Routes.AdminAnnouncements}
        component={AnnouncementsScreen}
      />
      <Stack.Screen
        name={Routes.AdminVendorApprovalDetail}
        component={VendorApprovalDetailScreen}
      />
    </Stack.Navigator>
  );
}
