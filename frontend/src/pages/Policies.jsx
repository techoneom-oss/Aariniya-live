import { useEffect } from 'react';

export default function Policies({ section }) {
  useEffect(() => {
    if (section) {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [section]);

  return (
    <div style={styles.page}>
      <div className="container" style={styles.container}>
        <h1 style={styles.mainTitle}>Shipping, Returns & Policies</h1>
        
        <section id="shipping" style={styles.section}>
          <h2 style={styles.sectionTitle}>Shipping Policy</h2>
          <ul style={styles.list}>
            <li>Free shipping across India on all orders.</li>
            <li>Orders dispatched within 2 business days.</li>
            <li>Estimated delivery: 3–6 business days (metros), 5–9 days (remote areas).</li>
            <li>Tracking link shared via WhatsApp/email after dispatch.</li>
            <li>We currently ship within India only.</li>
          </ul>
        </section>

        <section id="returns" style={styles.section}>
          <h2 style={styles.sectionTitle}>Return & Replacement Policy</h2>
          <ul style={styles.list}>
            <li>7-day return window from date of delivery.</li>
            <li>Eligible for return: damaged packaging, wrong product, quality issue.</li>
            <li>Not eligible: change of mind after opening.</li>
            <li>Process: WhatsApp us at [number] with your order details and a photo within 7 days.</li>
            <li>Refund: processed within 5–7 business days to original payment method.</li>
          </ul>
        </section>

        <section id="privacy" style={styles.section}>
          <h2 style={styles.sectionTitle}>Privacy Policy</h2>
          <ul style={styles.list}>
            <li>We collect only name, email, phone, and delivery address for order fulfilment.</li>
            <li>We do not sell or share your data with third parties.</li>
            <li>Email captured via the Forest Glow Tea waitlist is used only for that launch notification.</li>
            <li>You can request deletion of your data by emailing us.</li>
          </ul>
        </section>

        <section id="contact" style={styles.section}>
          <h2 style={styles.sectionTitle}>Contact</h2>
          <ul style={styles.list}>
            <li><strong>Email:</strong> [OWNER TO ADD]</li>
            <li><strong>WhatsApp:</strong> [OWNER TO ADD]</li>
            <li><strong>Instagram:</strong> <a href="https://www.instagram.com/aarinidevrani" target="_blank" rel="noopener noreferrer" style={styles.link}>@aarinidevrani</a></li>
            <li><strong>Response time:</strong> within 24 hours on business days.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: '4rem 0 6rem',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--color-text-main)',
    fontFamily: 'var(--font-sans)',
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  mainTitle: {
    fontSize: '2.5rem',
    fontFamily: 'var(--font-serif)',
    color: 'var(--color-primary)',
    marginBottom: '3rem',
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: '0.02em',
  },
  section: {
    marginBottom: '3rem',
    backgroundColor: '#fff',
    padding: '2.5rem',
    borderRadius: 'var(--radius-lg)',
    boxShadow: '0 4px 20px rgba(28, 53, 45, 0.03)',
    border: '1px solid rgba(28, 53, 45, 0.04)',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontFamily: 'var(--font-serif)',
    color: 'var(--color-primary)',
    marginBottom: '1.25rem',
    borderBottom: '1px solid rgba(28, 53, 45, 0.08)',
    paddingBottom: '0.75rem',
    fontWeight: '600',
  },
  list: {
    paddingLeft: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    lineHeight: '1.6',
    fontSize: '0.95rem',
    color: 'var(--color-text-main)',
  },
  link: {
    color: 'var(--color-accent)',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'var(--transition-fast)',
  }
};
