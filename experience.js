/* Touch scrolling stays native. Mouse dragging is an additional input path. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  function rail(track, pages, changed = () => {}) {
    const cards = [...track.children];
    let pending = false, current = 0, width = track.clientWidth, pointer = null, blockClickUntil = 0;
    const offset = i => Math.min(cards[i].offsetLeft - cards[0].offsetLeft, track.scrollWidth - track.clientWidth);
    function selected() {
      let nearest = 0, distance = Infinity;
      cards.forEach((card, i) => { const d = Math.abs(offset(i) - track.scrollLeft); if (d < distance) { distance = d; nearest = i; } });
      pages.forEach((button, i) => button.setAttribute('aria-pressed', String(i === nearest)));
      if (nearest !== current) { current = nearest; changed(current); }
      pending = false;
    }
    function go(i, instant = false) {
      const target = Math.max(0, Math.min(i, cards.length - 1));
      track.scrollTo({left: offset(target), behavior: reduce.matches || instant ? 'instant' : 'smooth'});
    }
    pages.forEach((button, i) => button.addEventListener('click', e => go(i, e.detail === 0)));
    track.addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(selected); } }, {passive: true});
    track.addEventListener('keydown', e => {
      if (e.target !== track || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      go(e.key === 'Home' ? 0 : e.key === 'End' ? cards.length - 1 : current + (e.key === 'ArrowRight' ? 1 : -1), true);
    });
    track.querySelectorAll('img,a').forEach(element => element.draggable = false);
    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || !e.isPrimary || e.button !== 0 || e.ctrlKey || e.metaKey || pointer) return;
      if (track.scrollWidth <= track.clientWidth + 1) return;
      pointer = {id:e.pointerId, x:e.clientX, y:e.clientY, left:track.scrollLeft, index:current, time:performance.now(), dragging:false};
    });
    track.addEventListener('pointermove', e => {
      if (!pointer || e.pointerId !== pointer.id) return;
      const dx=e.clientX-pointer.x, dy=e.clientY-pointer.y;
      if (!pointer.dragging) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { pointer=null; return; }
        if (Math.abs(dx) < 8) return;
        pointer.dragging=true; track.setPointerCapture(e.pointerId);
        track.style.scrollSnapType='none'; track.classList.add('is-dragging');
      }
      e.preventDefault();
      track.scrollTo({left:pointer.left-dx,behavior:'instant'});
    });
    function release(e) {
      if (!pointer || e.pointerId !== pointer.id) return;
      const drag=pointer; pointer=null;
      if (!drag.dragging) return;
      const distance=e.clientX-drag.x, velocity=Math.abs(distance)/Math.max(1,performance.now()-drag.time);
      const moved=Math.abs(distance)>Math.min(90,width*.18) || (Math.abs(distance)>18 && velocity>.35);
      const target=e.type==='pointercancel'?current:moved?drag.index+(distance<0?1:-1):drag.index;
      blockClickUntil=performance.now()+350;
      track.classList.remove('is-dragging'); track.style.removeProperty('scroll-snap-type');
      if (track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId);
      go(target);
    }
    track.addEventListener('pointerup',release);
    track.addEventListener('pointercancel',release);
    function cancelDrag(){
      if(!pointer)return;
      const drag=pointer;pointer=null;
      track.classList.remove('is-dragging');track.style.removeProperty('scroll-snap-type');
      if(track.hasPointerCapture(drag.id))track.releasePointerCapture(drag.id);
      if(drag.dragging){blockClickUntil=performance.now()+350;go(current,true);}
    }
    track.addEventListener('lostpointercapture',cancelDrag);
    window.addEventListener('blur',cancelDrag);
    track.addEventListener('pointerleave', e => { if(pointer&&!pointer.dragging&&e.pointerType==='mouse')pointer=null; });
    track.addEventListener('click', e => { if(performance.now()<blockClickUntil){e.preventDefault();e.stopImmediatePropagation();} },true);
    new ResizeObserver(() => { if(width!==track.clientWidth){width=track.clientWidth;go(current,true);} selected(); }).observe(track);
    changed(0); selected();
    return {go};
  }
  document.querySelectorAll('.catalog-carousel').forEach(shell => {
    rail(shell.querySelector('.catalog-grid'), [...shell.querySelectorAll('[data-catalog-page]')]);
  });
  const hero=document.querySelector('.hero-track');
  if(hero){
    const panels=[...hero.children], link=document.querySelector('.hero-controls .choose');
    rail(hero,[...document.querySelectorAll('[data-hero-page]')],i=>{
      panels.forEach((panel,j)=>{panel.inert=i!==j;panel.setAttribute('aria-hidden',String(i!==j));});
      link.href=panels[i].dataset.serviceUrl;
      link.setAttribute('aria-label','Об услуге: '+panels[i].dataset.serviceName);
    });
    let announce;
    hero.addEventListener('scroll',()=>{
      clearTimeout(announce);
      announce=setTimeout(()=>{const panel=panels.find(p=>!p.inert);document.querySelector('.hero-status').textContent=panel?.getAttribute('aria-label')||'';},180);
    },{passive:true});
  }

  const card = document.querySelector('#demo-promo');
  let prompted = false;
  try { prompted = sessionStorage.getItem('detroit-promo-dismissed') === '1'; } catch { /* Storage is optional. */ }
  function hide(remember = true) {
    card.hidden = true;
    document.querySelectorAll('[data-promo-open]').forEach(b => b.setAttribute('aria-expanded','false'));
    if (remember) { prompted = true; try { sessionStorage.setItem('detroit-promo-dismissed','1'); } catch {} }
  }
  function show(manual = false) {
    if (document.querySelector('dialog[open]') || document.body.classList.contains('menu-is-open')) return;
    prompted = true; card.hidden = false;
    try { sessionStorage.setItem('detroit-promo-dismissed','1'); } catch {}
    document.querySelectorAll('[data-promo-open]').forEach(b => b.setAttribute('aria-expanded','true'));
    if (!reduce.matches) card.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.22,1,.36,1)'});
    if (manual) card.querySelector('.promo-close').focus({preventScroll:true});
  }
  document.querySelectorAll('[data-promo-open]').forEach(button => {
    button.setAttribute('aria-controls','demo-promo'); button.setAttribute('aria-expanded','false');
    button.addEventListener('click', () => { if (typeof closeMenu === 'function') closeMenu(); document.querySelectorAll('#site-navigation details').forEach(d=>d.open=false); show(true); });
  });
  function returnFocus() { const toggle=document.querySelector('.menu-toggle'); (toggle.getClientRects().length?toggle:document.querySelector('.nav-promo')).focus({preventScroll:true}); }
  card.querySelector('.promo-close').addEventListener('click', () => { hide(); returnFocus(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !card.hidden) { hide(); returnFocus(); } });
  document.addEventListener('callback:open', () => hide());
  const services = document.querySelector('.home-page #services');
  if (services) {
    let frame = false;
    addEventListener('scroll', () => {
      if (prompted || frame) return;
      frame = true;
      requestAnimationFrame(() => {
        frame = false;
        if (services.getBoundingClientRect().bottom < innerHeight * .4 && !document.documentElement.classList.contains('keyboard-nav')) show();
      });
    }, {passive: true});
  }
})();
