import { ShieldCheck, Trees, HeartPulse } from 'lucide-react';

export default function MyJourney() {
  return (
    <div style={styles.page}>
      {/* Editorial Header */}
      <section style={styles.header}>
        <div className="container" style={styles.headerContainer}>
          <span style={styles.kicker}>Meet the Founder — Aarini Devrani</span>
          <h1 style={styles.title}>The Forest is Our Compass</h1>
          <p style={styles.subtitle}>
            How a childhood spent in the dense canopy of Northeast India inspired a return to raw wellness rituals.
          </p>
        </div>
      </section>

      {/* Hero Narrative Image */}
      <section style={styles.bannerSection}>
        <img 
          src="/assets/product_gallery_new_5.jpg" 
          alt="Misty Forests of Northeast India" 
          style={styles.bannerImg}
        />
        <div style={styles.bannerCaption}>
          "Nature works best when left close to its original form."
        </div>
      </section>

      {/* Chapter 1 */}
      <section style={styles.section}>
        <div className="container" style={styles.grid}>
          <div style={styles.textCol}>
            <div style={styles.chapterNum}>Chapter I</div>
            <h2 style={styles.chapterTitle}>A Childhood in the Canopy</h2>
            <p style={styles.p}>
              Growing up in the foothills of Northeast India, my backyard wasn’t a manicured lawn; it was a dense, living forest. I was raised in a world where the morning alarm was the call of wild hornbills, and the air carried the scent of wet pine, orchids, and wild ginger. My grandfather, a local elder who knew the language of the mountains, taught me early on that the forest is not something we visit—it is something we belong to.
            </p>
            <p style={styles.p}>
              I remember watching local honey hunters ascend massive trees, using only hand-woven hemp ropes and smoke to respectfully harvest small portions of wild honey. They never took more than the hive could spare. They believed the honey carried the spirit of the forest—the medicinal properties of a thousand wild flowers.
            </p>
          </div>
          <div style={styles.imageCol}>
            <div style={styles.imageBox}>
              <img 
                src="/assets/product_gallery_new_1.jpg" 
                alt="Aarini Devrani in Forest" 
                style={styles.narrativeImg}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quote Breakout */}
      <section style={styles.pullQuoteSection}>
        <div className="container" style={styles.pullQuoteContainer}>
          <p style={styles.pullQuoteText}>
            "We had traded the slow, nourishing rhythms of nature for convenience and shortcuts. Aariniya began as a personal quest to reconnect with purity."
          </p>
        </div>
      </section>

      {/* Chapter 2 & 3 */}
      <section style={{...styles.section, backgroundColor: '#ffffff'}}>
        <div className="container" style={styles.gridReversed}>
          <div style={styles.textCol}>
            <div style={styles.chapterNum}>Chapter II & III</div>
            <h2 style={styles.chapterTitle}>The Modern Disconnect & Returning to the Source</h2>
            <p style={styles.p}>
              When I left the forests to pursue my education and career in the city, I felt an immediate and deep disconnect. The air was heavy, life was rushed, and "wellness" was sold in plastic bottles, packed with artificial ingredients and high-pressure marketing. My energy levels plummeted, my skin lost its glow, and my mind was constantly cluttered.
            </p>
            <p style={styles.p}>
              I began looking for the pure ingredients of my childhood, but all I found was highly processed, pasteurized honey, blended from unknown sources and stripped of its natural pollen and beneficial enzymes.
            </p>
            <p style={styles.p}>
              In 2024, I decided to go back. I spent months traveling through the dense forest valleys, reconnecting with the tribal harvesting communities. I wanted to bring the raw, authentic wellness of the forest to the modern world, without altering its form. That was how Aariniya was born.
            </p>
          </div>
          <div style={styles.imageCol}>
            <div style={styles.imageBox}>
              <img 
                src="/assets/product_gallery_new_2.jpg" 
                alt="Authentic Wellness" 
                style={styles.narrativeImg}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Forest Visual Journal Gallery */}
      <section style={styles.journalSection}>
        <div className="container">
          <h2 style={styles.journalTitle}>Forest Visual Journal</h2>
          <p style={styles.journalSub}>Glimpses of Northeast India's pristine ecosystems, harvesting traditions, and ceremonies.</p>
          <div style={styles.journalGrid}>
            <div className="journal-card" style={styles.journalCard}>
              <img src="/assets/aarini_devrani_5.jpg" alt="Aarini Devrani Ceremonial Attire" style={styles.journalImg} />
              <div style={styles.journalCardOverlay}>
                <span style={styles.journalCardKicker}>Ceremony</span>
                <h4 style={styles.journalCardTitle}>Traditional Northeast Ceremonial Attire</h4>
              </div>
            </div>
            <div className="journal-card" style={styles.journalCard}>
              <img src="/assets/aarini_devrani_1.jpg" alt="Aarini Devrani Packing Honey" style={styles.journalImg} />
              <div style={styles.journalCardOverlay}>
                <span style={styles.journalCardKicker}>Process</span>
                <h4 style={styles.journalCardTitle}>Small Batch Quality Control</h4>
              </div>
            </div>
            <div className="journal-card" style={styles.journalCard}>
              <img src="/assets/aarini_devrani_2.jpg" alt="Aarini Devrani in Nature" style={styles.journalImg} />
              <div style={styles.journalCardOverlay}>
                <span style={styles.journalCardKicker}>Connection</span>
                <h4 style={styles.journalCardTitle}>Daily Forest Ritual Walk</h4>
              </div>
            </div>
            <div className="journal-card" style={styles.journalCard}>
              <img src="/assets/aarini_devrani_3.jpg" alt="Aarini Devrani Forest Story" style={styles.journalImg} />
              <div style={styles.journalCardOverlay}>
                <span style={styles.journalCardKicker}>Roots</span>
                <h4 style={styles.journalCardTitle}>A Childhood in the Foothills</h4>
              </div>
            </div>
            <div className="journal-card" style={styles.journalCard}>
              <img src="/assets/aarini_devrani_4.jpg" alt="Aarini Devrani Authentic Wellness" style={styles.journalImg} />
              <div style={styles.journalCardOverlay}>
                <span style={styles.journalCardKicker}>Philosophy</span>
                <h4 style={styles.journalCardTitle}>Mindful Wellness Lifestyle</h4>
              </div>
            </div>
            <div className="journal-card" style={styles.journalCard}>
              <img src="/assets/product_gallery_new_4.jpg" alt="Beekeeping Harvest" style={styles.journalImg} />
              <div style={styles.journalCardOverlay}>
                <span style={styles.journalCardKicker}>Harvest</span>
                <h4 style={styles.journalCardTitle}>Respectful Wild Hive Harvesting</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem values */}
      <section style={styles.valuesSection}>
        <div className="container">
          <h2 style={styles.valuesTitle}>Our Core Forest Pillars</h2>
          <div style={styles.valuesGrid}>
            <div style={styles.valueCard}>
              <Trees size={32} color="var(--color-accent)" style={{ marginBottom: '1rem' }} />
              <h3 style={styles.valueName}>Nature First</h3>
              <p style={styles.valueDesc}>Everything we source is kept close to its original state, minimal processing, no added sugars.</p>
            </div>
            <div style={styles.valueCard}>
              <ShieldCheck size={32} color="var(--color-accent)" style={{ marginBottom: '1rem' }} />
              <h3 style={styles.valueName}>Authentic Partnerships</h3>
              <p style={styles.valueDesc}>We support local tribal collectors in the Northeast, ensuring ethical wages and forest preservation.</p>
            </div>
            <div style={styles.valueCard}>
              <HeartPulse size={32} color="var(--color-accent)" style={{ marginBottom: '1rem' }} />
              <h3 style={styles.valueName}>Daily Rituals</h3>
              <p style={styles.valueDesc}>We focus on consistency. Small daily changes create compound, long-term health benefits.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: 'var(--bg-primary)',
    fontFamily: 'var(--font-sans)',
  },
  header: {
    padding: '5rem 0 3rem 0',
    textAlign: 'center',
  },
  headerContainer: {
    maxWidth: '800px',
  },
  kicker: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--color-accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    display: 'block',
    marginBottom: '0.75rem',
  },
  title: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  subtitle: {
    fontSize: '1.05rem',
    color: 'var(--color-text-muted)',
    lineHeight: '1.6',
  },
  bannerSection: {
    position: 'relative',
    height: '550px',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  bannerCaption: {
    position: 'absolute',
    color: '#ffffff',
    fontSize: '1.5rem',
    fontFamily: 'var(--font-serif)',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '0 1.5rem',
    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
  },
  section: {
    padding: '6rem 0',
    backgroundColor: 'var(--bg-primary)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    gap: '5rem',
    alignItems: 'center',
  },
  gridReversed: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    gap: '5rem',
    alignItems: 'center',
    direction: 'rtl', // Swaps columns visually
  },
  textCol: {
    direction: 'ltr', // Resets text direction for reversed grid
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  chapterNum: {
    fontFamily: 'var(--font-serif)',
    fontSize: '0.95rem',
    fontStyle: 'italic',
    color: 'var(--color-accent)',
    marginBottom: '0.5rem',
  },
  chapterTitle: {
    fontSize: '2rem',
    marginBottom: '1.5rem',
  },
  p: {
    fontSize: '0.98rem',
    lineHeight: '1.7',
    color: 'var(--color-text-muted)',
    marginBottom: '1.25rem',
  },
  imageCol: {
    display: 'flex',
    justifyContent: 'center',
  },
  imageBox: {
    width: '100%',
    maxWidth: '380px',
    height: '580px',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-medium)',
  },
  narrativeImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  pullQuoteSection: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '5rem 0',
    textAlign: 'center',
    borderTop: '1px solid rgba(28, 53, 45, 0.04)',
    borderBottom: '1px solid rgba(28, 53, 45, 0.04)',
  },
  pullQuoteContainer: {
    maxWidth: '850px',
  },
  pullQuoteText: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.75rem',
    lineHeight: '1.5',
    color: 'var(--color-primary)',
    fontStyle: 'italic',
  },
  journalSection: {
    padding: '7rem 0',
    backgroundColor: '#ffffff',
    borderTop: '1px solid rgba(28, 53, 45, 0.05)',
  },
  journalTitle: {
    fontSize: '2.5rem',
    textAlign: 'center',
    marginBottom: '0.5rem',
    color: 'var(--color-primary)',
  },
  journalSub: {
    fontSize: '1rem',
    textAlign: 'center',
    color: 'var(--color-text-muted)',
    marginBottom: '4rem',
  },
  journalGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2rem',
  },
  journalCard: {
    position: 'relative',
    height: '420px',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-subtle)',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  journalImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.6s ease',
  },
  journalCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    padding: '2rem 1.5rem',
    background: 'linear-gradient(to top, rgba(10, 25, 20, 0.9) 0%, rgba(10, 25, 20, 0.4) 60%, rgba(10, 25, 20, 0) 100%)',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'end',
    transition: 'opacity 0.3s ease',
  },
  journalCardKicker: {
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: 'var(--color-accent)',
    marginBottom: '0.4rem',
  },
  journalCardTitle: {
    fontSize: '1.15rem',
    fontWeight: '500',
    color: '#ffffff',
    margin: 0,
  },
  valuesSection: {
    padding: '6rem 0',
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
  },
  valuesTitle: {
    fontSize: '2.2rem',
    textAlign: 'center',
    marginBottom: '4rem',
    color: '#ffffff',
  },
  valuesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '3rem',
  },
  valueCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '1rem',
  },
  valueName: {
    fontSize: '1.25rem',
    color: '#ffffff',
    marginBottom: '0.75rem',
  },
  valueDesc: {
    fontSize: '0.9rem',
    lineHeight: '1.6',
    color: '#a9b9b3',
  }
};

// Inject responsive rules
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML += `
    @media (max-width: 900px) {
      [style*="chapterTitle"] {
        font-size: 1.75rem !important;
      }
      [style*="pullQuoteText"] {
        font-size: 1.4rem !important;
      }
      .container [style*="grid"], .container [style*="gridReversed"] {
        grid-template-columns: 1fr !important;
        gap: 3rem !important;
      }
      .container [style*="valuesGrid"] {
        grid-template-columns: 1fr !important;
        gap: 2rem !important;
      }
      [style*="imageBox"] {
        height: 380px !important;
      }
      .container [style*="journalGrid"] {
        grid-template-columns: 1fr 1fr !important;
        gap: 2rem !important;
      }
      [style*="journalCard"] {
        height: 350px !important;
      }
    }
    @media (max-width: 600px) {
      .container [style*="journalGrid"] {
        grid-template-columns: 1fr !important;
      }
    }
    .journal-card:hover img {
      transform: scale(1.05);
    }
  `;
  document.head.appendChild(style);
}
