import { useState, useEffect } from 'react';
import { LogOut, Calendar, ShoppingBag, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Profile({ user, setGlobalUser, setActivePage }) {
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India'
  });
  const [orders, setOrders] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 4000);
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('aariniya_token');
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load profile');
      const data = await response.json();
      setProfile({
        full_name: data.full_name || '',
        phone: data.phone || '',
        address_line1: data.address_line1 || '',
        address_line2: data.address_line2 || '',
        city: data.city || '',
        state: data.state || '',
        postal_code: data.postal_code || '',
        country: data.country || 'India'
      });
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Could not retrieve user details.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchUserOrders = async () => {
    try {
      const token = localStorage.getItem('aariniya_token');
      const response = await fetch(`${API_BASE_URL}/api/orders/my-orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load orders');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user) {
      setActivePage('auth');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUserProfile();
    fetchUserOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleInputChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', msg: '' });

    try {
      const token = localStorage.getItem('aariniya_token');
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });

      if (!response.ok) throw new Error('Failed to update details');
      
      // Update local storage user object
      const updatedUser = { ...user, ...profile };
      localStorage.setItem('aariniya_user', JSON.stringify(updatedUser));
      setGlobalUser(updatedUser);
      showFeedback('success', 'Profile and address updated successfully.');
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aariniya_token');
    localStorage.removeItem('aariniya_user');
    setGlobalUser(null);
    setActivePage('home');
  };

  if (loadingProfile) {
    return (
      <div style={styles.loading}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem' }}>Loading your wellness profile...</p>
      </div>
    );
  }

  return (
    <div className="container" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Your Wellness Dashboard</h1>
          <p style={styles.subtitle}>Welcome back, {profile.full_name}. Here is the overview of your wellness logs.</p>
        </div>
        <button className="btn btn-secondary" style={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={16} style={{ marginRight: '8px' }} />
          Logout
        </button>
      </div>

      <div style={styles.grid}>
        {/* Left Column: Contact and Address Settings */}
        <div style={styles.settingsCard}>
          <div style={styles.cardHeader}>
            <ShieldCheck size={20} color="var(--color-primary)" />
            <h3 style={styles.cardTitle}>Shipping & Contact Details</h3>
          </div>
          
          {feedback.msg && (
            <div style={{
              ...styles.alert,
              backgroundColor: feedback.type === 'success' ? '#edfdf5' : '#fdf1f1',
              color: feedback.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
              borderLeftColor: feedback.type === 'success' ? 'var(--color-success)' : 'var(--color-error)'
            }}>
              {feedback.msg}
            </div>
          )}

          <form onSubmit={handleSaveProfile} style={styles.form}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                name="full_name"
                className="form-input" 
                value={profile.full_name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <input 
                type="tel" 
                name="phone"
                className="form-input" 
                placeholder="e.g. +91 98765-43210"
                value={profile.phone}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Address Line 1</label>
              <input 
                type="text" 
                name="address_line1"
                className="form-input" 
                placeholder="House, apartment, flat no."
                value={profile.address_line1}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Address Line 2</label>
              <input 
                type="text" 
                name="address_line2"
                className="form-input" 
                placeholder="Street name, colony, landmark"
                value={profile.address_line2}
                onChange={handleInputChange}
              />
            </div>

            <div style={styles.row}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">City</label>
                <input 
                  type="text" 
                  name="city"
                  className="form-input" 
                  value={profile.city}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">State</label>
                <input 
                  type="text" 
                  name="state"
                  className="form-input" 
                  value={profile.state}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div style={styles.row}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Postal / Zip Code</label>
                <input 
                  type="text" 
                  name="postal_code"
                  className="form-input" 
                  value={profile.postal_code}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Country</label>
                <input 
                  type="text" 
                  name="country"
                  className="form-input" 
                  value={profile.country}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={saving}>
              {saving ? 'Saving...' : 'Save Details'}
            </button>
          </form>
        </div>

        {/* Right Column: Order History */}
        <div style={styles.ordersCard}>
          <div style={styles.cardHeader}>
            <ShoppingBag size={20} color="var(--color-primary)" />
            <h3 style={styles.cardTitle}>Order Logs</h3>
          </div>

          {orders.length === 0 ? (
            <div style={styles.emptyOrders}>
              <ShoppingBag size={48} color="rgba(28, 53, 45, 0.15)" />
              <p style={styles.emptyText}>No orders logged yet.</p>
              <button className="btn btn-secondary" onClick={() => setActivePage('product')} style={{ marginTop: '1rem' }}>
                Shop Deep Forest Honey
              </button>
            </div>
          ) : (
            <div style={styles.ordersList}>
              {orders.map((o) => (
                <div key={o.id} style={styles.orderItem}>
                  <div style={styles.orderHeader}>
                    <div>
                      <span style={styles.orderId}>Order ID: {o.razorpay_order_id}</span>
                      <div style={styles.orderMeta}>
                        <Calendar size={12} style={{ marginRight: '4px' }} />
                        <span>{new Date(o.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: o.payment_status === 'paid' ? 'rgba(45, 106, 79, 0.1)' : 'rgba(154, 52, 52, 0.1)',
                      color: o.payment_status === 'paid' ? 'var(--color-success)' : 'var(--color-error)'
                    }}>
                      {o.payment_status}
                    </span>
                  </div>

                  <div style={styles.orderItems}>
                    {o.items.map((item, idx) => (
                      <div key={idx} style={styles.itemRow}>
                        <span style={styles.itemName}>{item.name} x {item.quantity}</span>
                        <span style={styles.itemPrice}>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div style={styles.orderTotal}>
                    <span>Total Amount Paid</span>
                    <span style={styles.totalVal}>₹{o.total_amount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    paddingTop: '3rem',
    paddingBottom: '5rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(28, 53, 45, 0.08)',
    paddingBottom: '2rem',
    marginBottom: '3rem',
  },
  title: {
    fontSize: '2.2rem',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: 'var(--color-text-muted)',
    fontSize: '0.95rem',
  },
  logoutBtn: {
    padding: '0.6rem 1.2rem',
    fontSize: '0.85rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '3rem',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-subtle)',
    border: '1px solid rgba(28, 53, 45, 0.05)',
    padding: '2.5rem',
    alignSelf: 'start',
  },
  ordersCard: {
    backgroundColor: '#ffffff',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-subtle)',
    border: '1px solid rgba(28, 53, 45, 0.05)',
    padding: '2.5rem',
    alignSelf: 'start',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    borderBottom: '1px solid rgba(28, 53, 45, 0.08)',
    paddingBottom: '1rem',
    marginBottom: '2rem',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
  },
  row: {
    display: 'flex',
    gap: '1rem',
  },
  alert: {
    padding: '0.85rem 1rem',
    borderLeft: '4px solid',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.88rem',
    marginBottom: '1.5rem',
  },
  emptyOrders: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '4rem 0',
    textAlign: 'center',
  },
  emptyText: {
    color: 'var(--color-text-muted)',
    marginTop: '1rem',
    fontSize: '0.95rem',
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  orderItem: {
    border: '1px solid rgba(28, 53, 45, 0.08)',
    borderRadius: 'var(--radius-md)',
    padding: '1.5rem',
    backgroundColor: 'var(--bg-primary)',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid rgba(28, 53, 45, 0.06)',
    paddingBottom: '1rem',
    marginBottom: '1rem',
  },
  orderId: {
    fontSize: '0.9rem',
    fontWeight: '600',
    fontFamily: 'monospace',
    color: 'var(--color-primary)',
  },
  orderMeta: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
    marginTop: '4px',
  },
  statusBadge: {
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    padding: '4px 10px',
    borderRadius: '20px',
    letterSpacing: '0.05em',
  },
  orderItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid rgba(28, 53, 45, 0.06)',
    marginBottom: '1rem',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9rem',
  },
  itemName: {
    color: 'var(--color-text-main)',
  },
  itemPrice: {
    fontWeight: '500',
  },
  orderTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: 'var(--color-primary)',
  },
  totalVal: {
    fontSize: '1.1rem',
  },
  loading: {
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-muted)',
  }
};

// Add responsive stylesheet injections
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML += `
    @media (max-width: 900px) {
      .container [style*="grid"] {
        grid-template-columns: 1fr !important;
        gap: 2rem !important;
      }
    }
  `;
  document.head.appendChild(style);
}
