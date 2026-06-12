import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, Sparkles } from 'lucide-react';

export default function AariniyaChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Greetings! 🌿 I am your Aariniya Wellness Assistant. How may I guide your wellness ritual today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Generate response
    setTimeout(() => {
      let replyText = '';
      const text = textToSend.toLowerCase();

      if (text.includes('aarini') && (text.includes('who') || text.includes('profile') || text.includes('founder'))) {
        replyText = '🌿 **Aarini Devyani** is the symbolic founder and face of AARINIYA. She represents the spirit and philosophy of our brand—nature, wellness, balance, and authenticity. At 19, inspired by her roots in Central Indian wild forests, she leads a lifestyle centered around yoga, fitness, travel, and nature exploration. She is a representation of our values rather than a celebrity figure.';
      } else if (text.includes('honey') || text.includes('pure') || text.includes('raw') || text.includes('harvest') || text.includes('flagship') || text.includes('product')) {
        replyText = '🍯 **AARINIYA Deep Forest Multifloral Honey** is our flagship product. It is a carefully selected, premium multifloral forest honey inspired by the rich biodiversity of natural forest ecosystems. Harvested responsibly and packed in small batches inside premium glass packaging, it features a rich natural aroma and distinctive flavor profile. *(Please note: As a premium natural product, we make no medical claims to cure, prevent, or treat any diseases).*';
      } else if (text.includes('different') || text.includes('unlike') || text.includes('compare') || text.includes('special')) {
        replyText = '✨ **What makes AARINIYA different?** Unlike standard commodity honey brands, AARINIYA is a premium wellness experience. We combine authenticity, nature-inspired stories, sustainable community values, and premium quality into a complete daily ritual that helps you reconnect with nature.';
      } else if (text.includes('checkout') || text.includes('guest') || text.includes('account') || text.includes('login') || text.includes('sign in') || text.includes('without log')) {
        replyText = '🚚 **Guest Checkout**: Yes, absolutely! You can now checkout as a guest without creating an account or logging in. Simply add your items to the cart, fill in your details, and proceed directly to payment.';
      } else if (text.includes('yoga') || text.includes('course') || text.includes('diet') || text.includes('enroll') || text.includes('program')) {
        replyText = '🧘 We offer premium wellness courses to complement your daily honey ritual:\n\n1. **Forest Morning Yoga Flow (21 Days)**: Guided vinyasa for strength & mindfulness.\n2. **Deep Breathing & Meditation (10 Days)**: Calm stress & release tension.\n3. **Whole-Foods Diet Plan (4 Weeks)**: Mindful nutrition recipes & elimination of refined sugars.\n\nYou can enroll via the **"Wellness Courses"** tab at the top!';
      } else if (text.includes('pincode') || text.includes('pin') || text.includes('zip') || text.includes('post') || text.includes('city') || text.includes('state') || text.includes('auto-fill') || text.includes('automatic')) {
        replyText = '📍 **Auto-fill Pincode Integration**: When entering your delivery details at checkout, simply type your 6-digit Indian PIN code. Our system will query the official India Post API and automatically populate the **City** and **State** for you, making checkout error-free and seamless!';
      } else if (text.includes('hello') || text.includes('hi') || text.includes('hey') || text.includes('greetings')) {
        replyText = '🌿 Greetings! I am your Aariniya Wellness Assistant. How may I guide your wellness ritual today? You can ask me about our Deep Forest Honey, our founder Aarini, or our wellness programs.';
      } else if (text.includes('forest') || text.includes('origin') || text.includes('mountain') || text.includes('waterfall') || text.includes('community')) {
        replyText = '🌳 **Forest & Community Story**: The forests behind AARINIYA represent biodiversity, natural beauty, and balance. Our brand is inspired by forest landscapes, waterfalls, and mountain regions, and we carry a deep respect and appreciation for the traditional practices of local communities living close to nature.';
      } else if (text.includes('future') || text.includes('ecosystem') || text.includes('category') || text.includes('retreat')) {
        replyText = '🌱 **Future Brand Ecosystem**: While honey is our flagship product, AARINIYA is building a broader nature-inspired wellness ecosystem. In the future, we plan to expand into herbal wellness, natural foods, mindful lifestyle products, wellness experiences, and nature retreats.';
      } else if (text.includes('price') || text.includes('cost') || text.includes('buy') || text.includes('order')) {
        replyText = '🛍️ A 900g jar of our premium Deep Forest Multifloral Honey is priced at ₹1,970. We offer bundle savings: 2 Jars for ₹3,690, and a Family Pack of 5 Jars for ₹8,450. You can browse and order directly from the main product section!';
      } else {
        replyText = '✉️ I want to ensure you get the best assistance. If you have order queries, shipping questions, or special requests, please email our support team at **techoneom@gmail.com** and we will get back to you shortly!';
      }

      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const quickReplies = [
    { text: '🌿 What is AARINIYA?', query: 'What is AARINIYA?' },
    { text: '🍯 Flagship Honey', query: 'Tell me about AARINIYA Deep Forest Honey' },
    { text: '👤 Who is Aarini?', query: 'Who is Aarini?' },
    { text: '🚚 Guest Checkout', query: 'Can I checkout as guest?' }
  ];

  return (
    <div style={styles.container}>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)} 
          style={styles.fab} 
          title="Open Aariniya Assistant"
        >
          <MessageCircle size={24} color="#fff" />
          <span style={styles.fabBadge}></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={styles.window}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerTitle}>
              <div style={styles.avatar}>
                <Bot size={18} color="#1c352d" />
              </div>
              <div>
                <h4 style={styles.name}>Aariniya Guide</h4>
                <div style={styles.statusRow}>
                  <span style={styles.statusDot}></span>
                  <span style={styles.statusText}>Wellness AI • Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>
              <X size={18} color="#6b7771" />
            </button>
          </div>

          {/* Messages Area */}
          <div style={styles.messagesList}>
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                style={{
                  ...styles.messageRow,
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                {msg.sender === 'bot' && (
                  <div style={styles.botAvatar}>
                    <Sparkles size={12} color="#c49a3c" />
                  </div>
                )}
                <div 
                  style={{
                    ...styles.bubble,
                    backgroundColor: msg.sender === 'user' ? '#1c352d' : '#f5f2eb',
                    color: msg.sender === 'user' ? '#fff' : '#1c352d',
                    borderRadius: msg.sender === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                  }}
                >
                  <p style={styles.messageText}>{msg.text}</p>
                  <span 
                    style={{
                      ...styles.timeText,
                      color: msg.sender === 'user' ? 'rgba(255,255,255,0.6)' : '#8c9891'
                    }}
                  >
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
                <div style={styles.botAvatar}>
                  <Sparkles size={12} color="#c49a3c" />
                </div>
                <div style={{ ...styles.bubble, backgroundColor: '#f5f2eb', borderRadius: '18px 18px 18px 2px' }}>
                  <div style={styles.typingIndicator} className="typing-indicator-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Reply Chips */}
          <div style={styles.quickRepliesContainer}>
            {quickReplies.map((qr, index) => (
              <button 
                key={index} 
                onClick={() => handleSendMessage(qr.query)}
                style={styles.quickReplyBtn}
              >
                {qr.text}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }} 
            style={styles.inputForm}
          >
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question..."
              style={styles.input}
              disabled={isTyping}
            />
            <button 
              type="submit" 
              style={{
                ...styles.sendBtn,
                opacity: inputValue.trim() ? 1 : 0.6
              }}
              disabled={!inputValue.trim() || isTyping}
            >
              <Send size={16} color="#fff" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    fontFamily: "'Outfit', sans-serif",
  },
  fab: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#1c352d',
    border: 'none',
    boxShadow: '0 4px 16px rgba(28, 53, 45, 0.3)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  fabBadge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#c49a3c',
    border: '2px solid #1c352d',
    animation: 'pulse 2s infinite',
  },
  window: {
    width: '360px',
    height: '500px',
    borderRadius: '16px',
    backgroundColor: '#fff',
    boxShadow: '0 8px 32px rgba(28, 53, 45, 0.15)',
    border: '1px solid rgba(28, 53, 45, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1)',
  },
  header: {
    padding: '14px 16px',
    backgroundColor: '#fbf9f4',
    borderBottom: '1px solid rgba(28, 53, 45, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#e3dfd5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#1c352d',
    margin: 0,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#2d6a4f',
  },
  statusText: {
    fontSize: '0.75rem',
    color: '#6b7771',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#f1ede4',
    }
  },
  messagesList: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: '#fff',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    maxWidth: '85%',
  },
  botAvatar: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#f5f2eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: '2px',
  },
  bubble: {
    padding: '10px 14px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
    display: 'inline-block',
  },
  messageText: {
    fontSize: '0.88rem',
    lineHeight: '1.45',
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  timeText: {
    fontSize: '0.68rem',
    display: 'block',
    textAlign: 'right',
    marginTop: '4px',
  },
  quickRepliesContainer: {
    padding: '10px 16px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    borderTop: '1px solid rgba(28, 53, 45, 0.05)',
    backgroundColor: '#fff',
  },
  quickReplyBtn: {
    fontSize: '0.78rem',
    color: '#1c352d',
    backgroundColor: '#f5f2eb',
    border: '1px solid rgba(28, 53, 45, 0.08)',
    borderRadius: '20px',
    padding: '6px 12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    '&:hover': {
      backgroundColor: '#1c352d',
      color: '#fff',
    }
  },
  inputForm: {
    padding: '12px 16px',
    borderTop: '1px solid rgba(28, 53, 45, 0.08)',
    display: 'flex',
    gap: '10px',
    backgroundColor: '#fbf9f4',
  },
  input: {
    flex: 1,
    border: '1px solid rgba(28, 53, 45, 0.12)',
    borderRadius: '24px',
    padding: '10px 16px',
    fontSize: '0.88rem',
    outline: 'none',
    backgroundColor: '#fff',
    color: '#1c352d',
    transition: 'border-color 0.2s',
  },
  sendBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: '#1c352d',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  typingIndicator: {
    display: 'flex',
    gap: '4px',
    padding: '4px 2px',
    alignItems: 'center',
    height: '12px',
  }
};
