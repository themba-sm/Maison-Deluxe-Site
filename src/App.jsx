/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';

/* ─── SHARED HELPERS ─── */
const roseGrad = 'linear-gradient(135deg,#6B3A1F 0%,#C4956A 30%,#E8BFA0 50%,#C4956A 70%,#6B3A1F 100%)';
const roseText = {
  background: roseGrad,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};
const dividerLine = (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, margin:'18px 0' }}>
    <div style={{ height:1, flex:1, maxWidth:80, background:'linear-gradient(90deg,transparent,rgba(196,149,106,0.6),transparent)' }} />
    <span style={{ color:'rgba(196,149,106,0.7)', fontSize:'0.5rem' }}>◆</span>
    <div style={{ height:1, flex:1, maxWidth:80, background:'linear-gradient(90deg,transparent,rgba(196,149,106,0.6),transparent)' }} />
  </div>
);

/* ─── NAVBAR ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = ['Services','About','Gallery','Book Now','Contact'];

  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:100,
      transition:'all 0.4s',
      background: scrolled ? 'rgba(10,10,10,0.96)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(196,149,106,0.15)' : 'none',
      padding:'0 clamp(20px,5vw,60px)',
    }}>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center',
        justifyContent:'space-between', height:70 }}>
        {/* Logo */}
        <a href="#hero" style={{ display:'flex', alignItems:'center', gap:12, textDecoration:'none' }}>
          <img src="/logo.jpg" alt="Maison Deluxe" style={{
            width:40, height:40, borderRadius:'50%', objectFit:'cover',
            border:'1px solid rgba(196,149,106,0.4)',
            boxShadow:'0 0 16px rgba(196,149,106,0.25)',
          }} />
          <span style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'1.1rem', ...roseText }}>
            MAISON DELUXE
          </span>
        </a>

        {/* Desktop links */}
        <div style={{ display:'flex', gap:32, alignItems:'center' }} className="desktop-nav">
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(' ','-')}`} style={{
              fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.7rem',
              letterSpacing:'0.2em', color:'rgba(240,230,220,0.75)',
              textDecoration:'none', textTransform:'uppercase',
              transition:'color 0.3s',
            }}
            onMouseEnter={e => e.target.style.color='#C4956A'}
            onMouseLeave={e => e.target.style.color='rgba(240,230,220,0.75)'}
            >{l}</a>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} style={{
          background:'none', border:'none', cursor:'pointer',
          display:'flex', flexDirection:'column', gap:5, padding:4,
        }} className="mobile-menu-btn">
          {[0,1,2].map(i => (
            <div key={i} style={{
              width:24, height:1.5, background:'rgba(196,149,106,0.8)',
              transition:'all 0.3s',
              transform: open && i===0 ? 'rotate(45deg) translate(5px,5px)' :
                         open && i===1 ? 'scaleX(0)' :
                         open && i===2 ? 'rotate(-45deg) translate(5px,-5px)' : 'none',
            }} />
          ))}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div style={{
          background:'rgba(10,10,10,0.98)', backdropFilter:'blur(20px)',
          borderTop:'1px solid rgba(196,149,106,0.15)',
          padding:'24px clamp(20px,5vw,60px)',
          display:'flex', flexDirection:'column', gap:20,
        }}>
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(' ','-')}`}
              onClick={() => setOpen(false)}
              style={{
                fontFamily:'Montserrat,sans-serif', fontWeight:300,
                fontSize:'0.8rem', letterSpacing:'0.2em',
                color:'rgba(240,230,220,0.8)', textDecoration:'none', textTransform:'uppercase',
              }}>
              {l}
            </a>
          ))}
        </div>
      )}

      <style>{`
        @media(min-width:769px){ .mobile-menu-btn{display:none!important;} }
        @media(max-width:768px){ .desktop-nav{display:none!important;} }
      `}</style>
    </nav>
  );
}

