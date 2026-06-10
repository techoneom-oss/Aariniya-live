import { useState } from 'react';
import { Mail, Lock, User, Phone, CheckCircle, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Auth({ setGlobalUser, setActivePage }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : { email: formData.email, password: formData.password, full_name: formData.full_name, phone: formData.phone };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Save token and user details
      localStorage.setItem('aariniya_token', data.token);
      localStorage.setItem('aariniya_user', JSON.stringify(data.user));
      
      setSuccessMsg(isLogin ? 'Welcome back to Aariniya!' : 'Account created successfully!');
      
      setTimeout(() => {
        setGlobalUser(data.user);
        setActivePage('home');
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.authCard}>
        {/* Toggle tabs */}
        <div style={styles.tabs}>
          <button 
            style={{...styles.tab, ...(isLogin ? styles.activeTab : {})}}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Login
          </button>
          <button 
            style={{...styles.tab, ...(!isLogin ? styles.activeTab : {})}}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Create Account
          </button>
        </div>

        <div style={styles.cardContent}>
          <h2 style={styles.title}>
            {isLogin ? 'Welcome Back' : 'Join the Aariniya Way'}
          </h2>
          <p style={styles.subtitle}>
            {isLogin 
              ? 'Enter your credentials to access your daily wellness ritual.'
              : 'Create an account to track your orders, save addresses, and access premium courses.'}
          </p>

          {error && <div style={styles.errorAlert}>{error}</div>}
          
          {successMsg ? (
            <div style={styles.successContainer}>
              <CheckCircle size={48} color="var(--color-success)" />
              <p style={styles.successText}>{successMsg}</p>
              <p style={styles.redirectText}>Redirecting you to the rituals page...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={styles.form}>
              {/* Full Name (Sign Up only) */}
              {!isLogin && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div style={styles.inputWrapper}>
                    <User style={styles.inputIcon} size={18} />
                    <input 
                      type="text" 
                      name="full_name"
                      placeholder="Aarini Devrani" 
                      className="form-input"
                      style={styles.paddedInput}
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={styles.inputWrapper}>
                  <Mail style={styles.inputIcon} size={18} />
                  <input 
                    type="email" 
                    name="email"
                    placeholder="name@example.com" 
                    className="form-input"
                    style={styles.paddedInput}
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Phone (Sign Up only) */}
              {!isLogin && (
                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  <div style={styles.inputWrapper}>
                    <Phone style={styles.inputIcon} size={18} />
                    <input 
                      type="tel" 
                      name="phone"
                      placeholder="e.g. +91 98765-43210" 
                      className="form-input"
                      style={styles.paddedInput}
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={styles.inputWrapper}>
                  <Lock style={styles.inputIcon} size={18} />
                  <input 
                    type="password" 
                    name="password"
                    placeholder="••••••••" 
                    className="form-input"
                    style={styles.paddedInput}
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-block" 
                style={styles.submitBtn}
                disabled={loading}
              >
                {loading ? 'Please wait...' : (isLogin ? 'Login to Portal' : 'Register Account')}
                {!loading && <ArrowRight size={16} style={{ marginLeft: '8px' }} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    background: 'radial-gradient(circle at 10% 20%, rgba(244, 238, 225, 0.4) 0%, rgba(251, 249, 244, 0.8) 90.1%)',
  },
  authCard: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: '#ffffff',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-medium)',
    overflow: 'hidden',
    border: '1px solid rgba(28, 53, 45, 0.05)',
  },
  tabs: {
    display: 'flex',
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: '1px solid rgba(28, 53, 45, 0.08)',
  },
  tab: {
    flex: 1,
    padding: '1.2rem',
    background: 'none',
    border: 'none',
    fontSize: '0.9rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  activeTab: {
    backgroundColor: '#ffffff',
    color: 'var(--color-primary)',
    borderBottom: '2px solid var(--color-accent)',
  },
  cardContent: {
    padding: '2.5rem',
  },
  title: {
    fontSize: '1.8rem',
    marginBottom: '0.5rem',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '0.88rem',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    lineHeight: '1.5',
    marginBottom: '2rem',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--color-text-muted)',
  },
  paddedInput: {
    paddingLeft: '38px',
  },
  submitBtn: {
    marginTop: '1.5rem',
    height: '50px',
  },
  errorAlert: {
    padding: '0.85rem 1rem',
    backgroundColor: '#fdf0f0',
    color: 'var(--color-error)',
    borderLeft: '4px solid var(--color-error)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.88rem',
    marginBottom: '1.5rem',
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 0',
    textAlign: 'center',
  },
  successText: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--color-primary)',
    marginTop: '1rem',
  },
  redirectText: {
    fontSize: '0.9rem',
    color: 'var(--color-text-muted)',
    marginTop: '0.5rem',
  }
};
