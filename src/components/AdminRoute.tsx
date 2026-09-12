import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from '../store/hooks';

export default function AdminRoute() {
  const token = useSelector((state) => state.auth.token);
  const role = useSelector((state) => state.auth.user?.role || state.user.profile?.role);

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  if (role !== 'ADMIN') {
    return <Navigate to="/account" replace />;
  }

  return <Outlet />;
}
