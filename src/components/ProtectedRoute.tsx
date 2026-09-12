import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from '../store/hooks';

type ProtectedRouteProps = {
  roles?: string[];
};

export default function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const token = useSelector((state) => state.auth.token);
  const role = useSelector((state) => state.auth.user?.role || state.user.profile?.role);

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  if (roles && !roles.includes(role || '')) {
    return <Navigate to="/account" replace />;
  }

  return <Outlet />;
}
