import { useState, useEffect } from 'react';
import { Star, ShieldCheck, Plus, Minus, Check, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function ProductDetail({ onAddToCart }) {
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [selectedPack, setSelectedPack] = useState(1);
  
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
      setActiveImage(getProductPackImage(1));
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

  const toggleAccordion = (index) => setActiveAccordion(activeAccordion === index ? null : index);
  const currentPrice = selectedPack === 1 ? 1970 : (selectedPack === 2 ? 3690 : 8450);
  const currentOriginalPrice = selectedPack === 1 ? 2400 : (selectedPack === 2 ? 4800 : 12000);
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
              alt={product.name}
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
                <img src={img} alt={`View ${idx + 1}`} className="pd-thumb-img" />
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT / BOTTOM: Details */}
        <div className="pd-details">
          <span className="pd-brand-tag">AARINIYA | FLAGSHIP RITUAL</span>
          <h1 className="pd-title">{product.name}</h1>
          <p className="pd-subtitle">{product.subtitle}</p>

          {/* Rating */}
          <button
            className="pd-rating-row"
            onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span className="pd-stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill={i < Math.round(Number(averageRating)) ? 'var(--color-accent)' : 'none'} stroke={i < Math.round(Number(averageRating)) ? 'var(--color-accent)' : 'var(--color-text-muted)'} />
              ))}
            </span>
            <span className="pd-rating-text">{averageRating} ({totalReviewsCount} Verified Reviews)</span>
          </button>

          {/* Price */}
          <div className="pd-price-box">
            <div className="pd-price-label">PRICE</div>
            <div className="pd-price-row">
              <span className="pd-mrp">M.R.P. <s>₹{currentOriginalPrice.toLocaleString()}</s></span>
              <span className="pd-price">₹{currentPrice.toLocaleString()}</span>
              <span className="pd-badge-off">{discountPct}% Off</span>
            </div>
            <p className="pd-tax">(incl. of all taxes)</p>
          </div>

          {/* Offers strip */}
          <div className="pd-offers">
            <div className="pd-offer-item">✓ Free shipping on orders within India</div>
            <div className="pd-offer-item">✓ Earn 5% cashback on every order, post-delivery</div>
          </div>

          {/* Pack Selector */}
          <div className="pd-pack-section">
            <p className="pd-section-label">Select Pack Quantity</p>
            <div className="pd-pack-options">
              {[
                { pack: 1, label: '1 Jar', price: '₹1,970', save: null },
                { pack: 2, label: '2 Jars', price: '₹3,690', save: 'Save 6%' },
                { pack: 5, label: '5 Jars', price: '₹8,450', save: 'Save 14%' },
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
            <button className="pd-add-btn" onClick={handleAddToCartClick}>
              {product.inventory > 0 ? 'ADD TO CART' : 'PRE-ORDER'}
            </button>
          </div>

          {/* Trust badges */}
          <div className="pd-trust-strip">
            <div className="pd-trust-item"><ShieldCheck size={15} /><span>100% Pure</span></div>
            <div className="pd-trust-item"><Check size={15} /><span>Unfiltered</span></div>
            <div className="pd-trust-item"><Check size={15} /><span>Small Batch</span></div>
            <div className="pd-trust-item"><Check size={15} /><span>Premium Glass</span></div>
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
        </div>
      </div>

      {/* ── REVIEWS SECTION ─────────────────────────────── */}
      <section id="reviews-section" className="pd-reviews-section">
        <div className="container">
          <h2 className="pd-reviews-title">Customer Reviews</h2>

          {/* Summary box */}
          <div className="pd-review-summary">
            <div className="pd-review-avg">
              <div className="pd-stars pd-stars-lg">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} fill={i < Math.round(Number(averageRating)) ? 'var(--color-accent)' : 'none'} stroke={i < Math.round(Number(averageRating)) ? 'var(--color-accent)' : 'var(--color-text-muted)'} />
                ))}
              </div>
              <div className="pd-avg-num">{averageRating} <span>out of 5</span></div>
              <div className="pd-avg-count">Based on {totalReviewsCount} reviews</div>
            </div>

            <div className="pd-review-bars">
              {[5, 4, 3, 2, 1].map(stars => {
                const count = starsBreakdown[stars] || 0;
                const pct = totalReviewsCount > 0 ? (count / totalReviewsCount) * 100 : 0;
                return (
                  <div key={stars} className="pd-bar-row">
                    <span className="pd-bar-label">{stars}★</span>
                    <div className="pd-bar-bg"><div className="pd-bar-fill" style={{ width: `${pct}%` }} /></div>
                    <span className="pd-bar-count">{count}</span>
                  </div>
                );
              })}
            </div>

            <div className="pd-review-cta">
              <button className="pd-write-btn" onClick={() => setShowReviewForm(v => !v)}>
                {showReviewForm ? 'Cancel' : 'Write a Review'}
              </button>
            </div>
          </div>

          {/* Review form */}
          {showReviewForm && (
            <div className="pd-review-form-card">
              <h3 className="pd-form-title"><MessageSquare size={16} /> Share Your Experience</h3>
              {reviewSuccess ? (
                <div className="pd-success-msg"><Check size={18} /> Thank you! Your review has been submitted.</div>
              ) : (
                <form onSubmit={handleReviewSubmit}>
                  <div className="pd-form-row">
                    <div className="form-group">
                      <label className="form-label">Your Name</label>
                      <input type="text" className="form-input" placeholder="e.g. Priya Sharma" value={newReview.name} onChange={e => setNewReview({ ...newReview, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Review Title</label>
                      <input type="text" className="form-input" placeholder="e.g. Excellent honey!" value={newReview.title} onChange={e => setNewReview({ ...newReview, title: e.target.value })} required />
                    </div>
                    <div className="form-group pd-form-rating">
                      <label className="form-label">Rating</label>
                      <select className="form-input" value={newReview.rating} onChange={e => setNewReview({ ...newReview, rating: Number(e.target.value) })}>
                        <option value="5">5 Stars ⭐⭐⭐⭐⭐</option>
                        <option value="4">4 Stars ⭐⭐⭐⭐</option>
                        <option value="3">3 Stars ⭐⭐⭐</option>
                        <option value="2">2 Stars ⭐⭐</option>
                        <option value="1">1 Star ⭐</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Your Review</label>
                    <textarea className="form-input" rows="3" placeholder="Share your experience (texture, aroma, wellness results...)" value={newReview.text} onChange={e => setNewReview({ ...newReview, text: e.target.value })} required style={{ resize: 'vertical' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tags (Optional, comma-separated)</label>
                    <input type="text" className="form-input" placeholder="pure, thick, floral" value={newReview.tags} onChange={e => setNewReview({ ...newReview, tags: e.target.value })} />
                  </div>
                  <div className="pd-form-actions">
                    <button type="submit" className="btn btn-primary" disabled={submittingReview}>{submittingReview ? 'Publishing...' : 'Publish Review'}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowReviewForm(false)}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Reviews list */}
          <div className="pd-reviews-list">
            {reviews.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem 0' }}>No written reviews yet. Be the first!</p>
            )}
            {reviews.map((r, idx) => (
              <div key={r.id || idx} className="pd-review-card">
                <div className="pd-rc-top">
                  <div className="pd-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} fill={i < r.rating ? 'var(--color-accent)' : 'none'} stroke={i < r.rating ? 'var(--color-accent)' : 'var(--color-text-muted)'} />
                    ))}
                  </div>
                  <span className="pd-rc-date">{new Date(r.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="pd-rc-author">
                  <div className="pd-rc-avatar">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <span className="pd-rc-name">{r.reviewer_name}</span>
                  <span className="pd-rc-verified"><ShieldCheck size={10} /> Verified</span>
                </div>
                {r.title && <h4 className="pd-rc-title">{r.title}</h4>}
                <p className="pd-rc-body">{r.review_text}</p>
                {r.tags && r.tags.length > 0 && (
                  <div className="pd-rc-tags">
                    {r.tags.map((tag, ti) => <span key={ti} className="pd-rc-tag">#{tag}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
