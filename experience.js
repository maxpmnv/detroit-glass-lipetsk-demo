/* Browser scrolling owns both axes: no touch interception or drag simulation. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.catalog-carousel').forEach(shell => {
    const track = shell.querySelector('.catalog-grid');
    const cards = [...track.children];
    const pages = [...shell.querySelectorAll('[data-catalog-page]')];
    let pending = false;
    function selected() {
      const left = track.getBoundingClientRect().left + parseFloat(getComputedStyle(track).paddingLeft);
      let nearest = 0, distance = Infinity;
      cards.forEach((card, i) => { const d = Math.abs(card.getBoundingClientRect().left - left); if (d < distance) { distance = d; nearest = i; } });
      pages.forEach((button, i) => button.setAttribute('aria-pressed', String(i === nearest)));
      pending = false;
    }
    function go(i, instant = false) {
      const card = cards[Math.max(0, Math.min(i, cards.length - 1))];
      const left = card.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft - parseFloat(getComputedStyle(track).paddingLeft);
      track.scrollTo({left, behavior: reduce.matches || instant ? 'instant' : 'smooth'});
    }
    pages.forEach((button, i) => button.addEventListener('click', e => go(i, e.detail === 0)));
    track.addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(selected); } }, {passive: true});
    track.addEventListener('keydown', e => {
      if (e.target !== track || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const current = pages.findIndex(b => b.getAttribute('aria-pressed') === 'true');
      go(e.key === 'Home' ? 0 : e.key === 'End' ? cards.length - 1 : current + (e.key === 'ArrowRight' ? 1 : -1), true);
    });
    new ResizeObserver(selected).observe(track);
  });

  const card = document.querySelector('#demo-promo');
  const launcher = document.querySelector('.promo-launcher');
  let prompted = false;
  try { prompted = sessionStorage.getItem('detroit-promo-dismissed') === '1'; } catch { /* Storage is optional. */ }
  function hide(remember = true) {
    card.hidden = true; launcher.hidden = false;
    document.querySelectorAll('[data-promo-open]').forEach(b => b.setAttribute('aria-expanded','false'));
    if (remember) { prompted = true; try { sessionStorage.setItem('detroit-promo-dismissed','1'); } catch {} }
  }
  function show(manual = false) {
    if (document.querySelector('dialog[open]') || document.body.classList.contains('menu-is-open')) return;
    prompted = true; card.hidden = false; launcher.hidden = true;
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
