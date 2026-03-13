import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import worqitLogo from "../assets/worqit-logo.png";

// ————— STYLES ——————————————————————————————————————————————————————————————
const css = `
:root{
  --ink:#FFFFFF; --ink2:#FBFBFD; 
  --royal:#0055FF; --cyan:#00AAFF; --deep:#0033CC; /* Sharper Brand Blues to match logo */
  --gold:#F5A623; --gold-deep:#D97706;
  --grad:linear-gradient(135deg,#0055FF 0%,#00AAFF 100%);
  --gold-grad:linear-gradient(135deg,#F5A623 0%,#D97706 100%);
  --gtext:linear-gradient(135deg,#0055FF,#00AAFF);
  --silver:#6E6E73; --text:#1D1D1F; --line:rgba(0,0,0,.08);
}

#cur{width:10px;height:10px;border-radius:50%;position:fixed;pointer-events:none;z-index:9999;transition:transform .15s;background:var(--cyan);top:0;left:0;}
#ring{width:34px;height:34px;border:1.5px solid rgba(0,85,255,.35);border-radius:50%;position:fixed;pointer-events:none;z-index:9998;top:0;left:0;}

body::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:1;opacity:.05;
background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='.08'/%3E%3C/svg%3E");}

/* NAV */
nav.landing-nav{position:fixed;top:0;left:0;right:0;z-index:200;padding:0 72px;height:120px;display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.8);backdrop-filter:blur(24px);border-bottom:1px solid var(--line);}
.logo-link{display:flex;align-items:center;gap:0;text-decoration:none;}
.logo-link img{height:100px;width:auto;object-fit:contain;transform:translateY(5px);margin-right:-30px;}
.logo-text{font-size:36px;font-weight:800;background:var(--gtext);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-1.5px;line-height:1;}
.nav-links{display:flex;gap:36px;list-style:none;}
.nav-links a{color:var(--silver);font-size:14px;font-weight:600;text-decoration:none;transition:color .2s;cursor:none;}
.nav-links a:hover{color:var(--royal);}
.btn-primary-landing{background:var(--grad);color:#fff;border:none;padding:10px 24px;border-radius:8px;font:700 13px/1 'Plus Jakarta Sans',sans-serif;cursor:none;transition:all .2s;box-shadow:0 4px 20px rgba(0,85,255,.3);text-decoration:none;display:inline-block;}
.btn-primary-landing:hover{transform:translateY(-1px);box-shadow:0 8px 32px rgba(0,85,255,.5);}

/* HERO */
.hero{min-height:100vh;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:140px 72px 100px;text-align:center;overflow:hidden;background:var(--ink);}
.hero::before{content:'';position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:64px 64px;mask-image:radial-gradient(ellipse at center,black 20%,transparent 75%);}
.blob{position:absolute;border-radius:50%;pointer-events:none;filter:blur(110px);animation:drift 10s ease-in-out infinite;}
.blob-a{width:700px;height:700px;top:-200px;left:-200px;background:radial-gradient(circle,rgba(0,85,255,.12) 0%,transparent 70%);}
.blob-b{width:500px;height:500px;bottom:-100px;right:-100px;background:radial-gradient(circle,rgba(245,166,35,.08) 0%,transparent 70%);animation-delay:-5s;}
.blob-c{width:320px;height:320px;top:40%;left:55%;background:radial-gradient(circle,rgba(0,170,255,.1) 0%,transparent 70%);animation-delay:-2.5s;}
@keyframes drift{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(28px,-28px) scale(1.05);}66%{transform:translate(-18px,20px) scale(.97);}}

.hero-logo{margin-bottom:64px;position:relative;z-index:2;animation:up .8s ease both;display:flex;flex-direction:column;align-items:center;gap:0;}
.hero-logo img{height:500px;width:auto;object-fit:contain;filter:drop-shadow(0 20px 80px rgba(0,85,255,0.25));transform:translateX(20px);}
.hero-logo-text{font-size:80px;font-weight:800;background:var(--gtext);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-3px;margin-top:-150px;position:relative;z-index:3;}
.eyebrow{display:inline-flex;align-items:center;gap:10px;background:rgba(0,170,255,.1);border:1px solid rgba(0,170,255,.3);border-radius:100px;padding:8px 20px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--cyan);margin-bottom:28px;animation:up .8s .05s ease both;position:relative;z-index:2;}
.pip{width:6px;height:6px;background:var(--cyan);border-radius:50%;animation:blink 2s ease infinite;}
@keyframes blink{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.3;transform:scale(.7);}}
.hero-h1{font-weight:800;font-size:clamp(44px,7vw,92px);line-height:.95;letter-spacing:-3px;color:var(--text);margin-bottom:24px;position:relative;z-index:2;animation:up .8s .1s ease both;}
.grad-word{background:var(--gtext);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;display:inline-block;}
.hero-p{font-size:clamp(15px,1.6vw,19px);font-weight:500;color:var(--silver);line-height:1.8;max-width:560px;margin:0 auto 48px;position:relative;z-index:2;animation:up .8s .2s ease both;}
.hero-p strong{color:var(--text);font-weight:700;}
@keyframes up{from{opacity:0;transform:translateY(32px);}to{opacity:1;transform:none;}}

/* WAITLIST */
.wl-wrap{position:relative;z-index:2;animation:up .8s .3s ease both;}
.toggle{display:inline-flex;background:rgba(0,0,0,.04);border:1px solid var(--line);border-radius:100px;padding:4px;margin-bottom:20px;}
.tab{padding:10px 28px;border-radius:100px;border:none;font:600 13px/1 'Plus Jakarta Sans',sans-serif;cursor:none;color:var(--silver);background:transparent;transition:all .25s;}
.tab.on{background:var(--grad);color:#fff;box-shadow:0 4px 16px rgba(0,85,255,.4);}
.form-row{display:flex;gap:8px;max-width:500px;margin:0 auto;}
.wl-input{flex:1;background:#fff;border:1px solid var(--line);border-radius:10px;padding:15px 22px;font:500 14px/1 'Plus Jakarta Sans',sans-serif;color:var(--text);outline:none;transition:all .2s;}
.wl-input::placeholder{color:var(--silver);}
.wl-input:focus{border-color:rgba(0,170,255,.6);background:#fff;}
.wl-btn{background:var(--grad);color:#fff;border:none;padding:15px 28px;border-radius:10px;font:700 14px/1 'Plus Jakarta Sans',sans-serif;cursor:none;transition:all .2s;white-space:nowrap;box-shadow:0 4px 20px rgba(0,85,255,0.35);}
.wl-btn:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,85,255,0.55);}
.wl-ok{display:none;max-width:500px;margin:0 auto;background:rgba(0,85,255,.08);border:1px solid rgba(0,85,255,.3);border-radius:10px;padding:15px 24px;font-size:14px;color:var(--royal);font-weight:600;}
.proof{display:flex;align-items:center;justify-content:center;gap:18px;margin-top:28px;flex-wrap:wrap;font-size:13px;color:var(--silver);}
.faces{display:flex;}
.face{width:32px;height:32px;border-radius:50%;border:2px solid #fff;margin-left:-9px;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;font-weight:700;}
.face:first-child{margin-left:0;}
.proof strong{color:var(--text);}
.dot{width:3px;height:3px;background:var(--silver);border-radius:50%;opacity:.4;}

/* MARQUEE */
.mq{border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:20px 0;overflow:hidden;background:rgba(0,170,255,.03);position:relative;z-index:2;}
.mq-track{display:flex;gap:56px;width:max-content;animation:mq 30s linear infinite;}
.mq-track:hover{animation-play-state:paused;}
@keyframes mq{from{transform:translateX(0);}to{transform:translateX(-50%);}}
.mq-item{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--silver);opacity:.7;white-space:nowrap;display:flex;align-items:center;gap:10px;}
.mq-item::before{content:'';width:4px;height:4px;background:var(--cyan);border-radius:50%;}

/* NUMBERS */
.nums{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--line);position:relative;z-index:2;background:#fff;}
.nc{padding:52px 44px;border-right:1px solid var(--line);transition:background .3s;}
.nc:last-child{border-right:none;}
.nc:hover{background:rgba(0,170,255,.05);}
.nv{font-size:clamp(36px,4vw,56px);font-weight:800;color:var(--text);line-height:1;margin-bottom:10px;letter-spacing:-2px;}
.nv em{font-style:normal;background:var(--gtext);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.nl{font-size:13px;color:var(--silver);line-height:1.5;font-weight:500;}

/* SECTIONS */
.s{padding:120px 72px;position:relative;z-index:2;background:var(--ink);}
.s-tag{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:18px;background:var(--gtext);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.s-tag::before{content:'';width:24px;height:2px;background:var(--grad);border-radius:2px;flex-shrink:0;}
.s-h2{font-weight:800;font-size:clamp(32px,5vw,60px);color:var(--text);line-height:1.05;letter-spacing:-2px;margin-bottom:18px;}
.s-p{font-size:17px;color:var(--silver);line-height:1.75;max-width:520px;margin-bottom:64px;font-weight:500;}

/* PROBLEM */
.prob{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:20px;overflow:hidden;}
.pc{background:#fff;padding:52px 48px;position:relative;transition:background .3s;overflow:hidden;}
.pc::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--grad);transform:scaleX(0);transform-origin:left;transition:transform .4s;}
.pc:hover{background:rgba(0,85,255,.07);}
.pc:hover::before{transform:scaleX(1);}
.pc-n{font-size:58px;font-weight:800;line-height:1;margin-bottom:6px;letter-spacing:-2px;background:var(--gtext);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.pc-nl{font-size:11px;color:var(--silver);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:22px;font-weight:600;}
.pc-t{font-size:18px;font-weight:700;color:var(--text);margin-bottom:10px;}
.pc-p{font-size:14px;color:var(--silver);line-height:1.75;font-weight:500;}

/* HOW */
.how-bg{background:rgba(0,170,255,.025);}
.pipeline{display:grid;grid-template-columns:repeat(5,1fr);margin-top:72px;position:relative;}
.pipeline::before{content:'';position:absolute;top:40px;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,rgba(0,170,255,.3) 20%,rgba(0,170,255,.3) 80%,transparent);}
.ps{padding:0 20px;text-align:center;}
.pnode{width:80px;height:80px;border-radius:50%;margin:0 auto 28px;border:1px solid rgba(0,170,255,.3);background:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:24px;color:var(--royal);position:relative;z-index:1;transition:all .3s;}
.ps:hover .pnode{background:var(--grad);color:#fff;border-color:transparent;box-shadow:0 0 0 12px rgba(0,85,255,.1);}
.p-title{font-size:14px;font-weight:700;color:var(--text);margin-bottom:8px;}
.p-text{font-size:13px;color:var(--silver);line-height:1.7;font-weight:500;}

/* FEATURES */
.feat-grid{display:grid;grid-template-columns:1.4fr 1fr;grid-template-rows:auto auto;gap:16px;margin-top:72px;}
.fc{background:#fff;border:1px solid var(--line);border-radius:20px;padding:44px;position:relative;overflow:hidden;transition:all .3s;}
.fc:hover{border-color:rgba(0,85,255,.4);transform:translateY(-3px);box-shadow:0 16px 48px rgba(0,85,255,.15);}
.fc.big{grid-row:1/3;background:linear-gradient(135deg,rgba(0,85,255,.05),#fff);border-color:rgba(0,85,255,.25);}
.fi{width:52px;height:52px;border-radius:12px;background:rgba(0,85,255,.1);border:1px solid rgba(0,85,255,.25);display:flex;align-items:center;justify-content:center;margin-bottom:24px;}
.fi svg{width:24px;height:24px;stroke:var(--cyan);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;}
.ft{font-size:19px;font-weight:700;color:var(--text);margin-bottom:12px;}
.fp{font-size:14px;color:var(--silver);line-height:1.75;font-weight:500;}
.mock{margin-top:32px;}
.ai-lbl{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--silver);margin-bottom:14px;display:flex;align-items:center;gap:8px;}
.ai-lbl::before,.ai-lbl::after{content:'';flex:1;height:1px;background:var(--line);}
.mc-landing{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:14px;margin-bottom:10px;transition:all .2s;box-shadow:0 2px 8px rgba(0,0,0,0.02);}
.mc-landing:hover{background:#fff;border-color:rgba(0,85,255,.3);box-shadow:0 8px 24px rgba(0,85,255,0.1);}
.ava-landing{width:40px;height:40px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:#fff;flex-shrink:0;}
.mi-landing{flex:1;}
.mn-landing{font-size:13px;font-weight:700;color:var(--text);}
.mr-landing{font-size:11px;color:var(--silver);margin-top:3px;font-weight:500;}
.ms-landing{background:var(--grad);color:#fff;font-size:13px;font-weight:800;padding:5px 12px;border-radius:6px;box-shadow:0 4px 12px rgba(26,111,232,0.3);}

/* AUDIENCE */
.aud{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:72px;}
.ac{border-radius:24px;padding:52px 44px;border:1px solid var(--line);background:#fff;}
.ac.hir{background:linear-gradient(135deg,rgba(0,85,255,.08),#fff);border-color:rgba(0,85,255,.3);}
.ac.can{background:linear-gradient(135deg,rgba(0,170,255,.04),#fff);border-color:rgba(0,170,255,.2);}
.at{display:inline-block;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:5px 14px;border-radius:6px;margin-bottom:28px;background:rgba(0,170,255,.2);color:var(--cyan);border:1px solid rgba(0,170,255,.3);}
.ah3{font-size:30px;font-weight:800;color:var(--text);margin-bottom:14px;line-height:1.15;letter-spacing:-1px;}
.ap{font-size:15px;color:var(--silver);line-height:1.7;margin-bottom:32px;font-weight:500;}
.al-landing{list-style:none;}
.al-landing li{display:flex;align-items:flex-start;gap:12px;font-size:14px;color:var(--text);margin-bottom:14px;line-height:1.5;font-weight:600;}
.al-landing li::before{content:'';width:18px;height:18px;border-radius:50%;flex-shrink:0;margin-top:1px;background:linear-gradient(135deg,#0055FF,#00AAFF);-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18'%3E%3Cpath d='M3 9l4 4L15 5' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") center/cover;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18'%3E%3Cpath d='M3 9l4 4L15 5' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") center/cover;}

/* FOUNDING */
.found{background:linear-gradient(135deg,rgba(245,166,35,.1),rgba(255,255,255,.9));border:1px solid rgba(245,166,35,.25);border-radius:28px;padding:80px;text-align:center;position:relative;overflow:hidden;}
.found::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(245,166,35,.1),transparent 60%);pointer-events:none;}
.fb{display:inline-flex;align-items:center;gap:8px;background:rgba(245,166,35,.1);border:1px solid rgba(245,166,35,.25);border-radius:100px;padding:7px 20px;margin-bottom:28px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold-deep);border:1px solid rgba(245,166,35,.3);}
.fh2{font-size:clamp(32px,4.5vw,54px);font-weight:800;color:var(--text);line-height:1.05;letter-spacing:-2px;margin-bottom:16px;}
.fp2{font-size:17px;color:var(--silver);max-width:560px;margin:0 auto 52px;line-height:1.7;font-weight:500;}
.perks{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:52px;text-align:left;}
.perk{background:#fff;border:1px solid var(--line);border-radius:16px;padding:28px 24px;transition:all .3s;box-shadow:0 4px 12px rgba(0,0,0,0.02);}
.perk:hover{border-color:rgba(245,166,35,.4);background:#fff;}
.perk-n{font-size:38px;font-weight:800;line-height:1;margin-bottom:8px;letter-spacing:-1px;background:var(--gold-grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.perk-t{font-size:14px;font-weight:700;color:var(--text);margin-bottom:6px;}
.perk-p{font-size:13px;color:var(--silver);line-height:1.65;font-weight:500;}
.spots{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:36px;}
.slbl{font-size:13px;color:var(--silver);font-weight:600;}
.slbl strong{color:var(--gold);}
.strack{width:180px;height:4px;background:rgba(0,0,0,.05);border-radius:100px;overflow:hidden;}
.sfill{width:23%;height:100%;background:var(--gold-grad);border-radius:100px;animation:fill 2s 1s ease both;}
@keyframes fill{from{width:0;}to{width:23%;}}
.f-form{display:flex;gap:8px;max-width:460px;margin:0 auto;}
.f-input{flex:1;background:#fff;border:1px solid var(--line);border-radius:10px;padding:15px 20px;font:500 14px/1 'Plus Jakarta Sans',sans-serif;color:var(--text);outline:none;transition:border .2s;}
.f-input::placeholder{color:var(--silver);}
.f-input:focus{border-color:rgba(245,166,35,.6);}
.f-btn{background:var(--gold-grad);color:#fff;border:none;padding:15px 24px;border-radius:10px;font:700 14px/1 'Plus Jakarta Sans',sans-serif;cursor:none;transition:all .2s;white-space:nowrap;box-shadow:0 4px 20px rgba(245,166,35,0.35);}
.f-btn:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(245,166,35,0.5);}
.f-ok{display:none;max-width:460px;margin:16px auto 0;background:rgba(245,166,35,.08);border:1px solid rgba(245,166,35,.3);border-radius:10px;padding:14px 24px;font-size:14px;color:var(--gold-deep);font-weight:600;}

/* FOOTER */
footer.landing-footer{border-top:1px solid var(--line);padding:44px 72px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:20px;position:relative;z-index:2;background:#fff;}
.f-logo img{height:30px;width:auto;object-fit:contain;filter:brightness(1);}
.f-nav{display:flex;gap:28px;list-style:none;}
.f-nav a{color:var(--silver);font-size:13px;text-decoration:none;transition:color .2s;cursor:none;font-weight:600;}
.f-nav a:hover{color:var(--royal);}
.copy{font-size:13px;color:var(--silver);font-weight:500;}

/* REVEAL */
.rv{opacity:0;transform:translateY(36px);transition:all .7s ease;}
.rv.in{opacity:1;transform:none;}

@media(max-width:900px){
  nav.landing-nav{padding:0 24px;} .nav-links{display:none;}
  .hero,.s{padding:100px 24px 80px;}
  .nums{grid-template-columns:1fr 1fr;}
  .nc:nth-child(2){border-right:none;}
  .prob,.feat-grid,.aud,.perks{grid-template-columns:1fr;}
  .fc.big{grid-row:auto;}
  .pipeline{grid-template-columns:1fr 1fr;gap:32px;}
  .pipeline::before{display:none;}
  .found{padding:48px 24px;}
  .f-form,.form-row{flex-direction:column;}
  footer.landing-footer{flex-direction:column;text-align:center;padding:36px 24px;}
  .hero-logo img{height:300px;transform:translateX(10px);}
  .hero-logo-text{font-size:50px;margin-top:-90px;}
}
`;

