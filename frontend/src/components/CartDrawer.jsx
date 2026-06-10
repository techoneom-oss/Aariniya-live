import { useState, useEffect } from 'react';
import { X, Trash2, ShieldCheck, CreditCard, ShoppingBag } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function CartDrawer({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveFromCart, onClearCart, user, setActivePage }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
  });
  const [loading, setLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState(''); // '', 'loading', 'found', 'error'

  // Auto-populate user details when logged in
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address_line1: user.address_line1 || '',
        address_line2: user.address_line2 || '',
        city: user.city || '',
        state: user.state || '',
        postal_code: user.postal_code || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
      });
    }
  }, [user, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-fill city & state from pincode (India Post API)
    if (name === 'postal_code') {
      const pin = value.replace(/\D/g, '');
      if (pin.length === 6) {
        setPincodeStatus('loading');
        fetch(`https://api.postalpincode.in/pincode/${pin}`)
          .then(r => r.json())
          .then(data => {
            if (data && data[0] && data[0].Status === 'Success') {
              const post = data[0].PostOffice[0];
              setFormData(prev => ({
                ...prev,
                city: post.District || post.Name || prev.city,
                state: post.State || prev.state,
                postal_code: pin,
              }));
              setPincodeStatus('found');
            } else {
              setPincodeStatus('error');
            }
          })
          .catch(() => setPincodeStatus('error'));
      } else {
        setPincodeStatus('');
      }
    }
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setLoading(true);

    const checkoutData = {
      amount: totalAmount,
      currency: 'INR',
      customer_name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: {
        address_line1: formData.address_line1,
        address_line2: formData.address_line2,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        country: 'India'
      },
      items: cartItems,
      user_id: user ? user.id : null
    };

    try {
      // 1. Create order on Express backend
      const res = await fetch(`${API_BASE_URL}/api/orders/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('aariniya_token') || '')
        },
        body: JSON.stringify(checkoutData)
      });
      
      if (!res.ok) throw new Error("Could not create Razorpay checkout order.");
      const order = await res.json();

      // 2. Open Razorpay Checkout (Simulated if using mock key, Real if actual key loaded)
      if (order.isMock || !window.Razorpay) {
        // Trigger simulated Mock Checkout
        handleMockCheckout(order);
      } else {
        // Run real Razorpay gateway
        const options = {
          key: order.key || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mockKeyId123',
          amount: order.amount,
          currency: order.currency,
          name: 'AARINIYA',
          description: 'Nature\'s Sweetest Ritual',
          image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=100&auto=format&fit=crop', // Honey placeholder icon
          order_id: order.id,
          handler: async (response) => {
            await verifyPaymentSignature(response, false);
          },
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone
          },
          theme: {
            color: '#1c352d' // Premium Forest Green brand color
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
        setLoading(false);
      }

    } catch (err) {
      alert(err.message);
      setLoading(false);
    }
  };

  const handleMockCheckout = (order) => {
    alert("🚀 (Mock Checkout) Connecting to simulated Razorpay sandbox...\n\nOrder ID: " + order.id + "\nAmount: ₹" + (order.amount / 100));
    
    // Simulate signature generation
    setTimeout(async () => {
      const mockPaymentResponse = {
        razorpay_order_id: order.id,
        razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
        razorpay_signature: 'mock_signature_hex_12345',
        isMock: true
      };
      await verifyPaymentSignature(mockPaymentResponse, true);
    }, 1200);
  };

  const verifyPaymentSignature = async (paymentDetails, isMock) => {
    try {
      const verifyRes = await fetch(`${API_BASE_URL}/api/orders/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentDetails,
          isMock
        })
      });

      if (!verifyRes.ok) throw new Error("Payment signature verification failed.");
      
      await verifyRes.json();
      
      alert("🎉 Ritual Order Successful!\n\nYour order has been logged into the nature ledger.");
      
      // Clear cart
      onClearCart();
      
      // Close Drawer
      onClose();

      // Redirect
      if (user) {
        setActivePage('profile');
      } else {
        setActivePage('home');
      }
    } catch (err) {
      alert("Error verifying payment: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Background Overlay */}
      <div 
        className={`drawer-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      ></div>

      {/* Slide-out Drawer */}
      <div className={`drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} /> Your Ritual Cart
          </h2>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="drawer-body">
          {cartItems.length === 0 ? (
            <div style={styles.emptyCart}>
              <ShoppingBag size={48} color="rgba(28, 53, 45, 0.12)" />
              <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Your cart is empty.</p>
              <button className="btn btn-secondary" onClick={() => { setActivePage('product'); onClose(); }} style={{ marginTop: '1rem' }}>
                Browse Honey Jar
              </button>
            </div>
          ) : (
            <>
              {/* Item Lists */}
              <div style={styles.cartItemsList}>
                {cartItems.map((item) => (
                  <div key={item.id} style={styles.cartItem}>
                    <img src={item.image} alt={item.name} style={styles.itemImage} />
                    <div style={styles.itemDetails}>
                      <h4 style={styles.itemName}>{item.name}</h4>
                      {item.isPreorder && (
                        <span style={styles.preorderBadge}>Pre-order</span>
                      )}
                      <span style={styles.itemPrice}>₹{item.price}</span>
                      
                      {/* Controls */}
                      {!item.isCourse && (
                        <div style={styles.quantityWrapper}>
                          <button 
                            style={styles.qtyCtrlBtn} 
                            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          >
                            -
                          </button>
                          <span style={styles.qtyVal}>{item.quantity}</span>
                          <button 
                            style={styles.qtyCtrlBtn} 
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                    <button 
                      style={styles.removeBtn} 
                      onClick={() => onRemoveFromCart(item.id)}
                      title="Remove Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Shipping Details form */}
              <form id="checkout-form" onSubmit={handleCheckoutSubmit} style={styles.form}>
                <h3 style={styles.sectionHeader}>Shipping & Billing</h3>
                
                {!user && (
                  <p style={styles.loginHint} onClick={() => { setActivePage('auth'); onClose(); }}>
                    Have an account? <strong>Login for faster checkout</strong>
                  </p>
                )}

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    name="name"
                    className="form-input" 
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    className="form-input" 
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  <input 
                    type="tel" 
                    name="phone"
                    className="form-input" 
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Address Line 1</label>
                  <input 
                    type="text" 
                    name="address_line1"
                    placeholder="Flat / Building number" 
                    className="form-input" 
                    value={formData.address_line1}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Address Line 2</label>
                  <input 
                    type="text" 
                    name="address_line2"
                    placeholder="Colony, landmark" 
                    className="form-input" 
                    value={formData.address_line2}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Pincode — comes first so city/state auto-fill */}
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Pincode</label>
                  <input
                    type="text"
                    name="postal_code"
                    className="form-input"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    maxLength={6}
                    placeholder="6-digit PIN"
                    required
                    style={{ paddingRight: '2.2rem' }}
                  />
                  {pincodeStatus === 'loading' && (
                    <span style={styles.pincodeSpinner}>⏳</span>
                  )}
                  {pincodeStatus === 'found' && (
                    <span style={{ ...styles.pincodeSpinner, color: '#2d6a4f' }}>✓</span>
                  )}
                  {pincodeStatus === 'error' && (
                    <span style={{ ...styles.pincodeSpinner, color: '#9a3434' }}>✗</span>
                  )}
                  {pincodeStatus === 'found' && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-success)', marginTop: '3px' }}>✓ City &amp; State auto-filled</p>
                  )}
                  {pincodeStatus === 'error' && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-error)', marginTop: '3px' }}>Invalid PIN — please check</p>
                  )}
                </div>

                <div style={styles.row}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      name="city"
                      className="form-input"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      placeholder="Auto-filled from PIN"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      name="state"
                      className="form-input"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      placeholder="Auto-filled from PIN"
                    />
                  </div>
                </div>
              </form>
            </>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="drawer-footer">
            <div style={styles.subtotalRow}>
              <span>Subtotal</span>
              <span style={styles.subtotalPrice}>₹{totalAmount}</span>
            </div>

            <button 
              type="submit" 
              form="checkout-form"
              className="btn btn-primary btn-block" 
              style={styles.checkoutBtn}
              disabled={loading}
            >
              {loading ? (
                <span>Locking Order...</span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} /> Place Order & Pay
                </span>
              )}
            </button>
            <div style={styles.securitySeal}>
              <ShieldCheck size={14} color="var(--color-success)" />
              <span>Payments secured securely via Razorpay</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-main)',
    cursor: 'pointer',
    padding: '5px',
  },
  emptyCart: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 0',
  },
  cartItemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '2rem',
    borderBottom: '1px solid rgba(28, 53, 45, 0.08)',
    paddingBottom: '1.5rem',
  },
  cartItem: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: '0.85rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(28, 53, 45, 0.06)',
  },
  itemImage: {
    width: '60px',
    height: '60px',
    objectFit: 'contain',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '4px',
    padding: '4px',
  },
  itemDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  itemName: {
    fontSize: '0.88rem',
    fontWeight: '600',
    color: 'var(--color-primary)',
    lineHeight: '1.2',
    marginBottom: '2px',
  },
  preorderBadge: {
    display: 'inline-block',
    alignSelf: 'start',
    backgroundColor: '#fef3c7',
    color: '#d97706',
    fontSize: '0.68rem',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
    marginTop: '2px',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    lineHeight: '1',
  },
  itemPrice: {
    fontSize: '0.85rem',
    color: 'var(--color-accent)',
    fontWeight: '700',
    marginBottom: '4px',
  },
  quantityWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    border: '1px solid rgba(28, 53, 45, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
    alignSelf: 'start',
  },
  qtyCtrlBtn: {
    background: 'none',
    border: 'none',
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    color: 'var(--color-primary)',
    fontWeight: 'bold',
  },
  qtyVal: {
    fontSize: '0.8rem',
    fontWeight: '600',
    width: '20px',
    textAlign: 'center',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-error)',
    cursor: 'pointer',
    opacity: 0.7,
    padding: '8px',
    borderRadius: '50%',
    transition: 'var(--transition-fast)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '1.5rem',
  },
  sectionHeader: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--color-primary)',
    borderBottom: '1px solid rgba(28, 53, 45, 0.08)',
    paddingBottom: '6px',
    marginBottom: '1rem',
  },
  loginHint: {
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  row: {
    display: 'flex',
    gap: '0.75rem',
  },
  pincodeSpinner: {
    position: 'absolute',
    right: '0.75rem',
    top: '2.4rem',
    fontSize: '0.85rem',
    lineHeight: 1,
  },
  subtotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--color-primary)',
    marginBottom: '1rem',
  },
  subtotalPrice: {
    fontSize: '1.25rem',
  },
  checkoutBtn: {
    height: '50px',
  },
  securitySeal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    marginTop: '8px',
  }
};
