import { Navigate } from 'react-router-dom';
import { getAdminSessionToken, getCustomerSessionToken } from '../services/session';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'customer';
}

export function ProtectedRoute({ children, requiredRole = 'admin' }: ProtectedRouteProps) {
  if (requiredRole === 'admin') {
    return getAdminSessionToken() ? <>{children}</> : <Navigate to="/admin" replace />;
  }

  return getCustomerSessionToken() ? <>{children}</> : <Navigate to="/login" replace />;
}
