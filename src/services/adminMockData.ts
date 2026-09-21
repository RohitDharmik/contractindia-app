import type { User } from '@/types';

export type AdminUserStatus = 'active' | 'suspended' | 'deleted' | 'pending';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: User['role'];
  status: AdminUserStatus;
  plan: User['plan'];
  city: string;
  joinedAt: string;
  credits: number;
}

export interface VendorApproval {
  id: string;
  companyName: string;
  ownerName: string;
  city: string;
  state: string;
  gst?: string;
  pan?: string;
  submittedAt: string;
  documents: { id: string; name: string; type: string }[];
  status: ApprovalStatus;
  reason?: string;
}

export interface ListingApproval {
  id: string;
  serviceName: string;
  vendorName: string;
  category: string;
  submittedAt: string;
  status: ApprovalStatus;
  priceFrom: number;
}

export interface Payment {
  id: string;
  date: string;
  user: string;
  description: string;
  amount: number;
  gateway: 'razorpay' | 'stripe';
  method: string;
  status: 'success' | 'pending' | 'failed' | 'refunded';
  txnId: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: 'all' | 'individual' | 'commercial';
  channel: 'push' | 'in_app' | 'email';
  scheduledAt?: string;
  status: 'draft' | 'scheduled' | 'sent';
  sentCount?: number;
}

export interface AdminCategory {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  listings: number;
  featured: boolean;
}

export interface AdminPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  active: boolean;
  subscribers: number;
}

export const adminUsers: AdminUserRow[] = [
  { id: 'au1', name: 'Suresh Patil', email: 'suresh@example.com', mobile: '+91 98xxxx10', role: 'individual', status: 'active', plan: 'free', city: 'Pune', joinedAt: '2026-02-12', credits: 35 },
  { id: 'au2', name: 'Reena Nair', email: 'reena@example.com', mobile: '+91 98xxxx22', role: 'individual', status: 'active', plan: 'premium', city: 'Bengaluru', joinedAt: '2026-03-04', credits: 412 },
  { id: 'au3', name: 'Sthapati Architects', email: 'anjali@sthapati.in', mobile: '+91 90xxxx05', role: 'commercial', status: 'active', plan: 'commercial_pro', city: 'Mumbai', joinedAt: '2025-09-21', credits: 2240 },
  { id: 'au4', name: 'BuildRight Contractors', email: 'team@buildright.in', mobile: '+91 90xxxx18', role: 'commercial', status: 'active', plan: 'commercial_pro', city: 'Bengaluru', joinedAt: '2025-11-02', credits: 1860 },
  { id: 'au5', name: 'Mohammed Iqbal', email: 'iqbal@example.com', mobile: '+91 98xxxx33', role: 'individual', status: 'suspended', plan: 'free', city: 'Hyderabad', joinedAt: '2026-04-19', credits: 0 },
  { id: 'au6', name: 'Sterling Materials', email: 'sales@sterling.in', mobile: '+91 90xxxx41', role: 'commercial', status: 'pending', plan: 'free', city: 'Hyderabad', joinedAt: '2026-06-09', credits: 50 },
  { id: 'au7', name: 'Priya Sharma', email: 'priya@example.com', mobile: '+91 98xxxx55', role: 'individual', status: 'active', plan: 'premium', city: 'Delhi', joinedAt: '2026-01-11', credits: 280 },
];

export const vendorApprovals: VendorApproval[] = [
  {
    id: 'va1', companyName: 'Sterling Materials Co.', ownerName: 'Rajesh Kumar', city: 'Hyderabad', state: 'Telangana',
    gst: '36ABCDE1234F1Z5', pan: 'ABCDE1234F', submittedAt: '2026-06-09T10:30:00Z', status: 'pending',
    documents: [
      { id: 'd1', name: 'gst_certificate.pdf', type: 'GST' },
      { id: 'd2', name: 'pan_card.pdf', type: 'PAN' },
      { id: 'd3', name: 'incorporation.pdf', type: 'CIN' },
    ],
  },
  {
    id: 'va2', companyName: 'GreenSpace Architects', ownerName: 'Meera Krishnan', city: 'Chennai', state: 'Tamil Nadu',
    gst: '33XYZAB5678C1Z3', pan: 'XYZAB5678C', submittedAt: '2026-06-10T14:15:00Z', status: 'pending',
    documents: [
      { id: 'd4', name: 'coa_registration.pdf', type: 'COA' },
      { id: 'd5', name: 'gst.pdf', type: 'GST' },
    ],
  },
  {
    id: 'va3', companyName: 'NorthBuild PMC', ownerName: 'Harpreet Singh', city: 'Chandigarh', state: 'Punjab',
    submittedAt: '2026-06-08T09:00:00Z', status: 'pending',
    documents: [{ id: 'd6', name: 'company_brochure.pdf', type: 'Profile' }],
  },
];

