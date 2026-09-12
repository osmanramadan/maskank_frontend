import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faBuilding, faKey, faMagnifyingGlass, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

const categories = [
  { label: 'شقق', count: '١٬٢٤٠ إعلان', icon: faBuilding },
  { label: 'منازل وفيلات', count: '٣٨٦ إعلاناً', icon: faKey },
  { label: 'تجاري', count: '٢١٤ إعلاناً', icon: faBuilding },
  { label: 'أراضٍ', count: '١٧٢ إعلاناً', icon: faShieldHalved }
];

export default function HomePage() {
  const { language, t } = useLanguage();
  const categories = language === 'ar' ? [
    { label: 'شقق', count: '١٬٢٤٠ إعلان', icon: faBuilding },
    { label: 'منازل وفيلات', count: '٣٨٦ إعلاناً', icon: faKey },
    { label: 'تجاري', count: '٢١٤ إعلاناً', icon: faBuilding },
    { label: 'أراضٍ', count: '١٧٢ إعلاناً', icon: faShieldHalved }
  ] : [
    { label: 'Apartments', count: '1,240 listings', icon: faBuilding },
    { label: 'Homes & villas', count: '386 listings', icon: faKey },
    { label: 'Commercial', count: '214 listings', icon: faBuilding },
    { label: 'Land', count: '172 listings', icon: faShieldHalved }
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
          <div className="row g-3">{categories.map((category) => <div className="col-6 col-lg-3" key={category.label}><Link to="/properties" className="category-tile"><span className="category-icon"><FontAwesomeIcon icon={category.icon} /></span><strong>{category.label}</strong><small>{category.count}</small></Link></div>)}</div>
        </div>
      </section>
      <section className="trust-band"><div className="container row g-4 align-items-center"><div className="col-lg-5"><p className="eyebrow dark">{t('whyMaskank')}</p><h2>{t('clearerWay')}</h2></div><div className="col-lg-7"><div className="row g-4"><div className="col-md-4"><strong>٠١</strong><p>{t('verifiedDetails')}</p><small>{t('verifiedCopy')}</small></div><div className="col-md-4"><strong>٠٢</strong><p>{t('localInsight')}</p><small>{t('localCopy')}</small></div><div className="col-md-4"><strong>٠٣</strong><p>{t('madeForMoving')}</p><small>{t('movingCopy')}</small></div></div></div></div></section>
    </>
  );
}

function SearchPanel() {
  const { t } = useLanguage();
  return <form className="search-panel" action="/properties">
    <div className="search-label"><FontAwesomeIcon icon={faMagnifyingGlass} /><span>{t('searchLabel')}</span></div>
    <input name="keyword" className="form-control" placeholder={t('searchPlaceholder')} />
    <select name="purpose" className="form-select"><option value="">{t('buyOrRent')}</option><option value="sale">{t('forSale')}</option><option value="rent">{t('forRent')}</option></select>
    <select name="type" className="form-select"><option value="">{t('propertyType')}</option><option value="apartment">{t('apartment')}</option><option value="villa">{t('villa')}</option><option value="shop">{t('shop')}</option><option value="office">{t('office')}</option></select>
    <button className="btn btn-primary rounded-pill px-4" type="submit">{t('search')}</button>
  </form>;
}
