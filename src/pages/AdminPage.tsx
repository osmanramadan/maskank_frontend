import { useEffect } from 'react';
import { useDispatch, useSelector } from '../store/hooks';
import { fetchAdminStats } from '../features/admin/adminSlice.js';

export default function AdminPage() {
  const dispatch = useDispatch();
  const stats = useSelector((state) => state.admin.stats);
  const status = useSelector((state) => state.admin.status);

  useEffect(() => {
    dispatch(fetchAdminStats());
  }, [dispatch]);

  return (
    <section className="page-shell">
      <div className="container">
        <div className="section-heading mb-4">
          <p className="eyebrow dark">Admin dashboard</p>
          <h2>Market overview</h2>
        </div>

        {status === 'loading' || !stats ? (
          <div className="loading-card">Loading dashboard...</div>
        ) : (
          <div className="stats-grid admin-grid">
            <div>
              <strong>{stats.totalUsers ?? 0}</strong>
              <span>Total users</span>
            </div>
            <div>
              <strong>{stats.totalProperties ?? 0}</strong>
              <span>Properties</span>
            </div>
            <div>
              <strong>{stats.pendingProperties ?? 0}</strong>
              <span>Pending approvals</span>
            </div>
            <div>
              <strong>{stats.totalReports ?? 0}</strong>
              <span>Reports</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