export default function Landing() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('hirer');
  const [wlEmail, setWlEmail] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [wlSubmitted, setWlSubmitted] = useState(false);
  const [fSubmitted, setFSubmitted] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    // Cursor logic
    const cur = document.getElementById('cur');
    const ring = document.getElementById('ring');
    let mx = 0, my = 0, rx = 0, ry = 0;

    const moveCursor = (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (cur) {
        cur.style.left = mx - 5 + 'px';
        cur.style.top = my - 5 + 'px';
      }
    };

    const animateRing = () => {
      rx += (mx - rx - 17) * 0.1;
      ry += (my - ry - 17) * 0.1;
      if (ring) {
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
      }
      requestAnimationFrame(animateRing);
    };

    const handleMouseEnter = () => { if (cur) cur.style.transform = 'scale(2.5)'; };
    const handleMouseLeave = () => { if (cur) cur.style.transform = 'scale(1)'; };

    window.addEventListener('mousemove', moveCursor);
    animateRing();

    const interactables = document.querySelectorAll('a,button,input');
    interactables.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    // Intersection Observer
    const obs = new IntersectionObserver(entries => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('in'), i * 60);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.rv').forEach(el => obs.observe(el));

    return () => {
      style.remove();
      window.removeEventListener('mousemove', moveCursor);
    };
  }, []);

  const submitToFirebase = async (email, type, source) => {
    try {
      await addDoc(collection(db, source), {
        email,
        type,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("Firebase Error:", err);
    }
  };

  const handleWlSubmit = async () => {
    if (!wlEmail || !wlEmail.includes('@')) return;
    await submitToFirebase(wlEmail, tab, 'waitlist');
    setWlSubmitted(true);
  };

  const handleFSubmit = async () => {
    if (!fEmail || !fEmail.includes('@')) return;
    await submitToFirebase(fEmail, 'company', 'founding100');
    setFSubmitted(true);
  };

  return (
    <div style={{ background: '#FFFFFF', cursor: 'none' }}>
      <div id="cur"></div>
      <div id="ring"></div>

      {/* NAV */}
      <nav className="landing-nav">
        <Link className="logo-link" to="/">
          <img src={worqitLogo} alt="Worqit" />
          <span className="logo-text">Worqit</span>
        </Link>
        <ul className="nav-links">
          <li><a href="#problem">The Problem</a></li>
          <li><a href="#how">How It Works</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#founding">For Companies</a></li>
        </ul>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/login" className="btn-primary-landing" style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--text)' }}>Sign In</Link>
          <button className="btn-primary-landing" onClick={() => document.getElementById('waitlist').scrollIntoView({ behavior: 'smooth' })}>Join Waitlist</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="waitlist">
        <div className="blob blob-a"></div>
        <div className="blob blob-b"></div>
        <div className="blob blob-c"></div>

        <div className="hero-logo">
          <img src={worqitLogo} alt="Worqit" />
          <span className="hero-logo-text">Worqit</span>
        </div>

        <div className="eyebrow"><div className="pip"></div>Early Access &mdash; Limited Spots Available</div>

        <h1 className="hero-h1">The Future of<br /><span className="grad-word">Hiring</span> is Here.</h1>

        <p className="hero-p">
          Stop drowning in irrelevant applications.<br />
          <strong>Scroll through real talent. Connect instantly. Hire with confidence.</strong><br />
          One complete platform &mdash; from discovery to fully onboarded hire.
        </p>

        <div className="wl-wrap">
          <div className="toggle">
            <button className={`tab ${tab === 'hirer' ? 'on' : ''}`} onClick={() => setTab('hirer')}>I am Hiring</button>
            <button className={`tab ${tab === 'candidate' ? 'on' : ''}`} onClick={() => setTab('candidate')}>I am Job Seeking</button>
          </div>
          {!wlSubmitted ? (
            <div className="form-row">
              <input
                className="wl-input"
                type="email"
                placeholder={tab === 'hirer' ? "Enter your company email address" : "Enter your personal email address"}
                value={wlEmail}
                onChange={(e) => setWlEmail(e.target.value)}
              />
              <button className="wl-btn" onClick={handleWlSubmit}>Get Early Access</button>
            </div>
          ) : (
            <div className="wl-ok" style={{ display: 'block' }}>Your spot is reserved. We will be in touch with your early access details shortly.</div>
          )}
        </div>

        <div className="proof">
          <div className="faces">
            <div className="face">A</div><div className="face">P</div><div className="face">R</div><div className="face">K</div><div className="face">S</div>
          </div>
          <span><strong>2,400+</strong> professionals on the waitlist</span>
          <div className="dot"></div>
          <span>UAE &middot; India &middot; UK &middot; and beyond</span>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="mq">
        <div className="mq-track">
          <span className="mq-item">Discover Talent</span><span className="mq-item">Real-Time Chat</span><span className="mq-item">AI Shortlisting</span><span className="mq-item">Built-In Video Interviews</span><span className="mq-item">HR Document Hub</span><span className="mq-item">UAE Compliance</span><span className="mq-item">Global Hiring</span><span className="mq-item">Zero Fragmentation</span>
          <span className="mq-item">Discover Talent</span><span className="mq-item">Real-Time Chat</span><span className="mq-item">AI Shortlisting</span><span className="mq-item">Built-In Video Interviews</span><span className="mq-item">HR Document Hub</span><span className="mq-item">UAE Compliance</span><span className="mq-item">Global Hiring</span><span className="mq-item">Zero Fragmentation</span>
        </div>
      </div>

      {/* NUMBERS */}
      <div className="nums">
        <div className="nc rv"><div className="nv">250<em>+</em></div><div className="nl">Average applications per corporate job posting</div></div>
        <div className="nc rv"><div className="nv">2<em>%</em></div><div className="nl">Average response rate for job seekers today</div></div>
        <div className="nc rv"><div className="nv">47<em>d</em></div><div className="nl">Average days to fill an open role globally</div></div>
        <div className="nc rv"><div className="nv">1<em>&nbsp;platform</em></div><div className="nl">From discovery to fully onboarded hire</div></div>
      </div>

      {/* PROBLEM */}
      <section className="s" id="problem">
        <div className="rv">
          <div className="s-tag">The Problem</div>
          <h2 className="s-h2">Hiring is broken.<br />For everyone.</h2>
          <p className="s-p">The current system fails hirers and candidates equally. Noise, fragmentation, and wasted time have become the norm.</p>
        </div>
        <div className="prob rv">
          <div className="pc"><div className="pc-n">73%</div><div className="pc-nl">of applicants never hear back</div><div className="pc-t">Candidates are invisible</div><div className="pc-p">You apply to hundreds of roles and hear nothing. Your profile sits unseen in a pile with hundreds of others.</div></div>
          <div className="pc"><div className="pc-n">250+</div><div className="pc-nl">applications per posting</div><div className="pc-t">Hirers are overwhelmed</div><div className="pc-p">Every job post floods your inbox with irrelevant applications. Weeks of screening to find one qualified person.</div></div>
          <div className="pc"><div className="pc-n">5+</div><div className="pc-nl">separate tools per hire</div><div className="pc-t">The pipeline is fragmented</div><div className="pc-p">Source on one platform. Interview on another. Documents over email. Onboard on a completely different system.</div></div>
          <div className="pc"><div className="pc-n">47%</div><div className="pc-nl">of UAE hires require visas</div><div className="pc-t">International hiring is chaos</div><div className="pc-p">Work permits, visa documents, compliance paperwork &mdash; cross-border hiring in the UAE is entirely manual.</div></div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="s how-bg" id="how">
        <div className="rv" style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
          <div className="s-tag">How It Works</div>
          <h2 className="s-h2">From first scroll<br />to signed contract.</h2>
          <p className="s-p" style={{ margin: '0 auto' }}>One platform. One seamless pipeline. No switching tools midway through your hire.</p>
        </div>
        <div className="pipeline">
          <div className="ps rv"><div className="pnode">1</div><div className="p-title">Build Your Profile</div><div className="p-text">Upload your resume. Skills and experience extracted automatically.</div></div>
          <div className="ps rv"><div className="pnode">2</div><div className="p-title">Get Discovered</div><div className="p-text">Hirers scroll a curated feed. Best matches rise to the top.</div></div>
          <div className="ps rv"><div className="pnode">3</div><div className="p-title">Connect and Chat</div><div className="p-text">Hirer requests. You approve. Communicate directly inside Worqit.</div></div>
          <div className="ps rv"><div className="pnode">4</div><div className="p-title">Interview Inside</div><div className="p-text">Schedule and run video interviews without leaving the platform.</div></div>
          <div className="ps rv"><div className="pnode">5</div><div className="p-title">Onboard Seamlessly</div><div className="p-text">Submit all documents. UAE compliance templates built in.</div></div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="s" id="features">
        <div className="rv">
          <div className="s-tag">Features</div>
          <h2 className="s-h2">Everything you need.<br />Nothing you do not.</h2>
        </div>
        <div className="feat-grid">
          <div className="fc big rv">
            <div className="fi"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg></div>
            <div className="ft">AI Shortlisting Engine</div>
            <div className="fp">Our matching system analyses every candidate profile against your requirements &mdash; skills, experience, location, and availability. Your top candidates surface instantly.</div>
            <div className="mock">
              <div className="ai-lbl">Top Matches for You</div>
              <div className="mc-landing"><div className="ava-landing">AR</div><div className="mi-landing"><div className="mn-landing">Ahmed Al-Rashidi</div><div className="mr-landing">Senior Product Manager &middot; Dubai, UAE</div></div><div className="ms-landing">97</div></div>
              <div className="mc-landing"><div className="ava-landing">PS</div><div className="mi-landing"><div className="mn-landing">Priya Sharma</div><div className="mr-landing">Full Stack Developer &middot; Relocating to UAE</div></div><div className="ms-landing">94</div></div>
              <div className="mc-landing"><div className="ava-landing">MC</div><div className="mi-landing"><div className="mn-landing">Marcus Chen</div><div className="mr-landing">Data Scientist &middot; Available Immediately</div></div><div className="ms-landing">91</div></div>
            </div>
          </div>
          <div className="fc rv"><div className="fi"><svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg></div><div className="ft">Scroll-Based Candidate Feed</div><div className="fp">Browse professionals through a curated feed. Discover talent at your own pace &mdash; no keyword searches, no noise.</div></div>
          <div className="fc rv"><div className="fi"><svg viewBox="0 0 24 24"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14" /><rect x="1" y="6" width="15" height="12" rx="2" /></svg></div><div className="ft">Built-In Video Interviews</div><div className="fp">Schedule and conduct interviews without leaving Worqit. Works with external tools too.</div></div>
          <div className="fc rv"><div className="fi"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg></div><div className="ft">HR Document Hub</div><div className="fp">UAE visa documents, work permits, certifications &mdash; all tracked in one compliance-ready place.</div></div>
          <div className="fc rv"><div className="fi"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg></div><div className="ft">Real-Time Messaging</div><div className="fp">Direct professional communication between hirers and candidates. Clean. Contextual. No chaos.</div></div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="s">
        <div className="rv" style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
          <div className="s-tag">Who It Is For</div>
          <h2 className="s-h2">Built for both sides<br />of the equation.</h2>
        </div>
        <div className="aud">
          <div className="ac hir rv">
            <div className="at">For Companies and Hirers</div>
            <h3 className="ah3">Find exceptional<br />talent. Fast.</h3>
            <p className="ap">Stop drowning in applications. Start discovering people genuinely worth hiring.</p>
            <ul className="al-landing">
              <li>Scroll through curated, pre-structured candidate profiles</li>
              <li>AI surfaces your strongest matches automatically</li>
              <li>Connect, chat, and interview inside one platform</li>
              <li>Manage international onboarding documents with ease</li>
              <li>Run targeted job ads to precisely the right audience</li>
            </ul>
          </div>
          <div className="ac can rv">
            <div className="at">For Job Seekers</div>
            <h3 className="ah3">Stop applying.<br />Start being found.</h3>
            <p className="ap">Build your profile once. Let the right companies discover and come to you.</p>
            <ul className="al-landing">
              <li>Upload your resume and your profile builds itself</li>
              <li>Get discovered by companies actively looking to hire</li>
              <li>Full control over who can contact you</li>
              <li>Interview and onboard without switching platforms</li>
              <li>Always completely free for job seekers &mdash; no exceptions</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FOUNDING 100 */}
      <section className="s" id="founding">
        <div className="found rv">
          <div className="fb">Exclusive &mdash; Founding Partner Programme</div>
          <h2 className="fh2">Join the Founding<br />100 Companies</h2>
          <p className="fp2">Be among the first 100 companies on Worqit. Six months completely free, a lifetime discount, and a Founding Partner badge on your profile.</p>
          <div className="perks">
            <div className="perk"><div className="perk-n">6</div><div className="perk-t">Months Free Access</div><div className="perk-p">Full platform &mdash; unlimited browsing, AI shortlisting, video interviews, and HR document hub.</div></div>
            <div className="perk"><div className="perk-n">50%</div><div className="perk-t">Lifetime Discount</div><div className="perk-p">Founding Partners pay half the standard rate permanently, regardless of future pricing.</div></div>
            <div className="perk"><div className="perk-n">100</div><div className="perk-t">Companies Maximum</div><div className="perk-p">Strictly limited. Once all 100 spots are filled, the Founding Partner offer closes permanently.</div></div>
          </div>
          <div className="spots">
            <div className="slbl"><strong>23 of 100</strong> spots claimed</div>
            <div className="strack"><div className="sfill"></div></div>
            <div className="slbl">77 remaining</div>
          </div>
          {!fSubmitted ? (
            <div className="f-form">
              <input
                className="f-input"
                type="email"
                placeholder="Your company email address"
                value={fEmail}
                onChange={(e) => setFEmail(e.target.value)}
              />
              <button className="f-btn" onClick={handleFSubmit}>Claim Your Spot</button>
            </div>
          ) : (
            <div className="f-ok" style={{ display: 'block' }}>Your spot is reserved. Our team will reach out within 24 hours to confirm your Founding Partner status.</div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="logo-link">
          <img src={worqitLogo} alt="Worqit" style={{ height: '80px' }} />
          <span className="logo-text" style={{ fontSize: '32px' }}>Worqit</span>
        </div>
        <ul className="f-nav">
          <li><a href="#problem">The Problem</a></li>
          <li><a href="#how">How It Works</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#founding">For Companies</a></li>
          <li><a href="#">Privacy Policy</a></li>
        </ul>
        <div className="copy">&copy; 2026 Worqit. All rights reserved.</div>
      </footer>
    </div>
  );
}
