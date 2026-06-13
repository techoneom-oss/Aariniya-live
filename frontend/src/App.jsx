import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import AariniyaChatbot from './components/AariniyaChatbot';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import MyJourney from './pages/MyJourney';
import Courses from './pages/Courses';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Policies from './pages/Policies';
import WellnessQuiz from './pages/WellnessQuiz';

const getInitialPage = () => {
  const path = window.location.pathname;
  if (path === '/' || path === '') return 'home';
  if (path.startsWith('/deep-forest-honey')) return 'product';
  if (path.startsWith('/journey') || path.startsWith('/our-journey')) return 'journey';
  if (path.startsWith('/wellness-quiz')) return 'quiz';
  if (path.startsWith('/courses') || path.startsWith('/wellness-courses')) return 'courses';
  if (path.startsWith('/policies')) return 'policies';
  if (path.startsWith('/auth') || path.startsWith('/login') || path.startsWith('/signup')) return 'auth';
  if (path.startsWith('/profile')) return 'profile';
  if (path.startsWith('/admin')) return 'admin';
  return 'home';
};

export default function App() {
  const [activePage, setActivePage] = useState(getInitialPage);
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('aariniya_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error("Failed to parse user session", e);
        localStorage.removeItem('aariniya_user');
      }
    }
    return null;
  });

  const [policiesSection, setPoliciesSection] = useState(null);

  const handleNavToPolicies = (section) => {
    setPoliciesSection(section);
    setActivePage('policies');
  };

  // Synchronize URL path with activePage state
  useEffect(() => {
    const routeMap = {
      'home': '/',
      'product': '/deep-forest-honey',
      'journey': '/journey',
      'quiz': '/wellness-quiz',
      'courses': '/courses',
      'policies': '/policies',
      'auth': '/auth',
      'profile': '/profile',
      'admin': '/admin'
    };

    const currentPath = window.location.pathname;
    const targetPath = routeMap[activePage] || '/';

    if (currentPath !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, [activePage]);

  // Handle browser back/forward buttons (routing popstate)
  useEffect(() => {
    const handlePopState = () => {
      setActivePage(getInitialPage());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const existingScripts = document.querySelectorAll('.dynamic-jsonld');
    existingScripts.forEach(script => script.remove());

    let title = "AARINIYA | Raw Forest Honey from Odisha & Jharkhand — Pure, Tribal-Harvested";
    let description = "AARINIYA Deep Forest Honey — raw, unfiltered honey from the ancient forests of Odisha and Jharkhand. Harvested by tribal communities. Small batch. No additives. Free shipping across India.";
    let jsonLdData = null;
    let faqLdData = null;

    switch (activePage) {
      case 'home':
        title = "AARINIYA | Raw Forest Honey from Odisha & Jharkhand — Pure, Tribal-Harvested";
        description = "AARINIYA Deep Forest Honey — raw, unfiltered honey from the ancient forests of Odisha and Jharkhand. Harvested by tribal communities. Small batch. No additives. Free shipping across India.";
        jsonLdData = {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "AARINIYA",
          "url": "https://aariniya.netlify.app",
          "logo": "https://aariniya.netlify.app/favicon.svg",
          "sameAs": ["https://www.instagram.com/aarinidevrani"],
          "description": "Premium raw honey and herbal wellness brand from the tribal forests of Odisha and Jharkhand, Central India."
        };
        break;
      case 'product':
        title = "AARINIYA Deep Forest Multifloral Honey 900g | Raw & Unfiltered | ₹499 Founder Price";
        description = "Buy AARINIYA Deep Forest Honey — 900g raw, unfiltered, unpasteurized honey from Odisha and Jharkhand tribal forests. No heat treatment, no added sugar. Free shipping India. Only 100 jars available.";
        jsonLdData = {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "AARINIYA Deep Forest Multifloral Honey",
          "description": "Raw, unfiltered honey harvested by tribal communities from Odisha and Jharkhand forests. 900g premium glass jar.",
          "brand": { "@type": "Brand", "name": "AARINIYA" },
          "image": "https://aariniya.netlify.app/assets/product_jar_forest.jpg",
          "offers": {
            "@type": "Offer",
            "price": "499",
            "priceCurrency": "INR",
            "availability": "https://schema.org/LimitedAvailability",
            "priceValidUntil": "2026-12-31",
            "seller": { "@type": "Organization", "name": "AARINIYA" }
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5",
            "reviewCount": "1"
          }
        };
        faqLdData = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "Is this honey really raw and unfiltered?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. AARINIYA honey is cold-extracted and never heated above 40°C. It retains its natural pollen, enzymes, and beneficial micronutrients. You may notice natural crystallisation over time — this is a sign of purity, not spoilage." } },
            { "@type": "Question", "name": "Where exactly is this honey sourced from?", "acceptedAnswer": { "@type": "Answer", "text": "Our honey is harvested from the sal and mahua forests of Odisha and Jharkhand — one of India's most biodiverse forest corridors. We work directly with tribal communities who have harvested wild honey for generations using traditional, low-impact methods." } },
            { "@type": "Question", "name": "Does it have any added sugar or preservatives?", "acceptedAnswer": { "@type": "Answer", "text": "No. Zero added sugar. Zero preservatives. Zero artificial ingredients. What goes into the jar is exactly what comes out of the forest hive." } },
            { "@type": "Question", "name": "What is the shelf life?", "acceptedAnswer": { "@type": "Answer", "text": "Raw honey has an indefinite shelf life when stored properly. Keep the jar sealed, away from direct sunlight, in a cool dry place. Best consumed within 18 months of the harvest date on the label." } },
            { "@type": "Question", "name": "My honey has crystallised. Is it still good?", "acceptedAnswer": { "@type": "Answer", "text": "Absolutely. Crystallisation is natural and actually confirms purity — processed honey rarely crystallises because its beneficial compounds have been removed. Gently warm the jar in lukewarm water (never microwave) to return it to liquid form." } },
            { "@type": "Question", "name": "How is this different from supermarket honey?", "acceptedAnswer": { "@type": "Answer", "text": "Most commercial honey is pasteurised at high heat, blended from multiple unknown sources, and often diluted. AARINIYA is single-source, cold-filled, small batch, and harvested from a specific forest region. Every jar is traceable." } },
            { "@type": "Question", "name": "Do you offer free shipping?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Free shipping on all orders across India. Orders are dispatched within 2 business days. Delivery takes 3–6 business days depending on your location." } },
            { "@type": "Question", "name": "What if I want to return or my order arrives damaged?", "acceptedAnswer": { "@type": "Answer", "text": "We have a 7-day return and replacement policy. If your order arrives damaged or is not as described, WhatsApp us within 7 days of delivery with a photo and we will arrange a replacement or full refund." } }
          ]
        };
        break;
      case 'journey':
        title = "Our Story | AARINIYA — Roots in the Simlipal Forest, Odisha";
        description = "How Aarini Devrani's childhood in the Simlipal biosphere of Odisha inspired AARINIYA — a wellness brand partnering with tribal honey collectors of Central India.";
        break;
      case 'courses':
        title = "Wellness Courses | AARINIYA — Forest Yoga & Ayurvedic Nutrition";
        description = "Aarini's guided wellness programs — launching soon. Join the waitlist to be first to know.";
        break;
      case 'quiz':
        title = "Forest Wellness Quiz | Find Your Type | AARINIYA";
        description = "Take Aarini's 2-minute forest wellness quiz. Discover if you're a Golden Bloom, Deep Root, Forest Warrior, or Calm River — and get your personalised daily ritual.";
        break;
      case 'policies':
        title = "Shipping, Returns & Policies | AARINIYA";
        description = "Policies for AARINIYA — shipping, returns, privacy policy, and contact details.";
        break;
      default:
        break;
    }

    document.title = title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', title);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', description);

    const ogTags = [
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'AARINIYA' },
      { property: 'og:image', content: 'https://aariniya.netlify.app/assets/product_jar_forest.jpg' },
      { property: 'og:locale', content: 'en_IN' }
    ];
    ogTags.forEach(tag => {
      let el = document.querySelector(`meta[property="${tag.property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', tag.property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', tag.content);
    });

    if (jsonLdData) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.className = 'dynamic-jsonld';
      script.innerText = JSON.stringify(jsonLdData);
      document.head.appendChild(script);
    }
    if (faqLdData) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.className = 'dynamic-jsonld';
      script.innerText = JSON.stringify(faqLdData);
      document.head.appendChild(script);
    }
  }, [activePage]);

  // Cart actions
  const handleAddToCart = (newItem) => {
    setCartItems(prevItems => {
      const existing = prevItems.find(item => item.id === newItem.id);
      if (existing) {
        if (newItem.isCourse) {
          alert("✨ You are already enrolled in this course package in your cart.");
          return prevItems;
        }
        return prevItems.map(item => 
          item.id === newItem.id 
            ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
            : item
        );
      }
      return [...prevItems, { ...newItem, quantity: newItem.quantity || 1 }];
    });
    setCartOpen(true); // Auto-open cart for premium micro-interaction
  };

  const handleUpdateQuantity = (id, quantity) => {
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (id) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Render Page dispatcher
  const renderPage = () => {
    switch(activePage) {
      case 'home':
        return <Home setActivePage={setActivePage} />;
      case 'product':
        return <ProductDetail onAddToCart={handleAddToCart} setActivePage={setActivePage} />;
      case 'journey':
        return <MyJourney />;
      case 'courses':
        return <Courses onEnrollCourse={handleAddToCart} setActivePage={setActivePage} />;
      case 'quiz':
        return <WellnessQuiz setActivePage={setActivePage} />;
      case 'policies':
        return <Policies section={policiesSection} />;
      case 'auth':
        return <Auth setGlobalUser={setUser} setActivePage={setActivePage} />;
      case 'profile':
        return <Profile user={user} setGlobalUser={setUser} setActivePage={setActivePage} />;
      case 'admin':
        return <AdminDashboard user={user} setActivePage={setActivePage} />;
      default:
        return <Home setActivePage={setActivePage} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Navigation */}
      <Navbar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        user={user}
        onCartOpen={() => setCartOpen(true)}
      />

      {/* Main Pages Content */}
      <main style={{ flex: 1 }}>
        {renderPage()}
      </main>

      {/* Footer */}
      <Footer setActivePage={setActivePage} onPoliciesNav={handleNavToPolicies} />

      {/* Checkout Sidebar Cart Drawer */}
      <CartDrawer 
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        user={user}
        setActivePage={setActivePage}
      />

      {/* Floating WhatsApp Button */}
      <a 
        href="https://whatsapp.com/channel/0029Vb8C1tW47XeHNq4PEC2t"
        target="_blank" 
        rel="noopener noreferrer"
        className="floating-whatsapp"
        aria-label="Join for Exclusive Contents"
      >
        <span className="whatsapp-tooltip">Join for Exclusive Contents</span>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 2.01 14.069.993 11.458.993c-5.462 0-9.902 4.417-9.907 9.863-.002 1.77.474 3.5 1.378 5.008l-1.012 3.693 3.8-.97c1.517.828 3.197 1.263 4.84 1.267zm9.961-6.838c-.29-.145-1.713-.846-1.978-.942-.265-.096-.457-.144-.65.145-.19.29-.74.942-.907 1.135-.166.19-.333.215-.623.07-1.127-.564-1.926-1.008-2.697-2.329-.202-.348.202-.323.578-1.076.09-.18.046-.34-.02-.485-.067-.145-.65-1.569-.89-2.15-.235-.563-.473-.486-.65-.496-.168-.007-.36-.008-.553-.008-.193 0-.507.073-.772.362-.265.29-1.012.99-1.012 2.417s1.036 2.798 1.18 2.99c.145.19 2.036 3.111 4.933 4.363.689.298 1.228.476 1.648.609.693.22 1.325.19 1.824.115.556-.083 1.713-.699 1.954-1.376.241-.676.241-1.255.168-1.376-.073-.12-.265-.19-.554-.336z"/>
        </svg>
      </a>

      {/* Floating AI Chatbot */}
      <AariniyaChatbot />
    </div>
  );
}
