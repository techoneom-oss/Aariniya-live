import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, Share2, RotateCcw, Mail, Lock } from 'lucide-react';
import { API_BASE_URL } from '../config';

const InstagramIcon = ({ size = 20, style = {} }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const QUESTIONS = [
  {
    id: 1,
    question: "How do you feel most mornings when you wake up?",
    options: [
      "Tired and slow — need time to start",
      "Anxious or already thinking about the day",
      "Energetic but scattered, hard to focus",
      "Calm but a bit stiff or heavy"
    ]
  },
  {
    id: 2,
    question: "What's your biggest health concern right now?",
    options: [
      "Skin — dullness, breakouts, or uneven tone",
      "Digestion — bloating, acidity, or irregular gut",
      "Energy — constant fatigue or afternoon crashes",
      "Stress — overthinking, poor sleep, or mood swings"
    ]
  },
  {
    id: 3,
    question: "How would you describe your current relationship with food?",
    options: [
      "I eat whatever is convenient — not very mindful",
      "I try to eat healthy but cravings win often",
      "I follow a fairly clean diet but want more nourishment",
      "I eat well but still feel something is missing"
    ]
  },
  {
    id: 4,
    question: "When do you feel most at peace?",
    options: [
      "Early morning before the world wakes up",
      "After a good workout or movement session",
      "In nature — parks, forests, open spaces",
      "With a warm drink and quiet time to myself"
    ]
  },
  {
    id: 5,
    question: "Which of these sounds most like your current daily habit?",
    options: [
      "I have no real wellness routine yet",
      "I try things but nothing has stuck",
      "I have a routine but it feels incomplete",
      "I have rituals but want to deepen them"
    ]
  },
  {
    id: 6,
    question: "What do you want most from your wellness journey?",
    options: [
      "Visible glow — better skin and natural radiance",
      "Gut reset — lighter, cleaner from inside",
      "Steady energy — no more crashes or fatigue",
      "Inner calm — less stress, better sleep"
    ]
  }
];

const RESULTS = {
  "Golden Bloom": {
    tagline: "Your body is asking for radiance from within",
    description: "You are drawn to beauty, calm mornings, and slow nourishment. Your wellness journey is about glow — not just skin deep, but the kind that comes from consistent, gentle rituals.",
    ritual: "Start your morning with warm water + 1 tsp AARINIYA honey + a few drops of lemon. Let this be your 2-minute morning ritual before anything else.",
    product: "AARINIYA Deep Forest Honey — your base ritual ingredient."
  },
  "Deep Root": {
    tagline: "Your gut is the foundation — everything starts there",
    description: "You are intuitive and steady, but your digestive system needs attention. Bloating, heaviness, or irregular digestion is your body's signal to slow down and return to basics.",
    ritual: "Before meals, take 1 tsp AARINIYA honey in warm water. In the evenings, try our Forest Glow Herbal Tea — launching soon.",
    product: "AARINIYA Deep Forest Honey + Forest Glow Herbal Tea (coming soon)"
  },
  "Forest Warrior": {
    tagline: "Your energy wants to be unleashed — naturally",
    description: "You are active, driven, and productive — but your energy dips at the wrong times. You need natural fuel that works with your body, not against it.",
    ritual: "Replace your mid-morning snack with AARINIYA honey on a banana or in warm water. Natural fructose = clean sustained fuel.",
    product: "AARINIYA Deep Forest Honey — your pre-workout and daily energy ritual."
  },
  "Calm River": {
    tagline: "Your nervous system is asking for gentleness",
    description: "You feel the weight of modern life deeply. Stress, overthinking, and poor sleep are your main battles. Small, consistent acts of nourishment are your medicine.",
    ritual: "Before bed — warm milk + 1 tsp AARINIYA honey + a pinch of nutmeg. Aarini's personal sleep ritual. Try it for 7 nights.",
    product: "AARINIYA Deep Forest Honey — your evening ritual ingredient."
  }
};

export default function WellnessQuiz({ setActivePage }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [finalResult, setFinalResult] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentQuestion, showEmailCapture, showResults]);

  const handleOptionSelect = (optionIndex) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowEmailCapture(true);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setAnswers(answers.slice(0, -1));
    }
  };

  const validateEmail = (val) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(val).toLowerCase());
  };

  const calculateResultType = () => {
    const counts = {
      'Golden Bloom': 0,
      'Deep Root': 0,
      'Forest Warrior': 0,
      'Calm River': 0
    };
    
    const types = ['Golden Bloom', 'Deep Root', 'Forest Warrior', 'Calm River'];
    
    answers.forEach((val) => {
      const type = types[val];
      if (type) {
        counts[type]++;
      }
    });
    
    // Find type with max count, resolving ties in priority order
    let maxType = 'Golden Bloom';
    let maxCount = -1;
    types.forEach((type) => {
      if (counts[type] > maxCount) {
        maxCount = counts[type];
        maxType = type;
      }
    });
    
    return maxType;
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || !validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const resultType = calculateResultType();
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/quiz-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, resultType }),
      });
      
      if (response.ok) {
        setFinalResult(resultType);
        setShowResults(true);
      } else {
        let errorMessage = 'Something went wrong. Please try again.';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          }
        } catch (jsonErr) {
          console.error('Failed to parse error response JSON:', jsonErr);
        }
        
        // Show results even if backend returned an error (graceful fallback)
        setFinalResult(resultType);
        setShowResults(true);
        setError(errorMessage);
      }
    } catch (err) {
      // Fallback in case of server connection issues so users can still see their results
      console.error('Quiz submission failed:', err);
      setFinalResult(resultType);
      setShowResults(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    const shareCards = {
      'Deep Root': 'deep-root.png',
      'Golden Bloom': 'golden-bloom.png',
      'Forest Warrior': 'wild-spirit.png',
      'Calm River': 'calm-forest.png'
    };

    const filename = shareCards[finalResult] || 'golden-bloom.png';
    const imageUrl = `/assets/${filename}`;
    const shareText = `I just took Aarini's Forest Wellness Quiz — I'm a ${finalResult}! Find yours at @aarinidevrani aariniya.netlify.app/wellness-quiz`;

    let shared = false;

    // Try Web Share API first
    if (navigator.share && navigator.canShare) {
      try {
        const response = await fetch(imageUrl);
        if (response.ok) {
          const blob = await response.blob();
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `My Forest Wellness Type: ${finalResult}`,
              text: shareText
            });
            shared = true;
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('Share aborted by user.');
          return; // User cancelled
        }
        console.error('Error sharing via Web Share API:', err);
      }
    }

    // Fallback: Direct download for desktop or unsupported browsers
    if (!shared) {
      try {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (dlErr) {
        console.error('Error downloading card image:', dlErr);
        // Last resort fallback: Copy text to clipboard
        try {
          await navigator.clipboard.writeText(shareText);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 3000);
        } catch (clipErr) {
          console.error('Failed to copy text:', clipErr);
        }
      }
    }
  };

  const handleInstaShare = async () => {
    const shareCards = {
      'Deep Root': 'deep-root.png',
      'Golden Bloom': 'golden-bloom.png',
      'Forest Warrior': 'wild-spirit.png',
      'Calm River': 'calm-forest.png'
    };

    const filename = shareCards[finalResult] || 'golden-bloom.png';
    const imageUrl = `/assets/${filename}`;

    try {
      await navigator.clipboard.writeText('@aarinidevrani');
    } catch (err) {
      console.error('Failed to copy username:', err);
    }

    let shared = false;
    if (navigator.share && navigator.canShare) {
      try {
        const response = await fetch(imageUrl);
        if (response.ok) {
          const blob = await response.blob();
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `My Forest Wellness Type: ${finalResult}`,
              text: `My Forest Wellness Type is ${finalResult}! Find yours at @aarinidevrani aariniya.netlify.app/wellness-quiz`
            });
            shared = true;
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing to Instagram:', err);
        } else {
          return;
        }
      }
    }

    if (!shared) {
      try {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setToastMessage("Card downloaded & '@aarinidevrani' copied! Share it on your Instagram Story to collaborate.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      } catch (dlErr) {
        console.error('Download failed:', dlErr);
      }
    } else {
      setToastMessage("Tag '@aarinidevrani' copied to clipboard for collaboration!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  const handleRetake = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowEmailCapture(false);
    setEmail('');
    setError(null);
    setShowResults(false);
    setFinalResult('');
  };

  const progressPercent = showResults 
    ? 100 
    : showEmailCapture 
      ? 100 
      : Math.round((currentQuestion / QUESTIONS.length) * 100);

  return (
    <div className="quiz-page-wrapper" style={styles.page}>
      {/* Page Header Section */}
      {!showResults && (
        <div className="quiz-page-header" style={styles.header}>
          <span style={styles.kicker}>AARINIYA WELLNESS QUIZ</span>
          <h1 style={styles.title}>What's your forest wellness type?</h1>
          <p style={styles.subtext}>6 questions · 2 minutes · Aarini's personalised ritual for you</p>
        </div>
      )}

      {/* Main Container */}
      <div className="quiz-page-card" style={styles.card}>
        {/* Progress Bar */}
        <div style={styles.progressContainer}>
          <div style={{ ...styles.progressBar, width: `${progressPercent}%` }}></div>
        </div>

        {/* State 1: Active Quiz Questions */}
        {!showEmailCapture && !showResults && (
          <div>
            <div style={styles.questionNum}>Question {currentQuestion + 1} of {QUESTIONS.length}</div>
            <h2 style={styles.questionText}>{QUESTIONS[currentQuestion].question}</h2>
            
            <div style={styles.optionsList}>
              {QUESTIONS[currentQuestion].options.map((option, idx) => (
                <button 
                  key={idx} 
                  style={styles.optionBtn}
                  onClick={() => handleOptionSelect(idx)}
                  className="hover-light-bg"
                >
                  <span style={styles.optionText}>{option}</span>
                  <span style={styles.optionArrow}>→</span>
                </button>
              ))}
            </div>

            <div style={styles.navRow}>
              {currentQuestion > 0 ? (
                <button style={styles.backBtn} onClick={handleBack}>
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}
              <span style={styles.progressText}>{progressPercent}% Complete</span>
            </div>
          </div>
        )}

        {/* State 2: Email Capture Screen */}
        {showEmailCapture && !showResults && (
          <div style={styles.emailContainer}>
            <h2 style={styles.emailTitle}>Your Forest Ritual is Ready</h2>
            <p style={styles.emailSubtext}>
              Enter your email to reveal your type and unlock Aarini's personalised daily recommendation.
            </p>
            
            <form onSubmit={handleEmailSubmit}>
              {error && <div style={styles.errorText}>{error}</div>}
              
              <div style={styles.inputGroup}>
                <Mail size={18} style={styles.inputIcon} />
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  required
                  disabled={isLoading}
                />
              </div>

              <button 
                type="submit" 
                className={`btn btn-primary btn-block`} 
                style={{ padding: '1rem', marginTop: '0.5rem' }}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Reveal my type'}
                {!isLoading && <ArrowRight size={18} style={{ marginLeft: '8px' }} />}
              </button>
            </form>

            <div style={styles.privacyInfo}>
              <Lock size={12} style={{ marginRight: '6px', display: 'inline' }} />
              <span>No spam. Just your result + one email when Forest Glow Tea launches.</span>
            </div>
          </div>
        )}

        {/* State 3: Quiz Results Screen */}
        {showResults && finalResult && (
          <div style={styles.resultContent}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span style={styles.resultTagline}>{RESULTS[finalResult].tagline}</span>
              <h2 style={styles.resultType}>{finalResult}</h2>
              <div style={styles.divider}></div>
            </div>

            {/* Display the actual result card image directly! */}
            <div style={styles.cardImageContainer} className="cardImageContainer">
              <img 
                src={`/assets/${
                  finalResult === 'Deep Root' ? 'deep-root.png' :
                  finalResult === 'Golden Bloom' ? 'golden-bloom.png' :
                  finalResult === 'Forest Warrior' ? 'wild-spirit.png' :
                  finalResult === 'Calm River' ? 'calm-forest.png' : 'golden-bloom.png'
                }`} 
                alt={`${finalResult} Wellness Type Card`} 
                style={styles.cardImage} 
              />
            </div>

            {/* Direct Instagram Stories Share Button */}
            <button 
              className="btn btn-primary"
              style={styles.instaBtn}
              onClick={handleInstaShare}
            >
              <InstagramIcon size={18} style={{ marginRight: '8px' }} />
              Share on Instagram Story
            </button>

            <p style={styles.resultDesc}>
              {RESULTS[finalResult].description}
            </p>

            {/* Ritual Box */}
            <div style={styles.ritualBox}>
              <h3 style={styles.ritualTitle}>Your Personalised Daily Ritual</h3>
              <p style={styles.ritualText}>
                {RESULTS[finalResult].ritual}
              </p>
            </div>

            {/* Product Recommendation Card */}
            <div style={styles.prodCard}>
              <img 
                src="/assets/product_jar_forest.jpg" 
                alt="AARINIYA Deep Forest Multifloral Honey Jar" 
                style={styles.prodImg} 
              />
              <div style={styles.prodInfo}>
                <span style={styles.prodLabel}>Recommended Product</span>
                <h4 style={styles.prodTitle}>{RESULTS[finalResult].product}</h4>
                <button 
                  className="btn btn-primary" 
                  style={{ fontSize: '0.8rem', padding: '0.6rem 1.2rem' }}
                  onClick={() => { setActivePage('product'); window.scrollTo(0, 0); }}
                >
                  Shop Now — ₹499 Founder's Price
                </button>
              </div>
            </div>

            {/* Share & Retake Controls */}
            <div style={styles.actionRow}>
              <button 
                className="btn btn-secondary" 
                onClick={handleShare}
                style={{ flex: 1, minWidth: '160px', gap: '8px', textTransform: 'uppercase' }}
              >
                <Share2 size={16} />
                <span>Share My Type</span>
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleRetake}
                style={{ flex: 1, minWidth: '160px', gap: '8px', border: '1px solid rgba(28, 53, 45, 0.2)', textTransform: 'uppercase' }}
              >
                <RotateCcw size={16} />
                <span>Retake Quiz</span>
              </button>
            </div>
            
            {copySuccess && (
              <div style={styles.shareFeedback}>
                ✓ Result copied to clipboard!
              </div>
            )}
          </div>
        )}
      </div>

      {showToast && (
        <div style={styles.toast}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: '4rem 1rem 6rem',
    backgroundColor: '#fbf9f4',
    color: 'var(--color-text-main)',
    fontFamily: 'var(--font-sans)',
    minHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    textAlign: 'center',
    maxWidth: '600px',
    marginBottom: '2.5rem',
  },
  kicker: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    fontWeight: '600',
    letterSpacing: '0.15em',
    color: 'var(--color-accent)',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '0.75rem',
  },
  title: {
    fontFamily: 'var(--font-serif)',
    fontSize: '2.25rem',
    color: 'var(--color-primary)',
    marginBottom: '0.75rem',
    lineHeight: '1.25',
    fontWeight: '700',
  },
  subtext: {
    color: 'var(--color-text-muted)',
    fontSize: '0.95rem',
    lineHeight: '1.5',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '2.5rem 2rem',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-medium)',
    border: '1px solid rgba(28, 53, 45, 0.04)',
    width: '100%',
    maxWidth: '600px',
    position: 'relative',
    overflow: 'hidden',
  },
  progressContainer: {
    height: '4px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '2px',
    marginBottom: '2rem',
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'var(--color-accent)',
    transition: 'width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  questionNum: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--color-accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '0.5rem',
  },
  questionText: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.5rem',
    color: 'var(--color-primary)',
    marginBottom: '2rem',
    lineHeight: '1.35',
    fontWeight: '600',
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  optionBtn: {
    backgroundColor: '#fbf9f4',
    border: '1px solid rgba(28, 53, 45, 0.08)',
    borderRadius: 'var(--radius-md)',
    padding: '1.1rem 1.25rem',
    textAlign: 'left',
    color: 'var(--color-text-main)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  optionText: {
    flex: 1,
    lineHeight: '1.4',
  },
  optionArrow: {
    marginLeft: '1rem',
    color: 'var(--color-accent)',
    opacity: 0.7,
    transition: 'transform 0.2s ease',
  },
  navRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '2rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid rgba(28, 53, 45, 0.06)',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.4rem',
    fontFamily: 'var(--font-sans)',
    fontWeight: '500',
    transition: 'color 0.2s ease',
  },
  progressText: {
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-sans)',
    fontWeight: '500',
  },
  // Email Screen
  emailContainer: {
    animation: 'fadeIn 0.4s ease',
  },
  emailTitle: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.65rem',
    color: 'var(--color-primary)',
    marginBottom: '0.75rem',
    textAlign: 'center',
    fontWeight: '600',
  },
  emailSubtext: {
    color: 'var(--color-text-muted)',
    fontSize: '0.95rem',
    textAlign: 'center',
    marginBottom: '2rem',
    lineHeight: '1.5',
  },
  inputGroup: {
    position: 'relative',
    marginBottom: '1rem',
  },
  input: {
    width: '100%',
    padding: '0.85rem 1rem 0.85rem 2.5rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(28, 53, 45, 0.15)',
    backgroundColor: '#fbf9f4',
    color: 'var(--color-text-main)',
    fontSize: '0.95rem',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    transition: 'var(--transition-fast)',
  },
  inputIcon: {
    position: 'absolute',
    left: '0.9rem',
    top: '52%',
    transform: 'translateY(-50%)',
    color: 'var(--color-text-muted)',
    opacity: 0.7,
  },
  privacyInfo: {
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    marginTop: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: '1.4',
  },
  errorText: {
    color: 'var(--color-error)',
    fontSize: '0.85rem',
    textAlign: 'center',
    marginBottom: '1rem',
    fontWeight: '500',
  },
  // Results
  resultContent: {
    animation: 'fadeIn 0.6s ease',
  },
  resultTagline: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--color-accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    display: 'block',
    marginBottom: '0.5rem',
  },
  resultType: {
    fontFamily: 'var(--font-serif)',
    fontSize: '2.25rem',
    color: 'var(--color-primary)',
    fontWeight: '700',
  },
  divider: {
    width: '60px',
    height: '2px',
    backgroundColor: 'var(--color-accent)',
    margin: '1.25rem auto 0 auto',
  },
  resultDesc: {
    fontSize: '0.95rem',
    lineHeight: '1.65',
    color: 'var(--color-text-muted)',
    marginBottom: '1.75rem',
    textAlign: 'center',
  },
  ritualBox: {
    backgroundColor: 'rgba(196, 154, 60, 0.05)',
    borderLeft: '3px solid var(--color-accent)',
    padding: '1.25rem 1.5rem',
    borderRadius: '0 var(--radius-md) var(--radius-md) 0',
    marginBottom: '2rem',
  },
  ritualTitle: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.1rem',
    color: 'var(--color-primary)',
    fontWeight: '600',
    marginBottom: '0.4rem',
  },
  ritualText: {
    fontSize: '0.9rem',
    lineHeight: '1.55',
    color: 'var(--color-text-main)',
  },
  prodCard: {
    display: 'flex',
    backgroundColor: '#fbf9f4',
    borderRadius: 'var(--radius-md)',
    padding: '1.25rem',
    gap: '1.25rem',
    marginBottom: '2rem',
    border: '1px solid rgba(28, 53, 45, 0.05)',
    alignItems: 'center',
  },
  prodImg: {
    width: '85px',
    height: '85px',
    objectFit: 'cover',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(28, 53, 45, 0.05)',
  },
  prodInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  prodLabel: {
    fontSize: '0.7rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: 'var(--color-accent)',
    letterSpacing: '0.05em',
    marginBottom: '0.2rem',
  },
  prodTitle: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.05rem',
    color: 'var(--color-primary)',
    marginBottom: '0.6rem',
    fontWeight: '600',
    lineHeight: '1.3',
  },
  actionRow: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
   shareFeedback: {
    fontSize: '0.8rem',
    color: 'var(--color-success)',
    textAlign: 'center',
    marginTop: '0.75rem',
    fontWeight: '500',
  },
  cardImageContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '2rem',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(26, 60, 52, 0.12)',
    border: '1px solid rgba(28, 53, 45, 0.06)',
    backgroundColor: '#ffffff',
  },
  cardImage: {
    width: '100%',
    maxHeight: '420px',
    objectFit: 'contain',
    display: 'block',
  },
  instaBtn: {
    backgroundColor: '#e1306c',
    color: '#ffffff',
    border: 'none',
    padding: '0.9rem 1.5rem',
    borderRadius: '30px',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.85rem',
    fontWeight: '600',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '350px',
    margin: '0.5rem auto 2rem auto',
    boxShadow: '0 4px 15px rgba(225, 48, 108, 0.25)',
    transition: 'var(--transition-fast)',
  },
  toast: {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#1c352d',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '30px',
    fontSize: '0.85rem',
    fontWeight: '500',
    zIndex: 1000,
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
    textAlign: 'center',
    width: '90%',
    maxWidth: '450px',
    animation: 'slideUp 0.3s ease',
  }
};
