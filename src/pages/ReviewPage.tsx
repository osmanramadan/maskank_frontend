import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from '../store/hooks';
import { fetchAdminProperties, fetchAdminReports } from '../features/admin/adminSlice.js';
import api from '../services/api.js';

export default function ReviewPage() {
  const dispatch = useDispatch();
  const adminRole = useSelector((state) => state.auth.user?.role || state.user.profile?.role);
  const properties = useSelector((state) => state.admin.properties);
  const reports = useSelector((state) => state.admin.reports);
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (adminRole === 'ADMIN') {
      dispatch(fetchAdminProperties({ status: 'pending', page: 1, limit: 20 }));
      dispatch(fetchAdminReports({ page: 1, limit: 20, resolved: false }));
    }
  }, [adminRole, dispatch]);

  const approveProperty = async (id) => {
    setWorkingId(Number(id));
    setActionError('');
    try {
      await api.put(`/admin/properties/${id}/approve`);
      await dispatch(fetchAdminProperties({ status: 'pending', page: 1, limit: 20 }));
    } catch (error) {
      setActionError(error.response?.data?.message || 'Unable to approve property');
    } finally {
      setWorkingId(null);
    }
  };

  const rejectProperty = async (id) => {
    const reason = rejectionReasons[id]?.trim();
    if (!reason) {
      setActionError('Enter a rejection reason before rejecting a property.');
      return;
    }
    setWorkingId(Number(id));
    setActionError('');
    try {
      await api.put(`/admin/properties/${id}/reject`, { reason });
      setRejectionReasons((current) => ({ ...current, [id]: '' }));
      await dispatch(fetchAdminProperties({ status: 'pending', page: 1, limit: 20 }));
    } catch (error) {
      setActionError(error.response?.data?.message || 'Unable to reject property');
    } finally {
      setWorkingId(null);
    }
  };

  const resolveReport = async (id) => {
    await api.put(`/admin/reports/${id}/resolve`);
    dispatch(fetchAdminReports({ page: 1, limit: 20, resolved: false }));
  };

  if (adminRole !== 'ADMIN') {
    return <section className="page-shell"><div className="container"><div className="empty-state">Admin access required.</div></div></section>;
  }

  return (
    <section className="page-shell">
      <div className="container">
        <div className="section-heading mb-4">
          <p className="eyebrow dark">Moderation</p>
          <h2>Pending submissions</h2>
        </div>
        {actionError ? <div className="alert alert-danger">{actionError}</div> : null}

        <div className="review-stack">
          {properties.length ? properties.map((property) => (
            <div key={property.id} className="review-item">
              <div>
                <strong>{property.title}</strong>
                <small>{property.status} · {property.property_type} · {property.purpose}</small>
              </div>
              <div className="owner-listing-actions">
                <button type="button" className="btn btn-primary rounded-pill" disabled={workingId === Number(property.id)} onClick={() => approveProperty(property.id)}>
                  {workingId === Number(property.id) ? 'Saving...' : 'Approve'}
                </button>
                <input
                  value={rejectionReasons[property.id] || ''}
                  onChange={(event) => setRejectionReasons((current) => ({ ...current, [property.id]: event.target.value }))}
                  placeholder="Rejection reason"
                  aria-label={`Rejection reason for ${property.title}`}
                  disabled={workingId === Number(property.id)}
                />
                <button type="button" className="btn btn-outline-danger rounded-pill" disabled={workingId === Number(property.id)} onClick={() => rejectProperty(property.id)}>Reject</button>
              </div>
            </div>
          )) : <div className="empty-state">No pending submissions.</div>}
        </div>

        <div className="section-heading mt-5 mb-4">
          <p className="eyebrow dark">Reports</p>
          <h2>Open reports</h2>
        </div>

        <div className="review-stack">
          {reports.length ? reports.map((report) => (
            <div key={report.id} className="review-item">
              <div>
                <strong>{report.reason || 'Reported listing'}</strong>
                <small>{report.created_at}</small>
              </div>
              <button type="button" className="btn btn-outline-primary rounded-pill" onClick={() => resolveReport(report.id)}>Resolve</button>
            </div>
          )) : <div className="empty-state">No open reports.</div>}
        </div>
      </div>
    </section>
  );
}
