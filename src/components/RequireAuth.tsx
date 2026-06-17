import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default RequireAuth;
