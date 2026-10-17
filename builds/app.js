(() => { 'use strict';
const cards=[...document.querySelectorAll('.product')];
document.querySelector('[data-filter="all"] span').textContent=cards.length;
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 const filter=button.dataset.filter;let count=0;
 cards.forEach(card=>{card.hidden=filter!=='all'&&!card.dataset.category.split(' ').includes(filter);if(!card.hidden)count++;});
 document.querySelectorAll('[data-filter]').forEach(b=>{const selected=b===button;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
 document.querySelector('#filter-status').textContent=count+' products shown';
}));
const answer=document.querySelector('#guide-answer');
function recommend(message){
 const q=message.toLowerCase();let heading,description,links=[];
 if(/\b(price|cost|buy|purchase|pay|19|refund)\b/.test(q)){
 heading='Explore first. Check the offer before checkout.';
 description='Studio Brain has an existing $19 Payhip listing. Read the product page for what the software includes and the Windows setup requirements. The game and organizer showcases are free. Payhip displays the final checkout price and seller terms.';
 links=[['Studio details & purchase information','studio/'],['Open the store','https://payhip.com/mynxai']];
 }else if(/\b(privacy|private|data|offline|account|login)\b/.test(q)){
 heading='Choose how you want to use it.';
 description='This guide runs locally and sends no messages to an AI service. The creator showcase saves records in this browser; export a backup before clearing browser data. Jumping Jack needs no account. Studio runs on Windows with local models; external community apps have their own accounts and policies.';
 links=[['Try the creator workspace','creator/'],['Read Studio requirements','studio/#requirements']];
 }else if(/\b(mac|iphone|android|linux|phone|mobile)\b/.test(q)){
 heading='Start with a browser experience.';
 description='Studio Brain is a Windows download. Nightshift Creator Desk is available to try in your browser. Jumping Jack currently needs a keyboard. A Mac or phone edition of the Studio desktop software is not offered here.';
 links=[['Try Nightshift Creator Desk','creator/'],['Studio system requirements','studio/#requirements']];
 }else if(/\b(film|movie|slideshow|photo|video)\b/.test(q)){
 heading='Your next stop: Studio Film Desk.';
 description='Make and download a real film from your photos, captions and optional soundtrack. Try 720p WebM free in your browser; the local Windows edition adds MP4 and full HD.';
 links=[['Make a film','film/'],['Explore Studio Brain','studio/']];
 }else if(/\b(game|play|jump|fun|platformer)\b/.test(q)){
 heading='Your next stop: Jumping Jack.';
 description='A quick keyboard platformer. Move with the arrow keys or A/D, jump with Space, and reach the beacon. Play free, or download the standalone game.';
 links=[['Play Jumping Jack','game/'],['See the studio behind the showcase','studio/']];
 }else if(/\b(organiz|content|paid|request|desk|client|plan|track)/.test(q)){
 heading='Your next stop: Nightshift Creator Desk.';
 description='Plan content, record client briefs, track paid requests, and export your records. The showcase is a complete local browser workspace; it does not collect payments or send messages to clients.';
 links=[['Open the workspace','creator/'],['Explore Studio Brain','studio/']];
 }else if(/\b(connect|meet|people|community|friend|dating|relationship)/.test(q)){
 heading='Find your kind of connection.';
 description='Explore MingleKind for a kinder community experience, or OpenHeart for an adults-only connection space. These are separate public apps with their own current access rules.';
 links=[['Explore MingleKind','https://minglekind-community.fvf557cynh.chatgpt.site'],['Explore OpenHeart · 18+','https://furniture-consistently-tobacco-sub.trycloudflare.com']];
 }else if(/\b(law|recorder|recording|record|constitution|legal)\b/.test(q)){
 heading='Your next stop: Johnny Law.';
 description='Open the free Constitution reader and recorder. Review the app’s own guidance before recording or relying on information.';
 links=[['Open Johnny Law','https://johnny-law-recorder.mik-luvin-1308.chatgpt.site']];
 }else if(/\b(build|studio|website|create|windows|software|ai|model|code)/.test(q)){
 heading='Your next stop: Studio Brain.';
 description='Local Windows creation software with editable project files and browser checks. Start by trying its finished website, organizer, and game outputs, then read what is included and what setup is required.';
 links=[['Meet Studio Brain','studio/'],['Try the interactive website sample','../studio-demo/']];
 }else{
 heading='Let’s stay with what is in the collection.';
 description='I match requests to this collection. Try “build websites,” “organize content,” “play a game,” “meet people,” or “recorder.” You can also browse every product directly.';
 links=[['Explore everything','#collection']];
 }
 answer.replaceChildren();const h=document.createElement('h3');h.textContent=heading;answer.append(h);const p=document.createElement('p');p.textContent=description;answer.append(p);
 links.forEach(([label,href])=>{const a=document.createElement('a');a.className='text-link';a.href=href;a.textContent=label+' ↗';if(href.startsWith('https:'))a.rel='noopener noreferrer';answer.append(a,document.createElement('br'));});
 if(links[0][1]==='#collection')answer.querySelector('a').addEventListener('click',()=>document.querySelector('[data-filter="all"]').click());
}
document.querySelector('#guide-form').addEventListener('submit',event=>{event.preventDefault();const input=document.querySelector('#guide-input');if(input.value.trim())recommend(input.value.trim());});
document.querySelectorAll('[data-ask]').forEach(button=>button.addEventListener('click',()=>{document.querySelector('#guide-input').value=button.dataset.ask;recommend(button.dataset.ask);}));
// Community links follow the existing NOVA-maintained directory when it changes.
fetch('../',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Directory unavailable');return r.text();}).then(html=>{
 const doc=new DOMParser().parseFromString(html,'text/html');
 for(const [name,id] of [['openheart','openheart-link']]){const a=[...doc.querySelectorAll('a[href]')].find(a=>a.textContent.toLowerCase().includes(name));if(!a)return;const u=new URL(a.href,location.href);if(u.protocol==='https:'&&!u.username&&!u.password&&u.hostname!=='localhost'&&!/^127\./.test(u.hostname)){document.getElementById(id).href=u.href;}}
}).catch(()=>{});
})();
