import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from '../store/hooks';

export default function ProtectedRoute() {
  const token = useSelector((state) => state.auth.token);

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}
