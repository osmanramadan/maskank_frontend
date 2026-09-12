import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faBuilding, faKey, faMagnifyingGlass, faShieldHalved, faComments } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useEffect, useState } from 'react';
import api from '../services/api.js';

const categories = [
  { label: 'شقق', count: '١٬٢٤٠ إعلان', type: 'apartment', icon: faBuilding },
  { label: 'منازل وفيلات', count: '٣٨٦ إعلاناً', type: 'villa', icon: faKey },
  { label: 'تجاري', count: '٢١٤ إعلاناً', type: 'shop', icon: faBuilding },
  { label: 'أراضٍ', count: '١٧٢ إعلاناً', type: 'land', icon: faShieldHalved }
];

export default function HomePage() {
  const { language, t } = useLanguage();
  const categories = language === 'ar' ? [
    { label: 'شقق', count: '١٬٢٤٠ إعلان', type: 'apartment', icon: faBuilding },
    { label: 'منازل وفيلات', count: '٣٨٦ إعلاناً', type: 'villa', icon: faKey },
    { label: 'تجاري', count: '٢١٤ إعلاناً', type: 'shop', icon: faBuilding },
    { label: 'أراضٍ', count: '١٧٢ إعلاناً', type: 'land', icon: faShieldHalved }
  ] : [
    { label: 'Apartments', count: '1,240 listings', type: 'apartment', icon: faBuilding },
    { label: 'Homes & villas', count: '386 listings', type: 'villa', icon: faKey },
    { label: 'Commercial', count: '214 listings', type: 'shop', icon: faBuilding },
    { label: 'Land', count: '172 listings', type: 'land', icon: faShieldHalved }
  ];
  return (
    <>
      <section className="hero-section">
        <div className="container hero-content">
          <div className="row align-items-center gy-5">
            <div className="col-lg-7">
              <p className="eyebrow">{t('heroEyebrow')}</p>
              <h1>{t('heroTitle')} <em>{t('heroTitleAccent')}</em></h1>
              <p className="hero-copy">{t('heroCopy')}</p>
              <div className="hero-actions d-flex flex-wrap gap-3">
                <Link to="/properties" className="btn btn-primary btn-lg rounded-pill px-4">{t('explore')} <FontAwesomeIcon icon={faArrowRight} className="ms-2" /></Link>
                <Link to="/properties?purpose=sale" className="btn btn-quiet btn-lg rounded-pill px-4">{t('wantBuy')}</Link>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="hero-note">
                <span className="note-line" />
                <p>{t('heroQuote')}</p>
                <small>{t('heroGuide')}</small>
              </div>
            </div>
          </div>
          <SearchPanel />
        </div>
      </section>
      <section className="section-space">
        <div className="container">
          <div className="section-heading d-flex justify-content-between align-items-end mb-4">
            <div><p className="eyebrow dark">{t('searchStart')}</p><h2>{t('whatLooking')}</h2></div>
            <Link to="/properties" className="text-link d-none d-md-inline">{t('viewAll')} <FontAwesomeIcon icon={faArrowRight} /></Link>
          </div>
          <div className="row g-3">{categories.map((category) => <div className="col-6 col-lg-3" key={category.label}><Link to={`/properties?type=${category.type}`} className="category-tile"><span className="category-icon"><FontAwesomeIcon icon={category.icon} /></span><strong>{category.label}</strong><small>{category.count}</small></Link></div>)}</div>
        </div>
      </section>
      <section className="benefits-section">
        <div className="container">
          <div className="section-heading text-center mb-4">
            <p className="eyebrow dark">{t('benefitsEyebrow')}</p>
            <h2>{t('benefitsTitle')}</h2>
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <article className="benefit-card">
                <span className="benefit-icon"><FontAwesomeIcon icon={faShieldHalved} /></span>
                <h3>{t('verifiedBenefit')}</h3>
                <p>{t('verifiedBenefitCopy')}</p>
              </article>
            </div>
            <div className="col-md-4">
              <article className="benefit-card">
                <span className="benefit-icon"><FontAwesomeIcon icon={faMagnifyingGlass} /></span>
                <h3>{t('smartSearchBenefit')}</h3>
                <p>{t('smartSearchBenefitCopy')}</p>
              </article>
            </div>
            <div className="col-md-4">
              <article className="benefit-card">
                <span className="benefit-icon"><FontAwesomeIcon icon={faComments} /></span>
                <h3>{t('directContactBenefit')}</h3>
                <p>{t('directContactBenefitCopy')}</p>
              </article>
            </div>
          </div>
        </div>
      </section>
      <section className="trust-band"><div className="container row g-4 align-items-center"><div className="col-lg-5"><p className="eyebrow dark">{t('whyMaskank')}</p><h2>{t('clearerWay')}</h2></div><div className="col-lg-7"><div className="row g-4"><div className="col-md-4"><strong>٠١</strong><p>{t('verifiedDetails')}</p><small>{t('verifiedCopy')}</small></div><div className="col-md-4"><strong>٠٢</strong><p>{t('localInsight')}</p><small>{t('localCopy')}</small></div><div className="col-md-4"><strong>٠٣</strong><p>{t('madeForMoving')}</p><small>{t('movingCopy')}</small></div></div></div></div></section>
    </>
  );
}

