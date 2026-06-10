import { ArrowRight, Leaf, Shield, Compass, Sparkles } from 'lucide-react';

export default function Home({ setActivePage }) {
  const handleNav = (page) => {
    setActivePage(page);
    window.scrollTo(0, 0);
  };

  return (
    <div style={styles.wrapper}>
      {/* Hero Section */}
      <header style={styles.hero}>
        <div style={styles.heroOverlay}></div>
        <div className="container" style={styles.heroContent}>
          <span style={styles.heroKicker}>Nature's Sweetest Ritual</span>
          <h1 className="home-hero-title" style={styles.heroTitle}>A Wellness Brand inspired by the forests of Northeast India</h1>
          <p style={styles.heroText}>
            Built on the belief that nature already provides what modern life often lacks — simplicity, balance, and nourishment.
          </p>
          <div style={styles.heroBtns}>
            <button className="btn btn-accent" onClick={() => handleNav('product')}>
              Shop Flagship Honey
              <ArrowRight size={16} style={{ marginLeft: '8px' }} />
            </button>
            <button className="btn btn-secondary" style={styles.heroSecondaryBtn} onClick={() => handleNav('journey')}>
              Our Story
            </button>
          </div>
        </div>
      </header>

      {/* Flagship Product Teaser Section */}
      <section style={styles.teaserSection}>
        <div className="container home-teaser-grid responsive-grid-2" style={styles.teaserGrid}>
          <div className="home-teaser-image-container" style={styles.teaserImageContainer}>
            <img 
              src="/assets/product_jar_forest.jpg" 
              alt="Aariniya Deep Forest Honey Jar" 
              style={styles.teaserImage}
            />
            <div style={styles.badge}>Best Seller</div>
          </div>
          <div style={styles.teaserContent}>
            <span style={styles.teaserKicker}>First Release</span>
            <h2 style={styles.teaserTitle}>Deep Forest Multifloral Honey</h2>
            <p style={styles.teaserText}>
              Harvested from untouched forest regions rich in natural biodiversity. This raw, unfiltered forest honey has a thick, golden texture and a distinctive woody/floral flavor profile. Not just a sweetener—it is a daily grounding wellness ritual.
            </p>
            <ul style={styles.teaserList}>
              <li style={styles.teaserListItem}><Leaf size={16} color="var(--color-accent)" /> Raw, Unfiltered & Pure Honey</li>
              <li style={styles.teaserListItem}><Shield size={16} color="var(--color-accent)" /> Small-Batch Packed in Premium Glass</li>
              <li style={styles.teaserListItem}><Compass size={16} color="var(--color-accent)" /> Harvested Respectfully by Local Tribes</li>
            </ul>
            <button className="btn btn-primary" onClick={() => handleNav('product')} style={{ marginTop: '1.5rem' }}>
              Explore Honey Details
            </button>
          </div>
        </div>
      </section>

      {/* The Aariniya Way - Rituals */}
      <section style={styles.ritualsSection}>
        <div className="container">
          <div style={styles.sectionHeader}>
            <span style={styles.sectionKicker}>Our Philosophy</span>
            <h2 style={styles.sectionTitle}>The Aariniya Way</h2>
            <p style={styles.sectionSub}>Wellness is not a destination. It is a slow, daily ritual.</p>
          </div>

          <div className="home-rituals-grid responsive-grid-4" style={styles.ritualsGrid}>
            <div style={styles.ritualCard}>
              <div style={styles.ritualNum}>01</div>
              <h3 style={styles.ritualTitle}>Wake Up With Intention</h3>
              <p style={styles.ritualText}>Start your mornings with mindfulness. Set a quiet boundary before the rush of the digital world.</p>
            </div>
            <div style={styles.ritualCard}>
              <div style={styles.ritualNum}>02</div>
              <h3 style={styles.ritualTitle}>Move Your Body</h3>
              <p style={styles.ritualText}>Spend 20-30 minutes doing morning yoga flow or dynamic movement to release stiffness and tension.</p>
            </div>
            <div style={styles.ritualCard}>
              <div style={styles.ritualNum}>03</div>
              <h3 style={styles.ritualTitle}>Choose Better Nutrition</h3>
              <p style={styles.ritualText}>Ditch processed sugars. Fuel your body with raw forest honey, whole foods, and herbal nutrients.</p>
            </div>
            <div style={styles.ritualCard}>
              <div style={styles.ritualNum}>04</div>
              <h3 style={styles.ritualTitle}>Stay Connected to Nature</h3>
              <p style={styles.ritualText}>Time spent outdoors re-aligns your nervous system. Walk in the park, breathe the pine, feel the soil.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Profile Teaser */}
      <section style={styles.founderSection}>
        <div className="container home-founder-grid responsive-grid-2" style={styles.founderGrid}>
          <div style={styles.founderContent}>
            <span style={styles.teaserKicker}>Behind the Brand</span>
            <h2 style={styles.teaserTitle}>Meet Aarini Devrani</h2>
            <p style={styles.teaserText}>
              "Raised near the waterfalls and dense pine forests of Northeast India, I learned early that health is not built through shortcuts. It is built through small daily practices—morning movement, time outdoors, and mindful nutrition."
            </p>
            <p style={styles.teaserText}>
              Aariniya represents a return to that simplicity. By partnering with tribal honey collectors and local organic growers, we invite you to take a breath, slow down, and integrate pure, forest-sourced nutrition into your life.
            </p>
            <button className="btn btn-secondary" onClick={() => handleNav('journey')} style={{ marginTop: '1rem' }}>
              Read the Full Story
            </button>
          </div>
          <div style={styles.founderImages}>
            <div className="home-founder-image-frame" style={styles.founderImageFrame}>
              <img 
                src="/assets/product_gallery_new_3.jpg" 
                alt="Aarini Devrani morning wellness ritual" 
                style={styles.founderImage}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quote Banner */}
      <section style={styles.quoteSection}>
        <div className="container" style={styles.quoteContainer}>
          <Sparkles size={32} color="var(--color-accent)" style={{ marginBottom: '1.5rem' }} />
          <blockquote style={styles.quote}>
            "Nature works best when left close to its original form. Simple actions repeated consistently create meaningful, long-term change."
          </blockquote>
          <cite style={styles.cite}>— The Aariniya Philosophy</cite>
        </div>
      </section>
    </div>
  );
}

