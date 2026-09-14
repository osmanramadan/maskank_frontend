import { useState } from 'react';
import api from '../services/api.js';
import { useLanguage } from '../i18n/LanguageContext';

export default function ContactPage() {
  const { language } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const isArabic = language === 'ar';
  const updateField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setStatus('sending');
    setError('');
    try {
      await api.post('/contact', form);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setStatus('sent');
    } catch (requestError) {
      setError(requestError.response?.data?.message || (isArabic ? 'تعذر إرسال رسالتك.' : 'Unable to send your message.'));
      setStatus('error');
    }
  };

  return (
    <section className="page-shell contact-page">
      <div className="container">
        <div className="section-heading mb-4">
          <p className="eyebrow dark">{isArabic ? 'تواصل معنا' : 'Contact us'}</p>
          <h2>{isArabic ? 'نحن هنا لمساعدتك' : 'We are here to help'}</h2>
        </div>
        <div className="contact-layout">
          <div className="contact-intro">
            <h3>{isArabic ? 'أرسل لنا رسالتك' : 'Send us a message'}</h3>
            <p>{isArabic ? 'لديك سؤال أو اقتراح؟ املأ النموذج وسنرد عليك عبر بريدك الإلكتروني.' : 'Have a question or suggestion? Complete the form and we will reply by email.'}</p>
          </div>
          <form className="contact-form" onSubmit={submit}>
            <label><span>{isArabic ? 'الاسم *' : 'Name *'}</span><input value={form.name} onChange={(event) => updateField('name', event.target.value)} required maxLength={120} /></label>
            <label><span>{isArabic ? 'البريد الإلكتروني *' : 'Email *'}</span><input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required maxLength={254} /></label>
            <label><span>{isArabic ? 'الهاتف' : 'Phone'}</span><input type="tel" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} maxLength={40} /></label>
            <label><span>{isArabic ? 'عنوان الرسالة *' : 'Subject *'}</span><input value={form.subject} onChange={(event) => updateField('subject', event.target.value)} required maxLength={180} /></label>
            <label><span>{isArabic ? 'نص الرسالة *' : 'Message *'}</span><textarea rows={6} value={form.message} onChange={(event) => updateField('message', event.target.value)} required minLength={10} maxLength={5000} /></label>
            <button type="submit" className="btn btn-primary rounded-pill" disabled={status === 'sending'}>{status === 'sending' ? (isArabic ? 'جارٍ الإرسال...' : 'Sending...') : (isArabic ? 'إرسال الرسالة' : 'Send message')}</button>
            {status === 'sent' ? <div className="alert alert-success">{isArabic ? 'تم إرسال رسالتك بنجاح.' : 'Your message was sent successfully.'}</div> : null}
            {status === 'error' ? <div className="alert alert-danger">{error}</div> : null}
          </form>
        </div>
      </div>
    </section>
  );
}
