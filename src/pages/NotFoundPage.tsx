import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return <section className="listing-placeholder"><div className="container"><p className="eyebrow dark">404</p><h1>That address is unavailable.</h1><Link to="/" className="btn btn-primary rounded-pill">Return home</Link></div></section>;
}
