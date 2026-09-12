import { useDispatch, useSelector } from '../store/hooks';
import { useEffect, useState } from 'react';
import { fetchMessages, sendInquiry } from '../features/messages/messageSlice.js';

export default function MessagesPage() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const messages = useSelector((state) => state.messages.items);
  const [form, setForm] = useState({ propertyId: '', message: '' });

  useEffect(() => {
    if (token) {
      dispatch(fetchMessages());
    }
  }, [dispatch, token]);

  if (!token) {
    return (
      <section className="page-shell">
        <div className="container">
          <div className="empty-state">
            <h2>Sign in to view your conversations.</h2>
          </div>
        </div>
      </section>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await dispatch(sendInquiry(form));
    if (sendInquiry.fulfilled.match(result)) {
      setForm({ propertyId: '', message: '' });
    }
  };

  return (
    <section className="page-shell">
      <div className="container">
        <div className="section-heading mb-4">
          <p className="eyebrow dark">Inbox</p>
          <h2>Your messages</h2>
        </div>

        <div className="row g-4">
          <div className="col-lg-5">
            <div className="auth-card">
              <form className="auth-form" onSubmit={handleSubmit}>
                <label>
                  <span>Property ID</span>
                  <input value={form.propertyId} onChange={(event) => setForm({ ...form, propertyId: event.target.value })} placeholder="123" required />
                </label>
                <label>
                  <span>Your message</span>
                  <textarea rows="5" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="I’d like to arrange a viewing..." required />
                </label>
                <button type="submit" className="btn btn-primary rounded-pill">Send inquiry</button>
              </form>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="auth-card">
              {!messages.length ? (
                <div className="empty-state">No messages yet.</div>
              ) : (
                <div className="message-list">
                  {messages.map((message) => (
                    <div key={message.id} className="message-item">
                      <div className="message-meta">
                        <strong>{message.property_title || 'Property inquiry'}</strong>
                        <span>{new Date(message.created_at).toLocaleString()}</span>
                      </div>
                      <p>{message.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