const styles = {
  wrapper: {
    overflowX: 'hidden',
  },
  hero: {
    position: 'relative',
    minHeight: '85vh',
    display: 'flex',
    alignItems: 'center',
    background: 'url("/assets/product_jar_forest.jpg") no-repeat center center',
    backgroundSize: 'cover',
    color: '#ffffff',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(28, 53, 45, 0.65)', // Elegant dark forest green overlay
    zIndex: 1,
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '800px',
    paddingTop: '2rem',
  },
  heroKicker: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.9rem',
    fontWeight: '600',
    letterSpacing: '0.25em',
    color: 'var(--color-accent)',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '1rem',
  },
  heroTitle: {
    fontFamily: 'var(--font-serif)',
    fontSize: '3.5rem',
    color: '#ffffff',
    marginBottom: '1.5rem',
    fontWeight: '700',
    lineHeight: '1.15',
  },
  heroText: {
    fontFamily: 'var(--font-sans)',
    fontSize: '1.1rem',
    lineHeight: '1.6',
    color: '#edf2f0',
    marginBottom: '2.5rem',
    fontWeight: '300',
    maxWidth: '600px',
  },
  heroBtns: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  heroSecondaryBtn: {
    color: '#ffffff',
    borderColor: '#ffffff',
  },
  teaserSection: {
    padding: '7rem 0',
    backgroundColor: '#ffffff',
  },
  teaserGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '5rem',
    alignItems: 'center',
  },
  teaserImageContainer: {
    position: 'relative',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-medium)',
    height: '650px',
  },
  teaserImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    display: 'block',
    transition: 'var(--transition-smooth)',
  },
  badge: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--bg-primary)',
    padding: '6px 14px',
    fontSize: '0.75rem',
    fontWeight: '600',
    borderRadius: '40px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  teaserContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  teaserKicker: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    fontWeight: '600',
    letterSpacing: '0.15em',
    color: 'var(--color-accent)',
    textTransform: 'uppercase',
    marginBottom: '0.5rem',
  },
  teaserTitle: {
    fontSize: '2.5rem',
    marginBottom: '1.25rem',
  },
  teaserText: {
    fontSize: '1rem',
    lineHeight: '1.65',
    color: 'var(--color-text-muted)',
    marginBottom: '1.5rem',
  },
  teaserList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
    marginBottom: '1.5rem',
  },
  teaserListItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.95rem',
    color: 'var(--color-text-main)',
    fontWeight: '500',
  },
  ritualsSection: {
    padding: '7rem 0',
    backgroundColor: 'var(--bg-secondary)',
  },
  sectionHeader: {
    textAlign: 'center',
    maxWidth: '600px',
    margin: '0 auto 4.5rem auto',
  },
  sectionKicker: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    fontWeight: '600',
    letterSpacing: '0.2em',
    color: 'var(--color-accent)',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '0.5rem',
  },
  sectionTitle: {
    fontSize: '2.5rem',
    marginBottom: '0.75rem',
  },
  sectionSub: {
    color: 'var(--color-text-muted)',
    fontSize: '1rem',
  },
  ritualsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '2rem',
  },
  ritualCard: {
    backgroundColor: '#ffffff',
    padding: '2.5rem',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-subtle)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'var(--transition-smooth)',
  },
  ritualNum: {
    fontFamily: 'var(--font-serif)',
    fontSize: '2rem',
    color: 'rgba(28, 53, 45, 0.1)',
    fontWeight: '700',
    marginBottom: '1.5rem',
  },
  ritualTitle: {
    fontSize: '1.25rem',
    marginBottom: '1rem',
    color: 'var(--color-primary)',
  },
  ritualText: {
    fontSize: '0.9rem',
    lineHeight: '1.6',
    color: 'var(--color-text-muted)',
  },
  founderSection: {
    padding: '7rem 0',
    backgroundColor: '#ffffff',
  },
  founderGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '5rem',
    alignItems: 'center',
  },
  founderImages: {
    display: 'flex',
    justifyContent: 'center',
  },
  founderImageFrame: {
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-medium)',
    width: '100%',
    maxWidth: '400px',
    height: '580px',
  },
  founderImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  quoteSection: {
    padding: '6rem 0',
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
    textAlign: 'center',
  },
  quoteContainer: {
    maxWidth: '750px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  quote: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.8rem',
    lineHeight: '1.5',
    marginBottom: '1.5rem',
    fontStyle: 'italic',
  },
  cite: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'var(--color-accent)',
  }
};

