import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from './store/hooks';
import AppLayout from './layouts/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import PropertiesPage from './pages/PropertiesPage.jsx';
import PropertyDetailPage from './pages/PropertyDetailPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import FavoritesPage from './pages/FavoritesPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import OwnerPropertyFormPage from './pages/OwnerPropertyFormPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import { fetchCurrentUser } from './features/users/userSlice.js';
import { fetchFavorites } from './features/favorites/favoriteSlice.js';

export default function App() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      dispatch(fetchCurrentUser());
      dispatch(fetchFavorites());
    }
  }, [dispatch, token]);

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:id" element={<PropertyDetailPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/account" element={<AccountPage />} />
          <Route element={<ProtectedRoute roles={['OWNER', 'BROKER']} />}>
            <Route path="/add-property" element={<OwnerPropertyFormPage />} />
            <Route path="/properties/:id/edit" element={<OwnerPropertyFormPage />} />
          </Route>
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/review" element={<ReviewPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
