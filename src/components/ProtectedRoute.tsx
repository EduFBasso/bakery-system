import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'customer';
}

export function ProtectedRoute({ children, requiredRole = 'admin' }: ProtectedRouteProps) {
  if (requiredRole === 'admin') {
    const adminToken = localStorage.getItem('bread_admin_token');

    if (!adminToken) {
      return <Navigate to="/admin" replace />;
    }

    return <>{children}</>;
  }

  if (requiredRole === 'customer') {
    const customerToken = localStorage.getItem('bread_customer_token');

    if (!customerToken) {
      return <Navigate to="/customer/login" replace />;
    }

    return <>{children}</>;
  }

  return <>{children}</>;
}
