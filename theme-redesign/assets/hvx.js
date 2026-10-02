/* Havoc theme: keep spotlight price in sync with the chosen variant */
document.addEventListener('change',function(e){
  var s=e.target; if(!s.matches||!s.matches('[data-hvx-variant]'))return;
  var o=s.options[s.selectedIndex], box=s.closest('[data-hvx-spot]'); if(!box||!o)return;
  var p=box.querySelector('[data-hvx-price]'); if(p&&o.dataset.price)p.textContent=o.dataset.price;
});
