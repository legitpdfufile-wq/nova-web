(() => { 'use strict';
const cards=[...document.querySelectorAll('.product')];
document.querySelector('[data-filter="all"] span').textContent=cards.length;
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 const filter=button.dataset.filter;let count=0;
 cards.forEach(card=>{card.hidden=filter!=='all'&&!card.dataset.category.split(' ').includes(filter);if(!card.hidden)count++;});
 document.querySelectorAll('[data-filter]').forEach(b=>{const selected=b===button;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
 document.querySelector('#filter-status').textContent=count+' products shown';
}));
document.querySelector('#meet-nova').addEventListener('click',()=>document.dispatchEvent(new Event('nova-open')));
})();