/* ─── HERO ─── */
function Hero() {
  const overlayRef = useRef(null);
  const logoRef = useRef(null);
  const titleRef = useRef(null);
  const tagRef = useRef(null);
  const divRef = useRef(null);
  const subRef = useRef(null);
  const btnsRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!window.gsap) return;
    const ctx = window.gsap.context(() => {
      const tl = window.gsap.timeline({ defaults: { ease: 'power4.out' } });
      window.gsap.set([logoRef.current, titleRef.current, tagRef.current,
        divRef.current, subRef.current, btnsRef.current, scrollRef.current], { opacity:0 });

      tl.to(overlayRef.current, { opacity:0, duration:1.2, ease:'power2.inOut' }, 0.3);
      tl.fromTo(logoRef.current,
        { opacity:0, scale:0.6, filter:'blur(20px)' },
        { opacity:1, scale:1, filter:'blur(0px)', duration:1.0, ease:'back.out(1.3)' }, 0.5);
      tl.fromTo(titleRef.current,
        { opacity:0, y:30, filter:'blur(10px)' },
        { opacity:1, y:0, filter:'blur(0px)', duration:0.8 }, 1.0);
      tl.fromTo(tagRef.current,
        { opacity:0, letterSpacing:'0.8em' },
        { opacity:1, letterSpacing:'0.35em', duration:1.0 }, 1.4);
      tl.fromTo(divRef.current, { opacity:0, scaleX:0 }, { opacity:1, scaleX:1, duration:0.6, transformOrigin:'center' }, 1.7);
      tl.fromTo(subRef.current, { opacity:0, y:14 }, { opacity:1, y:0, duration:0.5 }, 1.9);
      tl.fromTo(btnsRef.current, { opacity:0, y:16 }, { opacity:1, y:0, duration:0.5 }, 2.2);
      tl.fromTo(scrollRef.current, { opacity:0 }, { opacity:1, duration:0.4 }, 2.7);
    });
    return () => ctx.revert();
  }, []);

  return (
    <section id="hero" style={{
      position:'relative', width:'100%', height:'100vh', overflow:'hidden',
      background:'linear-gradient(160deg,#0a0a0a 0%,#1a0f0a 40%,#0a0a0a 100%)',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      {/* Subtle rose gold glow bg */}
      <div style={{
        position:'absolute', inset:0, zIndex:0,
        background:'radial-gradient(ellipse at 50% 40%, rgba(196,149,106,0.08) 0%, transparent 65%)',
        pointerEvents:'none',
      }} />
      {/* Top gold line accent */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1, zIndex:2,
        background:'linear-gradient(90deg,transparent,rgba(196,149,106,0.5),transparent)' }} />

      {/* Intro overlay */}
      <div ref={overlayRef} style={{ position:'absolute', inset:0, background:'#000', zIndex:9, pointerEvents:'none' }} />

      {/* Content */}
      <div style={{ position:'relative', zIndex:5, textAlign:'center', padding:'0 clamp(20px,6vw,60px)', maxWidth:700 }}>

        {/* Logo mark */}
        <div ref={logoRef} style={{ opacity:0, marginBottom:28, display:'flex', justifyContent:'center' }}>
          <div style={{ position:'relative', display:'inline-block' }}>
            <div style={{
              position:'absolute', inset:'-10px', borderRadius:'50%',
              background:'radial-gradient(circle, rgba(196,149,106,0.2) 0%, transparent 70%)',
              filter:'blur(8px)',
            }} />
            <img src="/logo.jpg" alt="Maison Deluxe" style={{
              width:'clamp(100px,18vw,150px)', height:'clamp(100px,18vw,150px)',
              borderRadius:'50%', objectFit:'cover',
              border:'1px solid rgba(196,149,106,0.35)',
              boxShadow:'0 0 40px rgba(196,149,106,0.2)',
              position:'relative',
            }} />
          </div>
        </div>

        {/* MAISON DELUXE */}
        <div ref={titleRef} style={{ opacity:0, marginBottom:12 }}>
          <span style={{
            display:'block', fontFamily:'Cinzel,serif', fontWeight:700,
            fontSize:'clamp(2.2rem,9vw,5.5rem)', lineHeight:0.9,
            letterSpacing:'0.12em',
            ...roseText,
            filter:'drop-shadow(0 0 24px rgba(196,149,106,0.35))',
          }}>MAISON<br />DELUXE</span>
        </div>

        {/* BEAUTY · JEWELLERY */}
        <div ref={tagRef} style={{ opacity:0, marginBottom:6 }}>
          <span style={{
            fontFamily:'Montserrat,sans-serif', fontWeight:300,
            fontSize:'clamp(0.6rem,2vw,0.85rem)', letterSpacing:'0.35em',
            color:'rgba(196,149,106,0.65)', textTransform:'uppercase',
          }}>BEAUTY &nbsp;◆&nbsp; JEWELLERY &nbsp;◆&nbsp; NAILS</span>
        </div>

        {/* Divider */}
        <div ref={divRef} style={{ opacity:0 }}>{dividerLine}</div>

        {/* Tagline */}
        <p ref={subRef} style={{
          opacity:0, fontFamily:'Cormorant Garamond,serif', fontStyle:'italic',
          fontSize:'clamp(1rem,3vw,1.35rem)', color:'rgba(240,230,220,0.75)',
          letterSpacing:'0.08em', marginBottom:40,
        }}>Elevate. &nbsp;Express. &nbsp;Empower.</p>

        {/* Buttons */}
        <div ref={btnsRef} style={{ opacity:0, display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          <a href="#book-now" style={{
            padding:'clamp(12px,2vw,15px) clamp(28px,5vw,44px)',
            background:roseGrad,
            color:'#1a0a00', fontFamily:'Montserrat,sans-serif', fontWeight:600,
            fontSize:'clamp(0.62rem,1.5vw,0.75rem)', letterSpacing:'0.22em',
            textDecoration:'none', textTransform:'uppercase',
            boxShadow:'0 4px 28px rgba(196,149,106,0.35)',
            border:'1px solid rgba(196,149,106,0.4)',
          }}>BOOK NOW</a>
          <a href="#services" style={{
            padding:'clamp(12px,2vw,15px) clamp(28px,5vw,44px)',
            background:'rgba(0,0,0,0.4)',
            backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
            color:'#C4956A', fontFamily:'Montserrat,sans-serif', fontWeight:400,
            fontSize:'clamp(0.62rem,1.5vw,0.75rem)', letterSpacing:'0.22em',
            textDecoration:'none', textTransform:'uppercase',
            border:'1px solid rgba(196,149,106,0.35)',
          }}>OUR SERVICES</a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div ref={scrollRef} style={{
        position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)',
        textAlign:'center', zIndex:6, opacity:0,
      }}>
        <div style={{ width:22, height:36, border:'1px solid rgba(196,149,106,0.3)',
          borderRadius:11, margin:'0 auto 8px', display:'flex', justifyContent:'center', paddingTop:6 }}>
          <div style={{ width:2, height:7, background:'rgba(196,149,106,0.55)', borderRadius:2,
            animation:'scrollDot 1.4s ease-in-out infinite' }} />
        </div>
        <span style={{ fontFamily:'Montserrat', fontSize:'0.5rem',
          color:'rgba(196,149,106,0.35)', letterSpacing:'0.28em' }}>SCROLL</span>
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
    cards.forEach((card, i) => {
      window.gsap.fromTo(card,
        { opacity:0, y:40 },
        { opacity:1, y:0, duration:0.7, delay:i*0.12,
          scrollTrigger:{ trigger:card, start:'top 88%' } });
    });
  }, []);

  const services = [
    {
      icon:'✦',
      category:'Beauty',
      title:'Luxe Beauty',
      items:['Full Face Makeup','Lash Extensions','Lash Lifts & Tints','Brow Shaping & Tinting','Waxing & Threading'],
      desc:'From everyday glam to bridal artistry — every look is crafted with precision, premium products, and a deep understanding of your unique beauty.',
      ig:'luxebeautyco___',
    },
    {
      icon:'◈',
      category:'Nails',
      title:'Signature Nails',
      items:['Gel Manicures','Acrylic Sets','Nail Art & Design','BIAB (Builder in a Bottle)','Pedicures & Spa Treatments'],
      desc:'Impeccable nails that last. Whether you prefer understated elegance or bold statement sets, every nail is treated as a canvas.',
      ig:'maisondeluxe_nails',
    },
    {
      icon:'◇',
      category:'Jewellery',
      title:'Fine Jewellery',
      items:['Curated Jewellery Collections','Sterling Silver Pieces','Gold-Plated Accessories','Custom & Bespoke Pieces','Gift Curation'],
      desc:'Timeless pieces that complement your personal style. From delicate everyday wear to statement jewellery for life\'s special moments.',
      ig:'maisondeluxebyangel',
    },
  ];

  return (
    <section id="services" style={{ padding:'100px clamp(20px,6vw,80px)', background:'var(--black)' }} ref={ref}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:64 }}>
          <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.68rem',
            letterSpacing:'0.35em', color:'rgba(196,149,106,0.55)', marginBottom:12,
            textTransform:'uppercase' }}>What We Offer</p>
          <h2 style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'clamp(1.8rem,5vw,3rem)',
            ...roseText, marginBottom:0 }}>Our Services</h2>
          {dividerLine}
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic',
            fontSize:'clamp(1rem,2.5vw,1.2rem)', color:'var(--text-muted)', maxWidth:500, margin:'0 auto' }}>
            Three worlds of luxury, united under one maison.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:28 }}>
          {services.map((s, i) => (
            <div key={i} className="svc-card" style={{
              background:'linear-gradient(160deg,rgba(26,18,14,0.9) 0%,rgba(16,12,10,0.95) 100%)',
              border:'1px solid rgba(196,149,106,0.15)',
              padding:'clamp(28px,4vw,44px)',
              position:'relative', overflow:'hidden',
              transition:'border-color 0.3s, transform 0.3s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor='rgba(196,149,106,0.4)';
              e.currentTarget.style.transform='translateY(-4px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor='rgba(196,149,106,0.15)';
              e.currentTarget.style.transform='translateY(0)';
            }}>
              {/* Top glow */}
              <div style={{ position:'absolute', top:0, left:0, right:0, height:1,
                background:'linear-gradient(90deg,transparent,rgba(196,149,106,0.4),transparent)' }} />

              <span style={{ fontSize:'1.4rem', color:'rgba(196,149,106,0.7)', display:'block', marginBottom:16 }}>{s.icon}</span>
              <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.6rem',
                letterSpacing:'0.3em', color:'rgba(196,149,106,0.5)', textTransform:'uppercase', marginBottom:8 }}>{s.category}</p>
              <h3 style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'1.4rem',
                ...roseText, marginBottom:20 }}>{s.title}</h3>

              <ul style={{ listStyle:'none', marginBottom:20 }}>
                {s.items.map((item, j) => (
                  <li key={j} style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'1rem',
                    color:'rgba(240,230,220,0.75)', padding:'5px 0',
                    borderBottom:'1px solid rgba(196,149,106,0.08)',
                    display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ color:'rgba(196,149,106,0.5)', fontSize:'0.5rem' }}>◆</span>
                    {item}
                  </li>
                ))}
              </ul>

              <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic',
                fontSize:'0.95rem', color:'var(--text-muted)', lineHeight:1.7, marginBottom:20 }}>{s.desc}</p>

              <a href={`https://instagram.com/${s.ig}`} target="_blank" rel="noopener noreferrer"
                style={{
                  fontFamily:'Montserrat,sans-serif', fontWeight:400, fontSize:'0.6rem',
                  letterSpacing:'0.2em', color:'rgba(196,149,106,0.6)',
                  textDecoration:'none', textTransform:'uppercase',
                  display:'flex', alignItems:'center', gap:8,
                }}>
                <span style={{ fontSize:'0.85rem' }}>◈</span> @{s.ig}
              </a>
            </div>
          ))}
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
    window.gsap.fromTo(ref.current,
      { opacity:0, y:30 },
      { opacity:1, y:0, duration:0.9,
        scrollTrigger:{ trigger:ref.current, start:'top 82%' } });
  }, []);

  return (
    <section id="about" ref={ref} style={{
      padding:'100px clamp(20px,6vw,80px)',
      background:'linear-gradient(160deg,var(--surface) 0%,var(--black) 100%)',
    }}>
      <div style={{ maxWidth:1000, margin:'0 auto', display:'grid',
        gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:60, alignItems:'center' }}>

        {/* Logo visual */}
        <div style={{ display:'flex', justifyContent:'center' }}>
          <div style={{ position:'relative' }}>
            <div style={{
              position:'absolute', inset:'-20px', borderRadius:'50%',
              background:'radial-gradient(circle,rgba(196,149,106,0.12) 0%,transparent 70%)',
              filter:'blur(12px)', animation:'float 4s ease-in-out infinite',
            }} />
            <div style={{
              position:'absolute', inset:'-6px', borderRadius:'50%',
              border:'1px solid rgba(196,149,106,0.25)',
            }} />
            <div style={{
              position:'absolute', inset:'-18px', borderRadius:'50%',
              border:'1px solid rgba(196,149,106,0.1)',
            }} />
            <img src="/logo.jpg" alt="Maison Deluxe" style={{
              width:'clamp(180px,28vw,260px)', height:'clamp(180px,28vw,260px)',
              borderRadius:'50%', objectFit:'cover', display:'block',
              border:'1px solid rgba(196,149,106,0.3)',
              boxShadow:'0 0 60px rgba(196,149,106,0.15)',
              position:'relative',
            }} />
          </div>
        </div>

        {/* Text */}
        <div>
          <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.65rem',
            letterSpacing:'0.3em', color:'rgba(196,149,106,0.5)', textTransform:'uppercase', marginBottom:14 }}>
            The Maison
          </p>
          <h2 style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'clamp(1.8rem,5vw,2.8rem)',
            ...roseText, marginBottom:20 }}>
            Where Beauty<br />Meets Luxury
          </h2>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'clamp(1rem,2.2vw,1.15rem)',
            color:'rgba(240,230,220,0.8)', lineHeight:1.85, marginBottom:18 }}>
            Maison Deluxe was born from a belief that every woman deserves to feel extraordinary. 
            We are a curated luxury experience — bringing together the finest in beauty, nail artistry, 
            and jewellery under one signature name.
          </p>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic',
            fontSize:'clamp(0.95rem,2vw,1.08rem)', color:'rgba(240,230,220,0.6)', lineHeight:1.8, marginBottom:28 }}>
            Founded by Angel, Maison Deluxe is more than a beauty brand — it is a movement. 
            A space where you are seen, celebrated, and elevated. Every service is delivered 
            with intention, every product chosen with care, and every client treated as royalty.
          </p>

          {dividerLine}

          <div style={{ display:'flex', gap:32, flexWrap:'wrap' }}>
            {[['Beauty','@luxebeautyco___'],['Nails','@maisondeluxe_nails'],['Jewellery','@maisondeluxebyangel']].map(([k,v]) => (
              <div key={k}>
                <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.6rem',
                  letterSpacing:'0.2em', color:'rgba(196,149,106,0.5)', textTransform:'uppercase', marginBottom:4 }}>{k}</p>
                <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'0.95rem', color:'rgba(196,149,106,0.8)' }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── GALLERY PLACEHOLDER ─── */
