import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faLocationCrosshairs, faMapLocationDot } from '@fortawesome/free-solid-svg-icons';
import api from '../services/api.js';
import { useLanguage } from '../i18n/LanguageContext';

type MapProperty = {
  id: number;
  title: string;
  purpose: string;
  price: number;
  currency: string;
  city?: string;
  city_ar?: string;
  governorate?: string;
  governorate_ar?: string;
  latitude: number | string | null;
  longitude: number | string | null;
};

type LocationOption = { id: number; name_ar: string; name_en: string };
type CityOption = LocationOption & { governorate_id: number };
type Coordinates = { latitude: number; longitude: number };

const egyptCenter: [number, number] = [26.8206, 30.8025];
const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
});
const userLocationIcon = L.divIcon({
  className: 'property-map-user-marker',
  html: '<svg class="property-map-user-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="3.2"></circle><path d="M5.5 20c.6-4.1 2.8-6.2 6.5-6.2s5.9 2.1 6.5 6.2"></path></svg>',
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

function distanceInKm(first: Coordinates, second: Coordinates) {
  const earthRadius = 6371;
  const latitudeDelta = (second.latitude - first.latitude) * Math.PI / 180;
  const longitudeDelta = (second.longitude - first.longitude) * Math.PI / 180;
  const latitudeOne = first.latitude * Math.PI / 180;
  const latitudeTwo = second.latitude * Math.PI / 180;
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.sin(longitudeDelta / 2) ** 2 * Math.cos(latitudeOne) * Math.cos(latitudeTwo);
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function getVisibleMarkerPositions(properties: MapProperty[]) {
  const groups = new Map<string, MapProperty[]>();
  properties.forEach((property) => {
    const key = `${Number(property.latitude).toFixed(5)}:${Number(property.longitude).toFixed(5)}`;
    const group = groups.get(key) || [];
    group.push(property);
    groups.set(key, group);
  });

  const positions = new Map<number, [number, number]>();
  groups.forEach((group) => {
    group.forEach((property, index) => {
      const latitude = Number(property.latitude);
      const longitude = Number(property.longitude);
      if (group.length === 1) {
        positions.set(property.id, [latitude, longitude]);
        return;
      }
      const angle = (2 * Math.PI * index) / group.length;
      const offset = 0.0012;
      positions.set(property.id, [
        latitude + Math.sin(angle) * offset,
        longitude + Math.cos(angle) * offset
      ]);
    });
  });
  return positions;
}

function FitMapToProperties({ properties }: { properties: MapProperty[] }) {
  const map = useMap();

  useEffect(() => {
    if (!properties.length) return;
    const bounds = L.latLngBounds(properties.map((property) => [
      Number(property.latitude),
      Number(property.longitude)
    ] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [map, properties]);

  return null;
}

export default function PropertyMapPage() {
  const { language, t } = useLanguage();
  const [properties, setProperties] = useState<MapProperty[]>([]);
  const [locations, setLocations] = useState<{ governorates: LocationOption[]; cities: CityOption[] }>({ governorates: [], cities: [] });
  const [purpose, setPurpose] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState('');
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [status, setStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading');

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 240);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    Promise.all([
      api.get('/properties', {
        params: {
          page: 1,
          limit: 50,
          purpose: purpose || undefined,
          type: propertyType || undefined,
          governorate: governorate || undefined,
          city: city || undefined
        }
      }),
      api.get('/locations')
    ]).then(([propertiesResponse, locationsResponse]) => {
      if (!active) return;
      setProperties(propertiesResponse.data.data || []);
      setLocations(locationsResponse.data.data);
      setStatus('succeeded');
    }).catch(() => {
      if (active) setStatus('failed');
    });
    return () => { active = false; };
  }, [city, governorate, propertyType, purpose]);

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage(t('locationNotSupported'));
      return;
    }
    setLocationMessage(t('requestingLocation'));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setNearbyOnly(true);
        setLocationMessage(t('nearbyPropertiesEnabled'));
      },
      () => {
        setLocationMessage(t('locationPermissionDenied'));
        setNearbyOnly(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const mappedProperties = useMemo(
    () => properties
      .filter((property) => Number.isFinite(Number(property.latitude)) && Number.isFinite(Number(property.longitude)))
      .filter((property) => !nearbyOnly || !userLocation || distanceInKm(userLocation, {
        latitude: Number(property.latitude),
        longitude: Number(property.longitude)
      }) <= 25),
    [nearbyOnly, properties, userLocation]
  );
  const visibleMarkerPositions = useMemo(
    () => getVisibleMarkerPositions(mappedProperties),
    [mappedProperties]
  );
  const availableCities = locations.cities.filter((item) => {
    const selected = locations.governorates.find((item) => item.name_en === governorate);
    return selected && Number(item.governorate_id) === Number(selected.id);
  });

  const locationName = (property: MapProperty) => language === 'ar'
    ? `${property.city_ar || property.city || ''}، ${property.governorate_ar || property.governorate || ''}`
    : `${property.city || ''}, ${property.governorate || ''}`;

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  if (status === 'loading') {
    return <section className="page-shell"><div className="container"><div className="loading-card">{t('loading')}</div></div></section>;
  }

  return (
    <section className="page-shell property-map-page">
      <div className="container">
        <div className="section-heading property-map-heading">
          <p className="eyebrow dark">{t('propertyMapEyebrow')}</p>
          <h1><FontAwesomeIcon icon={faMapLocationDot} /> {t('propertyMapTitle')}</h1>
          <p className="page-copy">{t('propertyMapCopy')}</p>
        </div>
        <div className="property-map-filters" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <select className="form-select" value={purpose} onChange={(event) => setPurpose(event.target.value)}>
            <option value="">{t('buyOrRent')}</option>
            <option value="sale">{t('forSale')}</option>
            <option value="rent">{t('forRent')}</option>
          </select>
          <select className="form-select" value={propertyType} onChange={(event) => setPropertyType(event.target.value)}>
            <option value="">{t('propertyType')}</option>
            <option value="apartment">{t('apartment')}</option>
            <option value="villa">{t('villa')}</option>
            <option value="shop">{t('shop')}</option>
            <option value="office">{t('office')}</option>
            <option value="land">{t('land')}</option>
          </select>
          <select className="form-select" value={governorate} onChange={(event) => { setGovernorate(event.target.value); setCity(''); }}>
            <option value="">{t('governorate')}</option>
            {locations.governorates.map((item) => <option key={item.id} value={item.name_en}>{language === 'ar' ? item.name_ar : item.name_en}</option>)}
          </select>
          <select className="form-select" value={city} onChange={(event) => setCity(event.target.value)} disabled={!governorate}>
            <option value="">{t('city')}</option>
            {availableCities.map((item) => <option key={item.id} value={item.name_en}>{language === 'ar' ? item.name_ar : item.name_en}</option>)}
          </select>
          <button type="button" className={`btn property-location-button ${nearbyOnly ? 'is-active' : ''}`} onClick={requestUserLocation}>
            <FontAwesomeIcon icon={faLocationCrosshairs} /> {t('useMyLocation')}
          </button>
        </div>
        {locationMessage ? <div className="property-map-location-message">{locationMessage}</div> : null}
        {status === 'failed' ? <div className="alert alert-danger">{t('propertyMapFailed')}</div> : null}
        {status === 'succeeded' ? (
          <div className="property-map-card">
            <MapContainer className="property-map" center={egyptCenter} zoom={6} scrollWheelZoom>
              <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <FitMapToProperties properties={mappedProperties} />
              {userLocation ? <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userLocationIcon}><Popup>{t('yourLocation')}</Popup></Marker> : null}
              {mappedProperties.map((property) => (
                <Marker
                  key={property.id}
                  position={visibleMarkerPositions.get(property.id) || [Number(property.latitude), Number(property.longitude)]}
                  icon={markerIcon}
                >
                  <Popup>
                    <div className="property-map-popup" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      <strong>{property.title}</strong>
                      <span>{locationName(property)}</span>
                      <b>{Number(property.price).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-EG')} {property.currency}{property.purpose === 'rent' ? ` / ${t('perMonth')}` : ''}</b>
                      <Link to={`/properties/${property.id}`} className="btn btn-primary btn-sm rounded-pill">
                        {t('viewDetails')}
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            {!mappedProperties.length ? <div className="property-map-empty">{t('propertyMapEmpty')}</div> : null}
          </div>
        ) : null}
      </div>
      {showBackToTop ? (
        <button
          type="button"
          className="property-map-back-to-top"
          onClick={scrollToTop}
          aria-label={language === 'ar' ? 'العودة إلى أعلى الصفحة' : 'Back to top'}
          title={language === 'ar' ? 'العودة إلى أعلى الصفحة' : 'Back to top'}
        >
          <FontAwesomeIcon icon={faArrowUp} />
        </button>
      ) : null}
    </section>
  );
}
