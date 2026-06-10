import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, ShieldAlert } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function AdminDashboard({ user, setActivePage }) {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' or 'inventory'
  
  // Inventory editing states
  const [editInventory, setEditInventory] = useState({}); // { productId: value }
  const [feedback, setFeedback] = useState({ type: '', message: '' }); // { type: 'success' | 'error', message: '' }

  const showFeedback = useCallback((type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 4000);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('aariniya_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
      // Fetch stats
      const statsRes = await fetch(`${API_BASE_URL}/api/admin/dashboard-stats`, { headers });
      if (!statsRes.ok) throw new Error("Failed to fetch dashboard stats");
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch products
      const prodRes = await fetch(`${API_BASE_URL}/api/products`);
      if (!prodRes.ok) throw new Error("Failed to fetch products");
      const prodData = await prodRes.json();
      setProducts(prodData);
      
      // Initialize edit values
      const initialEdit = {};
      prodData.forEach(p => {
        initialEdit[p.id] = p.inventory;
      });
      setEditInventory(initialEdit);

      // Fetch courses
      const courseRes = await fetch(`${API_BASE_URL}/api/courses`);
      if (!courseRes.ok) throw new Error("Failed to fetch courses");
      const courseData = await courseRes.json();
      setCourses(courseData);

    } catch (err) {
      console.error(err);
      showFeedback('error', err.message);
    } finally {
      setLoading(false);
    }
  }, [showFeedback]);

  useEffect(() => {
    let isCurrent = true;
    let timer;
    if (user && user.role === 'admin') {
      timer = setTimeout(() => {
        if (isCurrent) {
          fetchDashboardData();
        }
      }, 0);
    } else {
      timer = setTimeout(() => {
        if (isCurrent) {
          setLoading(false);
        }
      }, 0);
    }
    return () => {
      isCurrent = false;
      if (timer) clearTimeout(timer);
    };
  }, [user, fetchDashboardData]);

  const handleUpdateInventory = async (productId) => {
    const token = localStorage.getItem('aariniya_token');
    const value = editInventory[productId];

    if (value === undefined || value === '') {
      showFeedback('error', 'Please enter a valid stock number');
      return;
    }

    const inventoryVal = parseInt(value, 10);
    if (isNaN(inventoryVal) || inventoryVal < 0) {
      showFeedback('error', 'Stock value must be a non-negative integer');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/inventory`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inventory: inventoryVal })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update inventory');
      
      // Update local state
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, inventory: inventoryVal } : p));
      showFeedback('success', `Product "${data.product.name}" stock updated to ${inventoryVal}`);
    } catch (err) {
      console.error(err);
      showFeedback('error', err.message);
    }
  };

  const handleToggleCourseStatus = async (courseId, currentStatus) => {
    const token = localStorage.getItem('aariniya_token');
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/courses/${courseId}/enrollment`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enrollment_status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update course status');

      // Update local state
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, enrollment_status: newStatus } : c));
      showFeedback('success', `Course "${data.course.title}" is now ${newStatus}`);
    } catch (err) {
      console.error(err);
      showFeedback('error', err.message);
    }
  };

  const handleInventoryChange = (productId, val) => {
    setEditInventory(prev => ({ ...prev, [productId]: val }));
  };

  // Access check
  if (!user || user.role !== 'admin') {
    return (
      <div style={styles.deniedContainer}>
        <div style={styles.deniedCard}>
          <ShieldAlert size={48} color="var(--color-error)" style={{ marginBottom: '1.5rem' }} />
          <h2 style={styles.deniedTitle}>Access Denied</h2>
          <p style={styles.deniedText}>Only authorized administrators can access this command panel.</p>
          <button style={styles.deniedBtn} onClick={() => setActivePage('home')}>Return to Sanctuary</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Fetching ecosystem diagnostics...</p>
      </div>
    );
  }

  return (
    <div className="container" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.kicker}>Admin Command Center</span>
        <h1 style={styles.title}>Aariniya Sanctuary Dashboard</h1>
        <p style={styles.subtitle}>
          Monitor sales analytics, review active ritual subscriptions, and manage botanical stock levels in real time.
        </p>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div style={{
          ...styles.feedbackBanner,
          backgroundColor: feedback.type === 'success' ? '#f0fdf4' : '#fdf0f0',
          color: feedback.type === 'success' ? 'var(--color-primary)' : 'var(--color-error)',
          borderColor: feedback.type === 'success' ? 'var(--color-primary)' : 'var(--color-error)'
        }}>
          {feedback.type === 'success' ? <CheckCircle size={20} style={{ marginRight: '8px' }} /> : <ShieldAlert size={20} style={{ marginRight: '8px' }} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div style={styles.filterTabs}>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'stats' ? styles.activeTabBtn : {})}}
          onClick={() => setActiveTab('stats')}
        >
          Analytics & Orders
        </button>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'inventory' ? styles.activeTabBtn : {})}}
          onClick={() => setActiveTab('inventory')}
        >
          Ecosystem Inventory
        </button>
      </div>

      {/* Tab Content 1: Stats & Orders */}
      {activeTab === 'stats' && stats && (
        <div>
          {/* Analytics Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Total Revenue</span>
              <span style={styles.statValue}>₹{stats.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              <span style={styles.statSubText}>Fully processed payments</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Total Orders</span>
              <span style={styles.statValue}>{stats.orderCount}</span>
              <span style={styles.statSubText}>Completed transactions</span>
            </div>
          </div>

          {/* Active Orders List */}
          <h2 style={styles.sectionTitle}>Active Order Registry</h2>
          {stats.activeOrders && stats.activeOrders.length === 0 ? (
            <div style={styles.emptyCard}>
              <p>No active orders registered in the system yet.</p>
            </div>
          ) : (
            <div style={styles.ordersList}>
              {stats.activeOrders.map(o => {
                const formattedDate = new Date(o.created_at).toLocaleString();
                const addressStr = `${o.address.address_line1 || ''}, ${o.address.address_line2 || ''}, ${o.address.city || ''}, ${o.address.state || ''} - ${o.address.postal_code || ''}, ${o.address.country || ''}`;

                return (
                  <div key={o.id} style={styles.orderCard}>
                    <div style={styles.orderHeader}>
                      <div>
                        <span style={styles.orderLabel}>Order ID</span>
                        <h3 style={styles.orderIdText}>{o.razorpay_order_id || `order_${o.id}`}</h3>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={styles.orderLabel}>Payment Status</span>
                        <span style={styles.paidBadge}>PAID</span>
                      </div>
                    </div>

                    <div style={styles.orderBodyGrid}>
                      <div>
                        <h4 style={styles.subHeading}>Customer Information</h4>
                        <p style={styles.bodyText}><strong>Name:</strong> {o.customer_name}</p>
                        <p style={styles.bodyText}><strong>Email:</strong> {o.email}</p>
                        <p style={styles.bodyText}><strong>Phone:</strong> {o.phone}</p>
                        <p style={styles.bodyText}><strong>Shipping Address:</strong> {addressStr}</p>
                        <p style={styles.bodyText}><strong>Date:</strong> {formattedDate}</p>
                      </div>

                      <div>
                        <h4 style={styles.subHeading}>Purchased Items</h4>
                        <div style={styles.itemsContainer}>
                          {o.items && o.items.map((item, idx) => (
                            <div key={idx} style={styles.orderItemRow}>
                              <div>
                                <span style={styles.itemName}>{item.name}</span>
                                <span style={styles.itemType}>{item.isCourse ? 'Wellness Course' : 'Physical Product'}</span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={styles.itemQty}>x{item.qty || item.quantity || 1}</span>
                                <span style={styles.itemPrice}>₹{((item.qty || item.quantity || 1) * (item.price || 0)).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={styles.orderFooter}>
                          <span>Total Amount Paid:</span>
                          <strong style={styles.orderTotalValue}>₹{o.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Inventory & Courses Management */}
      {activeTab === 'inventory' && (
        <div style={styles.inventoryGrid}>
          {/* Products Stock management */}
          <div style={styles.managementCard}>
            <h2 style={styles.managementCardTitle}>Botanical Products Inventory</h2>
            <p style={styles.managementCardSubtitle}>Modify direct stock counts. Changes are validated instantly.</p>
            
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Product Details</th>
                    <th style={styles.th}>Current Stock</th>
                    <th style={styles.th}>Modify Level</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>₹{p.price} per unit</div>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.stockLabel,
                          color: p.inventory < 10 ? 'var(--color-error)' : 'var(--color-primary)',
                          fontWeight: 'bold'
                        }}>
                          {p.inventory} units
                        </span>
                      </td>
                      <td style={styles.td}>
                        <input 
                          type="number"
                          min="0"
                          style={styles.stockInput}
                          value={editInventory[p.id] !== undefined ? editInventory[p.id] : p.inventory}
                          onChange={(e) => handleInventoryChange(p.id, e.target.value)}
                        />
                      </td>
                      <td style={styles.td}>
                        <button 
                          className="btn btn-primary"
                          style={styles.actionBtn}
                          onClick={() => handleUpdateInventory(p.id)}
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Courses Status management */}
          <div style={styles.managementCard}>
            <h2 style={styles.managementCardTitle}>Wellness Courses Registration</h2>
            <p style={styles.managementCardSubtitle}>Toggle enrollment openings for vinyasa flows and dietary blueprints.</p>
            
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Course Title</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Enrollment Status</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(c => (
                    <tr key={c.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{c.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{c.duration}</div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.typeBadgeCompact}>
                          {c.type}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: c.enrollment_status === 'open' ? '#e6f7ed' : '#fdf0f0',
                          color: c.enrollment_status === 'open' ? 'var(--color-primary)' : 'var(--color-error)'
                        }}>
                          {c.enrollment_status === 'open' ? 'OPEN' : 'CLOSED'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button 
                          style={{
                            ...styles.toggleBtn,
                            backgroundColor: c.enrollment_status === 'open' ? 'var(--color-error)' : 'var(--color-primary)',
                            color: '#ffffff'
                          }}
                          onClick={() => handleToggleCourseStatus(c.id, c.enrollment_status)}
                        >
                          {c.enrollment_status === 'open' ? 'Close Reg' : 'Open Reg'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '2rem',
    marginBottom: '3rem',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem',
    border: '1px solid rgba(28, 53, 45, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-small)',
  },
  statLabel: {
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--color-text-muted)',
    marginBottom: '0.5rem',
  },
  statValue: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: 'var(--color-primary)',
    marginBottom: '0.25rem',
  },
  statSubText: {
    fontSize: '0.85rem',
    color: 'var(--color-text-muted)',
  },
  sectionTitle: {
    fontSize: '1.8rem',
    marginBottom: '1.5rem',
    color: 'var(--color-primary)',
    borderBottom: '2px solid rgba(28, 53, 45, 0.05)',
    paddingBottom: '0.5rem',
  },
  emptyCard: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    padding: '3rem',
    textAlign: 'center',
    border: '1px solid rgba(28, 53, 45, 0.05)',
    color: 'var(--color-text-muted)',
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid rgba(28, 53, 45, 0.08)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-small)',
  },
  orderHeader: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '1.25rem 2rem',
    borderBottom: '1px solid rgba(28, 53, 45, 0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLabel: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.05em',
    display: 'block',
  },
  orderIdText: {
    fontSize: '1.1rem',
    color: 'var(--color-primary)',
    margin: 0,
  },
  paidBadge: {
    backgroundColor: '#e6f7ed',
    color: 'var(--color-primary)',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  orderBodyGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '2.5rem',
    padding: '2rem',
  },
  subHeading: {
    fontSize: '1.05rem',
    color: 'var(--color-primary)',
    marginBottom: '1rem',
    borderBottom: '1px solid rgba(28, 53, 45, 0.05)',
    paddingBottom: '0.25rem',
  },
  bodyText: {
    fontSize: '0.9rem',
    lineHeight: '1.6',
    margin: '0 0 0.5rem 0',
    color: 'var(--color-text-muted)',
  },
  itemsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  orderItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.88rem',
  },
  itemName: {
    fontWeight: '600',
    color: 'var(--color-primary)',
    display: 'block',
  },
  itemType: {
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
  },
  itemQty: {
    color: 'var(--color-text-muted)',
    marginRight: '1rem',
  },
  itemPrice: {
    fontWeight: '600',
  },
  orderFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(28, 53, 45, 0.08)',
    paddingTop: '1rem',
    fontSize: '1rem',
  },
  orderTotalValue: {
    fontSize: '1.25rem',
    color: 'var(--color-primary)',
  },
  inventoryGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3rem',
  },
  managementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 'var(--radius-lg)',
    padding: '2.5rem',
    border: '1px solid rgba(28, 53, 45, 0.08)',
    boxShadow: 'var(--shadow-small)',
  },
  managementCardTitle: {
    fontSize: '1.5rem',
    color: 'var(--color-primary)',
    marginBottom: '0.25rem',
  },
  managementCardSubtitle: {
    fontSize: '0.88rem',
    color: 'var(--color-text-muted)',
    marginBottom: '1.5rem',
  },
  tableWrapper: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    borderBottom: '2px solid rgba(28, 53, 45, 0.08)',
    padding: '1rem',
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--color-text-muted)',
  },
  tr: {
    borderBottom: '1px solid rgba(28, 53, 45, 0.05)',
  },
  td: {
    padding: '1rem',
    fontSize: '0.9rem',
    verticalAlign: 'middle',
  },
  stockLabel: {
    fontSize: '0.95rem',
  },
  stockInput: {
    width: '80px',
    padding: '0.4rem 0.6rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(28, 53, 45, 0.2)',
    fontFamily: 'var(--font-sans)',
  },
  actionBtn: {
    padding: '0.4rem 1rem',
    fontSize: '0.8rem',
    borderRadius: '20px',
  },
  typeBadgeCompact: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: 'var(--color-accent)',
    fontWeight: '600',
  },
  statusBadge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '4px',
    letterSpacing: '0.05em',
  },
  toggleBtn: {
    padding: '0.4rem 0.8rem',
    fontSize: '0.8rem',
    borderRadius: '20px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'var(--transition-fast)',
  },
  deniedContainer: {
    minHeight: '70vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  deniedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 'var(--radius-lg)',
    padding: '3rem',
    maxWidth: '480px',
    textAlign: 'center',
    border: '1px solid rgba(28, 53, 45, 0.08)',
    boxShadow: 'var(--shadow-medium)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  deniedTitle: {
    fontSize: '1.8rem',
    color: 'var(--color-error)',
    margin: '0 0 1rem 0',
  },
  deniedText: {
    fontSize: '0.95rem',
    color: 'var(--color-text-muted)',
    lineHeight: '1.6',
    margin: '0 0 2rem 0',
  },
  deniedBtn: {
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '40px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: 'var(--transition-fast)',
  },
  feedbackBanner: {
    borderLeft: '4px solid',
    borderRadius: 'var(--radius-sm)',
    padding: '1rem',
    marginBottom: '2rem',
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.9rem',
  },
  loadingContainer: {
    minHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  }
};
