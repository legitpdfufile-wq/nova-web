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
// Community links follow the existing NOVA-maintained directory when it changes.
fetch('../',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Directory unavailable');return r.text();}).then(html=>{
 const doc=new DOMParser().parseFromString(html,'text/html');
 for(const [name,id] of [['openheart','openheart-link']]){const a=[...doc.querySelectorAll('a[href]')].find(a=>a.textContent.toLowerCase().includes(name));if(!a)return;const u=new URL(a.href,location.href);if(u.protocol==='https:'&&!u.username&&!u.password&&u.hostname!=='localhost'&&!/^127\./.test(u.hostname)){document.getElementById(id).href=u.href;}}
}).catch(()=>{});
})();
