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
            How a childhood spent in the Simlipal biosphere forests of Odisha inspired a return to raw wellness rituals.
          </p>
        </div>
      </section>

      {/* Hero Narrative Image */}
      <section style={styles.bannerSection}>
        <img 
          src="/assets/product_gallery_new_5.jpg" 
          alt="Misty ancient forests of Odisha and Jharkhand" 
          style={styles.bannerImg}
        />
        <div style={styles.bannerCaption}>
          "Nature works best when left close to its original form."
        </div>
      </section>

      {/* Chapter 1 */}
      <section style={styles.section}>
        <div className="container journey-grid">
          <div style={styles.textCol}>
            <div style={styles.chapterNum}>Chapter I</div>
            <h2 style={styles.chapterTitle}>Roots in the Forest Heartland</h2>
            <p style={styles.p}>
              Growing up in Odisha, my backyard was not a manicured lawn — it was the edge of something ancient. The forests near Simlipal, one of India's last true biospheres, shaped how I understood food, health, and time.
            </p>
            <p style={styles.p}>
              I remember watching local tribal communities harvest wild honey the way their ancestors did — by hand, by season, by trust. They never took more than the forest could spare. They believed the honey carried the memory of every flower the bees had visited.
            </p>
            <p style={styles.p}>
              That belief stayed with me.
            </p>
          </div>
          <div style={styles.imageCol}>
            <div className="journey-image-box">
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
            "The forest does not need improvement. It only needs to be listened to."
          </p>
        </div>
      </section>

      {/* Chapter 2 & 3 */}
      <section style={{...styles.section, backgroundColor: '#ffffff'}}>
        <div className="container journey-grid-reversed">
          <div style={styles.textCol}>
            <div style={styles.chapterNum}>Chapter II</div>
            <h2 style={styles.chapterTitle}>The Modern Disconnect</h2>
            <p style={styles.p}>
              When I moved to the city, I searched for that same purity. What I found instead was processed honey from unknown sources, stripped of its natural enzymes and pollen.
            </p>
            <p style={styles.p}>
              In 2024, I went back. I spent months reconnecting with tribal harvesting communities across Odisha and Jharkhand — the Simlipal belt, the Chota Nagpur forests. I wanted to bring what they preserved directly to you, without altering its form.
            </p>
            <p style={styles.p}>
              That was how AARINIYA began.
            </p>
          </div>
          <div style={styles.imageCol}>
            <div className="journey-image-box">
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
          <p style={styles.journalSub}>Glimpses of Central Indian wild forests' pristine ecosystems, harvesting traditions, and ceremonies.</p>
          <div className="journey-journal-grid">
            <div className="journal-card journey-journal-card">
              <img src="/assets/aarini_devrani_5.jpg" alt="Aarini Devrani Ceremonial Attire" style={styles.journalImg} loading="lazy" />
              <div style={styles.journalCardOverlay}>
                <span style={styles.journalCardKicker}>Ceremony</span>
                <h4 style={styles.journalCardTitle}>Traditional Central Indian Ceremonial Attire</h4>
              </div>
            </div>
            <div className="journal-card journey-journal-card">
              <img src="/assets/aarini_devrani_1.jpg" alt="Aarini Devrani Packing Honey" style={styles.journalImg} loading="lazy" />
              <div style={styles.journalCardOverlay}>
                <span style={styles.journalCardKicker}>Process</span>
                <h4 style={styles.journalCardTitle}>Small Batch Quality Control</h4>
              </div>
            </div>
            <div className="journal-card journey-journal-card">
              <img src="/assets/aarini_devrani_2.jpg" alt="Aarini Devrani in Nature" style={styles.journalImg} loading="lazy" />
              <div style={styles.journalCardOverlay}>
                <span style={styles.journalCardKicker}>Connection</span>
                <h4 style={styles.journalCardTitle}>Daily Forest Ritual Walk</h4>
              </div>
            </div>
            <div className="journal-card journey-journal-card">
              <img src="/assets/aarini_devrani_3.jpg" alt="Aarini Devrani Forest Story" style={styles.journalImg} loading="lazy" />
              <div style={styles.journalCardOverlay}>
                <span style={styles.journalCardKicker}>Roots</span>
                <h4 style={styles.journalCardTitle}>A Childhood in the Foothills</h4>
              </div>
            </div>
            <div className="journal-card journey-journal-card">
              <img src="/assets/aarini_devrani_4.jpg" alt="Aarini Devrani Authentic Wellness" style={styles.journalImg} loading="lazy" />
              <div style={styles.journalCardOverlay}>
                <span style={styles.journalCardKicker}>Philosophy</span>
                <h4 style={styles.journalCardTitle}>Mindful Wellness Lifestyle</h4>
              </div>
            </div>
            <div className="journal-card journey-journal-card">
              <img src="/assets/product_gallery_new_4.jpg" alt="Beekeeping Harvest" style={styles.journalImg} loading="lazy" />
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
          <div className="journey-values-grid">
            <div style={styles.valueCard}>
              <Trees size={32} color="var(--color-accent)" style={{ marginBottom: '1rem' }} />
              <h3 style={styles.valueName}>Nature First</h3>
              <p style={styles.valueDesc}>Everything we source is kept close to its original state, minimal processing, no added sugars.</p>
            </div>
            <div style={styles.valueCard}>
              <ShieldCheck size={32} color="var(--color-accent)" style={{ marginBottom: '1rem' }} />
              <h3 style={styles.valueName}>Authentic Partnerships</h3>
              <p style={styles.valueDesc}>We support local tribal collectors in Central India, ensuring ethical wages and forest preservation.</p>
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
    height: '380px',
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
    padding: '4rem 0',
    backgroundColor: 'var(--bg-primary)',
  },
  textCol: {
    direction: 'ltr',
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
  narrativeImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  pullQuoteSection: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '3.5rem 0',
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
    padding: '4rem 0',
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
    padding: '4rem 0',
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
  },
  valuesTitle: {
    fontSize: '2.2rem',
    textAlign: 'center',
    marginBottom: '4rem',
    color: '#ffffff',
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
