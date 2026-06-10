import { useState, useEffect } from 'react';
import { Star, ShieldCheck, Plus, Minus, Check, MessageSquare } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function ProductDetail({ onAddToCart }) {
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [selectedPack, setSelectedPack] = useState(1); // 1, 2, or 5
  
  // Review form state
  const [newReview, setNewReview] = useState({
    name: '',
    title: '',
    rating: 5,
    text: '',
    tags: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const getProductPackImage = (pack) => {
    if (pack === 1) return '/assets/product_qty_1.jpg';
    if (pack === 2) return '/assets/product_qty_2.jpg';
    if (pack === 5) return '/assets/product_qty_5.jpg';
    return '/assets/product_qty_1.jpg';
  };

  const fetchProductDetails = async () => {
    try {
      // Fetch the honey product (seeded as ID 1)
      const res = await fetch(`${API_BASE_URL}/api/products/1`);
      if (!res.ok) throw new Error('Product not found');
      const data = await res.json();
      setProduct(data);
      if (data.images && data.images.length > 0) {
        setActiveImage(getProductPackImage(selectedPack));
      }
      
      // Fetch reviews
      const reviewsRes = await fetch(`${API_BASE_URL}/api/reviews/1`);
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProductDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.text) {
      alert("Please fill in your name and review content.");
      return;
    }
    setSubmittingReview(true);
    
    try {
      const parsedTags = newReview.tags 
        ? newReview.tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0)
        : ["pure", "honey"];

      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: 1,
          reviewer_name: newReview.name,
          title: newReview.title,
          rating: newReview.rating,
          review_text: newReview.text,
          tags: parsedTags
        })
      });

      if (!res.ok) throw new Error("Could not submit review");
      const submitted = await res.json();
      
      setReviews([submitted, ...reviews]);
      setReviewSuccess(true);
      setNewReview({ name: '', title: '', rating: 5, text: '', tags: '' });
      setTimeout(() => {
        setReviewSuccess(false);
        setShowReviewForm(false);
      }, 2000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  const currentPrice = selectedPack === 1 ? 1970 : (selectedPack === 2 ? 3690 : 8450);
  const currentOriginalPrice = selectedPack === 1 ? 2400 : (selectedPack === 2 ? 4800 : 12000);

  const handlePackChange = (pack) => {
    setSelectedPack(pack);
    setActiveImage(getProductPackImage(pack));
  };

  const handleAddToCartClick = () => {
    if (product) {
      const packName = selectedPack === 1 
        ? ' (1 Jar)' 
        : ` (Pack of ${selectedPack})`;
      
      const preorderText = product.inventory === 0 ? ' (Pre-order)' : '';

      onAddToCart({
        id: `${product.id}_pack_${selectedPack}`,
        name: product.name + packName + preorderText,
        price: currentPrice,
        image: getProductPackImage(selectedPack),
        quantity: quantity,
        isPreorder: product.inventory === 0,
        packSize: selectedPack
      });
    }
  };

  if (!product) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem' }}>Sourcing forest parameters...</p>
      </div>
    );
  }

  // Calculate review averages combining seeded database reviews + mock baseline
  const mockBase = { 5: 379, 4: 8, 3: 2, 2: 0, 1: 0 };
  
  const total5 = mockBase[5] + reviews.filter(r => r.rating === 5).length;
  const total4 = mockBase[4] + reviews.filter(r => r.rating === 4).length;
  const total3 = mockBase[3] + reviews.filter(r => r.rating === 3).length;
  const total2 = mockBase[2] + reviews.filter(r => r.rating === 2).length;
  const total1 = mockBase[1] + reviews.filter(r => r.rating === 1).length;
  
  const totalReviewsCount = total5 + total4 + total3 + total2 + total1;
  const sumRatings = (total5 * 5) + (total4 * 4) + (total3 * 3) + (total2 * 2) + (total1 * 1);
  const averageRating = totalReviewsCount > 0 
    ? (sumRatings / totalReviewsCount).toFixed(2)
    : '4.97';

  const starsBreakdown = { 
    5: total5, 
    4: total4, 
    3: total3, 
    2: total2, 
    1: total1 
  };

  const displayImages = product 
    ? [getProductPackImage(selectedPack), ...product.images.slice(1)]
    : [];

  return (
    <div className="container product-container">
      {/* Product Detail Top Section */}
      <div className="product-main-grid">
        {/* Left Column: Image Gallery */}
        <div className="product-gallery-container">
          <div className="product-thumbnails">
            {displayImages.map((img, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveImage(img)}
                className="product-thumbnail-btn"
                style={{
                  borderColor: activeImage === img ? 'var(--color-accent)' : 'rgba(28, 53, 45, 0.08)',
                  borderWidth: activeImage === img ? '2px' : '1px',
                  borderStyle: 'solid'
                }}
              >
                <img src={img} alt={`Detail ${idx + 1}`} className="product-thumbnail-img" />
              </button>
            ))}
          </div>
          <div className="product-main-image-container">
            <img src={activeImage} alt={product.name} className="product-main-image" />
          </div>
        </div>

        {/* Right Column: Purchasing Details */}
        <div className="product-details-col">
          <span className="product-brand-tag">AARINIYA | Flagship Ritual</span>
          <h1 className="product-title">{product.name}</h1>
          <p className="product-subtitle">{product.subtitle}</p>

          {/* Star Rating Summary */}
          <div className="product-rating-summary" onClick={() => document.getElementById('reviews-section').scrollIntoView()}>
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill={i < Math.round(Number(averageRating)) ? "var(--color-accent)" : "none"} />
              ))}
            </div>
            <span className="product-rating-text">{averageRating} / 5 ({totalReviewsCount} Verified Reviews)</span>
          </div>

          {/* Price Box */}
          <div className="product-price-container">
            <div className="product-price-row">
              <span className="product-price">₹{currentPrice}</span>
              {currentOriginalPrice && (
                <>
                  <span className="product-original-price">M.R.P. ₹{currentOriginalPrice}</span>
                  <span className="product-discount-badge">
                    {Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>
            <p className="product-tax-note">(inclusive of all taxes)</p>
          </div>

          {/* Offers banner */}
          <div className="product-offers-box">
            <div className="product-offer-tag">✓ Earn 5% MCash cashbacks automatically on every order</div>
            <div className="product-offer-tag">✓ Free shipping on orders within India</div>
          </div>

          {/* Pack Quantity Selector */}
          <div className="product-size-section">
            <span className="product-section-label">Select Pack Quantity</span>
            <div className="product-size-options">
              <button 
                className={`product-size-btn ${selectedPack === 1 ? 'product-active-size-btn' : ''}`}
                onClick={() => handlePackChange(1)}
              >
                <span style={{ fontWeight: '700' }}>1 Jar</span>
                <span style={{ fontSize: '0.75rem', marginTop: '2px', opacity: 0.9 }}>₹1,970</span>
              </button>
              <button 
                className={`product-size-btn ${selectedPack === 2 ? 'product-active-size-btn' : ''}`}
                onClick={() => handlePackChange(2)}
              >
                <span style={{ fontWeight: '700' }}>2 Jars</span>
                <span style={{ fontSize: '0.75rem', marginTop: '2px', opacity: 0.9 }}>₹3,690</span>
                <span className="product-save-pill">Save 6%</span>
              </button>
              <button 
                className={`product-size-btn ${selectedPack === 5 ? 'product-active-size-btn' : ''}`}
                onClick={() => handlePackChange(5)}
              >
                <span style={{ fontWeight: '700' }}>5 Jars</span>
                <span style={{ fontSize: '0.75rem', marginTop: '2px', opacity: 0.9 }}>₹8,450</span>
                <span className="product-save-pill">Save 14%</span>
              </button>
            </div>
          </div>

          {/* Stock Status Indicator */}
          {product.inventory > 0 ? (
            <div className="product-stock-status">
              <span className="product-in-stock-dot">●</span>
              <span className="product-in-stock-text">In Stock — Only {product.inventory} jars left from this harvest.</span>
            </div>
          ) : (
            <div className="product-preorder-status">
              <div className="product-preorder-header">
                <span className="product-preorder-dot">●</span>
                <span className="product-preorder-title">Next Harvest Pre-order</span>
              </div>
              <p className="product-preorder-desc">
                🌿 Current batch is fully reserved. Pre-order now to secure your jar from the next harvest. Estimated shipping: 3-4 weeks.
              </p>
            </div>
          )}

          {/* Quantity and CTA */}
          <div className="product-purchase-controls">
            <div className="product-quantity-selector">
              <button 
                className="product-qty-btn" 
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              >
                <Minus size={16} />
              </button>
              <span className="product-qty-val">{quantity}</span>
              <button 
                className="product-qty-btn" 
                onClick={() => setQuantity(prev => prev + 1)}
              >
                <Plus size={16} />
              </button>
            </div>

            <button 
              className="btn btn-primary product-add-to-cart-btn"
              onClick={handleAddToCartClick}
            >
              {product.inventory > 0 ? 'Add to Ritual Cart' : 'Pre-order Honey (Next Batch)'}
            </button>
          </div>

          {/* Accordions (Potency, Taste, Ways to enjoy, etc.) */}
          <div className="product-accordions">
            {/* Accordion 1: Potency */}
            <div className={`accordion-item ${activeAccordion === 0 ? 'open' : ''}`}>
              <div className="accordion-header" onClick={() => toggleAccordion(0)}>
                <span>What Makes it Potent?</span>
                <span>{activeAccordion === 0 ? '−' : '+'}</span>
              </div>
              <div className="accordion-content">
                <p>{product.short_description}</p>
                <p style={{ marginTop: '0.5rem' }}>{product.description}</p>
              </div>
            </div>

            {/* Accordion 2: Taste Profile */}
            <div className={`accordion-item ${activeAccordion === 1 ? 'open' : ''}`}>
              <div className="accordion-header" onClick={() => toggleAccordion(1)}>
                <span>Taste & Texture Profile</span>
                <span>{activeAccordion === 1 ? '−' : '+'}</span>
              </div>
              <div className="accordion-content">
                {product.taste_profile && (
                  <ul style={{ listStyle: 'square', paddingLeft: '1.2rem' }}>
                    <li><strong>Flavor:</strong> {product.taste_profile.flavor}</li>
                    <li><strong>Aroma:</strong> {product.taste_profile.aroma}</li>
                    <li><strong>Texture:</strong> {product.taste_profile.texture}</li>
                    <li><strong>Floral Source:</strong> {product.taste_profile.source}</li>
                  </ul>
                )}
              </div>
            </div>

            {/* Accordion 3: Ways to Enjoy */}
            <div className={`accordion-item ${activeAccordion === 2 ? 'open' : ''}`}>
              <div className="accordion-header" onClick={() => toggleAccordion(2)}>
                <span>Ways to Enjoy</span>
                <span>{activeAccordion === 2 ? '−' : '+'}</span>
              </div>
              <div className="accordion-content">
                <ul style={{ listStyle: 'circle', paddingLeft: '1.2rem' }}>
                  {product.ways_to_enjoy.map((w, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Accordion 4: Technical Specs */}
            <div className={`accordion-item ${activeAccordion === 3 ? 'open' : ''}`}>
              <div className="accordion-header" onClick={() => toggleAccordion(3)}>
                <span>Product Information</span>
                <span>{activeAccordion === 3 ? '−' : '+'}</span>
              </div>
              <div className="accordion-content">
                {product.details && (
                  <table className="product-spec-table">
                    <tbody>
                      <tr>
                        <td className="product-spec-label">Brand</td>
                        <td>{product.details.brand}</td>
                      </tr>
                      <tr>
                        <td className="product-spec-label">Net weight</td>
                        <td>{product.details.net_weight}</td>
                      </tr>
                      <tr>
                        <td className="product-spec-label">Packaging</td>
                        <td>{product.details.packaging}</td>
                      </tr>
                      <tr>
                        <td className="product-spec-label">Origin</td>
                        <td>{product.details.origin}</td>
                      </tr>
                      <tr>
                        <td className="product-spec-label">Storage</td>
                        <td>{product.details.storage}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section id="reviews-section" className="product-reviews-wrapper">
        <h2 className="product-reviews-title">Customer Reviews</h2>
        
        {/* Three Column Summary Box */}
        <div className="product-summary-box">
          {/* Column 1: Average */}
          <div className="product-summary-col-left">
            <div className="product-summary-stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} fill={i < Math.round(Number(averageRating)) ? "var(--color-accent)" : "none"} style={{ marginRight: '2px' }} />
              ))}
            </div>
            <div className="product-summary-avg-rating">{averageRating} out of 5</div>
            <div className="product-summary-total-reviews">Based on {totalReviewsCount} reviews</div>
          </div>

          {/* Column 2: Progress Bars (with borders) */}
          <div className="product-summary-col-middle">
            <div className="product-progress-list">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = starsBreakdown[stars] || 0;
                const percentage = totalReviewsCount > 0 ? (count / totalReviewsCount) * 100 : 0;
                return (
                  <div key={stars} className="product-progress-row">
                    <div className="product-stars-wrapper">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={11} fill={i < stars ? "var(--color-primary)" : "none"} style={{ marginRight: '1px' }} />
                      ))}
                    </div>
                    <div className="product-progress-bar-bg">
                      <div className="product-progress-bar-fill" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="product-progress-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 3: Button */}
          <div className="product-summary-col-right">
            <button className="btn product-write-review-btn" onClick={() => setShowReviewForm(!showReviewForm)}>
              Write a review
            </button>
          </div>
        </div>

        {/* Toggled Write a Review form */}
        {showReviewForm && (
          <div className="product-write-review-card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)' }}>
              <MessageSquare size={16} /> Share Your Experience
            </h3>
            
            {reviewSuccess ? (
              <div style={{ display: 'flex', alignItems: 'center', padding: '1rem', backgroundColor: '#edfdf5', color: 'var(--color-success)', borderLeft: '4px solid var(--color-success)', borderRadius: 'var(--radius-sm)' }}>
                <Check size={18} style={{ marginRight: '6px' }} />
                Thank you! Your feedback has been uploaded to the wellness ledger.
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit}>
                <div style={{ display: 'flex', gap: '1rem' }} className="review-form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Your Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. sakshi singh" 
                      className="form-input" 
                      value={newReview.name}
                      onChange={e => setNewReview({ ...newReview, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Review Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Excellent honey / Love it" 
                      className="form-input" 
                      value={newReview.title}
                      onChange={e => setNewReview({ ...newReview, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ width: '130px' }}>
                    <label className="form-label">Rating</label>
                    <select 
                      className="form-input"
                      value={newReview.rating}
                      onChange={e => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                    >
                      <option value="5">5 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="2">2 Stars</option>
                      <option value="1">1 Star</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Review Details</label>
                  <textarea 
                    placeholder="Share your experience (texture, aroma, wellness results...)" 
                    className="form-input"
                    rows="3"
                    value={newReview.text}
                    onChange={e => setNewReview({ ...newReview, text: e.target.value })}
                    required
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="pure, thick, floral" 
                    className="form-input" 
                    value={newReview.tags}
                    onChange={e => setNewReview({ ...newReview, tags: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 2rem' }} disabled={submittingReview}>
                    {submittingReview ? 'Uploading...' : 'Publish Review'}
                  </button>
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.6rem 1.5rem' }} onClick={() => setShowReviewForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Dropdown sort bar */}
        <div className="product-sort-bar">
          <span className="product-sort-label">Most Recent</span>
          <span className="product-sort-arrow">▼</span>
        </div>

        {/* Reviews List */}
        <div className="product-comments-list">
          {reviews.map((r, idx) => (
            <div key={r.id || idx} className="product-review-card">
              {/* Star Rating and Date row */}
              <div className="product-review-meta-row">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < r.rating ? "var(--color-accent)" : "none"} style={{ marginRight: '1px' }} />
                  ))}
                </div>
                <span className="product-review-date">
                  {new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                </span>
              </div>

              {/* User row */}
              <div className="product-reviewer-row">
                <div className="product-reviewer-avatar">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <span className="product-reviewer-name">{r.reviewer_name}</span>
                <span className="product-verified-tag">
                  <ShieldCheck size={11} style={{ marginRight: '3px' }} /> Verified Buyer
                </span>
              </div>

              {/* Title & Body */}
              <h4 className="product-review-title-text">{r.title || 'Love it'}</h4>
              <p className="product-review-body">{r.review_text}</p>
              
              {r.tags && r.tags.length > 0 && (
                <div className="product-review-tags">
                  {r.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="product-tag-badge">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
