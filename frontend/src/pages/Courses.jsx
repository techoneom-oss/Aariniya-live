import React, { useState, useEffect } from 'react';
import { Calendar, Tag, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Courses({ onEnrollCourse }) {
  const [courses, setCourses] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses`);
      if (!res.ok) throw new Error("Failed to load courses");
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = filter === 'all' 
    ? courses 
    : courses.filter(c => c.type === filter);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem' }}>Aligning energetic courses...</p>
      </div>
    );
  }

  return (
    <div className="container" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.kicker}>Aariniya Wellness Ecosystem</span>
        <h1 style={styles.title}>Yoga Courses & Nourishing Diet Plans</h1>
        <p style={styles.subtitle}>
          Elevate your daily rituals. Explore guided practices and nutrition blueprints designed to restore balance and vitality.
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={styles.filterTabs}>
        <button 
          style={{...styles.tabBtn, ...(filter === 'all' ? styles.activeTabBtn : {})}}
          onClick={() => setFilter('all')}
        >
          All Offerings
        </button>
        <button 
          style={{...styles.tabBtn, ...(filter === 'yoga' ? styles.activeTabBtn : {})}}
          onClick={() => setFilter('yoga')}
        >
          Yoga & Breathwork
        </button>
        <button 
          style={{...styles.tabBtn, ...(filter === 'diet' ? styles.activeTabBtn : {})}}
          onClick={() => setFilter('diet')}
        >
          Dietary Blueprints
        </button>
      </div>

      {/* Courses Grid */}
      <div style={styles.grid}>
        {filteredCourses.map((c) => (
          <div key={c.id} className="card" style={styles.courseCard}>
            <div style={styles.imageBox}>
              <img src={c.image} alt={c.title} style={styles.image} />
              <span style={{
                ...styles.typeBadge,
                backgroundColor: c.type === 'yoga' ? 'var(--color-primary)' : 'var(--color-accent)',
                color: c.type === 'yoga' ? '#ffffff' : 'var(--color-primary)'
              }}>
                {c.type === 'yoga' ? 'Yoga' : 'Diet'}
              </span>
            </div>

            <div style={styles.cardContent}>
              <div style={styles.durationRow}>
                <Calendar size={14} style={{ marginRight: '4px' }} />
                <span>{c.duration}</span>
              </div>

              <h3 style={styles.courseTitle}>{c.title}</h3>
              <p style={styles.courseSubtitle}>{c.subtitle}</p>
              <p style={styles.description}>{c.description}</p>
              
              <div style={styles.footerRow}>
                <div style={styles.priceCol}>
                  <span style={styles.priceLabel}>Access Fee</span>
                  <span style={styles.priceVal}>₹{c.price}</span>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={styles.enrollBtn}
                  onClick={() => onEnrollCourse({
                    id: `course_${c.id}`,
                    name: c.title,
                    price: c.price,
                    image: c.image,
                    isCourse: true
                  })}
                >
                  Enroll Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trust Banner */}
      <div style={styles.trustBanner}>
        <Sparkles size={24} color="var(--color-accent)" style={{ marginBottom: '1rem' }} />
        <h3 style={styles.trustTitle}>The Digital Wellness Promise</h3>
        <p style={styles.trustText}>
          Once enrolled, you will receive lifetime access instructions via email and your Aariniya portal profile. No recurring charges. Cancel or request support anytime.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    paddingTop: '3.5rem',
    paddingBottom: '6rem',
    fontFamily: 'var(--font-sans)',
  },
  header: {
    textAlign: 'center',
    maxWidth: '700px',
    margin: '0 auto 3.5rem auto',
  },
  kicker: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--color-accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    display: 'block',
    marginBottom: '0.5rem',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  },
  subtitle: {
    fontSize: '1rem',
    color: 'var(--color-text-muted)',
    lineHeight: '1.6',
  },
  filterTabs: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '3.5rem',
  },
  tabBtn: {
    padding: '0.65rem 1.5rem',
    borderRadius: '40px',
    border: '1px solid rgba(28, 53, 45, 0.12)',
    backgroundColor: '#ffffff',
    color: 'var(--color-text-muted)',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  activeTabBtn: {
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
    borderColor: 'var(--color-primary)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2.5rem',
    marginBottom: '5rem',
  },
  courseCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  imageBox: {
    position: 'relative',
    height: '220px',
    width: '100%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  typeBadge: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    padding: '4px 10px',
    fontSize: '0.75rem',
    fontWeight: '600',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  cardContent: {
    padding: '1.75rem',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  durationRow: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
    marginBottom: '0.75rem',
  },
  courseTitle: {
    fontSize: '1.35rem',
    marginBottom: '0.5rem',
    lineHeight: '1.25',
  },
  courseSubtitle: {
    fontSize: '0.85rem',
    color: 'var(--color-accent)',
    fontWeight: '600',
    marginBottom: '1rem',
  },
  description: {
    fontSize: '0.9rem',
    lineHeight: '1.6',
    color: 'var(--color-text-muted)',
    marginBottom: '2rem',
    flex: 1,
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(28, 53, 45, 0.08)',
    paddingTop: '1.25rem',
  },
  priceCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  priceLabel: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.05em',
  },
  priceVal: {
    fontSize: '1.35rem',
    fontWeight: '700',
    color: 'var(--color-primary)',
  },
  enrollBtn: {
    padding: '0.55rem 1.25rem',
    fontSize: '0.85rem',
  },
  trustBanner: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    padding: '3rem',
    textAlign: 'center',
    maxWidth: '850px',
    margin: '0 auto',
    border: '1px solid rgba(28, 53, 45, 0.05)',
  },
  trustTitle: {
    fontSize: '1.5rem',
    marginBottom: '0.75rem',
  },
  trustText: {
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: 'var(--color-text-muted)',
    maxWidth: '650px',
    margin: '0 auto',
  },
  loading: {
    minHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-muted)',
  }
};

// Inject responsive grid styling
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML += `
    @media (max-width: 991px) {
      .container [style*="grid"] {
        grid-template-columns: 1fr 1fr !important;
        gap: 2rem !important;
      }
    }
    @media (max-width: 650px) {
      .container [style*="grid"] {
        grid-template-columns: 1fr !important;
      }
    }
  `;
  document.head.appendChild(style);
}
