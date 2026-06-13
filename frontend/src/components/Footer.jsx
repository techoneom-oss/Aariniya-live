

export default function Footer({ setActivePage, onPoliciesNav }) {
  const handleNav = (page) => {
    setActivePage(page);
    window.scrollTo(0, 0);
  };

  const handlePoliciesNav = (section) => {
    if (onPoliciesNav) {
      onPoliciesNav(section);
    } else {
      setActivePage('policies');
    }
  };

  return (
    <footer style={styles.footer}>
      <div className="container footer-grid">
        {/* Brand Column */}
        <div style={styles.brandCol}>
          <h3 style={styles.logo}>AARINIYA</h3>
          <p style={styles.mission}>
            Harvesting pure, raw forest products inspired by the natural richness and traditional wisdom of Central Indian wild forests.
          </p>
          <div style={styles.promiseBox}>
            <span style={styles.promiseTitle}>Our Promise:</span>
            <span style={styles.promiseText}>Raw. Authentic. Sourced ethically.</span>
          </div>
        </div>

        {/* Navigation Column */}
        <div>
          <h4 style={styles.heading}>Discover</h4>
          <ul style={styles.list}>
            <li style={styles.listItem} onClick={() => handleNav('home')}>Home</li>
            <li style={styles.listItem} onClick={() => handleNav('product')}>Deep Forest Honey</li>
            <li style={styles.listItem} onClick={() => handleNav('journey')}>Our Story</li>
            <li style={styles.listItem} onClick={() => handleNav('courses')}>Yoga & Diet Plans</li>
          </ul>
        </div>

        {/* Contact Column */}
        <div>
          <h4 style={styles.heading}>Connect</h4>
          <p style={styles.text}>Aariniya Wellness</p>
          <p style={{ ...styles.text, marginTop: '0.75rem' }}>
            <a 
              href="https://www.instagram.com/aarinidevrani" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ 
                color: '#ffffff', 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px',
                fontWeight: '500',
                fontSize: '0.9rem'
              }} 
              className="hover-gold"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              Follow @aarinidevrani on Instagram
            </a>
          </p>
        </div>

        {/* Newsletter Column */}
        <div>
          <h4 style={styles.heading}>The Ritual Journal</h4>
          <p style={styles.text}>Subscribe to receive mindful recipes, yoga schedules, and forest harvests.</p>
          <form style={styles.form} onSubmit={(e) => { e.preventDefault(); alert("Welcome to the Aariniya Circle!"); e.target.reset(); }}>
            <input 
              type="email" 
              placeholder="Your email address" 
              style={styles.input}
              required
            />
            <button type="submit" style={styles.submitBtn}>Join</button>
          </form>
        </div>
      </div>

      <div style={styles.bottom}>
        <div className="container" style={styles.bottomContainer}>
          <div>
            <p style={styles.copy}>© {new Date().getFullYear()} AARINIYA Wellness. All rights reserved.</p>
            <p style={{ ...styles.copy, marginTop: '4px' }}>Sourced from Odisha & Jharkhand | Shipped across India</p>
          </div>
          <div style={styles.footerLinks}>
            <span style={{ ...styles.footerLink, fontSize: '12px' }} onClick={() => handlePoliciesNav('shipping')}>Shipping Policy</span>
            <span style={{ ...styles.footerLink, fontSize: '12px', color: '#849790' }}>|</span>
            <span style={{ ...styles.footerLink, fontSize: '12px' }} onClick={() => handlePoliciesNav('returns')}>Returns & Refunds</span>
            <span style={{ ...styles.footerLink, fontSize: '12px', color: '#849790' }}>|</span>
            <span style={{ ...styles.footerLink, fontSize: '12px' }} onClick={() => handlePoliciesNav('privacy')}>Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    backgroundColor: 'var(--color-primary)',
    color: '#dbe3e0',
    padding: '4.5rem 0 0 0',
    fontFamily: 'var(--font-sans)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr',
    gap: '3rem',
    paddingBottom: '3.5rem',
  },
  brandCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  logo: {
    color: '#ffffff',
    fontFamily: 'var(--font-serif)',
    fontSize: '1.8rem',
    fontWeight: '700',
    letterSpacing: '0.12em',
    marginBottom: '0.5rem',
  },
  mission: {
    fontSize: '0.9rem',
    lineHeight: '1.6',
    color: '#a9b9b3',
  },
  promiseBox: {
    marginTop: '0.5rem',
    borderLeft: '2px solid var(--color-accent)',
    paddingLeft: '0.8rem',
    display: 'flex',
    flexDirection: 'column',
  },
  promiseTitle: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--color-accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  promiseText: {
    fontSize: '0.85rem',
    color: '#ffffff',
  },
  heading: {
    color: '#ffffff',
    fontFamily: 'var(--font-serif)',
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    letterSpacing: '0.05em',
  },
  list: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
  },
  listItem: {
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
    color: '#a9b9b3',
  },
  text: {
    fontSize: '0.9rem',
    lineHeight: '1.6',
    color: '#a9b9b3',
    marginBottom: '0.5rem',
  },
  form: {
    marginTop: '1rem',
    display: 'flex',
  },
  input: {
    flex: 1,
    padding: '0.75rem 1rem',
    border: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '0.9rem',
    borderTopLeftRadius: 'var(--radius-sm)',
    borderBottomLeftRadius: 'var(--radius-sm)',
    outline: 'none',
  },
  submitBtn: {
    padding: '0 1.25rem',
    backgroundColor: 'var(--color-accent)',
    border: 'none',
    color: 'var(--color-primary)',
    fontWeight: '600',
    cursor: 'pointer',
    borderTopRightRadius: 'var(--radius-sm)',
    borderBottomRightRadius: 'var(--radius-sm)',
    transition: 'var(--transition-fast)',
  },
  bottom: {
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '1.5rem 0',
  },
  bottomContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  copy: {
    fontSize: '0.8rem',
    color: '#849790',
  },
  footerLinks: {
    display: 'flex',
    gap: '1.5rem',
  },
  footerLink: {
    fontSize: '0.8rem',
    color: '#849790',
    cursor: 'pointer',
  }
};


