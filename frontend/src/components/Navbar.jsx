import React from 'react';
import { ShoppingBag, User, Menu, X } from 'lucide-react';

export default function Navbar({ activePage, setActivePage, cartCount, user, onCartOpen }) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleNav = (page) => {
    setActivePage(page);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <nav style={styles.nav}>
      <div className="container" style={styles.navContainer}>
        {/* Mobile Menu Toggle */}
        <button className="nav-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo */}
        <div style={styles.logo} onClick={() => handleNav('home')}>
          AARINIYA
          <span style={styles.tagline}>NATURE'S SWEETEST RITUAL</span>
        </div>

        {/* Links */}
        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <span 
            style={{...styles.link, ...(activePage === 'home' ? styles.activeLink : {})}} 
            onClick={() => handleNav('home')}
          >
            Home
          </span>
          <span 
            style={{...styles.link, ...(activePage === 'product' ? styles.activeLink : {})}} 
            onClick={() => handleNav('product')}
          >
            Deep Forest Honey
          </span>
          <span 
            style={{...styles.link, ...(activePage === 'journey' ? styles.activeLink : {})}} 
            onClick={() => handleNav('journey')}
          >
            Our Journey
          </span>
          <span 
            style={{...styles.link, ...(activePage === 'courses' ? styles.activeLink : {})}} 
            onClick={() => handleNav('courses')}
          >
            Wellness Courses
          </span>
          {user && user.role === 'admin' && (
            <span 
              style={{...styles.link, ...(activePage === 'admin' ? styles.activeLink : {})}} 
              onClick={() => handleNav('admin')}
            >
              Admin Panel
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          {/* User Profile / Auth */}
          <button 
            style={{...styles.iconBtn, ...(activePage === 'profile' || activePage === 'auth' ? styles.activeIcon : {})}}
            onClick={() => handleNav(user ? 'profile' : 'auth')}
            title={user ? `Profile: ${user.full_name}` : 'Login / Signup'}
          >
            <User size={20} />
            {user && <span style={styles.userDot}></span>}
          </button>

          {/* Cart Icon */}
          <button style={styles.iconBtn} onClick={onCartOpen} title="Shopping Cart">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span style={styles.cartBadge}>{cartCount}</span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: 'rgba(251, 249, 244, 0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(28, 53, 45, 0.06)',
    transition: 'var(--transition-smooth)',
  },
  navContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '75px',
    position: 'relative',
  },
  menuBtn: {
    display: 'none',
    background: 'none',
    border: 'none',
    color: 'var(--color-primary)',
    cursor: 'pointer',
    padding: '5px',
  },
  logo: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.4rem',
    fontWeight: '700',
    letterSpacing: '0.15em',
    color: 'var(--color-primary)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    lineHeight: '1.1',
  },
  tagline: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.55rem',
    letterSpacing: '0.2em',
    fontWeight: '500',
    color: 'var(--color-accent)',
    marginTop: '2px',
  },
  links: {
    display: 'flex',
    gap: '2.5rem',
    alignItems: 'center',
  },
  link: {
    fontSize: '0.9rem',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
    position: 'relative',
    padding: '5px 0',
  },
  activeLink: {
    color: 'var(--color-primary)',
    fontWeight: '600',
  },
  actions: {
    display: 'flex',
    gap: '1.2rem',
    alignItems: 'center',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-main)',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transition: 'var(--transition-fast)',
  },
  activeIcon: {
    color: 'var(--color-primary)',
    backgroundColor: 'rgba(28, 53, 45, 0.05)',
  },
  cartBadge: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-primary)',
    fontSize: '0.7rem',
    fontWeight: '700',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDot: {
    position: 'absolute',
    bottom: '4px',
    right: '4px',
    width: '6px',
    height: '6px',
    backgroundColor: 'var(--color-success)',
    borderRadius: '50%',
  },
};
