/* Progressive enhancement: service navigation and an original-photo comparison. */
document.querySelectorAll('.header .nav-group').forEach(group=>group.addEventListener('toggle',()=>{if(group.open)document.querySelectorAll('.header .nav-group').forEach(other=>{if(other!==group)other.open=false})}));
document.querySelectorAll('.comparison').forEach(comparison=>{
 const input=comparison.querySelector('input'),before=comparison.querySelector('.compare-before'),handle=comparison.querySelector('.compare-handle');
 handle.innerHTML='<svg viewBox="0 0 32 24"><path d="m12 5-7 7 7 7m8-14 7 7-7 7"/></svg>';
 const update=()=>{before.style.clipPath=`inset(0 ${100-Number(input.value)}% 0 0)`;handle.style.left=input.value+'%';input.setAttribute('aria-valuetext',`${input.value}% изображения до обработки`)};
 input.addEventListener('input',update);update();
});
