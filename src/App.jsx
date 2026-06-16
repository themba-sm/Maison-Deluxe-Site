/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ─── SHARED HELPERS ─── */
const roseGrad = 'linear-gradient(135deg,#A0444C 0%,#C4956A 30%,#F2C4C8 50%,#C4956A 70%,#A0444C 100%)';
const roseText = {
  background: roseGrad,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};
const dividerLine = (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, margin:'18px 0' }}>
    <div style={{ height:1, flex:1, maxWidth:80, background:'linear-gradient(90deg,transparent,rgba(192,48,58,0.4),transparent)' }} />
    <span style={{ color:'#A0444C', fontSize:'0.5rem' }}>◆</span>
    <div style={{ height:1, flex:1, maxWidth:80, background:'linear-gradient(90deg,transparent,rgba(192,48,58,0.4),transparent)' }} />
  </div>
);

/* ─── CRM DATA STORE (localStorage-backed) ─── */
const CRM = {
  getLeads: () => { try { return JSON.parse(localStorage.getItem('md_leads')||'[]'); } catch(e){ return []; } },
  saveLead: (lead) => {
    const leads = CRM.getLeads();
    const idx = leads.findIndex(l => l.phone === lead.phone || l.email === lead.email);
    if (idx >= 0) {
      leads[idx] = { ...leads[idx], ...lead, updatedAt: new Date().toISOString(), touchpoints: (leads[idx].touchpoints||0)+1 };
    } else {
      leads.push({ ...lead, id: Date.now().toString(), createdAt: new Date().toISOString(), touchpoints: 1, status:'new' });
    }
    localStorage.setItem('md_leads', JSON.stringify(leads));
    return leads[idx >= 0 ? idx : leads.length-1];
  },
  getOrders: () => { try { return JSON.parse(localStorage.getItem('md_orders')||'[]'); } catch(e){ return []; } },
  saveOrder: (order) => {
    const orders = CRM.getOrders();
    const newOrder = { ...order, id:'ORD-'+Date.now(), createdAt: new Date().toISOString(), status:'pending' };
    orders.unshift(newOrder);
    localStorage.setItem('md_orders', JSON.stringify(orders));
    return newOrder;
  },
  getAppointments: () => { try { return JSON.parse(localStorage.getItem('md_appts')||'[]'); } catch(e){ return []; } },
  saveAppointment: (appt) => {
    const appts = CRM.getAppointments();
    const newAppt = { ...appt, id:'APT-'+Date.now(), createdAt: new Date().toISOString(), status:'pending' };
    appts.unshift(newAppt);
    localStorage.setItem('md_appts', JSON.stringify(appts));
    return newAppt;
  },
  getAnalytics: () => {
    const orders = CRM.getOrders();
    const leads = CRM.getLeads();
    const appts = CRM.getAppointments();
    const revenue = orders.reduce((s,o) => s + (parseFloat((o.total||'').replace(/[^0-9.]/g,''))||0), 0);
    const byService = {};
    orders.forEach(o => { const k = o.service||'Other'; byService[k] = (byService[k]||0)+1; });
    return { totalOrders: orders.length, totalLeads: leads.length, totalAppointments: appts.length, revenue, byService, conversionRate: leads.length > 0 ? Math.round((orders.length/leads.length)*100) : 0 };
  }
};

/* ─── WHATSAPP AUTOMATION ─── */
const WA_NUMBER = '27000000000';
const WA = {
  buildMessage: (type, data) => {
    if (type === 'order') return `*New Order — Maison Deluxe*\n\n*Order ID:* ${data.id}\n*Client:* ${data.name}\n*Service:* ${data.service}\n*Date:* ${data.date||'TBD'}\n*Amount:* ${data.total||'TBD'}\n*Phone:* ${data.phone||'N/A'}\n*Notes:* ${data.notes||'None'}\n\n_Automated via Maison Deluxe AI System_`;
    if (type === 'appointment') return `*Appointment Request — Maison Deluxe*\n\n*Client:* ${data.name}\n*Service:* ${data.service}\n*Date:* ${data.date}\n*Time:* ${data.time||'TBD'}\n*Phone:* ${data.phone}\n\n_Automated via Maison Deluxe AI System_`;
    if (type === 'lead') return `*New Lead — Maison Deluxe*\n\n*Name:* ${data.name}\n*Phone:* ${data.phone||'N/A'}\n*Email:* ${data.email||'N/A'}\n*Interest:* ${data.interest||'General Inquiry'}\n\n_AI Concierge captured this lead_`;
    return '';
  },
  open: (type, data) => {
    const msg = WA.buildMessage(type, data);
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  }
};

/* ─── AI VOICE AGENT ─── */
const VoiceAgent = {
  speak: (text, onEnd) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new window.SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Karen') || (v.lang === 'en-GB' && v.localService));
    if (preferred) utt.voice = preferred;
    utt.rate = 0.93; utt.pitch = 1.05; utt.volume = 1;
    if (onEnd) { utt.onend = onEnd; utt.onerror = onEnd; }
    window.speechSynthesis.speak(utt);
    // Fallback: force-end speaking state after estimated duration
    const wordCount = text.split(' ').length;
    const estimatedMs = Math.max(2000, wordCount * 400);
    setTimeout(() => { if (window.speechSynthesis && !window.speechSynthesis.speaking && onEnd) onEnd(); }, estimatedMs);
  },
  stop: () => { if (window.speechSynthesis) window.speechSynthesis.cancel(); },
  listen: (onResult, onEnd) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const rec = new SR();
    rec.continuous = false; rec.interimResults = false; rec.lang = 'en-ZA';
    rec.onresult = (e) => { if (onResult) onResult(e.results[0][0].transcript); };
    rec.onend = () => { if (onEnd) onEnd(); };
    rec.start();
    return rec;
  }
};

