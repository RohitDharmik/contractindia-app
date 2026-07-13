import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  return {
    user,
    isAuthenticated: !!user && !!accessToken,
    isCommercial: user?.role === 'commercial',
    isAdmin: user?.role === 'admin',
  };
}