function SearchPanel() {
  const { language, t } = useLanguage();
  const [locations, setLocations] = useState<{ governorates: LocationOption[]; cities: CityOption[] }>({
    governorates: [],
    cities: []
  });
  const [governorate, setGovernorate] = useState('');

  useEffect(() => {
    api.get('/locations')
      .then((response) => {
        setLocations({
          governorates: response.data.data.governorates,
          cities: response.data.data.cities
        });
      })
      .catch(() => {
        setLocations({ governorates: [], cities: [] });
      });
  }, []);

  const selectedGovernorate = locations.governorates.find((item) => item.name_en === governorate);
  const availableCities = locations.cities.filter(
    (city) => selectedGovernorate && String(city.governorate_id) === String(selectedGovernorate.id)
  );

  return <form className="search-panel" action="/properties">
    <div className="search-label"><FontAwesomeIcon icon={faMagnifyingGlass} /><span>{t('searchLabel')}</span></div>
    <select name="purpose" className="form-select"><option value="">{t('buyOrRent')}</option><option value="sale">{t('forSale')}</option><option value="rent">{t('forRent')}</option></select>
    <select name="type" className="form-select"><option value="">{t('propertyType')}</option><option value="apartment">{t('apartment')}</option><option value="villa">{t('villa')}</option><option value="shop">{t('shop')}</option><option value="office">{t('office')}</option><option value="land">{t('land')}</option></select>
    <select
      name="governorate"
      className="form-select"
      value={governorate}
      onChange={(event) => setGovernorate(event.target.value)}
    >
      <option value="">{language === 'ar' ? 'المحافظة' : 'Governorate'}</option>
      {locations.governorates.map((item) => (
        <option key={item.id} value={item.name_en}>
          {language === 'ar' ? `${item.name_ar} - ${item.name_en}` : `${item.name_en} - ${item.name_ar}`}
        </option>
      ))}
    </select>
    <select name="city" className="form-select" disabled={!governorate}>
      <option value="">{language === 'ar' ? 'المدينة' : 'City'}</option>
      {availableCities.map((item) => (
        <option key={item.id} value={item.name_en}>
          {language === 'ar' ? `${item.name_ar} - ${item.name_en}` : `${item.name_en} - ${item.name_ar}`}
        </option>
      ))}
    </select>
    <button className="btn btn-primary rounded-pill px-4" type="submit">{t('search')}</button>
  </form>;
}

type LocationOption = {
  id: number;
  name_ar: string;
  name_en: string;
};

type CityOption = LocationOption & {
  governorate_id: number;
};
