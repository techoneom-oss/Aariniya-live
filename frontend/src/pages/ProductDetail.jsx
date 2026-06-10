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
      <div style={styles.loading}>
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
    <div className="container" style={styles.container}>
      {/* Product Detail Top Section */}
      <div className="product-main-grid" style={styles.mainGrid}>
        {/* Left Column: Image Gallery */}
        <div className="product-gallery-container">
          <div className="product-thumbnails">
            {displayImages.map((img, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveImage(img)}
                className="product-thumbnail-btn"
                style={{
                  border: activeImage === img ? '2px solid var(--color-accent)' : '1px solid rgba(28, 53, 45, 0.08)'
                }}
              >
                <img className="product-thumbnail-img" src={img} alt={`Detail ${idx + 1}`} />
              </button>
            ))}
          </div>
          <div className="product-main-image-container">
            <img className="product-main-image" src={activeImage} alt={product.name} />
          </div>
        </div>

        {/* Right Column: Purchasing Details */}
        <div style={styles.detailsCol}>
          <span style={styles.brandTag}>AARINIYA | Flagship Ritual</span>
          <h1 style={styles.title}>{product.name}</h1>
          <p style={styles.subtitle}>{product.subtitle}</p>

          {/* Star Rating Summary */}
          <div style={styles.ratingSummary} onClick={() => document.getElementById('reviews-section').scrollIntoView()}>
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill={i < Math.round(Number(averageRating)) ? "var(--color-accent)" : "none"} />
              ))}
            </div>
            <span style={styles.ratingText}>{averageRating} / 5 ({totalReviewsCount} Verified Reviews)</span>
          </div>

          {/* Price Box */}
          <div style={styles.priceContainer}>
            <div style={styles.priceRow}>
              <span style={styles.price}>₹{currentPrice}</span>
              {currentOriginalPrice && (
                <>
                  <span style={styles.originalPrice}>M.R.P. ₹{currentOriginalPrice}</span>
                  <span style={styles.discountBadge}>
                    {Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>
            <p style={styles.taxNote}>(inclusive of all taxes)</p>
          </div>

          {/* Offers banner */}
          <div style={styles.offersBox}>
            <div style={styles.offerTag}>✓ Earn 5% MCash cashbacks automatically on every order</div>
            <div style={styles.offerTag}>✓ Free shipping on orders within India</div>
          </div>

          {/* Pack Quantity Selector */}
          <div style={styles.sizeSection}>
            <span style={styles.sectionLabel}>Select Pack Quantity</span>
            <div style={styles.sizeOptions}>
              <button 
                style={{
                  ...styles.sizeBtn, 
                  ...(selectedPack === 1 ? styles.activeSizeBtn : {})
                }}
                onClick={() => handlePackChange(1)}
              >
                <span style={{ fontWeight: '700' }}>1 Jar</span>
                <span style={{ fontSize: '0.75rem', marginTop: '2px', opacity: 0.9 }}>₹1,970</span>
              </button>
              <button 
                style={{
                  ...styles.sizeBtn, 
                  ...(selectedPack === 2 ? styles.activeSizeBtn : {})
                }}
                onClick={() => handlePackChange(2)}
              >
                <span style={{ fontWeight: '700' }}>2 Jars</span>
                <span style={{ fontSize: '0.75rem', marginTop: '2px', opacity: 0.9 }}>₹3,690</span>
                <span style={styles.savePill}>Save 6%</span>
              </button>
              <button 
                style={{
                  ...styles.sizeBtn, 
                  ...(selectedPack === 5 ? styles.activeSizeBtn : {})
                }}
                onClick={() => handlePackChange(5)}
              >
                <span style={{ fontWeight: '700' }}>5 Jars</span>
                <span style={{ fontSize: '0.75rem', marginTop: '2px', opacity: 0.9 }}>₹8,450</span>
                <span style={styles.savePill}>Save 14%</span>
              </button>
            </div>
          </div>

          {/* Stock Status Indicator */}
          {product.inventory > 0 ? (
            <div style={styles.stockStatus}>
              <span style={styles.inStockDot}>●</span>
              <span style={styles.inStockText}>In Stock — Only {product.inventory} jars left from this harvest.</span>
            </div>
          ) : (
            <div style={styles.preorderStatus}>
              <div style={styles.preorderHeader}>
                <span style={styles.preorderDot}>●</span>
                <span style={styles.preorderTitle}>Next Harvest Pre-order</span>
              </div>
              <p style={styles.preorderDesc}>
                🌿 Current batch is fully reserved. Pre-order now to secure your jar from the next harvest. Estimated shipping: 3-4 weeks.
              </p>
            </div>
          )}

          {/* Quantity and CTA */}
          <div style={styles.purchaseControls}>
            <div style={styles.quantitySelector}>
              <button 
                style={styles.qtyBtn} 
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              >
                <Minus size={16} />
              </button>
              <span style={styles.qtyVal}>{quantity}</span>
              <button 
                style={styles.qtyBtn} 
                onClick={() => setQuantity(prev => prev + 1)}
              >
                <Plus size={16} />
              </button>
            </div>

            <button 
              className="btn btn-primary" 
              style={styles.addToCartBtn}
              onClick={handleAddToCartClick}
            >
              {product.inventory > 0 ? 'Add to Ritual Cart' : 'Pre-order Honey (Next Batch)'}
            </button>
          </div>

          {/* Accordions (Potency, Taste, Ways to enjoy, etc.) */}
          <div style={styles.accordions}>
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
                  <table style={styles.specTable}>
                    <tbody>
                      <tr>
                        <td style={styles.specLabel}>Brand</td>
                        <td>{product.details.brand}</td>
                      </tr>
                      <tr>
                        <td style={styles.specLabel}>Net weight</td>
                        <td>{product.details.net_weight}</td>
                      </tr>
                      <tr>
                        <td style={styles.specLabel}>Packaging</td>
                        <td>{product.details.packaging}</td>
                      </tr>
                      <tr>
                        <td style={styles.specLabel}>Origin</td>
                        <td>{product.details.origin}</td>
                      </tr>
                      <tr>
                        <td style={styles.specLabel}>Storage</td>
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
      <section id="reviews-section" className="product-reviews-wrapper" style={styles.reviewsWrapper}>
        <h2 style={styles.reviewsTitle}>Customer Reviews</h2>
        
        {/* Three Column Summary Box */}
        <div className="product-summary-box" style={styles.summaryBox}>
          {/* Column 1: Average */}
          <div style={styles.summaryColLeft}>
            <div style={styles.summaryStars}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} fill={i < Math.round(Number(averageRating)) ? "var(--color-accent)" : "none"} style={{ marginRight: '2px' }} />
              ))}
            </div>
            <div style={styles.summaryAvgRating}>{averageRating} out of 5</div>
            <div style={styles.summaryTotalReviews}>Based on {totalReviewsCount} reviews</div>
          </div>

          {/* Column 2: Progress Bars (with borders) */}
          <div className="product-summary-col-middle" style={styles.summaryColMiddle}>
            <div style={styles.progressList}>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = starsBreakdown[stars] || 0;
                const percentage = totalReviewsCount > 0 ? (count / totalReviewsCount) * 100 : 0;
                return (
                  <div key={stars} style={styles.progressRow}>
                    <div style={styles.starsWrapper}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={11} fill={i < stars ? "var(--color-primary)" : "none"} style={{ marginRight: '1px' }} />
                      ))}
                    </div>
                    <div style={styles.progressBarBg}>
                      <div style={{...styles.progressBarFill, width: `${percentage}%`}}></div>
                    </div>
                    <span style={styles.progressCount}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 3: Button */}
          <div style={styles.summaryColRight}>
            <button className="btn" style={styles.writeReviewBtn} onClick={() => setShowReviewForm(!showReviewForm)}>
              Write a review
            </button>
          </div>
        </div>

        {/* Toggled Write a Review form */}
        {showReviewForm && (
          <div style={styles.writeReviewCard}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)' }}>
              <MessageSquare size={16} /> Share Your Experience
            </h3>
            
            {reviewSuccess ? (
              <div style={styles.reviewSuccessMsg}>
                <Check size={18} style={{ marginRight: '6px' }} />
                Thank you! Your feedback has been uploaded to the wellness ledger.
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit}>
                <div style={styles.row} className="review-form-row">
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
        <div style={styles.sortBar}>
          <span style={styles.sortLabel}>Most Recent</span>
          <span style={styles.sortArrow}>▼</span>
        </div>

        {/* Reviews List */}
        <div style={styles.commentsList}>
          {reviews.map((r, idx) => (
            <div key={r.id || idx} style={styles.reviewCard}>
              {/* Star Rating and Date row */}
              <div style={styles.reviewMetaRow}>
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < r.rating ? "var(--color-accent)" : "none"} style={{ marginRight: '1px' }} />
                  ))}
                </div>
                <span style={styles.reviewDate}>
                  {new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                </span>
              </div>

              {/* User row */}
              <div style={styles.reviewerRow}>
                <div style={styles.reviewerAvatar}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <span style={styles.reviewerName}>{r.reviewer_name}</span>
                <span style={styles.verifiedTag}>
                  <ShieldCheck size={11} style={{ marginRight: '3px' }} /> Verified Buyer
                </span>
              </div>

              {/* Title & Body */}
              <h4 style={styles.reviewTitleText}>{r.title || 'Love it'}</h4>
              <p style={styles.reviewBody}>{r.review_text}</p>
              
              {r.tags && r.tags.length > 0 && (
                <div style={styles.reviewTags}>
                  {r.tags.map((tag, tIdx) => (
                    <span key={tIdx} style={styles.tagBadge}>#{tag}</span>
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

const styles = {
  container: {
    paddingTop: '3rem',
    paddingBottom: '6rem',
    fontFamily: 'var(--font-sans)',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '4.5rem',
  },
  galleryWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  mainImageContainer: {
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-medium)',
    height: '800px',
    width: '100%',
    backgroundColor: '#f5f7f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
    display: 'block',
    transition: 'transform 0.4s ease',
  },
  thumbnails: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    marginTop: '1rem',
  },
  thumbnailBtn: {
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    outline: 'none',
    background: 'none',
    flexShrink: 0,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center',
    borderRadius: 'var(--radius-md)',
    display: 'block',
  },
  detailsCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  brandTag: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--color-accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    marginBottom: '0.5rem',
  },
  title: {
    fontSize: '2.2rem',
    marginBottom: '0.75rem',
    lineHeight: '1.2',
  },
  subtitle: {
    fontSize: '1rem',
    color: 'var(--color-text-muted)',
    lineHeight: '1.5',
    marginBottom: '1.5rem',
  },
  ratingSummary: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    marginBottom: '2rem',
  },
  ratingText: {
    fontSize: '0.88rem',
    color: 'var(--color-primary)',
    fontWeight: '500',
  },
  priceContainer: {
    marginBottom: '2rem',
    width: '100%',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '1rem',
  },
  price: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: 'var(--color-primary)',
  },
  originalPrice: {
    fontSize: '1.1rem',
    color: 'var(--color-text-muted)',
    textDecoration: 'line-through',
  },
  discountBadge: {
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-primary)',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  taxNote: {
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
    marginTop: '4px',
  },
  offersBox: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-md)',
    padding: '1.25rem 1.5rem',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    marginBottom: '2.5rem',
    border: '1px solid rgba(28, 53, 45, 0.05)',
  },
  offerTag: {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: 'var(--color-primary-light)',
  },
  sizeSection: {
    marginBottom: '2.5rem',
    width: '100%',
  },
  sectionLabel: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.75rem',
    color: 'var(--color-primary)',
  },
  sizeOptions: {
    display: 'flex',
    gap: '1rem',
    width: '100%',
  },
  sizeBtn: {
    position: 'relative',
    padding: '0.8rem 0.5rem',
    fontSize: '0.9rem',
    border: '1px solid rgba(28, 53, 45, 0.15)',
    borderRadius: 'var(--radius-sm)',
    background: '#ffffff',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: '62px',
    color: 'var(--color-primary)',
  },
  savePill: {
    position: 'absolute',
    top: '-9px',
    right: '8px',
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-primary)',
    fontSize: '0.62rem',
    fontWeight: '800',
    padding: '1px 5px',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textTransform: 'uppercase',
  },
  activeSizeBtn: {
    borderColor: 'var(--color-primary)',
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
  },
  disabledSizeBtn: {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--color-text-muted)',
    borderStyle: 'dashed',
    cursor: 'not-allowed',
  },
  purchaseControls: {
    display: 'flex',
    gap: '1.5rem',
    width: '100%',
    marginBottom: '3rem',
  },
  quantitySelector: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid rgba(28, 53, 45, 0.15)',
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  qtyBtn: {
    background: 'none',
    border: 'none',
    width: '45px',
    height: '45px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--color-primary)',
    transition: 'var(--transition-fast)',
  },
  qtyVal: {
    width: '40px',
    textAlign: 'center',
    fontSize: '0.95rem',
    fontWeight: '600',
  },
  addToCartBtn: {
    flex: 1,
    height: '47px',
  },
  stockStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
    fontWeight: '500',
    color: 'var(--color-primary)',
  },
  inStockDot: {
    color: '#2d6a4f',
    fontSize: '1.2rem',
    lineHeight: '1',
  },
  inStockText: {
    fontFamily: 'var(--font-sans)',
  },
  preorderStatus: {
    backgroundColor: '#f4f6f5',
    borderRadius: 'var(--radius-md)',
    padding: '1rem 1.25rem',
    border: '1px solid rgba(45, 106, 79, 0.15)',
    marginBottom: '1.5rem',
    width: '100%',
  },
  preorderHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.35rem',
  },
  preorderDot: {
    color: '#d97706',
    fontSize: '1.2rem',
    lineHeight: '1',
    animation: 'pulse 2s infinite',
  },
  preorderTitle: {
    fontWeight: '600',
    color: 'var(--color-primary)',
    fontSize: '0.9rem',
  },
  preorderDesc: {
    fontSize: '0.85rem',
    color: 'var(--color-text-muted)',
    lineHeight: '1.45',
    margin: 0,
    textAlign: 'left',
  },
  accordions: {
    width: '100%',
    borderTop: '1px solid rgba(28, 53, 45, 0.08)',
  },
  specTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  specLabel: {
    fontWeight: '600',
    color: 'var(--color-primary)',
    width: '35%',
    padding: '6px 0',
  },
  loading: {
    minHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-muted)',
  },
  reviewsWrapper: {
    marginTop: '6rem',
    borderTop: '1px solid rgba(28, 53, 45, 0.08)',
    paddingTop: '4.5rem',
  },
  reviewsTitle: {
    fontFamily: 'var(--font-serif)',
    fontSize: '2rem',
    textAlign: 'center',
    marginBottom: '2.5rem',
    color: 'var(--color-primary)',
  },
  summaryBox: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 2fr 1.2fr',
    borderTop: '1px solid rgba(28, 53, 45, 0.08)',
    borderBottom: '1px solid rgba(28, 53, 45, 0.08)',
    padding: '2.5rem 0',
    alignItems: 'center',
    marginBottom: '2.5rem',
  },
  summaryColLeft: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  summaryStars: {
    marginBottom: '0.4rem',
  },
  summaryAvgRating: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.8rem',
    fontWeight: '700',
    color: 'var(--color-primary)',
    lineHeight: '1.2',
  },
  summaryTotalReviews: {
    fontSize: '0.85rem',
    color: 'var(--color-text-muted)',
    marginTop: '0.25rem',
  },
  summaryColMiddle: {
    borderLeft: '1px solid rgba(28, 53, 45, 0.08)',
    borderRight: '1px solid rgba(28, 53, 45, 0.08)',
    padding: '0 3rem',
  },
  starsWrapper: {
    display: 'flex',
    alignItems: 'center',
    width: '75px',
  },
  progressList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    fontSize: '0.85rem',
  },
  progressBarBg: {
    flex: 1,
    height: '6px',
    backgroundColor: 'rgba(28, 53, 45, 0.08)',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'var(--color-primary)',
  },
  progressCount: {
    width: '30px',
    textAlign: 'right',
    color: 'var(--color-text-muted)',
    fontWeight: '500',
  },
  summaryColRight: {
    display: 'flex',
    justifyContent: 'center',
  },
  writeReviewBtn: {
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
    padding: '0.9rem 2.5rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
    boxShadow: 'var(--shadow-subtle)',
    textTransform: 'none',
    letterSpacing: '0.02em',
  },
  writeReviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-subtle)',
    padding: '2.5rem',
    border: '1px solid rgba(28, 53, 45, 0.08)',
    marginBottom: '2.5rem',
  },
  sortBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.88rem',
    fontWeight: '600',
    color: 'var(--color-primary)',
    cursor: 'pointer',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid rgba(28, 53, 45, 0.08)',
    marginBottom: '1.5rem',
    width: 'fit-content',
  },
  sortLabel: {
    fontFamily: 'var(--font-sans)',
  },
  sortArrow: {
    fontSize: '0.7rem',
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
  },
  reviewCard: {
    padding: '2rem 0',
    borderBottom: '1px solid rgba(28, 53, 45, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  reviewMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  reviewerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  reviewerAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid rgba(28, 53, 45, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-primary)',
  },
  reviewerName: {
    fontWeight: '600',
    color: 'var(--color-primary)',
    fontSize: '0.9rem',
    textTransform: 'capitalize',
  },
  verifiedTag: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.7rem',
    color: 'var(--color-success)',
    backgroundColor: 'rgba(45, 106, 79, 0.08)',
    padding: '1px 5px',
    borderRadius: '4px',
    marginLeft: '5px',
  },
  reviewDate: {
    fontSize: '0.82rem',
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-sans)',
  },
  reviewTitleText: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: 'var(--color-primary)',
    margin: '0 0 0.5rem 0',
    fontFamily: 'var(--font-sans)',
  },
  reviewBody: {
    fontSize: '0.94rem',
    lineHeight: '1.65',
    color: 'var(--color-text-main)',
    margin: '0 0 1rem 0',
    textAlign: 'left',
  },
  reviewTags: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  tagBadge: {
    fontSize: '0.75rem',
    color: 'var(--color-primary-light)',
    backgroundColor: 'var(--bg-secondary)',
    padding: '2px 8px',
    borderRadius: '20px',
    fontWeight: '500',
  }
};
