import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, Sparkles } from 'lucide-react';

export default function AariniyaChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Greetings! 🌿 I am Aarini, the founder of AARINIYA. How can I help guide your wellness ritual today?',
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

      if (text.includes('pure') || text.includes('real') || text.includes('original') || text.includes('fake') || text.includes('adulterat') || text.includes('sugar') || text.includes('chemical') || text.includes('preservative')) {
        replyText = "Yes — completely. Our honey is cold-extracted, never heated, never blended from unknown sources. You will often see it crystallise over time — that is actually proof of purity. Processed honey rarely crystallises because its natural compounds have been removed.";
      } else if (text.includes('where') || text.includes('source') || text.includes('origin') || text.includes('come from') || text.includes('harvest') || text.includes('odisha') || text.includes('jharkhand') || text.includes('simlipal') || text.includes('tribal') || text.includes('corridor')) {
        replyText = "Our honey comes from the sal and mahua forests of Odisha and Jharkhand — one of India's most biodiverse forest corridors. We work directly with tribal communities who have harvested wild honey for generations. It is single-source, seasonal, and fully traceable.";
      } else if (text.includes('different') || text.includes('dabur') || text.includes('supermarket') || text.includes('commercial') || text.includes('brand') || text.includes('patanjali') || text.includes('comparison') || text.includes('compare')) {
        replyText = "Commercial honey is usually pasteurised at high heat (which destroys enzymes and pollen), blended from multiple unknown sources, and sometimes diluted. Ours is none of that. It is raw, single-source, cold-filled, and you can taste the difference.";
      } else if (text.includes('price') || text.includes('cost') || text.includes('mrp') || text.includes('expensive') || text.includes('discount') || text.includes('499') || text.includes('1970')) {
        replyText = "We are in our founding launch phase. We want our first customers to experience the product at a special price before we open to the wider market. This is a first harvest, limited batch — only 100 jars at this price.";
      } else if (text.includes('buy') || text.includes('order') || text.includes('purchase') || text.includes('how to') || text.includes('checkout') || text.includes('cart')) {
        replyText = "You can add to cart directly on the site and checkout securely. Or if you prefer, just tap the \"Order on WhatsApp\" button — I will personally confirm your order there.";
      } else if (text.includes('ship') || text.includes('deliver') || text.includes('courier') || text.includes('location') || text.includes('pincode') || text.includes('city') || text.includes('state')) {
        replyText = "Yes, we ship across India — free shipping on all orders. Delivery is usually 3–6 business days for metros and 5–9 for other areas.";
      } else if (text.includes('crystallis') || text.includes('crystal') || text.includes('spoil') || text.includes('solid') || text.includes('freeze')) {
        replyText = "Not at all! Crystallisation is completely natural for raw honey — it actually means the honey is pure. Just place the jar in a bowl of lukewarm water for 15–20 minutes and it will return to liquid. Never microwave it — that destroys the beneficial enzymes.";
      } else if (text.includes('tea') || text.includes('herbal') || text.includes('glow') || text.includes('launch') || text.includes('coming soon')) {
        replyText = "We are getting very close! Forest Glow Herbal Tea is our next ritual — crafted from six Ayurvedic herbs for gut health and skin glow. If you enter your email in the \"Coming Next\" section on our homepage, I will personally notify you first.";
      } else if (text.includes('return') || text.includes('damage') || text.includes('refund') || text.includes('replace') || text.includes('broken')) {
        replyText = "I am sorry to hear that. Please WhatsApp me within 7 days of delivery with a photo of the issue and I will arrange a replacement or full refund right away — no questions asked.";
      } else if (text.includes('weight') || text.includes('diabet') || text.includes('health') || text.includes('disease') || text.includes('doctor') || text.includes('cure') || text.includes('lose')) {
        replyText = "Raw forest honey is a natural whole food with beneficial enzymes, antioxidants, and minerals. Many people use it as a replacement for refined sugar. However, I am not a doctor and would not make medical claims. If you have a specific health condition, please check with your doctor about including it in your diet.";
      } else if (text.includes('child') || text.includes('kid') || text.includes('baby') || text.includes('infant') || text.includes('toddler') || text.includes('age')) {
        replyText = "Raw honey is not recommended for infants under 12 months. For children above 1 year and adults, raw honey is generally considered safe as part of a balanced diet.";
      } else if (text.includes('loyalty') || text.includes('repeat') || text.includes('membership') || text.includes('coupon') || text.includes('promo')) {
        replyText = "Right now we are offering our founding launch price — ₹499 instead of ₹1,970. We are building a loyalty program for repeat customers. The 5-jar pack at ₹2,299 gives the best value per jar.";
      } else if (text.includes('phone') || text.includes('call') || text.includes('number') || text.includes('contact') || text.includes('whatsapp') || text.includes('talk') || text.includes('support')) {
        replyText = "We are a small team and respond fastest on WhatsApp. Just tap the green WhatsApp button on the site and I will get back to you within a few hours.";
      } else if (text.includes('aarini') || text.includes('who') || text.includes('profile') || text.includes('founder')) {
        replyText = "Namaste! 🌿 I am Aarini Devrani, the founder of AARINIYA. Raised near the sal and mahua forests of Odisha and Jharkhand, I started AARINIYA to share the raw wellness rituals of Central Indian forests. You can follow my daily rituals on Instagram @aarinidevrani!";
      } else if (text.includes('hello') || text.includes('hi') || text.includes('hey') || text.includes('greetings') || text.includes('namaste') || text.includes('kaise') || text.includes('kya') || text.includes('aao')) {
        replyText = "Namaste! 🌿 I am Aarini, the founder of AARINIYA. I am so happy to connect with you. How can I help you with your wellness journey today? You can ask me about our Deep Forest Honey, our founder Aarini, or our wellness programs.";
      } else {
        replyText = "I want to make sure this is handled properly for you. Please WhatsApp us directly at [number] and we will sort this out personally.";
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
    { text: '🌿 What is AARINIYA?', query: 'Tell me about AARINIYA' },
    { text: '🍯 Purity of Honey', query: 'Is your honey pure?' },
    { text: '👤 Who is Aarini?', query: 'Who is Aarini Devrani?' },
    { text: '🍵 Next Release?', query: 'When is the herbal tea launching?' }
  ];

  return (
    <div className="chatbot-container">
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
                <h4 style={styles.name}>Aarini</h4>
                <div style={styles.statusRow}>
                  <span style={styles.statusDot}></span>
                  <span style={styles.statusText}>Founder • Online</span>
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