export const listingApprovals: ListingApproval[] = [
  { id: 'la1', serviceName: 'Modular Office Interiors', vendorName: 'Sthapati Architects', category: 'Interior Design', submittedAt: '2026-06-11T08:00:00Z', status: 'pending', priceFrom: 1450 },
  { id: 'la2', serviceName: 'Vastu Consultation', vendorName: 'GreenSpace Architects', category: 'Architecture', submittedAt: '2026-06-12T11:20:00Z', status: 'pending', priceFrom: 5000 },
  { id: 'la3', serviceName: 'Drone Land Survey', vendorName: 'AeroSurvey India', category: 'Survey Services', submittedAt: '2026-06-12T16:40:00Z', status: 'pending', priceFrom: 22000 },
];

export const adminPayments: Payment[] = [
  { id: 'p1', date: '2026-06-14T10:12:00Z', user: 'Reena Nair', description: 'Premium plan \u2014 monthly', amount: 589, gateway: 'razorpay', method: 'UPI', status: 'success', txnId: 'pay_NX9aB2k7Yu1' },
  { id: 'p2', date: '2026-06-14T09:48:00Z', user: 'Sthapati Architects', description: 'Featured listing boost', amount: 2999, gateway: 'razorpay', method: 'Card', status: 'success', txnId: 'pay_NX9aA8s4Vu3' },
  { id: 'p3', date: '2026-06-13T22:01:00Z', user: 'Suresh Patil', description: 'Credit pack \u2014 500 credits', amount: 943, gateway: 'stripe', method: 'Card', status: 'success', txnId: 'ch_3PoXjK2hl' },
  { id: 'p4', date: '2026-06-13T18:33:00Z', user: 'Mohammed Iqbal', description: 'Credit pack \u2014 100 credits', amount: 235, gateway: 'razorpay', method: 'UPI', status: 'failed', txnId: 'pay_NX99lpQRm' },
  { id: 'p5', date: '2026-06-13T12:05:00Z', user: 'BuildRight Contractors', description: 'Commercial Pro \u2014 monthly', amount: 2949, gateway: 'razorpay', method: 'Netbanking', status: 'success', txnId: 'pay_NX97vYsKp' },
  { id: 'p6', date: '2026-06-12T09:21:00Z', user: 'Priya Sharma', description: 'Premium plan \u2014 monthly', amount: 589, gateway: 'razorpay', method: 'UPI', status: 'refunded', txnId: 'pay_NX95zFkXr' },
];

export const announcements: Announcement[] = [
  { id: 'an1', title: 'New cities launched', body: 'ContractsIndia is now live in Jaipur, Indore and Bhopal.', audience: 'all', channel: 'push', scheduledAt: '2026-06-15T10:00:00Z', status: 'sent', sentCount: 184209 },
  { id: 'an2', title: 'Monsoon offer', body: '20% off on Premium subscription till June 30.', audience: 'individual', channel: 'in_app', status: 'scheduled', scheduledAt: '2026-06-16T09:00:00Z' },
  { id: 'an3', title: 'Vendor onboarding webinar', body: 'Join us this Saturday to learn how to grow leads.', audience: 'commercial', channel: 'email', status: 'draft' },
];

export const adminCategories: AdminCategory[] = [
  { id: 'architecture', name: 'Architecture', icon: 'business-outline', active: true, listings: 412, featured: true },
  { id: 'structural', name: 'Structural Engineering', icon: 'construct-outline', active: true, listings: 287, featured: false },
  { id: 'legal', name: 'Legal Services', icon: 'briefcase-outline', active: true, listings: 154, featured: false },
  { id: 'approvals', name: 'Govt. Approvals', icon: 'shield-checkmark-outline', active: true, listings: 198, featured: true },
  { id: 'contractors', name: 'Contractors', icon: 'hammer-outline', active: true, listings: 631, featured: true },
  { id: 'interior', name: 'Interior Design', icon: 'color-palette-outline', active: true, listings: 245, featured: false },
  { id: 'materials', name: 'Material Suppliers', icon: 'cube-outline', active: true, listings: 502, featured: true },
  { id: 'survey', name: 'Survey Services', icon: 'map-outline', active: true, listings: 87, featured: false },
  { id: 'project_mgmt', name: 'Project Management', icon: 'analytics-outline', active: true, listings: 121, featured: false },
  { id: 'environmental', name: 'Environmental', icon: 'leaf-outline', active: false, listings: 64, featured: false },
  { id: 'financial', name: 'Financial Services', icon: 'card-outline', active: true, listings: 92, featured: false },
];

export const adminPlanRows: AdminPlan[] = [
  { id: 'free', name: 'Free', price: 0, credits: 50, active: true, subscribers: 122480 },
  { id: 'premium', name: 'Premium', price: 499, credits: 500, active: true, subscribers: 38241 },
  { id: 'commercial_pro', name: 'Commercial Pro', price: 2499, credits: 2500, active: true, subscribers: 4128 },
];
