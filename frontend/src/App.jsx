import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import MyJourney from './pages/MyJourney';
import Courses from './pages/Courses';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Load user session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('aariniya_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user session", e);
        localStorage.removeItem('aariniya_user');
      }
    }
  }, []);

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
        return <Courses onEnrollCourse={handleAddToCart} />;
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
      <Footer setActivePage={setActivePage} />

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
    </div>
  );
}
