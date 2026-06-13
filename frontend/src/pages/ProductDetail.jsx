import { useState, useEffect } from 'react';
import { Plus, Minus, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function ProductDetail({ onAddToCart }) {
  const [product, setProduct] = useState({
    id: 1,
    name: "AARINIYA Deep Forest Multifloral Honey",
    subtitle: "Raw Forest Honey | Small Batch Packed | Premium Glass Jar | 900g",
    short_description: "Raw, unfiltered, and unpasteurized. Harvested by tribal communities from the sal and mahua forests of Odisha and Jharkhand — one of India's most biodiverse forest corridors. No heat treatment. No added sugar. No blending from unknown sources. Every jar carries the natural pollen, enzymes, and micronutrients of a thousand wild forest flowers.",
    description: "Raw, unfiltered, and unpasteurized. Harvested by tribal communities from the sal and mahua forests of Odisha and Jharkhand — one of India's most biodiverse forest corridors. No heat treatment. No added sugar. No blending from unknown sources. Every jar carries the natural pollen, enzymes, and micronutrients of a thousand wild forest flowers.",
    price: 499,
    original_price: 1970,
    inventory: 100,
    images: [
      "/assets/product_qty_1.jpg",
      "/assets/product_qty_2.jpg",
      "/assets/product_qty_5.jpg",
      "/assets/product_clean_shot.jpg",
      "/assets/product_jar_forest.jpg",
      "/assets/product_founder_jar.jpg",
      "/assets/product_morning.jpg",
      "/assets/product_gift_box.jpg",
      "/assets/product_wellbeing_triptych.jpg",
      "/assets/product_rituals.jpg",
      "/assets/product_wellness_blueprint.jpg",
      "/assets/product_comparison.jpg",
      "/assets/product_forest_to_home.jpg"
    ],
    highlights: [
      "Deep Forest Sourced",
      "Raw Multifloral Honey",
      "Small Batch Packed",
      "Premium Glass Jar Packaging",
      "Rich Natural Aroma",
      "Distinctive Forest Flavor",
      "Carefully Selected",
      "Daily Wellness Ritual",
      "No Added Sugar",
      "No Artificial Flavors",
      "Crafted With Care"
    ],
    taste_profile: {
      flavor: "Rich, smooth, naturally sweet",
      aroma: "Deep floral and forest notes",
      texture: "Golden, thick, and luxurious",
      source: "Raw Multifloral Honey"
    },
    ways_to_enjoy: [
      "Morning warm water ritual",
      "Herbal tea and green tea",
      "Smoothies and wellness drinks",
      "Breakfast bowls",
      "Toast and pancakes",
      "Healthy recipes",
      "Natural sweetening alternative"
    ],
    details: {
      brand: "AARINIYA",
      product_name: "Deep Forest Multifloral Honey",
      net_weight: "900g",
      packaging: "Premium Glass Jar",
      honey_type: "Raw Multifloral Honey",
      origin: "Odisha & Jharkhand forests, India",
      storage: "Store in a cool and dry place. Keep lid tightly closed after use."
    }
  });
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState('/assets/product_qty_1.jpg');
  const [quantity, setQuantity] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [activeFaq, setActiveFaq] = useState(null);
  const [selectedPack, setSelectedPack] = useState(1);

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };
  
  const [newReview, setNewReview] = useState({ name: '', title: '', rating: 5, text: '', tags: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const getProductPackImage = (pack) => {
    if (pack === 1) return '/assets/product_qty_1.jpg';
    if (pack === 2) return '/assets/product_qty_2.jpg';
    if (pack === 5) return '/assets/product_qty_5.jpg';
    return '/assets/product_qty_1.jpg';
  };

  const fetchProductDetails = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/1`);
      if (!res.ok) throw new Error('Product not found');
      const data = await res.json();
      setProduct(data);
      setActiveImage(getProductPackImage(selectedPack));
      const reviewsRes = await fetch(`${API_BASE_URL}/api/reviews/1`);
      if (reviewsRes.ok) setReviews(await reviewsRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchProductDetails(); }, []);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.text) { alert('Please fill in your name and review content.'); return; }
    setSubmittingReview(true);
    try {
      const parsedTags = newReview.tags
        ? newReview.tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0)
        : ['pure', 'honey'];
      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: 1, reviewer_name: newReview.name, title: newReview.title, rating: newReview.rating, review_text: newReview.text, tags: parsedTags })
      });
      if (!res.ok) throw new Error('Could not submit review');
      const submitted = await res.json();
      setReviews([submitted, ...reviews]);
      setReviewSuccess(true);
      setNewReview({ name: '', title: '', rating: 5, text: '', tags: '' });
      setTimeout(() => { setReviewSuccess(false); setShowReviewForm(false); }, 2000);
    } catch (err) { alert(err.message); }
    finally { setSubmittingReview(false); }
  };

  const currentPrice = selectedPack === 1 ? 499 : (selectedPack === 2 ? 949 : 2299);
  const currentOriginalPrice = selectedPack === 1 ? 1970 : (selectedPack === 2 ? 3940 : 9850);
  const discountPct = Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100);

  const handlePackChange = (pack) => { setSelectedPack(pack); setActiveImage(getProductPackImage(pack)); setImageLoaded(false); };

  const handleAddToCartClick = () => {
    if (product) {
      const packName = selectedPack === 1 ? ' (1 Jar)' : ` (Pack of ${selectedPack})`;
      const preorderText = product.inventory === 0 ? ' (Pre-order)' : '';
      onAddToCart({ id: `${product.id}_pack_${selectedPack}`, name: product.name + packName + preorderText, price: currentPrice, image: getProductPackImage(selectedPack), quantity, isPreorder: product.inventory === 0, packSize: selectedPack });
    }
  };

  if (!product) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>Sourcing forest parameters...</p>
      </div>
    );
  }

  const mockBase = { 5: 379, 4: 8, 3: 2, 2: 0, 1: 0 };
  const total5 = mockBase[5] + reviews.filter(r => r.rating === 5).length;
  const total4 = mockBase[4] + reviews.filter(r => r.rating === 4).length;
  const total3 = mockBase[3] + reviews.filter(r => r.rating === 3).length;
  const total2 = mockBase[2] + reviews.filter(r => r.rating === 2).length;
  const total1 = mockBase[1] + reviews.filter(r => r.rating === 1).length;
  const totalReviewsCount = total5 + total4 + total3 + total2 + total1;
  const sumRatings = (total5 * 5) + (total4 * 4) + (total3 * 3) + (total2 * 2) + (total1 * 1);
  const averageRating = totalReviewsCount > 0 ? (sumRatings / totalReviewsCount).toFixed(2) : '4.97';
  const starsBreakdown = { 5: total5, 4: total4, 3: total3, 2: total2, 1: total1 };
  const displayImages = product ? [getProductPackImage(selectedPack), ...product.images.slice(1)] : [];

  const getProductImageAltText = (src) => {
    if (src.includes('product_qty_1') || src.includes('product_qty_2') || src.includes('product_qty_5') || src.includes('product_clean_shot')) {
      return "AARINIYA Deep Forest Multifloral Honey 900g glass jar — raw unfiltered honey from Odisha and Jharkhand tribal forests";
    }
    if (src.includes('product_jar_forest')) {
      return "AARINIYA honey jar with forest background";
    }
    if (src.includes('product_founder_jar') || src.includes('aarini_devrani')) {
      return "Aarini Devrani founder of AARINIYA wellness brand";
    }
    if (src.includes('gift_box') || src.includes('packaging')) {
      return "AARINIYA honey packaging — premium glass jar small batch";
    }
    if (src.includes('morning') || src.includes('drizzle')) {
      return "AARINIYA honey drizzle — pure raw forest honey";
    }
    if (src.includes('wellbeing') || src.includes('triptych') || src.includes('texture')) {
      return "Raw honey texture close-up — AARINIYA forest honey";
    }
    return "AARINIYA Deep Forest Multifloral Honey 900g glass jar — raw unfiltered honey from Odisha and Jharkhand tribal forests";
  };

  return (
    <div className="pd-page">

      {/* ── MAIN PRODUCT SECTION ─────────────────────────── */}
      <div className="pd-grid">

        {/* LEFT / TOP: Gallery */}
        <div className="pd-gallery">
          {/* Main Image */}
          <div className="pd-main-img-wrap">
            {!imageLoaded && <div className="pd-img-skeleton" />}
            <img
              src={activeImage}
              alt={getProductImageAltText(activeImage)}
              className="pd-main-img"
              style={{ opacity: imageLoaded ? 1 : 0 }}
              onLoad={() => setImageLoaded(true)}
            />
          </div>

          {/* Thumbnails strip — below image */}
          <div className="pd-thumbs">
            {displayImages.map((img, idx) => (
              <button
                key={idx}
                className={`pd-thumb-btn ${activeImage === img ? 'pd-thumb-active' : ''}`}
                onClick={() => { setActiveImage(img); setImageLoaded(false); }}
                aria-label={`View image ${idx + 1}`}
              >
                <img src={img} alt={getProductImageAltText(img)} className="pd-thumb-img" />
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT / BOTTOM: Details */}
        <div className="pd-details">
          <span className="pd-brand-tag">AARINIYA | FLAGSHIP RITUAL</span>
          <h1 className="pd-title">{product.name}</h1>
          <p className="pd-subtitle">{product.subtitle}</p>

          {/* Price */}
          <div className="pd-price-box">
            <div className="pd-price-label">PRICE</div>
            <div className="pd-price-row">
              <span className="pd-mrp">M.R.P. <s>₹{currentOriginalPrice.toLocaleString()}</s></span>
              <span className="pd-price">₹{currentPrice.toLocaleString()}</span>
              <span className="pd-badge-off" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}>Founder's Launch Price</span>
            </div>
            <p className="pd-tax">(incl. of all taxes)</p>
            <p className="pd-batch-limit" style={{ color: 'var(--color-accent)', fontWeight: '600', fontSize: '0.88rem', marginTop: '6px' }}>
              First harvest batch — only 100 jars available
            </p>
          </div>

          {/* Description */}
          <div className="pd-description-section" style={{ margin: '1.5rem 0' }}>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-text-main)', marginBottom: '0.75rem' }}>
              Raw, unfiltered, and unpasteurized. Harvested by tribal communities from the sal and mahua forests of Odisha and Jharkhand — one of India's most biodiverse forest corridors.
            </p>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-text-main)' }}>
              No heat treatment. No added sugar. No blending from unknown sources. Every jar carries the natural pollen, enzymes, and micronutrients of a thousand wild forest flowers.
            </p>
          </div>

          {/* Trust badges row */}
          <div className="pd-trust-strip" style={{ marginBottom: '1.5rem' }}>
            <div className="pd-trust-item"><Check size={14} /><span>FSSAI Compliant</span></div>
            <div className="pd-trust-item"><Check size={14} /><span>100% Pure</span></div>
            <div className="pd-trust-item"><Check size={14} /><span>No Added Sugar</span></div>
            <div className="pd-trust-item"><Check size={14} /><span>Cold-Filled</span></div>
            <div className="pd-trust-item"><Check size={14} /><span>Small Batch</span></div>
          </div>

          {/* Offers strip */}
          <div className="pd-offers">
            <div className="pd-offer-item">✓ Free shipping on orders within India</div>
            <div className="pd-offer-item">✓ Loyalty rewards — coming soon for repeat customers</div>
          </div>

          {/* Pack Selector */}
          <div className="pd-pack-section">
            <p className="pd-section-label">Select Pack Quantity</p>
            <div className="pd-pack-options">
              {[
                { pack: 1, label: '1 Jar', price: '₹499', save: null },
                { pack: 2, label: '2 Jars', price: '₹949', save: 'Save ₹49' },
                { pack: 5, label: '5 Jars', price: '₹2,299', save: 'Save ₹196' },
              ].map(({ pack, label, price, save }) => (
                <button
                  key={pack}
                  className={`pd-pack-btn ${selectedPack === pack ? 'pd-pack-active' : ''}`}
                  onClick={() => handlePackChange(pack)}
                >
                  <span className="pd-pack-name">{label}</span>
                  <span className="pd-pack-price">{price}</span>
                  {save && <span className="pd-pack-save">{save}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Stock */}
          {product.inventory > 0 ? (
            <div className="pd-stock-row">
              <span className="pd-stock-dot pd-dot-green">●</span>
              <span className="pd-stock-text">In Stock — Only {product.inventory} jars left from this harvest.</span>
            </div>
          ) : (
            <div className="pd-preorder-box">
              <span className="pd-stock-dot pd-dot-amber">●</span>
              <div>
                <strong>Next Harvest Pre-order</strong>
                <p style={{ fontSize: '0.85rem', marginTop: '4px', color: 'var(--color-text-muted)' }}>
                  🌿 Current batch fully reserved. Pre-order to secure next harvest. Est. shipping: 3–4 weeks.
                </p>
              </div>
            </div>
          )}

          {/* Qty + CTA */}
          <div className="pd-cta-row">
            <div className="pd-qty-ctrl">
              <button className="pd-qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))} aria-label="Decrease qty"><Minus size={16} /></button>
              <span className="pd-qty-num">{quantity}</span>
              <button className="pd-qty-btn" onClick={() => setQuantity(q => q + 1)} aria-label="Increase qty"><Plus size={16} /></button>
            </div>
            <div style={{ flex: 1, display: 'flex', width: '100%' }}>
              <button className="pd-add-btn" onClick={handleAddToCartClick} style={{ width: '100%' }}>
                {product.inventory > 0 ? 'ADD TO CART' : 'PRE-ORDER'}
              </button>
            </div>
          </div>

          {/* Accordions */}
          <div className="pd-accordions">
            {[
              {
                label: 'What Makes it Potent?',
                content: (
                  <div>
                    <p style={{ marginBottom: '0.5rem' }}>{product.short_description}</p>
                    <p>{product.description}</p>
                  </div>
                )
              },
              {
                label: 'Taste & Texture Profile',
                content: product.taste_profile && (
                  <ul className="pd-spec-list">
                    <li><strong>Flavor:</strong> {product.taste_profile.flavor}</li>
                    <li><strong>Aroma:</strong> {product.taste_profile.aroma}</li>
                    <li><strong>Texture:</strong> {product.taste_profile.texture}</li>
                    <li><strong>Floral Source:</strong> {product.taste_profile.source}</li>
                  </ul>
                )
              },
              {
                label: 'Ways to Enjoy',
                content: (
                  <ul className="pd-spec-list">
                    {product.ways_to_enjoy.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                )
              },
              {
                label: 'Product Information',
                content: product.details && (
                  <table className="pd-spec-table">
                    <tbody>
                      {[
                        ['Brand', product.details.brand],
                        ['Net Weight', product.details.net_weight],
                        ['Packaging', product.details.packaging],
                        ['Origin', product.details.origin],
                        ['Storage', product.details.storage],
                      ].map(([k, v]) => (
                        <tr key={k}><td className="pd-spec-key">{k}</td><td>{v}</td></tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            ].map((acc, i) => (
              <div key={i} className={`pd-acc-item ${activeAccordion === i ? 'pd-acc-open' : ''}`}>
                <button className="pd-acc-header" onClick={() => toggleAccordion(i)}>
                  <span>{acc.label}</span>
                  {activeAccordion === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <div className="pd-acc-body">
                  <div className="pd-acc-inner">{acc.content}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Common Questions FAQ section */}
          <div style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(28, 53, 45, 0.08)', paddingTop: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', fontFamily: 'var(--font-serif)', marginBottom: '1.25rem', fontWeight: '600' }}>Common Questions</h3>
            <div className="pd-accordions">
              {[
                {
                  q: "Is this honey really raw and unfiltered?",
                  a: "Yes. AARINIYA honey is cold-extracted and never heated above 40°C. It retains its natural pollen, enzymes, and beneficial micronutrients. You may notice natural crystallisation over time — this is a sign of purity, not spoilage."
                },
                {
                  q: "Where exactly is this honey sourced from?",
                  a: "Our honey is harvested from the sal and mahua forests of Odisha and Jharkhand — one of India's most biodiverse forest corridors. We work directly with tribal communities who have harvested wild honey for generations using traditional, low-impact methods."
                },
                {
                  q: "Does it have any added sugar or preservatives?",
                  a: "No. Zero added sugar. Zero preservatives. Zero artificial ingredients. What goes into the jar is exactly what comes out of the forest hive."
                },
                {
                  q: "What is the shelf life?",
                  a: "Raw honey has an indefinite shelf life when stored properly. Keep the jar sealed, away from direct sunlight, in a cool dry place. Best consumed within 18 months of the harvest date on the label."
                },
                {
                  q: "My honey has crystallised. Is it still good?",
                  a: "Absolutely. Crystallisation is natural and actually confirms purity — processed honey rarely crystallises because its beneficial compounds have been removed. Gently warm the jar in lukewarm water (never microwave) to return it to liquid form."
                },
                {
                  q: "How is this different from supermarket honey?",
                  a: "Most commercial honey is pasteurised at high heat, blended from multiple unknown sources, and often diluted. AARINIYA is single-source, cold-filled, small batch, and harvested from a specific forest region. Every jar is traceable."
                },
                {
                  q: "Do you offer free shipping?",
                  a: "Yes. Free shipping on all orders across India. Orders are dispatched within 2 business days. Delivery takes 3–6 business days depending on your location."
                },
                {
                  q: "What if I want to return or my order arrives damaged?",
                  a: "We have a 7-day return and replacement policy. If your order arrives damaged or is not as described, WhatsApp us within 7 days of delivery with a photo and we will arrange a replacement or full refund."
                }
              ].map((faq, idx) => (
                <div key={idx} className={`pd-acc-item ${activeFaq === idx ? 'pd-acc-open' : ''}`}>
                  <button className="pd-acc-header" onClick={() => setActiveFaq(activeFaq === idx ? null : idx)} style={{ padding: '12px 0' }}>
                    <span style={{ fontWeight: '500', textAlign: 'left' }}>{faq.q}</span>
                    {activeFaq === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  <div className="pd-acc-body">
                    <div className="pd-acc-inner" style={{ paddingBottom: '12px', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>{faq.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── REVIEWS SECTION ─────────────────────────────── */}
      <section id="reviews-section" className="pd-reviews-section">
        <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', fontStyle: 'italic' }}>
            Be the first to share your experience — early reviews coming soon from our founding batch customers.
          </p>
        </div>
      </section>
    </div>
  );
}
