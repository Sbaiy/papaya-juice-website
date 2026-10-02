// Presentation only. Ordering, QR verification and reclamations stay in menu.html.
(() => {
  const root=document.body;
  function syncView(){
    const categories=document.getElementById('categoriesView');
    root.classList.toggle('pj-category-open',categories.style.display==='none');
    const target=document.getElementById('pjCategoryCount'), text=document.querySelectorAll('#catsGrid .cat-card').length+' catégories';
    if(target.textContent!==text)target.textContent=text;
  }
  new MutationObserver(syncView).observe(document.getElementById('categoriesView'),{attributes:true,attributeFilter:['style'],childList:true,subtree:true});
  document.getElementById('pjDiscover').addEventListener('click',()=>document.getElementById('catsGrid').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));
  syncView();
  // Preserve the original language controls after removing the drawer trigger.
  function placeLanguages(){const row=document.getElementById('papaya-lang'),actions=document.querySelector('.pj-header-actions');if(row&&actions){row.setAttribute('aria-label','Langue du menu');if(row.parentElement!==actions)actions.appendChild(row);}}
  new MutationObserver(placeLanguages).observe(document.getElementById('mainHeader'),{childList:true});placeLanguages();
  // Gentle pointer tilt; transforms never participate in price/order calculations.
  const motion=matchMedia('(prefers-reduced-motion: reduce)'), fine=matchMedia('(hover: hover) and (pointer: fine)');
  let card=null,frame=0,px=0,py=0;
  function clear(){if(frame)cancelAnimationFrame(frame);frame=0;if(card){card.style.removeProperty('--pj-rx');card.style.removeProperty('--pj-ry');}card=null;}
  document.addEventListener('pointermove',e=>{
    if(motion.matches||!fine.matches||e.pointerType!=='mouse')return;
    const next=e.target.closest('.cat-card,.product-card');if(next!==card){clear();card=next;}if(!card)return;
    px=e.clientX;py=e.clientY;if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(!card)return;const r=card.getBoundingClientRect();card.style.setProperty('--pj-rx',((.5-(py-r.top)/r.height)*5)+'deg');card.style.setProperty('--pj-ry',(((px-r.left)/r.width-.5)*7)+'deg');});
  },{passive:true});
  document.addEventListener('pointerout',e=>{if(card&&!card.contains(e.relatedTarget))clear();},{passive:true});
  motion.addEventListener('change',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
})();
