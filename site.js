const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const header=document.querySelector('#site-header'),menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#site-navigation');
const mobileNav=matchMedia('(max-width: 900px)'),pageLocks=new Set();let lockedY=0;
function lockPage(owner){if(!pageLocks.size){lockedY=scrollY;document.body.style.setProperty('--locked-y',`-${lockedY}px`);document.documentElement.classList.add('page-locked')}pageLocks.add(owner)}
function unlockPage(owner){if(!pageLocks.delete(owner)||pageLocks.size)return;document.documentElement.classList.remove('page-locked');document.body.style.removeProperty('--locked-y');window.scrollTo({top:lockedY,behavior:'instant'})}
function closeMenu(){header.classList.remove('menu-open');document.body.classList.remove('menu-is-open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Открыть меню');document.querySelectorAll('main,.site-footer').forEach(el=>el.inert=false);unlockPage('menu')}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';if(!open){closeMenu();return}header.classList.add('menu-open');document.body.classList.add('menu-is-open');menu.setAttribute('aria-expanded','true');menu.setAttribute('aria-label','Закрыть меню');document.querySelectorAll('main,.site-footer').forEach(el=>el.inert=true);nav.scrollTop=0;lockPage('menu')});
mobileNav.addEventListener('change',()=>{closeMenu();nav.querySelectorAll('details').forEach(d=>d.open=false)});
new ResizeObserver(()=>document.documentElement.style.setProperty('--header-height',`${header.getBoundingClientRect().height}px`)).observe(header);
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{closeMenu();nav.querySelectorAll('details').forEach(d=>d.open=false)}));
document.addEventListener('click',e=>{if(!header.contains(e.target)){closeMenu();nav.querySelectorAll('details').forEach(d=>d.open=false)}});
document.addEventListener('keydown',e=>{document.documentElement.classList.add('keyboard-nav');if(e.key==='Escape'){if(header.classList.contains('menu-open')){closeMenu();menu.focus()}nav.querySelectorAll('details').forEach(d=>d.open=false)}});
header.addEventListener('keydown',e=>{if(e.key!=='Tab'||!header.classList.contains('menu-open'))return;const items=[...header.querySelectorAll('a,button,summary')].filter(el=>el.getClientRects().length&&!el.closest('details:not([open]) .mega-menu,details:not([open]) .nav-dropdown'));const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}});
document.addEventListener('pointerdown',()=>document.documentElement.classList.remove('keyboard-nav'));
function updateHeader(){header.classList.toggle('scrolled',scrollY>30)}addEventListener('scroll',updateHeader,{passive:true});updateHeader();
function animateOnce(el,keyframes,options){if(reduced.matches||document.documentElement.classList.contains('keyboard-nav'))return;el.getAnimations().forEach(a=>a.cancel());el.animate(keyframes,options)}
nav.querySelectorAll('.nav-group').forEach(group=>group.addEventListener('toggle',()=>{
if(!group.open)return;
nav.querySelectorAll('.nav-group').forEach(other=>{if(other!==group)other.open=false});
const panel=group.querySelector('.mega-menu,.nav-dropdown');
if(panel&&!mobileNav.matches)animateOnce(panel,[{opacity:0,transform:'translateY(-5px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'cubic-bezier(.23,1,.32,1)'});
}));
const dialog=document.querySelector('#callback'),form=document.querySelector('#callback-form'),view=document.querySelector('.callback-form-view'),success=document.querySelector('.callback-success');let trigger=null;
const clientName=document.querySelector('#client-name'),clientPhone=document.querySelector('#client-phone'),clientService=document.querySelector('#client-service');
function clearErrors(){document.querySelectorAll('.field-error').forEach(e=>e.textContent='');form.querySelectorAll('[aria-invalid]').forEach(e=>e.removeAttribute('aria-invalid'))}
function showForm(){view.hidden=false;success.hidden=true;clearErrors()}
document.querySelectorAll('[data-callback]').forEach(button=>button.addEventListener('click',e=>{e.preventDefault();trigger=button;closeMenu();nav.querySelectorAll('details').forEach(d=>d.open=false);showForm();clientService.value=button.dataset.service||'consult';document.querySelector('#callback-title').textContent=button.dataset.offer?'Заявка по акции':'Обратный звонок';const context=document.querySelector('.callback-context');context.hidden=!button.dataset.offer;context.textContent=button.dataset.offer||'';document.dispatchEvent(new Event('callback:open'));dialog.showModal();lockPage('callback');dialog.scrollTop=0;if(e.detail)animateOnce(dialog,[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.23,1,.32,1)'});(mobileNav.matches?document.querySelector('#callback-title'):clientName).focus({preventScroll:true})}));
dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{unlockPage('callback');form.reset();clearErrors();const target=trigger?.getClientRects().length?trigger:menu.getClientRects().length?menu:document.querySelector('[data-promo-open]');target?.focus({preventScroll:true})});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
form.addEventListener('submit',e=>{e.preventDefault();clearErrors();const badName=clientName.value.trim().length<2,badPhone=!/^[78]\d{10}$/.test(clientPhone.value.replace(/\D/g,''));
if(badName){document.querySelector('#name-error').textContent='Введите имя — не менее двух символов.';clientName.setAttribute('aria-invalid','true')}
if(badPhone){document.querySelector('#phone-error').textContent='Введите 11 цифр, начиная с +7 или 8.';clientPhone.setAttribute('aria-invalid','true')}
if(badName||badPhone){(badName?clientName:clientPhone).focus();return}
// Explicit demo: no fetch, form post, analytics, storage or transmission.
view.hidden=true;success.hidden=false;success.focus();form.reset()});
document.querySelector('[data-reset-form]').addEventListener('click',()=>{showForm();clientName.focus()});
const cards=[...document.querySelectorAll('.portfolio-section .work-card')];
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',e=>{const category=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});let visible=0;cards.forEach(card=>{card.hidden=category!=='all'&&card.dataset.category!==category;if(!card.hidden){visible++;if(e.detail)animateOnce(card,[{opacity:.4,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:250,easing:'cubic-bezier(.23,1,.32,1)'})}});document.querySelector('.filter-status').textContent='Показано работ: '+visible}));
document.querySelector('.live-reviews')?.addEventListener('toggle',e=>{if(e.target.open){const iframe=e.target.querySelector('iframe');if(!iframe.getAttribute('src'))iframe.src=iframe.dataset.src}});
document.querySelectorAll('.faq-item').forEach(item=>{let pointer=false;item.querySelector('summary').addEventListener('pointerdown',()=>pointer=true);item.querySelector('summary').addEventListener('keydown',()=>pointer=false);item.addEventListener('toggle',()=>{if(item.open&&pointer)animateOnce(item.querySelector('.faq-answer'),[{opacity:0},{opacity:1}],{duration:180,easing:'ease-out'});pointer=false})});
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){animateOnce(e.target,[{opacity:.4,transform:'translateY(16px)'},{opacity:1,transform:'none'}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});observer.unobserve(e.target)}}),{threshold:.15});document.querySelectorAll('.about-copy,.home-page .work-grid').forEach(el=>observer.observe(el));const videos=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)e.target.pause()}));document.querySelectorAll('video').forEach(video=>videos.observe(video))}
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(v=>v.pause())});
reduced.addEventListener('change',()=>{if(reduced.matches)document.getAnimations().forEach(a=>a.cancel())});
