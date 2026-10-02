/* Havoc redesign v2: progressive enhancement only. Page works fully without this file. */
(function(){
  var d=document,root=d.documentElement;
  if(!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  root.classList.add('hvx-anim');
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px',threshold:.08});
  function scan(){d.querySelectorAll('.hvx-reveal:not(.is-in)').forEach(function(el){
    var r=el.getBoundingClientRect(); if(r.top<window.innerHeight){el.classList.add('is-in');} else io.observe(el);});}
  if(d.readyState!=='loading')scan();else d.addEventListener('DOMContentLoaded',scan);
  d.addEventListener('shopify:section:load',scan);
})();
/* Spotlight: keep price in sync with chosen variant */
document.addEventListener('change',function(e){
  var s=e.target; if(!s.matches||!s.matches('[data-hvx-variant]'))return;
  var o=s.options[s.selectedIndex], box=s.closest('[data-hvx-spot]'); if(!box||!o)return;
  var p=box.querySelector('[data-hvx-price]'); if(p&&o.dataset.price)p.textContent=o.dataset.price;
});
