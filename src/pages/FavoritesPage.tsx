import { useEffect } from 'react';
import { useDispatch, useSelector } from '../store/hooks';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { fetchFavorites, removeFavorite } from '../features/favorites/favoriteSlice.js';

const uploadsBaseUrl = (import.meta.env.VITE_UPLOADS_URL || '/uploads').replace(/\/$/, '');
const defaultPropertyImage = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#eef3f0"/>
        <stop offset="100%" stop-color="#d9e5de"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#g)"/>
    <rect x="140" y="120" width="920" height="560" rx="26" fill="#f8faf8" stroke="#c7d5cb" stroke-width="4"/>
    <circle cx="600" cy="310" r="126" fill="#dfe9e2"/>
    <path d="M505 390 L600 240 L695 390 Z" fill="#c9d8cf"/>
    <rect x="455" y="380" width="290" height="94" rx="18" fill="#e6efe7"/>
    <text x="600" y="560" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" fill="#3d5d51" font-weight="700">No property image</text>
  </svg>
`)}`;

function getImageUrl(filePath?: string | null) {
  if (!filePath) return defaultPropertyImage;
  const value = String(filePath).trim();
  if (value.startsWith('http')) return value;
  const normalized = value.replace(/\\/g, '/').replace(/^.*?uploads\//, '').replace(/^\/+/, '');
  return `${uploadsBaseUrl}/${normalized}`;
}

export default function FavoritesPage() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const favorites = useSelector((state) => state.favorites.items);

  useEffect(() => {
    if (token) dispatch(fetchFavorites());
  }, [dispatch, token]);

  if (!token) {
    return (
      <section className="page-shell">
        <div className="container">
          <div className="empty-state">
            <h2>Sign in to save your favorites.</h2>
            <Link to="/auth" className="btn btn-primary rounded-pill mt-3">Go to login</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-shell">
      <div className="container">
        <div className="section-heading d-flex justify-content-between align-items-end mb-4">
          <div>
            <p className="eyebrow dark">Saved homes</p>
            <h2>Your favorites</h2>
          </div>
        </div>

        {!favorites.length ? (
          <div className="empty-state">You haven’t saved any property yet.</div>
        ) : (
          <div className="results-grid">
            {favorites.map((property) => (
              <div key={property.id} className="property-card compact-card">
                <img src={getImageUrl(Array.isArray(property.images) ? property.images[0]?.filePath : undefined)} alt={property.title || 'Property'} className="property-card-image" onError={(event) => { if (event.currentTarget.src !== defaultPropertyImage) event.currentTarget.src = defaultPropertyImage; }} />
                <div className="property-card-body">
                  <div className="property-card-topline">
                    <span>{property.purpose === 'sale' ? 'For sale' : 'For rent'}</span>
                    <strong>{Number(property.price).toLocaleString('en-EG')} {property.currency}</strong>
                  </div>
                  <h3>{property.title}</h3>
                  <div className="location-chip">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    <span>{property.city}, {property.governorate}</span>
                  </div>
                  <div className="detail-actions mt-3">
                    <Link to={`/properties/${property.id}`} className="btn btn-primary rounded-pill">View</Link>
                    <button type="button" className="btn btn-outline-danger rounded-pill" onClick={() => dispatch(removeFavorite(property.id))}>
                      <FontAwesomeIcon icon={faHeart} className="me-2" />Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