function Gallery() {
  const ref = useRef(null);
  useEffect(() => {
    if (!window.gsap || !window.ScrollTrigger) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    const items = ref.current?.querySelectorAll('.gal-item');
    items?.forEach((el,i) => {
      window.gsap.fromTo(el, { opacity:0, scale:0.92 }, {
        opacity:1, scale:1, duration:0.6, delay:i*0.08,
        scrollTrigger:{ trigger:el, start:'top 90%' }
      });
    });
  }, []);

  const placeholders = [
    { label:'Bridal Makeup', cat:'Beauty', col:'rgba(139,26,26,0.08)' },
    { label:'Nail Art', cat:'Nails', col:'rgba(196,149,106,0.08)' },
    { label:'Fine Jewellery', cat:'Jewellery', col:'rgba(139,26,26,0.08)' },
    { label:'Lash Extensions', cat:'Beauty', col:'rgba(196,149,106,0.08)' },
    { label:'Gel Sets', cat:'Nails', col:'rgba(139,26,26,0.08)' },
    { label:'Bespoke Pieces', cat:'Jewellery', col:'rgba(196,149,106,0.08)' },
  ];

  return (
    <section id="gallery" ref={ref} style={{ padding:'100px clamp(20px,6vw,80px)', background:'var(--black)' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:60 }}>
          <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.68rem',
            letterSpacing:'0.35em', color:'rgba(196,149,106,0.55)', marginBottom:12, textTransform:'uppercase' }}>
            Our Work
          </p>
          <h2 style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'clamp(1.8rem,5vw,3rem)', ...roseText }}>
            Gallery
          </h2>
          {dividerLine}
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic',
            fontSize:'clamp(0.95rem,2.2vw,1.1rem)', color:'var(--text-muted)' }}>
            A glimpse into the world of Maison Deluxe. Follow us on Instagram for more.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16 }}>
          {placeholders.map((p, i) => (
            <div key={i} className="gal-item" style={{
              aspectRatio:'1 / 1.1',
              background:`linear-gradient(160deg,${p.col} 0%,rgba(26,18,14,0.95) 100%)`,
              border:'1px solid rgba(196,149,106,0.12)',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              gap:10, cursor:'pointer', transition:'border-color 0.3s',
              position:'relative', overflow:'hidden',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor='rgba(196,149,106,0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='rgba(196,149,106,0.12)'}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:1,
                background:'linear-gradient(90deg,transparent,rgba(196,149,106,0.3),transparent)' }} />
              <span style={{ fontSize:'1.8rem', color:'rgba(196,149,106,0.3)' }}>◈</span>
              <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.6rem',
                letterSpacing:'0.25em', color:'rgba(196,149,106,0.4)', textTransform:'uppercase' }}>{p.cat}</p>
              <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic',
                fontSize:'0.95rem', color:'rgba(240,230,220,0.4)', textAlign:'center', padding:'0 20px' }}>{p.label}</p>
              <p style={{ fontFamily:'Montserrat,sans-serif', fontSize:'0.55rem',
                letterSpacing:'0.2em', color:'rgba(196,149,106,0.3)', textTransform:'uppercase' }}>Photo coming soon</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center', marginTop:40 }}>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic',
            fontSize:'0.95rem', color:'var(--text-muted)', marginBottom:20 }}>
            Follow our Instagram accounts to see our latest work
          </p>
          <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
            {['maisondeluxebyangel','luxebeautyco___','maisondeluxe_nails'].map(h => (
              <a key={h} href={`https://instagram.com/${h}`} target="_blank" rel="noopener noreferrer"
                style={{
                  padding:'10px 22px', border:'1px solid rgba(196,149,106,0.3)',
                  fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.6rem',
                  letterSpacing:'0.18em', color:'rgba(196,149,106,0.7)',
                  textDecoration:'none', textTransform:'lowercase',
                  transition:'all 0.3s',
                }}
                onMouseEnter={e => { e.target.style.borderColor='rgba(196,149,106,0.6)'; e.target.style.color='#C4956A'; }}
                onMouseLeave={e => { e.target.style.borderColor='rgba(196,149,106,0.3)'; e.target.style.color='rgba(196,149,106,0.7)'; }}>
                @{h}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── BOOK NOW ─── */
function BookNow() {
  const ref = useRef(null);
  const [form, setForm] = useState({ name:'', email:'', service:'', date:'', message:'' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!window.gsap || !window.ScrollTrigger) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.gsap.fromTo(ref.current, { opacity:0, y:30 }, {
      opacity:1, y:0, duration:0.9,
      scrollTrigger:{ trigger:ref.current, start:'top 82%' }
    });
  }, []);

  const inputStyle = {
    width:'100%', padding:'14px 18px',
    background:'rgba(26,18,14,0.7)',
    border:'1px solid rgba(196,149,106,0.2)',
    color:'var(--text)', fontFamily:'Cormorant Garamond,serif', fontSize:'1rem',
    outline:'none', transition:'border-color 0.3s',
    appearance:'none',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
  };

  return (
    <section id="book-now" ref={ref} style={{
      padding:'100px clamp(20px,6vw,80px)',
      background:'linear-gradient(160deg,var(--surface) 0%,var(--black) 100%)',
    }}>
      <div style={{ maxWidth:700, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.68rem',
            letterSpacing:'0.35em', color:'rgba(196,149,106,0.55)', marginBottom:12, textTransform:'uppercase' }}>
            Reserve Your Experience
          </p>
          <h2 style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'clamp(1.8rem,5vw,3rem)', ...roseText }}>
            Book Now
          </h2>
          {dividerLine}
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic',
            fontSize:'clamp(0.95rem,2.2vw,1.1rem)', color:'var(--text-muted)' }}>
            Every appointment is a personalised luxury experience.
          </p>
        </div>

        {sent ? (
          <div style={{ textAlign:'center', padding:'60px 40px',
            border:'1px solid rgba(196,149,106,0.25)', background:'rgba(26,18,14,0.6)' }}>
            <span style={{ fontSize:'2rem', color:'rgba(196,149,106,0.7)', display:'block', marginBottom:20 }}>◆</span>
            <h3 style={{ fontFamily:'Cinzel,serif', fontSize:'1.4rem', ...roseText, marginBottom:14 }}>
              Request Received
            </h3>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic',
              fontSize:'1.05rem', color:'var(--text-muted)' }}>
              Thank you, {form.name}. We will be in touch shortly to confirm your booking.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
              <div>
                <label style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.6rem',
                  letterSpacing:'0.2em', color:'rgba(196,149,106,0.5)', textTransform:'uppercase',
                  display:'block', marginBottom:8 }}>Full Name</label>
                <input style={inputStyle} placeholder="Your name" value={form.name}
                  onChange={e => setForm({...form, name:e.target.value})} required
                  onFocus={e => e.target.style.borderColor='rgba(196,149,106,0.5)'}
                  onBlur={e => e.target.style.borderColor='rgba(196,149,106,0.2)'} />
              </div>
              <div>
                <label style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.6rem',
                  letterSpacing:'0.2em', color:'rgba(196,149,106,0.5)', textTransform:'uppercase',
                  display:'block', marginBottom:8 }}>Email</label>
                <input type="email" style={inputStyle} placeholder="your@email.com" value={form.email}
                  onChange={e => setForm({...form, email:e.target.value})} required
                  onFocus={e => e.target.style.borderColor='rgba(196,149,106,0.5)'}
                  onBlur={e => e.target.style.borderColor='rgba(196,149,106,0.2)'} />
              </div>
            </div>

            <div>
              <label style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.6rem',
                letterSpacing:'0.2em', color:'rgba(196,149,106,0.5)', textTransform:'uppercase',
                display:'block', marginBottom:8 }}>Service</label>
              <select style={inputStyle} value={form.service}
                onChange={e => setForm({...form, service:e.target.value})} required
                onFocus={e => e.target.style.borderColor='rgba(196,149,106,0.5)'}
                onBlur={e => e.target.style.borderColor='rgba(196,149,106,0.2)'}>
                <option value="" disabled>Select a service</option>
                <optgroup label="── Beauty ──">
                  <option>Full Face Makeup</option>
                  <option>Lash Extensions</option>
                  <option>Lash Lift & Tint</option>
                  <option>Brow Shaping & Tinting</option>
                  <option>Waxing & Threading</option>
                </optgroup>
                <optgroup label="── Nails ──">
                  <option>Gel Manicure</option>
                  <option>Acrylic Set</option>
                  <option>Nail Art & Design</option>
                  <option>BIAB</option>
                  <option>Pedicure</option>
                </optgroup>
                <optgroup label="── Jewellery ──">
                  <option>Jewellery Consultation</option>
                  <option>Custom / Bespoke Piece</option>
                  <option>Gift Curation</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.6rem',
                letterSpacing:'0.2em', color:'rgba(196,149,106,0.5)', textTransform:'uppercase',
                display:'block', marginBottom:8 }}>Preferred Date</label>
              <input type="date" style={{...inputStyle, colorScheme:'dark'}} value={form.date}
                onChange={e => setForm({...form, date:e.target.value})}
                onFocus={e => e.target.style.borderColor='rgba(196,149,106,0.5)'}
                onBlur={e => e.target.style.borderColor='rgba(196,149,106,0.2)'} />
            </div>

            <div>
              <label style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.6rem',
                letterSpacing:'0.2em', color:'rgba(196,149,106,0.5)', textTransform:'uppercase',
                display:'block', marginBottom:8 }}>Message</label>
              <textarea rows={4} style={{...inputStyle, resize:'vertical'}} placeholder="Any details or special requests..."
                value={form.message} onChange={e => setForm({...form, message:e.target.value})}
                onFocus={e => e.target.style.borderColor='rgba(196,149,106,0.5)'}
                onBlur={e => e.target.style.borderColor='rgba(196,149,106,0.2)'} />
            </div>

            <button type="submit" style={{
              padding:'16px 44px', background: sending ? 'rgba(196,149,106,0.3)' : roseGrad,
              color:'#1a0a00', fontFamily:'Montserrat,sans-serif', fontWeight:600,
              fontSize:'0.72rem', letterSpacing:'0.24em', textTransform:'uppercase',
              border:'none', cursor: sending ? 'wait' : 'pointer',
              boxShadow:'0 4px 28px rgba(196,149,106,0.3)',
              transition:'opacity 0.3s', marginTop:4,
            }}>
              {sending ? 'Sending...' : 'Request Booking'}
            </button>
          </form>
        )}
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
    window.gsap.fromTo(ref.current, { opacity:0, y:30 }, {
      opacity:1, y:0, duration:0.9,
      scrollTrigger:{ trigger:ref.current, start:'top 82%' }
    });
  }, []);

  return (
    <section id="contact" ref={ref} style={{ padding:'100px clamp(20px,6vw,80px)', background:'var(--black)' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.68rem',
            letterSpacing:'0.35em', color:'rgba(196,149,106,0.55)', marginBottom:12, textTransform:'uppercase' }}>
            Get In Touch
          </p>
          <h2 style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'clamp(1.8rem,5vw,3rem)', ...roseText }}>
            Contact
          </h2>
          {dividerLine}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:28 }}>
          {[
            { icon:'◈', label:'Instagram — Beauty', value:'@luxebeautyco___', href:'https://instagram.com/luxebeautyco___' },
            { icon:'◈', label:'Instagram — Nails', value:'@maisondeluxe_nails', href:'https://instagram.com/maisondeluxe_nails' },
            { icon:'◈', label:'Instagram — Jewellery', value:'@maisondeluxebyangel', href:'https://instagram.com/maisondeluxebyangel' },
            { icon:'◇', label:'WhatsApp', value:'Coming Soon', href:'#' },
          ].map((c, i) => (
            <a key={i} href={c.href} target={c.href !== '#' ? '_blank' : undefined}
              rel="noopener noreferrer"
              style={{
                display:'block', textDecoration:'none',
                background:'linear-gradient(160deg,rgba(26,18,14,0.9),rgba(16,12,10,0.95))',
                border:'1px solid rgba(196,149,106,0.15)',
                padding:'clamp(24px,3vw,36px)',
                transition:'border-color 0.3s, transform 0.3s',
                position:'relative', overflow:'hidden',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(196,149,106,0.4)'; e.currentTarget.style.transform='translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(196,149,106,0.15)'; e.currentTarget.style.transform='translateY(0)'; }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:1,
                background:'linear-gradient(90deg,transparent,rgba(196,149,106,0.3),transparent)' }} />
              <span style={{ fontSize:'1.2rem', color:'rgba(196,149,106,0.6)', display:'block', marginBottom:12 }}>{c.icon}</span>
              <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.6rem',
                letterSpacing:'0.2em', color:'rgba(196,149,106,0.5)', textTransform:'uppercase', marginBottom:6 }}>{c.label}</p>
              <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'1.05rem', color:'rgba(240,230,220,0.8)' }}>{c.value}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  return (
    <footer style={{
      padding:'48px clamp(20px,6vw,80px) 36px',
      background:'var(--surface)',
      borderTop:'1px solid rgba(196,149,106,0.12)',
    }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          flexWrap:'wrap', gap:24, marginBottom:32 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <img src="/logo.jpg" alt="Maison Deluxe" style={{
              width:36, height:36, borderRadius:'50%', objectFit:'cover',
              border:'1px solid rgba(196,149,106,0.3)',
            }} />
            <div>
              <span style={{ fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'1rem', ...roseText,
                display:'block' }}>MAISON DELUXE</span>
              <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.58rem',
                letterSpacing:'0.2em', color:'rgba(196,149,106,0.4)' }}>BEAUTY · JEWELLERY · NAILS</span>
            </div>
          </div>

          <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
            {['Services','About','Gallery','Book Now','Contact'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(' ','-')}`} style={{
                fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.62rem',
                letterSpacing:'0.18em', color:'rgba(240,230,220,0.45)',
                textDecoration:'none', textTransform:'uppercase',
                transition:'color 0.3s',
              }}
              onMouseEnter={e => e.target.style.color='#C4956A'}
              onMouseLeave={e => e.target.style.color='rgba(240,230,220,0.45)'}
              >{l}</a>
            ))}
          </div>
        </div>

        <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(196,149,106,0.2),transparent)', marginBottom:24 }} />

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          flexWrap:'wrap', gap:16 }}>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontStyle:'italic',
            fontSize:'0.9rem', color:'rgba(240,230,220,0.35)' }}>
            Elevate. Express. Empower.
          </p>
          <p style={{ fontFamily:'Montserrat,sans-serif', fontWeight:300, fontSize:'0.58rem',
            letterSpacing:'0.15em', color:'rgba(240,230,220,0.3)' }}>
            © {new Date().getFullYear()} Maison Deluxe. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─── APP ─── */
export default function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <Services />
      <About />
      <Gallery />
      <BookNow />
      <Contact />
      <Footer />
    </>
  );
}