/* ─── NAVBAR ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const links = ['Services','Nails','AI Concierge','Appointments','Order Now','About','Contact'];
  return (
    <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, transition:'all 0.4s', background: scrolled ? 'rgba(10,10,10,0.96)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid rgba(196,149,106,0.15)' : 'none', padding:'0 clamp(20px,5vw,60px)' }}>
      <div style={{ maxWidth:1300, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:70 }}>
        <a href="#hero" style={{ display:'flex', alignItems:'center', gap:12, textDecoration:'none' }}>
          <img src="/logo.jpg" alt="Maison Deluxe" style={{ width:40, height:40, borderRadius:'50%', objectFit:'cover', border:'1px solid rgba(192,48,58,0.3)', boxShadow:'0 0 16px rgba(192,48,58,0.2)' }} />
          <span style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'1.1rem', ...roseText }}>MAISON DELUXE</span>
        </a>
        <div style={{ display:'flex', gap:24, alignItems:'center' }} className="desktop-nav">
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`} style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.62rem', letterSpacing:'0.18em', color:'#3D1A1E', textDecoration:'none', textTransform:'uppercase', transition:'color 0.3s' }}
            onMouseEnter={e => e.target.style.color='#C4956A'} onMouseLeave={e => e.target.style.color='#3D1A1E'}>{l}</a>
          ))}
        </div>
        <button onClick={() => setOpen(!open)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', gap:5, padding:4 }} className="mobile-menu-btn">
          {[0,1,2].map(i => (<div key={i} style={{ width:24, height:1.5, background:'rgba(196,149,106,0.8)', transition:'all 0.3s', transform: open && i===0 ? 'rotate(45deg) translate(5px,5px)' : open && i===1 ? 'scaleX(0)' : open && i===2 ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />))}
        </button>
      </div>
      {open && (
        <div style={{ background:'rgba(253,240,243,0.98)', backdropFilter:'blur(20px)', borderTop:'1px solid rgba(196,149,106,0.15)', padding:'24px clamp(20px,5vw,60px)', display:'flex', flexDirection:'column', gap:20 }}>
          {links.map(l => (<a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`} onClick={() => setOpen(false)} style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.8rem', letterSpacing:'0.2em', color:'#3D1A1E', textDecoration:'none', textTransform:'uppercase' }}>{l}</a>))}
        </div>
      )}
      <style>{`@media(min-width:769px){.mobile-menu-btn{display:none!important;}}@media(max-width:768px){.desktop-nav{display:none!important;}}`}</style>
    </nav>
  );
}

/* ─── HERO ─── */
function Hero() {
  const overlayRef = useRef(null); const logoRef = useRef(null); const titleRef = useRef(null);
  const tagRef = useRef(null); const divRef = useRef(null); const subRef = useRef(null);
  const btnsRef = useRef(null); const scrollRef = useRef(null);
  useEffect(() => {
    if (!window.gsap) return;
    const ctx = window.gsap.context(() => {
      const tl = window.gsap.timeline({ defaults: { ease: 'power4.out' } });
      window.gsap.set([logoRef.current,titleRef.current,tagRef.current,divRef.current,subRef.current,btnsRef.current,scrollRef.current], { opacity:0 });
      tl.to(overlayRef.current, { opacity:0, duration:1.2, ease:'power2.inOut' }, 0.3);
      tl.fromTo(logoRef.current, { opacity:0, scale:0.6, filter:'blur(20px)' }, { opacity:1, scale:1, filter:'blur(0px)', duration:1.0, ease:'back.out(1.3)' }, 0.5);
      tl.fromTo(titleRef.current, { opacity:0, y:30, filter:'blur(10px)' }, { opacity:1, y:0, filter:'blur(0px)', duration:0.8 }, 1.0);
      tl.fromTo(tagRef.current, { opacity:0, letterSpacing:'0.8em' }, { opacity:1, letterSpacing:'0.35em', duration:1.0 }, 1.4);
      tl.fromTo(divRef.current, { opacity:0, scaleX:0 }, { opacity:1, scaleX:1, duration:0.6, transformOrigin:'center' }, 1.7);
      tl.fromTo(subRef.current, { opacity:0, y:14 }, { opacity:1, y:0, duration:0.5 }, 1.9);
      tl.fromTo(btnsRef.current, { opacity:0, y:16 }, { opacity:1, y:0, duration:0.5 }, 2.2);
      tl.fromTo(scrollRef.current, { opacity:0 }, { opacity:1, duration:0.4 }, 2.7);
    });
    return () => ctx.revert();
  }, []);
  return (
    <section id="hero" style={{ position:'relative', width:'100%', height:'100vh', overflow:'hidden', background:'linear-gradient(160deg,#FDF0F3 0%,#F5D0D5 40%,#FDF0F3 100%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ position:'absolute', inset:0, zIndex:0, background:'radial-gradient(ellipse at 50% 40%, rgba(242,196,200,0.4) 0%, transparent 65%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1, zIndex:2, background:'linear-gradient(90deg,transparent,rgba(192,48,58,0.35),transparent)' }} />
      <div ref={overlayRef} style={{ position:'absolute', inset:0, background:'#F5D8DC', zIndex:9, pointerEvents:'none' }} />
      <div style={{ position:'relative', zIndex:5, textAlign:'center', padding:'0 clamp(20px,6vw,60px)', maxWidth:700 }}>
        <div ref={logoRef} style={{ opacity:0, marginBottom:28, display:'flex', justifyContent:'center' }}>
          <div style={{ position:'relative', display:'inline-block' }}>
            <div style={{ position:'absolute', inset:'-10px', borderRadius:'50%', background:'radial-gradient(circle, rgba(242,196,200,0.6) 0%, transparent 70%)', filter:'blur(8px)' }} />
            <img src="/logo.jpg" alt="Maison Deluxe" style={{ width:'clamp(100px,18vw,150px)', height:'clamp(100px,18vw,150px)', borderRadius:'50%', objectFit:'cover', border:'1px solid rgba(192,48,58,0.25)', boxShadow:'0 0 40px rgba(242,196,200,0.5)', position:'relative' }} />
          </div>
        </div>
        <div ref={titleRef} style={{ opacity:0, marginBottom:12 }}>
          <span style={{ display:'block', fontFamily:'Cinzel,serif', fontWeight:700, fontSize:'clamp(2.2rem,9vw,5.5rem)', lineHeight:0.9, letterSpacing:'0.12em', ...roseText, filter:'drop-shadow(0 0 24px rgba(196,149,106,0.35))' }}>MAISON<br />DELUXE</span>
        </div>
        <div ref={tagRef} style={{ opacity:0, marginBottom:6 }}>
          <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'clamp(0.6rem,2vw,0.85rem)', letterSpacing:'0.35em', color:'#A0444C', textTransform:'uppercase' }}>BEAUTY &nbsp;◆&nbsp; JEWELLERY &nbsp;◆&nbsp; NAILS</span>
        </div>
        <div ref={divRef} style={{ opacity:0 }}>{dividerLine}</div>
        <p ref={subRef} style={{ opacity:0, fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'clamp(1rem,3vw,1.35rem)', color:'#3D1A1E', letterSpacing:'0.08em', marginBottom:40 }}>Elevate. &nbsp;Express. &nbsp;Empower.</p>
        <div ref={btnsRef} style={{ opacity:0, display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          <a href="#order-now" style={{ padding:'clamp(12px,2vw,15px) clamp(28px,5vw,44px)', background:roseGrad, color:'#FFFFFF', fontFamily:'Montserrat,sans-serif', fontWeight:600, fontSize:'clamp(0.62rem,1.5vw,0.75rem)', letterSpacing:'0.22em', textDecoration:'none', textTransform:'uppercase', boxShadow:'0 4px 28px rgba(192,48,58,0.25)', border:'1px solid rgba(192,48,58,0.3)' }}>ORDER NOW</a>
          <a href="#ai-concierge" style={{ padding:'clamp(12px,2vw,15px) clamp(28px,5vw,44px)', background:'rgba(255,240,243,0.7)', backdropFilter:'blur(12px)', color:'#A0444C', fontFamily:'Montserrat,sans-serif', fontWeight:400, fontSize:'clamp(0.62rem,1.5vw,0.75rem)', letterSpacing:'0.22em', textDecoration:'none', textTransform:'uppercase', border:'1px solid rgba(192,48,58,0.25)' }}>AI CONCIERGE</a>
        </div>
      </div>
      <div ref={scrollRef} style={{ position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)', textAlign:'center', zIndex:6, opacity:0 }}>
        <div style={{ width:22, height:36, border:'1px solid rgba(192,48,58,0.22)', borderRadius:11, margin:'0 auto 8px', display:'flex', justifyContent:'center', paddingTop:6 }}>
          <div style={{ width:2, height:7, background:'rgba(192,48,58,0.55)', borderRadius:2, animation:'scrollDot 1.4s ease-in-out infinite' }} />
        </div>
        <span style={{ fontFamily:'Montserrat', fontSize:'0.5rem', color:'#A0444C', letterSpacing:'0.28em' }}>SCROLL</span>
      </div>
    </section>
  );
}

/* ─── SERVICES ─── */
function Services() {
  const ref = useRef(null);
  useEffect(() => {
    if (!window.gsap || !window.ScrollTrigger) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    const cards = ref.current?.querySelectorAll('.svc-card');
    if (!cards) return;
    cards.forEach((card, i) => { window.gsap.fromTo(card, { opacity:0, y:40 }, { opacity:1, y:0, duration:0.7, delay:i*0.12, scrollTrigger:{ trigger:card, start:'top 88%' } }); });
  }, []);
  const services = [
    { icon:'✦', category:'Beauty', title:'Luxe Beauty', items:['Full Face Makeup','Lash Extensions','Lash Lifts & Tints','Brow Shaping & Tinting','Waxing & Threading'], desc:'From everyday glam to bridal artistry — every look crafted with precision and premium products.', ig:'luxebeautyco___' },
    { icon:'◈', category:'Nails', title:'Signature Nails', items:['Gel Manicures','Acrylic Sets','Nail Art & Design','BIAB (Builder in a Bottle)','Pedicures & Spa Treatments'], desc:'Impeccable nails that last. Every nail treated as a canvas for your unique expression.', ig:'maisondeluxe_nails' },

  ];
  return (
    <section id="services" style={{ padding:'100px clamp(20px,6vw,80px)', background:'var(--black)' }} ref={ref}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:64 }}>
          <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.68rem', letterSpacing:'0.35em', color:'#A0444C', marginBottom:12, textTransform:'uppercase' }}>What We Offer</p>
          <h2 style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'clamp(1.8rem,5vw,3rem)', ...roseText }}>Our Services</h2>
          {dividerLine}
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'clamp(1rem,2.5vw,1.2rem)', color:'var(--text-muted)', maxWidth:500, margin:'0 auto' }}>Three worlds of luxury, united under one maison.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:28 }}>
          {services.map((s, i) => (
            <div key={i} className="svc-card" style={{ background:'linear-gradient(160deg,#FFFFFF 0%,#FDF0F3 100%)', border:'1px solid rgba(192,48,58,0.12)', padding:'clamp(28px,4vw,44px)', position:'relative', overflow:'hidden', transition:'border-color 0.3s, transform 0.3s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(192,48,58,0.45)'; e.currentTarget.style.transform='translateY(-4px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(196,149,106,0.15)'; e.currentTarget.style.transform='translateY(0)'; }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(192,48,58,0.28),transparent)' }} />
              <span style={{ fontSize:'1.4rem', color:'#A0444C', display:'block', marginBottom:16 }}>{s.icon}</span>
              <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.6rem', letterSpacing:'0.3em', color:'#A0444C', textTransform:'uppercase', marginBottom:8 }}>{s.category}</p>
              <h3 style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'1.4rem', ...roseText, marginBottom:20 }}>{s.title}</h3>
              <ul style={{ listStyle:'none', marginBottom:20 }}>
                {s.items.map((item, j) => (<li key={j} style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'1rem', color:'#3D1A1E', padding:'5px 0', borderBottom:'1px solid rgba(196,149,106,0.08)', display:'flex', alignItems:'center', gap:10 }}><span style={{ color:'#A0444C', fontSize:'0.5rem' }}>◆</span>{item}</li>))}
              </ul>
              <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'0.95rem', color:'var(--text-muted)', lineHeight:1.7, marginBottom:20 }}>{s.desc}</p>
              <a href={`https://instagram.com/${s.ig}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily:'Montserrat,sans-serif', fontWeight:400, fontSize:'0.6rem', letterSpacing:'0.2em', color:'#A0444C', textDecoration:'none', textTransform:'uppercase', display:'flex', alignItems:'center', gap:8 }}><span>◈</span> @{s.ig}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── AI CONCIERGE + VOICE AGENT ─── */
function AiConcierge() {
  const endRef = useRef(null);
  const recRef = useRef(null);
  const OPTS = ['Shop Press-On Nails','Order a Beauty Service','Book Appointment','Browse Jewellery','Track My Order','FAQ'];
  const [msgs, setMsgs] = useState([{ from:'bot', text:"Hello, gorgeous! Welcome to Maison Deluxe. 🌹\n\nI'm your personal AI concierge. I can help you order, book appointments, or answer any questions — and I can speak to you too.\n\nWhat can I help you with today?", options:OPTS }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [captureForm, setCaptureForm] = useState({ name:'', phone:'', email:'' });

  useEffect(() => { window.speechSynthesis && window.speechSynthesis.getVoices(); }, []);
  useEffect(() => { if (endRef.current) { const container = endRef.current.parentElement; if (container) container.scrollTop = container.scrollHeight; } }, [msgs]);

  const getReply = useCallback((msg) => {
    const m = msg.toLowerCase();
    if (m.includes('shop') || m.includes('press') || (m.includes('nail') && !m.includes('size') && !m.includes('book')))
      return { text:"We have 9 stunning hand-crafted nail sets — Garden Florals, Sweet Bride, Royal Blue Luxe, Floral French, Blush Classic and more.\n\nEvery set includes nail file, glue, adhesive tabs & a complimentary gift. Delivered nationwide.", options:['Order a Nail Set','How to Measure My Nails','Back to Menu'] };
    if (m.includes('book') || m.includes('appointment') || m.includes('schedule'))
      return { text:"I'd love to book your appointment! Our AI Appointment System will guide you through selecting your service, date, and time in seconds.", options:['Go to Appointments','Main Menu'] };
    if (m.includes('beauty') || m.includes('lash') || m.includes('makeup') || m.includes('brow'))
      return { text:"We offer full face makeup, lash extensions, lash lifts & tints, brow shaping, and waxing.\n\nEvery service is a personalised luxury experience crafted just for you.", options:['Book Appointment','Order Now','Main Menu'] };
    if (m.includes('jewel') || m.includes('browse jewel'))
      return { text:"Maison Deluxe Jewellery features stainless steel and gold-plated pieces — necklaces, bracelets and curated sets starting from R68.\n\nScrolling you to our jewellery collection now! 💛", options:['View Jewellery Collection','Main Menu'] };
    if (m.includes('track') || (m.includes('my') && m.includes('order')))
      return { text:"To track your order, share your order number and we'll respond immediately via WhatsApp.\n\nAll nationwide orders are dispatched within 2–3 business days.", options:['Contact on WhatsApp','Main Menu'] };
    if (m.includes('price') || m.includes('cost') || m.includes('how much'))
      return { text:"Our nail sets range from R80 to R224, plus R109.99 nationwide delivery.\n\nJewellery pieces start from R68. Beauty services are priced on consultation.", options:['View Nail Sets','Book Appointment','Main Menu'] };
    if (m.includes('deliver') || m.includes('nationwide'))
      return { text:"Yes! We deliver nationwide across South Africa.\n\nDelivery is R109.99 and takes 2–3 business days. 🇿🇦", options:['Order Now','Main Menu'] };
    if (m.includes('faq') || m.includes('question'))
      return { text:"Common questions:", options:['How to measure my nail size?','Do you deliver nationwide?','How do I order?','Main Menu'] };
    if (m.includes('measure') || m.includes('size'))
      return { text:"Use a ruler across the widest part of each nail. Our sizes go from XS to L.\n\nWhen between sizes, always go one size up for comfort.", options:['Order a Set','Main Menu'] };
    if (m.includes('whatsapp') || m.includes('contact'))
      return { text:"You can reach us directly on WhatsApp for instant assistance!", options:['Open WhatsApp','Main Menu'], action:'whatsapp' };
    if (m.includes('main menu') || m === 'menu')
      return { text:"How else can I help you today?", options:OPTS };
    if (m.includes('open whatsapp'))
      return { text:"Opening WhatsApp now! 💬", options:['Main Menu'], action:'whatsapp_open' };
    if (m.includes('go to appointments'))
      return { text:"Heading to the Appointments section now!", options:[], action:'scroll_appointments' };
    return { text:"Thank you for reaching out. Our team will assist you shortly. How else can I help?", options:OPTS };
  }, []);

  const sendMsg = useCallback(async (text) => {
    if (!text.trim()) return;
    setMsgs(prev => [...prev, { from:'user', text }]);
    setInput('');
    setTyping(true);
    await new Promise(r => setTimeout(r, 800 + Math.random()*500));
    setTyping(false);
    const reply = getReply(text);
    setMsgs(prev => [...prev, { from:'bot', ...reply }]);
    if (voiceMode) { setSpeaking(true); VoiceAgent.speak(reply.text.replace(/[◆◈◇✦\n]/g,' '), () => setSpeaking(false)); }
    if (!leadCaptured && !showCapture && (text.toLowerCase().includes('order') || text.toLowerCase().includes('book') || text.toLowerCase().includes('appoint'))) {
      setTimeout(() => setShowCapture(true), 1200);
    }
    if (reply.action === 'whatsapp_open') setTimeout(() => WA.open('lead', { name:'Website Visitor', interest:'Chat Inquiry' }), 300);
    if (reply.action === 'scroll_appointments') setTimeout(() => document.getElementById('appointments')?.scrollIntoView({ behavior:'smooth' }), 400);

  }, [getReply, voiceMode, leadCaptured]);

  const toggleVoice = () => {
    if (voiceMode) { VoiceAgent.stop(); setVoiceMode(false); setListening(false); }
    else { setVoiceMode(true); setSpeaking(true); VoiceAgent.speak("Hello! Voice mode activated. I'm your Maison Deluxe AI receptionist. How can I assist you today?", () => setSpeaking(false)); }
  };

  const startListening = () => {
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    setListening(true);
    recRef.current = VoiceAgent.listen((text) => { setListening(false); sendMsg(text); }, () => setListening(false));
    if (!recRef.current) { setListening(false); alert('Voice recognition requires Chrome browser.'); }
  };

  const saveLead = () => {
    if (!captureForm.name) return;
    CRM.saveLead({ ...captureForm, interest:'AI Concierge', source:'website_chat' });
    WA.open('lead', captureForm);
    setLeadCaptured(true);
    setShowCapture(false);
    setMsgs(prev => [...prev, { from:'bot', text:`Thank you, ${captureForm.name}! Your details have been saved and our team has been notified via WhatsApp. We'll be in touch shortly. 🌹`, options:OPTS }]);
  };

  return (
    <section id="ai-concierge" style={{ padding:'100px clamp(20px,6vw,80px)', background:'linear-gradient(160deg,var(--surface) 0%,var(--black) 100%)' }}>
      <div style={{ maxWidth:1000, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.68rem', letterSpacing:'0.35em', color:'#A0444C', marginBottom:12, textTransform:'uppercase' }}>Powered by AI</p>
          <h2 style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'clamp(1.8rem,5vw,3rem)', ...roseText }}>AI Concierge</h2>
          {dividerLine}
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'clamp(0.95rem,2.2vw,1.1rem)', color:'var(--text-muted)' }}>Your personal luxury AI receptionist — chat or speak naturally.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:24, alignItems:'start' }} className="ai-grid">
          {/* Chat */}
          <div style={{ background:'linear-gradient(160deg,#FFFFFF,#FDF0F3)', border:'1px solid rgba(192,48,58,0.15)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(192,48,58,0.35),transparent)' }} />
            <div style={{ padding:'16px 22px', borderBottom:'1px solid rgba(196,149,106,0.1)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ position:'relative' }}>
                  <img src="/logo.jpg" alt="" style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', border:'1px solid rgba(192,48,58,0.22)' }} />
                  <div style={{ position:'absolute', bottom:1, right:1, width:8, height:8, borderRadius:'50%', background:'#4CAF50', border:'1.5px solid #0a0a0a' }} />
                </div>
                <div>
                  <p style={{ fontFamily:'Cinzel,serif', fontSize:'0.82rem', ...roseText }}>Maison Deluxe AI</p>
                  <p style={{ fontFamily:'Montserrat,sans-serif', fontSize:'0.52rem', letterSpacing:'0.12em', color:'#A0444C' }}>{speaking ? '● Speaking...' : listening ? '🎤 Listening...' : '● Online — 24/7'}</p>
                </div>
              </div>
              <button onClick={toggleVoice} style={{ padding:'7px 14px', border:`1px solid ${voiceMode ? 'rgba(196,149,106,0.6)' : 'rgba(196,149,106,0.25)'}`, background: voiceMode ? 'rgba(196,149,106,0.15)' : 'transparent', color:'#A0444C', fontFamily:'Montserrat,sans-serif', fontSize:'0.55rem', letterSpacing:'0.12em', cursor:'pointer', textTransform:'uppercase', transition:'all 0.3s' }}>{voiceMode ? '🔊 Voice On' : '🎙 Voice'}</button>
            </div>
            <div style={{ height:380, overflowY:'auto', padding:'18px 22px', display:'flex', flexDirection:'column', gap:14, background:'#FEFAFA' }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display:'flex', flexDirection:'column', alignItems: m.from==='user' ? 'flex-end' : 'flex-start', gap:8 }}>
                  <div style={{ maxWidth:'82%', padding:'11px 15px', background: m.from==='user' ? roseGrad : '#FFFFFF', color: m.from==='user' ? '#FFFFFF' : '#3D1A1E', border: m.from==='bot' ? '1px solid rgba(192,48,58,0.18)' : 'none', fontFamily:'Cormorant Garamond,serif', fontSize:'0.98rem', lineHeight:1.65, whiteSpace:'pre-line' }}>{m.text}</div>
                  {m.options && m.options.length > 0 && (
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', maxWidth:'92%' }}>
                      {m.options.map((opt, j) => (
                        <button key={j} onClick={() => sendMsg(opt)} style={{ padding:'5px 11px', border:'1px solid rgba(192,48,58,0.22)', background:'transparent', color:'rgba(196,149,106,0.75)', fontFamily:'Montserrat,sans-serif', fontSize:'0.52rem', letterSpacing:'0.1em', cursor:'pointer', textTransform:'uppercase', transition:'all 0.2s' }}
                        onMouseEnter={e => { e.target.style.background='rgba(196,149,106,0.1)'; e.target.style.borderColor='rgba(196,149,106,0.5)'; }}
                        onMouseLeave={e => { e.target.style.background='transparent'; e.target.style.borderColor='rgba(196,149,106,0.3)'; }}>{opt}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {typing && (<div style={{ display:'flex', gap:5, padding:'11px 15px', background:'#FFFFFF', border:'1px solid rgba(192,48,58,0.18)', width:'fit-content' }}>{[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'rgba(192,48,58,0.5)', animation:`typing 1.2s ${i*0.2}s ease-in-out infinite` }} />)}</div>)}
              <div ref={endRef} />
            </div>
            <div style={{ padding:'14px 22px', borderTop:'1px solid rgba(196,149,106,0.1)', display:'flex', gap:8 }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && sendMsg(input)} placeholder="Type your message..." style={{ flex:1, padding:'10px 14px', background:'rgba(192,48,58,0.04)', border:'1px solid rgba(192,48,58,0.15)', color:'var(--text)', fontFamily:'Cormorant Garamond,serif', fontSize:'0.95rem', outline:'none' }} />
              {voiceMode && (<button onClick={startListening} style={{ padding:'10px 12px', border:`1px solid ${listening ? 'rgba(196,149,106,0.7)' : 'rgba(196,149,106,0.25)'}`, background: listening ? 'rgba(196,149,106,0.2)' : 'transparent', color:'#A0444C', cursor:'pointer', fontSize:'1rem', animation: listening ? 'pulse 1s infinite' : 'none' }}>{listening ? '🔴' : '🎤'}</button>)}
              <button onClick={() => sendMsg(input)} style={{ padding:'10px 16px', background:roseGrad, border:'none', color:'#FFFFFF', fontFamily:'Montserrat,sans-serif', fontWeight:600, fontSize:'0.62rem', letterSpacing:'0.12em', cursor:'pointer' }}>SEND</button>
            </div>
          </div>

          {/* Side Panel */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {showCapture && !leadCaptured && (
              <div style={{ background:'linear-gradient(160deg,#FFFFFF,#FDF0F3)', border:'1px solid rgba(192,48,58,0.25)', padding:'22px', position:'relative' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(192,48,58,0.35),transparent)' }} />
                <p style={{ fontFamily:'Cinzel,serif', fontSize:'0.88rem', ...roseText, marginBottom:4 }}>Save Your Details</p>
                <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'0.82rem', color:'rgba(61,26,30,0.7)', marginBottom:14 }}>Get exclusive offers & follow-ups</p>
                {['name','phone','email'].map(f => (<input key={f} placeholder={f.charAt(0).toUpperCase()+f.slice(1)} value={captureForm[f]} onChange={e => setCaptureForm(p => ({...p, [f]:e.target.value}))} style={{ width:'100%', padding:'9px 12px', marginBottom:9, background:'rgba(192,48,58,0.04)', border:'1px solid rgba(192,48,58,0.15)', color:'var(--text)', fontFamily:'Cormorant Garamond,serif', fontSize:'0.9rem', outline:'none', boxSizing:'border-box' }} />))}
                <button onClick={saveLead} style={{ width:'100%', padding:'10px', background:roseGrad, border:'none', color:'#FFFFFF', fontFamily:'Montserrat,sans-serif', fontWeight:600, fontSize:'0.6rem', letterSpacing:'0.18em', cursor:'pointer' }}>SAVE & NOTIFY TEAM</button>
                <button onClick={() => setShowCapture(false)} style={{ width:'100%', marginTop:7, padding:'8px', background:'transparent', border:'1px solid rgba(192,48,58,0.2)', color:'#A0444C', fontFamily:'Montserrat,sans-serif', fontSize:'0.52rem', cursor:'pointer' }}>Not now</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes typing{0%,100%{transform:translateY(0);opacity:0.4}50%{transform:translateY(-4px);opacity:1}}@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(196,149,106,0.4)}50%{box-shadow:0 0 0 8px rgba(196,149,106,0)}}@media(max-width:768px){.ai-grid{grid-template-columns:1fr!important;}}`}</style>
    </section>
  );
}

/* ─── AI APPOINTMENT SYSTEM ─── */
function Appointments() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:'', email:'', phone:'', service:'', date:'', time:'', notes:'' });
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apptId, setApptId] = useState('');
  const times = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','13:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];
  const serviceGroups = {
    'Beauty': ['Full Face Makeup','Lash Extensions','Lash Lift & Tint','Brow Shaping & Tinting','Waxing & Threading'],
    'Nails': ['Gel Manicure','Acrylic Set','Nail Art & Design','BIAB','Pedicure & Spa'],
    'Jewellery': ['Jewellery Consultation','Custom Bespoke Piece','Gift Curation'],
  };
  const inp = { width:'100%', padding:'12px 16px', background:'#FFFFFF', border:'1px solid rgba(192,48,58,0.15)', color:'var(--text)', fontFamily:'Cormorant Garamond,serif', fontSize:'1rem', outline:'none', marginBottom:14, boxSizing:'border-box' };

  const handleBook = async () => {
    setSaving(true);
    CRM.saveLead({ name:form.name, phone:form.phone, email:form.email, interest:form.service, source:'appointment_system' });
    const appt = CRM.saveAppointment(form);
    setApptId(appt.id);
    await new Promise(r => setTimeout(r, 700));
    WA.open('appointment', { ...form, id:appt.id });
    setSaving(false); setDone(true);
  };

  if (done) return (
    <section id="appointments" style={{ padding:'100px clamp(20px,6vw,80px)', background:'var(--black)' }}>
      <div style={{ maxWidth:600, margin:'0 auto', textAlign:'center' }}>
        <span style={{ fontSize:'2.5rem', display:'block', marginBottom:20 }}>✦</span>
        <h2 style={{ fontFamily:'Cinzel,serif', fontSize:'clamp(1.5rem,4vw,2.2rem)', ...roseText, marginBottom:12 }}>Appointment Confirmed</h2>
        {dividerLine}
        <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'1.1rem', color:'var(--text-muted)', marginBottom:8 }}>Thank you, {form.name}. Your booking has been received.</p>
        <p style={{ fontFamily:'Montserrat,sans-serif', fontSize:'0.62rem', letterSpacing:'0.14em', color:'#A0444C', marginBottom:20 }}>Reference: {apptId}</p>
        <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'1rem', color:'rgba(61,26,30,0.76)', marginBottom:28 }}>Your WhatsApp has opened with your booking details. Our team will confirm within 2 hours.</p>
        <button onClick={() => { setDone(false); setStep(1); setForm({ name:'', email:'', phone:'', service:'', date:'', time:'', notes:'' }); }} style={{ padding:'12px 32px', background:roseGrad, border:'none', color:'#FFFFFF', fontFamily:'Montserrat,sans-serif', fontWeight:600, fontSize:'0.65rem', letterSpacing:'0.2em', cursor:'pointer' }}>BOOK ANOTHER</button>
      </div>
    </section>
  );

  return (
    <section id="appointments" style={{ padding:'100px clamp(20px,6vw,80px)', background:'var(--black)' }}>
      <div style={{ maxWidth:700, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.68rem', letterSpacing:'0.35em', color:'#A0444C', marginBottom:12, textTransform:'uppercase' }}>Smart Booking</p>
          <h2 style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'clamp(1.8rem,5vw,3rem)', ...roseText }}>AI Appointment System</h2>
          {dividerLine}
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'clamp(0.95rem,2.2vw,1.1rem)', color:'var(--text-muted)' }}>Instant WhatsApp confirmation on every booking.</p>
        </div>
        <div style={{ display:'flex', gap:0, marginBottom:36 }}>
          {['Details','Service','Date & Time','Confirm'].map((s,i) => (
            <div key={s} style={{ flex:1, textAlign:'center' }}>
              <div style={{ height:3, marginBottom:8, background: step > i+1 ? roseGrad : step === i+1 ? roseGrad : 'rgba(196,149,106,0.15)', transition:'background 0.4s' }} />
              <span style={{ fontFamily:'Montserrat,sans-serif', fontSize:'0.52rem', letterSpacing:'0.1em', color: step >= i+1 ? '#A0444C' : 'rgba(160,68,76,0.4)', textTransform:'uppercase' }}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{ background:'linear-gradient(160deg,#FFFFFF,#FDF0F3)', border:'1px solid rgba(192,48,58,0.15)', padding:'clamp(28px,4vw,48px)', position:'relative' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(192,48,58,0.35),transparent)' }} />
          {step === 1 && (
            <div>
              <h3 style={{ fontFamily:'Cinzel,serif', fontSize:'1.2rem', ...roseText, marginBottom:22 }}>Your Details</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <input style={inp} placeholder="Full Name *" value={form.name} onChange={e => setForm(p => ({...p, name:e.target.value}))} />
                <input style={inp} placeholder="Phone Number *" value={form.phone} onChange={e => setForm(p => ({...p, phone:e.target.value}))} />
              </div>
              <input style={inp} placeholder="Email Address" value={form.email} onChange={e => setForm(p => ({...p, email:e.target.value}))} />
              <button disabled={!form.name||!form.phone} onClick={() => setStep(2)} style={{ padding:'12px 32px', background:(!form.name||!form.phone)?'rgba(196,149,106,0.2)':roseGrad, border:'none', color:'#FFFFFF', fontFamily:'Montserrat,sans-serif', fontWeight:600, fontSize:'0.65rem', letterSpacing:'0.2em', cursor:(!form.name||!form.phone)?'not-allowed':'pointer' }}>NEXT →</button>
            </div>
          )}
          {step === 2 && (
            <div>
              <h3 style={{ fontFamily:'Cinzel,serif', fontSize:'1.2rem', ...roseText, marginBottom:22 }}>Select Service</h3>
              {Object.entries(serviceGroups).map(([cat, svcs]) => (
                <div key={cat} style={{ marginBottom:18 }}>
                  <p style={{ fontFamily:'Montserrat,sans-serif', fontSize:'0.58rem', letterSpacing:'0.18em', color:'#A0444C', textTransform:'uppercase', marginBottom:10 }}>── {cat} ──</p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))', gap:7 }}>
                    {svcs.map(svc => (<button key={svc} onClick={() => setForm(p => ({...p, service:svc}))} style={{ padding:'9px 12px', border:`1px solid ${form.service===svc?'rgba(196,149,106,0.7)':'rgba(196,149,106,0.15)'}`, background: form.service===svc?'rgba(196,149,106,0.12)':'transparent', color: form.service===svc?'#A0444C':'rgba(61,26,30,0.7)', fontFamily:'Cormorant Garamond,serif', fontSize:'0.9rem', cursor:'pointer', textAlign:'left', transition:'all 0.2s' }}>{svc}</button>))}
                  </div>
                </div>
              ))}
              <div style={{ display:'flex', gap:10, marginTop:6 }}>
                <button onClick={() => setStep(1)} style={{ padding:'11px 22px', background:'transparent', border:'1px solid rgba(192,48,58,0.15)', color:'#A0444C', fontFamily:'Montserrat,sans-serif', fontSize:'0.6rem', cursor:'pointer' }}>← BACK</button>
                <button disabled={!form.service} onClick={() => setStep(3)} style={{ padding:'11px 28px', background:form.service?roseGrad:'rgba(196,149,106,0.2)', border:'none', color:'#FFFFFF', fontFamily:'Montserrat,sans-serif', fontWeight:600, fontSize:'0.65rem', letterSpacing:'0.2em', cursor:form.service?'pointer':'not-allowed' }}>NEXT →</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <h3 style={{ fontFamily:'Cinzel,serif', fontSize:'1.2rem', ...roseText, marginBottom:22 }}>Date & Time</h3>
              <input type="date" style={{ ...inp, colorScheme:'dark' }} value={form.date} onChange={e => setForm(p => ({...p, date:e.target.value}))} min={new Date().toISOString().split('T')[0]} />
              <p style={{ fontFamily:'Montserrat,sans-serif', fontSize:'0.58rem', letterSpacing:'0.18em', color:'#A0444C', textTransform:'uppercase', marginBottom:10 }}>Preferred Time</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:7, marginBottom:14 }}>
                {times.map(t => (<button key={t} onClick={() => setForm(p => ({...p, time:t}))} style={{ padding:'8px 4px', border:`1px solid ${form.time===t?'rgba(196,149,106,0.7)':'rgba(196,149,106,0.15)'}`, background: form.time===t?'rgba(196,149,106,0.12)':'transparent', color: form.time===t?'#A0444C':'rgba(61,26,30,0.65)', fontFamily:'Montserrat,sans-serif', fontSize:'0.62rem', cursor:'pointer', transition:'all 0.2s' }}>{t}</button>))}
              </div>
              <textarea rows={2} style={{ ...inp, resize:'vertical' }} placeholder="Special requests or notes..." value={form.notes} onChange={e => setForm(p => ({...p, notes:e.target.value}))} />
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setStep(2)} style={{ padding:'11px 22px', background:'transparent', border:'1px solid rgba(192,48,58,0.15)', color:'#A0444C', fontFamily:'Montserrat,sans-serif', fontSize:'0.6rem', cursor:'pointer' }}>← BACK</button>
                <button disabled={!form.date||!form.time} onClick={() => setStep(4)} style={{ padding:'11px 28px', background:(form.date&&form.time)?roseGrad:'rgba(196,149,106,0.2)', border:'none', color:'#FFFFFF', fontFamily:'Montserrat,sans-serif', fontWeight:600, fontSize:'0.65rem', letterSpacing:'0.2em', cursor:(form.date&&form.time)?'pointer':'not-allowed' }}>REVIEW →</button>
              </div>
            </div>
          )}
          {step === 4 && (
            <div>
              <h3 style={{ fontFamily:'Cinzel,serif', fontSize:'1.2rem', ...roseText, marginBottom:22 }}>Confirm Appointment</h3>
              {[['Client',form.name],['Phone',form.phone],['Email',form.email||'Not provided'],['Service',form.service],['Date',form.date],['Time',form.time],['Notes',form.notes||'None']].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid rgba(196,149,106,0.08)' }}>
                  <span style={{ fontFamily:'Montserrat,sans-serif', fontSize:'0.58rem', letterSpacing:'0.14em', color:'#A0444C', textTransform:'uppercase' }}>{k}</span>
                  <span style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'0.98rem', color:'#3D1A1E' }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop:8, padding:'12px 16px', background:'rgba(192,48,58,0.04)', border:'1px solid rgba(192,48,58,0.08)', marginBottom:22 }}>
                <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'0.88rem', color:'rgba(61,26,30,0.7)' }}>A WhatsApp message will be sent to our team immediately. We will confirm within 2 hours.</p>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setStep(3)} style={{ padding:'12px 22px', background:'transparent', border:'1px solid rgba(192,48,58,0.15)', color:'#A0444C', fontFamily:'Montserrat,sans-serif', fontSize:'0.6rem', cursor:'pointer' }}>← EDIT</button>
                <button onClick={handleBook} disabled={saving} style={{ flex:1, padding:'14px', background:saving?'rgba(196,149,106,0.3)':roseGrad, border:'none', color:'#FFFFFF', fontFamily:'Montserrat,sans-serif', fontWeight:600, fontSize:'0.68rem', letterSpacing:'0.22em', cursor:saving?'wait':'pointer' }}>{saving?'CONFIRMING...':'✓ CONFIRM APPOINTMENT'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── NAIL PRODUCTS DATA ─── */
const NAIL_PRODUCTS = [
  { id:'garden-florals', name:'Garden Florals Signature Set', subtitle:'LUXÉ Nails Collection', desc:'Nude base with 3D flowers in vivid colours — a full garden on your fingertips.', price:'R224.00', priceNum:224, tags:['3D Art','Multi-Colour'], img:'/nail-garden-florals.jpg' },
  { id:'noir-classic', name:'Noir Classic Set', subtitle:'LUXÉ Nails Collection', desc:'Nude base with a sleek black French tip — sophisticated, striking, and effortlessly bold.', price:'R122.00', priceNum:122, tags:['French Tip','Dark'], img:'/nail-noir-classic.jpg' },
  { id:'sunshine-classic', name:'Sunshine Classic Set', subtitle:'LUXÉ Nails Collection', desc:'Warm sunshine yellow, shaped for glowing summer days.', price:'R80.00', priceNum:80, tags:['Classic','Bright'], img:'/nail-sunshine-classic.jpg' },
  { id:'sweet-bride', name:'Sweet Bride Set', subtitle:'LUXÉ Nails Collection', desc:'Bridal elegance in blush and cream with delicate 3D pearl floral art.', price:'R204.00', priceNum:204, tags:['Bridal','3D Art'], img:'/nail-sweet-bride.jpg' },
  { id:'hot-pink-classic', name:'Hot Pink Classic Set', subtitle:'LUXÉ Nails Collection', desc:'Bold hot pink in a clean glossy finish. A classic that never goes out of style.', price:'R110.00', priceNum:110, tags:['Classic','Bold'], img:'/nail-hot-pink-classic.jpg' },
  { id:'floral-french', name:'Floral French Set', subtitle:'LUXÉ Nails Collection', desc:'Soft pink base with a white French tip and hand-crafted 3D floral blooms in blush.', price:'R164.00', priceNum:164, tags:['French Tip','Floral'], img:'/nail-floral-french.jpg' },
  { id:'signature', name:'Signature Set', subtitle:'LUXÉ Nails Collection', desc:'Nude stiletto base with a white V-tip and a statement 3D white flower with crystal charm.', price:'R168.00', priceNum:168, tags:['Stiletto','Floral'], img:'/nail-signature.jpg' },
  { id:'royal-blue', name:'Royal Blue Luxe Set', subtitle:'LUXÉ Nails Collection', desc:'Nude base with a deep navy French tip — adorned with a sparkling bow charm and blue crystal detail.', price:'R204.00', priceNum:204, tags:['French Tip','Glam'], img:'/nail-royal-blue.jpg' },
  { id:'blush-classic', name:'Blush Classic Set', subtitle:'LUXÉ Nails Collection', desc:'Dusty pink stiletto with a white French tip and cascading 3D white florals with rhinestone accents.', price:'R154.00', priceNum:154, tags:['Stiletto','Floral'], img:'/nail-blush-classic.jpg' },
];

/* ─── JEWELLERY PRODUCTS DATA ─── */
const JEWELLERY_PRODUCTS = [
  {
    id:'cross-necklace-gold',
    name:'Crystal Cross Necklace',
    subtitle:'Maison Deluxe Jewellery',
    desc:'Stainless steel cross set with sparkling cubic zirconia stones. Timeless faith meets luxury finish.',
    price:'R68.00',
    priceNum:68,
    tags:['Necklace','Gold'],
    metal:'Gold',
    img:'https://media.base44.com/images/public/whatsapp/6a2ff5ed23685ae7f8dac91d/your_agent/6a2ff5ed23685ae7f8dac91e/dfcd4aab6_whatsapp_image_1330789732361409.jpg'
  },
  {
    id:'cross-necklace-silver',
    name:'Crystal Cross Necklace',
    subtitle:'Maison Deluxe Jewellery',
    desc:'Stainless steel cross set with sparkling cubic zirconia stones. Timeless faith meets luxury finish.',
    price:'R68.00',
    priceNum:68,
    tags:['Necklace','Silver'],
    metal:'Silver',
    img:'https://media.base44.com/images/public/whatsapp/6a2ff5ed23685ae7f8dac91d/your_agent/6a2ff5ed23685ae7f8dac91e/686d8ec25_whatsapp_image_1943809632993683.jpg'
  },
  {
    id:'flower-bracelet-set',
    name:"Women's Luxury Flower Bracelet Set",
    subtitle:'Maison Deluxe Jewellery',
    desc:'A duo of gold-plated floral bracelets — a wide cuff and a delicate chain — for effortless stacked elegance.',
    price:'R242.00',
    priceNum:242,
    tags:['Bracelet','Gold','Set'],
    metal:'Gold',
    img:'https://media.base44.com/images/public/whatsapp/6a2ff5ed23685ae7f8dac91d/your_agent/6a2ff5ed23685ae7f8dac91e/b3bcad447_whatsapp_image_1024838303333969.jpg'
  },
  {
    id:'roman-bracelet-set',
    name:'3 Pcs Waterproof Stainless Steel Bracelet Set',
    subtitle:'Maison Deluxe Jewellery',
    desc:'Three bold gold bangles — Roman numeral engraving, floral detailing, and a sleek nail cuff. Waterproof & built to last.',
    price:'R322.00',
    priceNum:322,
    tags:['Bracelet','Gold','Set'],
    metal:'Gold',
    img:'https://media.base44.com/images/public/whatsapp/6a2ff5ed23685ae7f8dac91d/your_agent/6a2ff5ed23685ae7f8dac91e/6096d72db_whatsapp_image_2042047893186546.jpg'
  },
];
const SIZE_CHART = [
  { size:'XS', thumb:'1.4cm', index:'1.0cm', middle:'1.1cm', ring:'1.0cm', pinky:'0.7cm' },
  { size:'S', thumb:'1.5cm', index:'1.1cm', middle:'1.2cm', ring:'1.1cm', pinky:'0.8cm' },
  { size:'M', thumb:'1.6cm', index:'1.2cm', middle:'1.3cm', ring:'1.2cm', pinky:'0.9cm' },
  { size:'L', thumb:'1.7cm', index:'1.3cm', middle:'1.4cm', ring:'1.3cm', pinky:'1.0cm' },
];
const FINGERS = ['Thumb','Index','Middle','Ring','Pinky'];

function SizeGuide({ onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(61,26,30,0.88)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }} onClick={onClose}>
      <div style={{ background:'linear-gradient(160deg,#FFFFFF,#FDF0F3)', border:'1px solid rgba(192,48,58,0.22)', maxWidth:680, width:'100%', padding:'clamp(28px,4vw,48px)', position:'relative', maxHeight:'90vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(192,48,58,0.35),transparent)' }} />
        <button onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'none', border:'none', cursor:'pointer', color:'#A0444C', fontSize:'1.2rem' }}>✕</button>
        <h3 style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'clamp(1.4rem,4vw,2rem)', ...roseText, marginBottom:20 }}>Nail Size Guide</h3>
        <div style={{ margin:'0 0 20px', padding:'16px 20px', background:'rgba(192,48,58,0.05)', border:'1px solid rgba(192,48,58,0.2)' }}>
          <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:500, fontSize:'0.62rem', letterSpacing:'0.18em', color:'#A0444C', textTransform:'uppercase', marginBottom:8 }}>How to Measure</p>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'1rem', color:'#3D1A1E', lineHeight:1.7 }}>Use a tape measure pressed to the curvature of your nail surface. Measure the widest point from left groove to right groove. When between sizes, go one size up.</p>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>{['Size',...FINGERS].map(h => (<th key={h} style={{ padding:'10px 12px', textAlign:'center', fontFamily:'Montserrat,sans-serif', fontWeight:500, fontSize:'0.55rem', letterSpacing:'0.14em', color:'#A0444C', textTransform:'uppercase', borderBottom:'1px solid rgba(196,149,106,0.2)' }}>{h}</th>))}</tr>
            </thead>
            <tbody>
              {SIZE_CHART.map((row, i) => (
                <tr key={row.size} style={{ background: i%2===0 ? 'rgba(196,149,106,0.03)' : 'transparent' }}>
                  <td style={{ padding:'10px 12px', textAlign:'center', fontFamily:'Montserrat,sans-serif', fontWeight:600, fontSize:'0.72rem', color:'#A0444C', letterSpacing:'0.14em' }}>{row.size}</td>
                  {[row.thumb,row.index,row.middle,row.ring,row.pinky].map((v,j) => (<td key={j} style={{ padding:'10px 12px', textAlign:'center', fontFamily:'Cormorant Garamond,serif', fontSize:'0.9rem', color:'#3D1A1E', borderBottom:'1px solid rgba(196,149,106,0.06)' }}>{v}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OrderModal({ product, onClose }) {
  const [step, setStep] = useState(1);
  const [sizes, setSizes] = useState({ thumb:'', index:'', middle:'', ring:'', pinky:'' });
  const [info, setInfo] = useState({ name:'', email:'', phone:'', address:'', notes:'' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [orderId, setOrderId] = useState('');
  const sizeOpts = ['XS','S','M','L'];
  const fingerKeys = ['thumb','index','middle','ring','pinky'];
  const allSizes = fingerKeys.every(k => sizes[k]);
  const delivery = 109.99;
  const total = (product.priceNum + delivery).toFixed(2);
  const inp = { width:'100%', padding:'11px 14px', background:'#FFFFFF', border:'1px solid rgba(192,48,58,0.15)', color:'var(--text)', fontFamily:'Cormorant Garamond,serif', fontSize:'0.98rem', outline:'none' };

  const handleOrder = async (e) => {
    e.preventDefault(); setSending(true);
    CRM.saveLead({ name:info.name, phone:info.phone, email:info.email, interest:`Nail Order: ${product.name}`, source:'shop' });
    const order = CRM.saveOrder({ name:info.name, email:info.email, phone:info.phone, address:info.address, service:`Nail Set: ${product.name}`, product:product.id, sizes, notes:info.notes, total:`R${total}`, type:'nail' });
    setOrderId(order.id);
    const sizeStr = fingerKeys.map(k => `${k.charAt(0).toUpperCase()+k.slice(1)}: ${sizes[k]}`).join(', ');
    const msg = `*New Order — Maison Deluxe Nails*\n\n*Order ID:* ${order.id}\n*Set:* ${product.name}\n*Price:* ${product.price} + R109.99 delivery\n\n*Nail Sizes:* ${sizeStr}\n\n*Name:* ${info.name}\n*Phone:* ${info.phone}\n*Email:* ${info.email}\n*Address:* ${info.address}\n*Notes:* ${info.notes||'None'}\n\n*Total: R${total}*\n\n_Automated via Maison Deluxe AI Order System_`;
    await new Promise(r => setTimeout(r, 700));
    setSending(false); setSent(true);
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(61,26,30,0.9)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', overflowY:'auto' }} onClick={onClose}>
      <div style={{ background:'linear-gradient(160deg,#FFFFFF,#FDF0F3)', border:'1px solid rgba(192,48,58,0.22)', maxWidth:540, width:'100%', padding:'clamp(22px,4vw,42px)', position:'relative', maxHeight:'92vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(192,48,58,0.35),transparent)' }} />
        <button onClick={onClose} style={{ position:'absolute', top:14, right:14, background:'none', border:'none', cursor:'pointer', color:'#A0444C', fontSize:'1.2rem' }}>✕</button>
        <h3 style={{ fontFamily:'Cinzel,serif', fontSize:'1.25rem', ...roseText, marginBottom:4 }}>{product.name}</h3>
        <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'0.9rem', color:'rgba(61,26,30,0.7)', marginBottom:18 }}>{product.price} + R109.99 delivery = <strong style={{color:'rgba(196,149,106,0.8)'}}>R{total}</strong></p>
        <div style={{ display:'flex', gap:6, marginBottom:26 }}>
          {['Nail Sizes','Details','Confirm'].map((s,i) => (<div key={s} style={{ flex:1, textAlign:'center' }}><div style={{ height:2, marginBottom:5, background: step > i+1 ? roseGrad : step === i+1 ? roseGrad : 'rgba(196,149,106,0.15)' }} /><span style={{ fontFamily:'Montserrat,sans-serif', fontSize:'0.5rem', letterSpacing:'0.1em', color: step >= i+1 ? '#A0444C' : 'rgba(160,68,76,0.4)', textTransform:'uppercase' }}>{s}</span></div>))}
        </div>
        {sent ? (
          <div style={{ textAlign:'center', padding:'28px 0' }}>
            <span style={{ fontSize:'1.8rem', color:'#A0444C', display:'block', marginBottom:14 }}>✦</span>
            <h4 style={{ fontFamily:'Cinzel,serif', fontSize:'1.2rem', ...roseText, marginBottom:8 }}>Order Placed!</h4>
            <p style={{ fontFamily:'Montserrat,sans-serif', fontSize:'0.6rem', letterSpacing:'0.14em', color:'#A0444C', marginBottom:8 }}>Ref: {orderId}</p>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'0.95rem', color:'var(--text-muted)' }}>WhatsApp opened with your order. Our team will confirm shortly. 🌹</p>
          </div>
        ) : step === 1 ? (
          <div>
            {fingerKeys.map(finger => (
              <div key={finger} style={{ marginBottom:12 }}>
                <p style={{ fontFamily:'Montserrat,sans-serif', fontSize:'0.58rem', letterSpacing:'0.16em', color:'#A0444C', textTransform:'uppercase', marginBottom:7 }}>{finger.charAt(0).toUpperCase()+finger.slice(1)}</p>
                <div style={{ display:'flex', gap:7 }}>
                  {sizeOpts.map(s => (<button key={s} onClick={() => setSizes(p => ({...p, [finger]:s}))} style={{ flex:1, padding:'8px 4px', border:`1px solid ${sizes[finger]===s?'rgba(196,149,106,0.7)':'rgba(196,149,106,0.2)'}`, background: sizes[finger]===s?'rgba(196,149,106,0.15)':'transparent', color: sizes[finger]===s?'#C4956A':'rgba(240,230,220,0.5)', fontFamily:'Montserrat,sans-serif', fontSize:'0.68rem', cursor:'pointer', transition:'all 0.2s' }}>{s}</button>))}
                </div>
              </div>
            ))}
            <button disabled={!allSizes} onClick={() => setStep(2)} style={{ width:'100%', marginTop:6, padding:'12px', background:allSizes?roseGrad:'rgba(196,149,106,0.2)', border:'none', color:'#FFFFFF', fontFamily:'Montserrat,sans-serif', fontWeight:600, fontSize:'0.62rem', letterSpacing:'0.18em', cursor:allSizes?'pointer':'not-allowed' }}>NEXT →</button>
          </div>
        ) : step === 2 ? (
          <form>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:11 }}>
              <input style={inp} placeholder="Full Name *" value={info.name} onChange={e => setInfo(p=>({...p,name:e.target.value}))} required />
              <input style={inp} placeholder="Phone *" value={info.phone} onChange={e => setInfo(p=>({...p,phone:e.target.value}))} required />
            </div>
            <input style={{...inp, marginTop:11}} placeholder="Email" value={info.email} onChange={e => setInfo(p=>({...p,email:e.target.value}))} />
            <input style={{...inp, marginTop:11}} placeholder="Delivery Address *" value={info.address} onChange={e => setInfo(p=>({...p,address:e.target.value}))} required />
            <textarea rows={2} style={{...inp, marginTop:11, resize:'vertical'}} placeholder="Special notes..." value={info.notes} onChange={e => setInfo(p=>({...p,notes:e.target.value}))} />
            <div style={{ display:'flex', gap:9, marginTop:12 }}>
              <button type="button" onClick={() => setStep(1)} style={{ padding:'11px 18px', background:'transparent', border:'1px solid rgba(192,48,58,0.15)', color:'#A0444C', fontFamily:'Montserrat,sans-serif', fontSize:'0.6rem', cursor:'pointer' }}>← BACK</button>
              <button type="button" disabled={!info.name||!info.phone||!info.address} onClick={() => setStep(3)} style={{ flex:1, padding:'11px', background:(info.name&&info.phone&&info.address)?roseGrad:'rgba(196,149,106,0.2)', border:'none', color:'#FFFFFF', fontFamily:'Montserrat,sans-serif', fontWeight:600, fontSize:'0.62rem', cursor:(info.name&&info.phone&&info.address)?'pointer':'not-allowed' }}>REVIEW →</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOrder}>
            {[['Product',product.name],['Sizes',fingerKeys.map(k=>`${k.charAt(0).toUpperCase()+k.slice(1)}:${sizes[k]}`).join(' | ')],['Name',info.name],['Phone',info.phone],['Address',info.address],['Total',`R${total}`]].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(196,149,106,0.08)' }}>
                <span style={{ fontFamily:'Montserrat,sans-serif', fontSize:'0.56rem', letterSpacing:'0.12em', color:'#A0444C', textTransform:'uppercase' }}>{k}</span>
                <span style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'0.92rem', color:'#3D1A1E', maxWidth:'55%', textAlign:'right' }}>{v}</span>
              </div>
            ))}
            <div style={{ display:'flex', gap:9, marginTop:18 }}>
              <button type="button" onClick={() => setStep(2)} style={{ padding:'12px 18px', background:'transparent', border:'1px solid rgba(192,48,58,0.15)', color:'#A0444C', fontFamily:'Montserrat,sans-serif', fontSize:'0.6rem', cursor:'pointer' }}>← EDIT</button>
              <button type="submit" disabled={sending} style={{ flex:1, padding:'13px', background:sending?'rgba(196,149,106,0.3)':roseGrad, border:'none', color:'#FFFFFF', fontFamily:'Montserrat,sans-serif', fontWeight:600, fontSize:'0.66rem', letterSpacing:'0.2em', cursor:sending?'wait':'pointer' }}>{sending?'PLACING ORDER...':'✓ PLACE ORDER'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── NAILS SHOP ─── */
function NailsShop() {
  const [ordering, setOrdering] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  return (
    <section id="nails" style={{ padding:'100px clamp(20px,6vw,80px)', background:'var(--black)' }}>
      {ordering && <OrderModal product={ordering} onClose={() => setOrdering(null)} />}
      {showGuide && <SizeGuide onClose={() => setShowGuide(false)} />}
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:64 }}>
          <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.68rem', letterSpacing:'0.35em', color:'#A0444C', marginBottom:12, textTransform:'uppercase' }}>LUXÉ Collection</p>
          <h2 style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'clamp(1.8rem,5vw,3rem)', ...roseText }}>Press-On Nails Shop</h2>
          {dividerLine}
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'clamp(1rem,2.5vw,1.2rem)', color:'var(--text-muted)', maxWidth:580, margin:'0 auto 8px' }}>Luxury handmade press-on nails · Custom sets · Reusable · Made with love in South Africa · Nationwide delivery.</p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', margin:'24px 0 0' }}>
            {['Nail File','Liquid Nail Glue','Adhesive Tabs','Complimentary Gift','Reusable Sets'].map(i => (<span key={i} style={{ padding:'6px 14px', border:'1px solid rgba(192,48,58,0.15)', fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.58rem', letterSpacing:'0.14em', color:'#A0444C', textTransform:'uppercase' }}>✦ {i}</span>))}
          </div>
          <div style={{ marginTop:18 }}>
            <button onClick={() => setShowGuide(true)} style={{ background:'linear-gradient(135deg,#C4956A 0%,#A0444C 60%,#C0303A 100%)', border:'none', padding:'13px 32px', cursor:'pointer', fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'0.68rem', letterSpacing:'0.22em', color:'#FFFFFF', textTransform:'uppercase', boxShadow:'0 4px 22px rgba(192,48,58,0.28), 0 1px 0 rgba(255,255,255,0.08) inset', transition:'transform 0.18s, box-shadow 0.18s', display:'inline-flex', alignItems:'center', gap:8 }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(192,48,58,0.38)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 22px rgba(192,48,58,0.28)'; }}>
                <span style={{ fontSize:'0.9rem' }}>◈</span> VIEW SIZE GUIDE &amp; MEASUREMENT INSTRUCTIONS</button>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:22 }}>
          {NAIL_PRODUCTS.map(p => (
            <div key={p.id} style={{ background:'linear-gradient(160deg,#FFFFFF,#FDF0F3)', border:'1px solid rgba(192,48,58,0.2)', overflow:'hidden', transition:'border-color 0.3s, transform 0.3s', display:'flex', flexDirection:'column' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(196,149,106,0.35)'; e.currentTarget.style.transform='translateY(-4px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(196,149,106,0.12)'; e.currentTarget.style.transform='translateY(0)'; }}>
              <div style={{ aspectRatio:'4/3', position:'relative', overflow:'hidden', borderBottom:'1px solid rgba(196,149,106,0.08)', background:'#FDF0F3' }}>
                {p.img && <img src={p.img} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform 0.6s' }} onMouseEnter={e => e.target.style.transform='scale(1.05)'} onMouseLeave={e => e.target.style.transform='scale(1)'} />}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:1, zIndex:2, background:'linear-gradient(90deg,transparent,rgba(192,48,58,0.22),transparent)' }} />
              </div>
              <div style={{ padding:'clamp(16px,3vw,26px)', flex:1, display:'flex', flexDirection:'column' }}>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
                  {p.tags.map(t => (<span key={t} style={{ padding:'2px 9px', border:'1px solid rgba(192,48,58,0.12)', fontFamily:'Montserrat,sans-serif', fontSize:'0.48rem', letterSpacing:'0.14em', color:'#A0444C', textTransform:'uppercase' }}>{t}</span>))}
                </div>
                <h3 style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'1.1rem', ...roseText, marginBottom:10 }}>{p.name}</h3>
                <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'0.93rem', color:'rgba(61,26,30,0.68)', lineHeight:1.65, flex:1, marginBottom:16 }}>{p.desc}</p>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:14, borderTop:'1px solid rgba(196,149,106,0.1)' }}>
                  <div>
                    <p style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'1.05rem', ...roseText }}>{p.price}</p>
                    <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.5rem', color:'#A0444C', letterSpacing:'0.1em' }}>+ R109.99 delivery</p>
                  </div>
                  <button onClick={() => setOrdering(p)} style={{ padding:'10px 20px', background:roseGrad, color:'#FFFFFF', fontFamily:'Montserrat,sans-serif', fontWeight:600, fontSize:'0.6rem', letterSpacing:'0.18em', textTransform:'uppercase', border:'none', cursor:'pointer', boxShadow:'0 4px 16px rgba(192,48,58,0.15)' }}>ORDER</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:44, padding:'28px', border:'1px solid rgba(192,48,58,0.2)', background:'rgba(192,48,58,0.02)' }}>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'1.05rem', color:'rgba(61,26,30,0.74)', marginBottom:14 }}>See more designs on our Instagram</p>
          <a href="https://instagram.com/maisondeluxe_nails" target="_blank" rel="noopener noreferrer" style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.62rem', letterSpacing:'0.2em', color:'#A0444C', textDecoration:'none', textTransform:'uppercase', borderBottom:'1px solid rgba(196,149,106,0.25)', paddingBottom:2 }}>@maisondeluxe_nails</a>
        </div>
      </div>
    </section>
  );
}


/* ─── JEWELLERY SHOP ─── */

function JewelleryShop() {
  return (
    <section id="jewellery" style={{ padding:'80px clamp(20px,6vw,80px) 100px', background:'linear-gradient(160deg,#fdf6f0 0%,#fff8f5 50%,#fdf0f3 100%)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:64 }}>
          <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.68rem', letterSpacing:'0.35em', color:'#A0444C', marginBottom:12, textTransform:'uppercase' }}>Maison Deluxe Collection</p>
          <h2 style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'clamp(1.8rem,5vw,3rem)', ...roseText }}>Jewellery</h2>
          {dividerLine}
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'clamp(1rem,2.5vw,1.2rem)', color:'var(--text-muted)', maxWidth:580, margin:'0 auto 8px' }}>Curated pieces that complement your nails and elevate every look. Stainless steel · Waterproof · Nationwide delivery.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:22 }}>
          {JEWELLERY_PRODUCTS.map(p => (
            <div key={p.id} style={{ background:'linear-gradient(160deg,#FFFFFF,#FDF0F3)', border:'1px solid rgba(196,149,106,0.2)', overflow:'hidden', transition:'border-color 0.3s, transform 0.3s', display:'flex', flexDirection:'column' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(196,149,106,0.5)'; e.currentTarget.style.transform='translateY(-4px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(196,149,106,0.2)'; e.currentTarget.style.transform='translateY(0)'; }}>
              <div style={{ aspectRatio:'1/1', position:'relative', overflow:'hidden', borderBottom:'1px solid rgba(196,149,106,0.08)', background:'#FDF0F3' }}>
                <img src={p.img} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform 0.6s' }} onMouseEnter={e => e.target.style.transform='scale(1.05)'} onMouseLeave={e => e.target.style.transform='scale(1)'} />
                <div style={{ position:'absolute', top:0, left:0, right:0, height:1, zIndex:2, background:'linear-gradient(90deg,transparent,rgba(196,149,106,0.3),transparent)' }} />
                {p.metal && (
                  <div style={{ position:'absolute', top:12, right:12, padding:'3px 10px', background:'rgba(10,10,10,0.75)', backdropFilter:'blur(6px)', border:'1px solid rgba(196,149,106,0.35)' }}>
                    <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.5rem', letterSpacing:'0.18em', color:'rgba(196,149,106,0.9)', textTransform:'uppercase' }}>{p.metal}</span>
                  </div>
                )}
              </div>
              <div style={{ padding:'clamp(16px,3vw,26px)', flex:1, display:'flex', flexDirection:'column' }}>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
                  {p.tags.map(t => (<span key={t} style={{ padding:'2px 9px', border:'1px solid rgba(196,149,106,0.2)', fontFamily:'Montserrat,sans-serif', fontSize:'0.48rem', letterSpacing:'0.14em', color:'#A0444C', textTransform:'uppercase' }}>{t}</span>))}
                </div>
                <h3 style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'1rem', ...roseText, marginBottom:10 }}>{p.name}</h3>
                <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'0.93rem', color:'rgba(61,26,30,0.68)', lineHeight:1.65, flex:1, marginBottom:16 }}>{p.desc}</p>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:14, borderTop:'1px solid rgba(196,149,106,0.1)' }}>
                  <div>
                    <p style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'1.05rem', ...roseText }}>{p.price}</p>
                    <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.5rem', color:'#A0444C', letterSpacing:'0.1em' }}>+ R109.99 delivery</p>
                  </div>
                  <a href="#order-now" style={{ padding:'10px 20px', background:roseGrad, color:'#FFFFFF', fontFamily:'Montserrat,sans-serif', fontWeight:600, fontSize:'0.6rem', letterSpacing:'0.18em', textTransform:'uppercase', border:'none', cursor:'pointer', textDecoration:'none', display:'inline-block', boxShadow:'0 4px 16px rgba(192,48,58,0.15)' }}>ORDER</a>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:44, padding:'28px', border:'1px solid rgba(196,149,106,0.2)', background:'rgba(255,255,255,0.6)' }}>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'1.05rem', color:'rgba(61,26,30,0.74)', marginBottom:14 }}>See more pieces on our Instagram</p>
          <a href="https://instagram.com/maisondeluxebyangel" target="_blank" rel="noopener noreferrer" style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.62rem', letterSpacing:'0.2em', color:'#A0444C', textDecoration:'none', textTransform:'uppercase', borderBottom:'1px solid rgba(196,149,106,0.25)', paddingBottom:2 }}>@maisondeluxebyangel</a>
        </div>
      </div>
    </section>
  );
}

function OrderNow() {
  const ref = useRef(null);
  const [form, setForm] = useState({ name:'', email:'', phone:'', service:'', date:'', notes:'' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [orderId, setOrderId] = useState('');
  const inp = { width:'100%', padding:'13px 16px', background:'#FFFFFF', border:'1px solid rgba(192,48,58,0.15)', color:'var(--text)', fontFamily:'Cormorant Garamond,serif', fontSize:'1rem', outline:'none', transition:'border-color 0.3s', appearance:'none' };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSending(true);
    CRM.saveLead({ name:form.name, phone:form.phone, email:form.email, interest:form.service, source:'order_form' });
    const order = CRM.saveOrder({ ...form, type:'service', total:'TBC' });
    setOrderId(order.id);
    WA.open('order', { ...form, id:order.id, total:'TBC' });
    await new Promise(r => setTimeout(r, 900));
    setSending(false); setSent(true);
  };

  return (
    <section id="order-now" ref={ref} style={{ padding:'100px clamp(20px,6vw,80px)', background:'linear-gradient(160deg,var(--surface) 0%,var(--black) 100%)' }}>
      <div style={{ maxWidth:700, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.68rem', letterSpacing:'0.35em', color:'#A0444C', marginBottom:12, textTransform:'uppercase' }}>Book a Service</p>
          <h2 style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'clamp(1.8rem,5vw,3rem)', ...roseText }}>Order Now</h2>
          {dividerLine}
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'clamp(0.95rem,2.2vw,1.1rem)', color:'var(--text-muted)' }}>Every appointment is a personalised luxury experience.</p>
        </div>
        {sent ? (
          <div style={{ textAlign:'center', padding:'56px 40px', border:'1px solid rgba(192,48,58,0.18)', background:'rgba(255,245,247,0.85)' }}>
            <span style={{ fontSize:'2rem', color:'#A0444C', display:'block', marginBottom:18 }}>◆</span>
            <h3 style={{ fontFamily:'Cinzel,serif', fontSize:'1.4rem', ...roseText, marginBottom:12 }}>Order Received</h3>
            <p style={{ fontFamily:'Montserrat,sans-serif', fontSize:'0.6rem', letterSpacing:'0.14em', color:'#A0444C', marginBottom:10 }}>Ref: {orderId}</p>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'1rem', color:'var(--text-muted)' }}>Thank you, {form.name}. WhatsApp opened with your order details. We will confirm shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div><label style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.58rem', letterSpacing:'0.18em', color:'#A0444C', textTransform:'uppercase', display:'block', marginBottom:7 }}>Full Name</label><input style={inp} placeholder="Your name" value={form.name} onChange={e => setForm({...form,name:e.target.value})} required onFocus={e => e.target.style.borderColor='rgba(196,149,106,0.5)'} onBlur={e => e.target.style.borderColor='rgba(196,149,106,0.2)'} /></div>
              <div><label style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.58rem', letterSpacing:'0.18em', color:'#A0444C', textTransform:'uppercase', display:'block', marginBottom:7 }}>Phone</label><input style={inp} placeholder="+27..." value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} required onFocus={e => e.target.style.borderColor='rgba(196,149,106,0.5)'} onBlur={e => e.target.style.borderColor='rgba(196,149,106,0.2)'} /></div>
            </div>
            <div><label style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.58rem', letterSpacing:'0.18em', color:'#A0444C', textTransform:'uppercase', display:'block', marginBottom:7 }}>Email</label><input type="email" style={inp} placeholder="your@email.com" value={form.email} onChange={e => setForm({...form,email:e.target.value})} onFocus={e => e.target.style.borderColor='rgba(196,149,106,0.5)'} onBlur={e => e.target.style.borderColor='rgba(196,149,106,0.2)'} /></div>
            <div>
              <label style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.58rem', letterSpacing:'0.18em', color:'#A0444C', textTransform:'uppercase', display:'block', marginBottom:7 }}>Service</label>
              <select style={inp} value={form.service} onChange={e => setForm({...form,service:e.target.value})} required onFocus={e => e.target.style.borderColor='rgba(196,149,106,0.5)'} onBlur={e => e.target.style.borderColor='rgba(196,149,106,0.2)'}>
                <option value="" disabled>Select a service</option>
                <optgroup label="── Beauty ──"><option>Full Face Makeup</option><option>Lash Extensions</option><option>Lash Lift & Tint</option><option>Brow Shaping & Tinting</option><option>Waxing & Threading</option></optgroup>
                <optgroup label="── Nails ──"><option>Gel Manicure</option><option>Acrylic Set</option><option>Nail Art & Design</option><option>BIAB</option><option>Pedicure</option></optgroup>
                <optgroup label="── Jewellery ──"><option>Jewellery Consultation</option><option>Custom / Bespoke Piece</option><option>Gift Curation</option></optgroup>
              </select>
            </div>
            <div><label style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.58rem', letterSpacing:'0.18em', color:'#A0444C', textTransform:'uppercase', display:'block', marginBottom:7 }}>Preferred Date</label><input type="date" style={{...inp, colorScheme:'dark'}} value={form.date} onChange={e => setForm({...form,date:e.target.value})} min={new Date().toISOString().split('T')[0]} onFocus={e => e.target.style.borderColor='rgba(196,149,106,0.5)'} onBlur={e => e.target.style.borderColor='rgba(196,149,106,0.2)'} /></div>
            <div><label style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.58rem', letterSpacing:'0.18em', color:'#A0444C', textTransform:'uppercase', display:'block', marginBottom:7 }}>Message</label><textarea rows={4} style={{...inp, resize:'vertical'}} placeholder="Any details or special requests..." value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} onFocus={e => e.target.style.borderColor='rgba(196,149,106,0.5)'} onBlur={e => e.target.style.borderColor='rgba(196,149,106,0.2)'} /></div>
            <button type="submit" style={{ padding:'15px 44px', background:sending?'rgba(196,149,106,0.3)':roseGrad, color:'#FFFFFF', fontFamily:'Montserrat,sans-serif', fontWeight:600, fontSize:'0.7rem', letterSpacing:'0.22em', textTransform:'uppercase', border:'none', cursor:sending?'wait':'pointer', boxShadow:'0 4px 28px rgba(192,48,58,0.18)', marginTop:4 }}>{sending?'Sending...':'Place Order'}</button>
          </form>
        )}
      </div>
    </section>
  );
}

/* ─── ANALYTICS DASHBOARD ─── */
function Analytics() {
  const [data, setData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [leads, setLeads] = useState([]);
  const [appts, setAppts] = useState([]);
  const [tab, setTab] = useState('overview');
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const ADMIN_PIN = '2024';

  const refresh = useCallback(() => {
    setData(CRM.getAnalytics());
    setOrders(CRM.getOrders().slice(0,20));
    setLeads(CRM.getLeads().slice(0,20));
    setAppts(CRM.getAppointments().slice(0,20));
  }, []);

  useEffect(() => { if (unlocked) refresh(); }, [unlocked, refresh]);

  const stat = (label, value, sub) => (
    <div style={{ background:'linear-gradient(160deg,#FFFFFF,#FDF0F3)', border:'1px solid rgba(192,48,58,0.15)', padding:'22px 26px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(192,48,58,0.28),transparent)' }} />
      <p style={{ fontFamily:'Montserrat,sans-serif', fontSize:'0.56rem', letterSpacing:'0.18em', color:'#A0444C', textTransform:'uppercase', marginBottom:7 }}>{label}</p>
      <p style={{ fontFamily:'Cinzel,serif', fontSize:'1.9rem', ...roseText, marginBottom:3 }}>{value}</p>
      {sub && <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'0.82rem', color:'rgba(61,26,30,0.65)' }}>{sub}</p>}
    </div>
  );

  if (!unlocked) return (
    <section id="analytics" style={{ padding:'100px clamp(20px,6vw,80px)', background:'var(--black)' }}>
      <div style={{ maxWidth:400, margin:'0 auto', textAlign:'center' }}>
        <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.68rem', letterSpacing:'0.35em', color:'#A0444C', marginBottom:12, textTransform:'uppercase' }}>Admin</p>
        <h2 style={{ fontFamily:'Cinzel,serif', fontSize:'clamp(1.5rem,4vw,2.2rem)', ...roseText, marginBottom:12 }}>Analytics Dashboard</h2>
        {dividerLine}
        <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'1rem', color:'var(--text-muted)', marginBottom:24 }}>Admin access required</p>
        <input type="password" placeholder="Enter PIN" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key==='Enter' && pin===ADMIN_PIN && setUnlocked(true)} style={{ width:'100%', padding:'13px', background:'#FFFFFF', border:'1px solid rgba(192,48,58,0.15)', color:'var(--text)', fontFamily:'Cormorant Garamond,serif', fontSize:'1rem', outline:'none', textAlign:'center', marginBottom:12, letterSpacing:'0.3em' }} />
        <button onClick={() => pin===ADMIN_PIN ? setUnlocked(true) : alert('Incorrect PIN')} style={{ width:'100%', padding:'13px', background:roseGrad, border:'none', color:'#FFFFFF', fontFamily:'Montserrat,sans-serif', fontWeight:600, fontSize:'0.62rem', letterSpacing:'0.2em', cursor:'pointer' }}>UNLOCK DASHBOARD</button>
        <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'0.78rem', color:'#A0444C', marginTop:10 }}>Default PIN: 2024</p>
      </div>
    </section>
  );

  return (
    <section id="analytics" style={{ padding:'100px clamp(20px,6vw,80px)', background:'var(--black)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.68rem', letterSpacing:'0.35em', color:'#A0444C', marginBottom:12, textTransform:'uppercase' }}>Admin</p>
          <h2 style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'clamp(1.8rem,5vw,3rem)', ...roseText }}>Analytics Dashboard</h2>
          {dividerLine}
        </div>
        <div style={{ display:'flex', gap:7, marginBottom:28, flexWrap:'wrap' }}>
          {['overview','orders','leads','appointments'].map(t => (<button key={t} onClick={() => setTab(t)} style={{ padding:'8px 18px', border:`1px solid ${tab===t?'rgba(196,149,106,0.6)':'rgba(196,149,106,0.15)'}`, background: tab===t?'rgba(196,149,106,0.1)':'transparent', color: tab===t?'#C4956A':'rgba(196,149,106,0.4)', fontFamily:'Montserrat,sans-serif', fontSize:'0.58rem', letterSpacing:'0.16em', cursor:'pointer', textTransform:'uppercase', transition:'all 0.3s' }}>{t}</button>))}
          <button onClick={refresh} style={{ marginLeft:'auto', padding:'8px 16px', border:'1px solid rgba(192,48,58,0.12)', background:'transparent', color:'#A0444C', fontFamily:'Montserrat,sans-serif', fontSize:'0.58rem', cursor:'pointer' }}>↻ Refresh</button>
        </div>

        {tab === 'overview' && data && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:16, marginBottom:24 }}>
              {stat('Total Orders', data.totalOrders, 'All time')}
              {stat('Total Leads', data.totalLeads, 'CRM records')}
              {stat('Appointments', data.totalAppointments, 'Booked')}
              {stat('Revenue', `R${data.revenue.toFixed(0)}`, 'From nail orders')}
              {stat('Conversion', `${data.conversionRate}%`, 'Lead → Order')}
            </div>
            {Object.keys(data.byService).length > 0 ? (
              <div style={{ background:'linear-gradient(160deg,#FFFFFF,#FDF0F3)', border:'1px solid rgba(192,48,58,0.15)', padding:'24px' }}>
                <p style={{ fontFamily:'Montserrat,sans-serif', fontSize:'0.6rem', letterSpacing:'0.18em', color:'#A0444C', textTransform:'uppercase', marginBottom:16 }}>Orders by Service</p>
                {Object.entries(data.byService).sort((a,b) => b[1]-a[1]).map(([svc,count]) => (
                  <div key={svc} style={{ marginBottom:9 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'0.92rem', color:'#3D1A1E' }}>{svc}</span>
                      <span style={{ fontFamily:'Montserrat,sans-serif', fontSize:'0.68rem', color:'#A0444C' }}>{count}</span>
                    </div>
                    <div style={{ height:3, background:'rgba(192,48,58,0.08)', borderRadius:2 }}>
                      <div style={{ height:'100%', background:roseGrad, borderRadius:2, width:`${Math.min(100,(count/Math.max(...Object.values(data.byService)))*100)}%`, transition:'width 0.8s' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'36px', border:'1px solid rgba(192,48,58,0.08)' }}>
                <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'1rem', color:'#A0444C' }}>No activity yet. Orders and leads will appear here automatically.</p>
              </div>
            )}
          </div>
        )}

        {['orders','leads','appointments'].includes(tab) && (
          <div style={{ background:'linear-gradient(160deg,#FFFFFF,#FDF0F3)', border:'1px solid rgba(192,48,58,0.15)', overflow:'auto' }}>
            {(tab==='orders'?orders:tab==='leads'?leads:appts).length === 0 ? (
              <div style={{ textAlign:'center', padding:'44px', color:'#A0444C' }}>
                <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'1rem' }}>No {tab} yet. They will appear here as activity comes in.</p>
              </div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(196,149,106,0.15)' }}>
                    {(tab==='orders'?['ID','Name','Service','Total','Date','Status']:tab==='leads'?['Name','Phone','Email','Interest','Source','Touches']:['ID','Name','Service','Date','Time','Status']).map(h => (<th key={h} style={{ padding:'11px 14px', textAlign:'left', fontFamily:'Montserrat,sans-serif', fontSize:'0.52rem', letterSpacing:'0.16em', color:'#A0444C', textTransform:'uppercase' }}>{h}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {(tab==='orders'?orders:tab==='leads'?leads:appts).map((row, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid rgba(196,149,106,0.05)' }} onMouseEnter={e => e.currentTarget.style.background='rgba(196,149,106,0.03)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      {tab==='orders' && [row.id,row.name,row.service,row.total,row.createdAt?.slice(0,10),row.status].map((v,j) => (<td key={j} style={{ padding:'11px 14px', fontFamily:'Cormorant Garamond,serif', fontSize:'0.88rem', color: j===5?'rgba(196,149,106,0.7)':'rgba(240,230,220,0.65)' }}>{v||'—'}</td>))}
                      {tab==='leads' && [row.name,row.phone,row.email,row.interest,row.source,row.touchpoints].map((v,j) => (<td key={j} style={{ padding:'11px 14px', fontFamily:'Cormorant Garamond,serif', fontSize:'0.88rem', color:'rgba(61,26,30,0.68)' }}>{v||'—'}</td>))}
                      {tab==='appointments' && [row.id,row.name,row.service,row.date,row.time,row.status].map((v,j) => (<td key={j} style={{ padding:'11px 14px', fontFamily:'Cormorant Garamond,serif', fontSize:'0.88rem', color: j===5?'rgba(196,149,106,0.7)':'rgba(240,230,220,0.65)' }}>{v||'—'}</td>))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        <div style={{ marginTop:14, display:'flex', justifyContent:'flex-end' }}>
          <button onClick={() => setUnlocked(false)} style={{ padding:'7px 16px', background:'transparent', border:'1px solid rgba(192,48,58,0.2)', color:'#A0444C', fontFamily:'Montserrat,sans-serif', fontSize:'0.55rem', cursor:'pointer' }}>LOCK DASHBOARD</button>
        </div>
      </div>
    </section>
  );
}

/* ─── ABOUT ─── */
function About() {
  const ref = useRef(null);
  useEffect(() => {
    if (!window.gsap || !window.ScrollTrigger) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.gsap.fromTo(ref.current, { opacity:0, y:30 }, { opacity:1, y:0, duration:0.9, scrollTrigger:{ trigger:ref.current, start:'top 82%' } });
  }, []);
  return (
    <section id="about" ref={ref} style={{ padding:'100px clamp(20px,6vw,80px)', background:'linear-gradient(160deg,var(--surface) 0%,var(--black) 100%)' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:60, alignItems:'center' }}>
        <div style={{ display:'flex', justifyContent:'center' }}>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', inset:'-20px', borderRadius:'50%', background:'radial-gradient(circle,rgba(242,196,200,0.7) 0%,transparent 70%)', filter:'blur(12px)', animation:'float 4s ease-in-out infinite' }} />
            <div style={{ position:'absolute', inset:'-6px', borderRadius:'50%', border:'1px solid rgba(192,48,58,0.18)' }} />
            <div style={{ position:'absolute', inset:'-18px', borderRadius:'50%', border:'1px solid rgba(192,48,58,0.08)' }} />
            <img src="/logo.jpg" alt="Maison Deluxe" style={{ width:'clamp(180px,28vw,260px)', height:'clamp(180px,28vw,260px)', borderRadius:'50%', objectFit:'cover', display:'block', border:'1px solid rgba(192,48,58,0.22)', boxShadow:'0 0 60px rgba(242,196,200,0.45)', position:'relative' }} />
          </div>
        </div>
        <div>
          <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.65rem', letterSpacing:'0.3em', color:'#A0444C', textTransform:'uppercase', marginBottom:14 }}>The Maison</p>
          <h2 style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'clamp(1.8rem,5vw,2.8rem)', ...roseText, marginBottom:20 }}>Where Beauty<br />Meets Luxury</h2>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'clamp(1rem,2.2vw,1.15rem)', color:'#3D1A1E', lineHeight:1.85, marginBottom:18 }}>Maison Deluxe was born from a belief that every woman deserves to feel extraordinary. We are a curated luxury experience — bringing together the finest in beauty, nail artistry, and jewellery under one signature name.</p>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'clamp(0.95rem,2vw,1.08rem)', color:'rgba(61,26,30,0.76)', lineHeight:1.8, marginBottom:28 }}>Founded by Angel, Maison Deluxe is more than a beauty brand — it is a movement. A space where you are seen, celebrated, and elevated.</p>
          {dividerLine}
          <div style={{ display:'flex', gap:32, flexWrap:'wrap' }}>
            {[['Beauty','@luxebeautyco___'],['Nails','@maisondeluxe_nails'],['@maisondeluxebyangel']].map(([k,v]) => (<div key={k}><p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.6rem', letterSpacing:'0.2em', color:'#A0444C', textTransform:'uppercase', marginBottom:4 }}>{k}</p><p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'0.95rem', color:'rgba(196,149,106,0.8)' }}>{v}</p></div>))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── CONTACT ─── */
function Contact() {
  const ref = useRef(null);
  useEffect(() => {
    if (!window.gsap || !window.ScrollTrigger) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.gsap.fromTo(ref.current, { opacity:0, y:30 }, { opacity:1, y:0, duration:0.9, scrollTrigger:{ trigger:ref.current, start:'top 82%' } });
  }, []);
  return (
    <section id="contact" ref={ref} style={{ padding:'100px clamp(20px,6vw,80px)', background:'var(--black)' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.68rem', letterSpacing:'0.35em', color:'#A0444C', marginBottom:12, textTransform:'uppercase' }}>Get In Touch</p>
          <h2 style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'clamp(1.8rem,5vw,3rem)', ...roseText }}>Contact</h2>
          {dividerLine}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:24 }}>
          {[
            { icon:'◈', label:'Instagram — Beauty', value:'@luxebeautyco___', href:'https://instagram.com/luxebeautyco___' },
            { icon:'◈', label:'Instagram — Nails', value:'@maisondeluxe_nails', href:'https://instagram.com/maisondeluxe_nails' },
            { icon:'◈', label:'Instagram — Jewellery', value:'@maisondeluxebyangel', href:'https://instagram.com/maisondeluxebyangel' },
            { icon:'💬', label:'WhatsApp', value:'Chat with our team', href:`https://wa.me/${WA_NUMBER}?text=Hello%20Maison%20Deluxe!%20I%20would%20like%20to%20get%20in%20touch.` },
          ].map((c, i) => (<a key={i} href={c.href} target="_blank" rel="noopener noreferrer" style={{ display:'block', textDecoration:'none', background:'linear-gradient(160deg,#FFFFFF,#FDF0F3)', border:'1px solid rgba(192,48,58,0.18)', padding:'clamp(22px,3vw,34px)', transition:'border-color 0.3s, transform 0.3s', position:'relative', overflow:'hidden' }} onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(192,48,58,0.45)'; e.currentTarget.style.transform='translateY(-4px)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(196,149,106,0.15)'; e.currentTarget.style.transform='translateY(0)'; }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(192,48,58,0.22),transparent)' }} />
            <span style={{ fontSize:'1.2rem', color:'#A0444C', display:'block', marginBottom:10 }}>{c.icon}</span>
            <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.58rem', letterSpacing:'0.18em', color:'#A0444C', textTransform:'uppercase', marginBottom:5 }}>{c.label}</p>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'1rem', color:'#3D1A1E' }}>{c.value}</p>
          </a>))}
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  return (
    <footer style={{ padding:'44px clamp(20px,6vw,80px) 28px', background:'#F5D8DC', borderTop:'1px solid rgba(196,149,106,0.1)' }}>
      <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', flexDirection:'column', alignItems:'center', gap:18, textAlign:'center' }}>
        <img src="/logo.jpg" alt="Maison Deluxe" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', border:'1px solid rgba(192,48,58,0.18)', opacity:0.75 }} />
        <span style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'0.88rem', letterSpacing:'0.2em', ...roseText }}>MAISON DELUXE</span>
        <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic', fontSize:'0.85rem', color:'rgba(61,26,30,0.7)' }}>Elevate. Express. Empower.</p>
        <div style={{ display:'flex', gap:18, flexWrap:'wrap', justifyContent:'center' }}>
          {['luxebeautyco___','maisondeluxe_nails','maisondeluxebyangel'].map(h => (<a key={h} href={`https://instagram.com/${h}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily:'Montserrat,sans-serif', fontSize:'0.55rem', letterSpacing:'0.14em', color:'#A0444C', textDecoration:'none' }}>@{h}</a>))}
        </div>
        <div style={{ height:1, width:'100%', maxWidth:180, background:'linear-gradient(90deg,transparent,rgba(192,48,58,0.12),transparent)' }} />
        <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.52rem', letterSpacing:'0.18em', color:'rgba(196,149,106,0.18)', textTransform:'uppercase' }}>© 2025 Maison Deluxe · AI Powered · South Africa</p>
        <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.48rem', letterSpacing:'0.1em', color:'rgba(160,68,76,0.2)' }}>AI Concierge · Voice Agent · CRM · WhatsApp Automation · Appointments · Analytics</p>
      </div>
    </footer>
  );
}

/* ─── APP ─── */
export default function App() {
  useEffect(() => {
    // Always start at the top of the page on load, ignore any URL hash scroll
    window.history.scrollRestoration = 'manual';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  return (
    <>
      <Navbar />
      <Hero />
      <Services />
      <NailsShop />
      <AiConcierge />
      <Appointments />
      <OrderNow />
      <Analytics />
      <About />
      <Contact />
      <Footer />
    </>
  );
}
