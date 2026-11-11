(()=>{'use strict';if(window.top!==window)return;
const script=document.currentScript,base=new URL('.',script.src),links={"creator":{"demo":"https://legitpdfufile-wq.github.io/nova-web/builds/creator/","store":"https://payhip.com/mynxai"},"crew":{"demo":"https://legitpdfufile-wq.github.io/nova-web/builds/crew/","store":"https://payhip.com/mynxai"},"doctor":{"demo":"https://legitpdfufile-wq.github.io/nova-web/builds/doctor/","store":"https://payhip.com/b/6W9QN"},"film":{"demo":"https://legitpdfufile-wq.github.io/nova-web/builds/film/","store":"https://payhip.com/b/BEm6T"},"forge":{"demo":"https://legitpdfufile-wq.github.io/nova-web/builds/forge/","store":"https://payhip.com/b/o5AE0"},"game":{"demo":"https://legitpdfufile-wq.github.io/nova-web/builds/game/","store":"https://payhip.com/mynxai"},"hive":{"demo":"https://legitpdfufile-wq.github.io/nova-web/builds/hive/","store":"https://payhip.com/b/ByKl7"},"minglekind":{"demo":"https://legitpdfufile-wq.github.io/nova-web/builds/minglekind/","store":"https://payhip.com/mynxai"},"novasafe":{"demo":"https://legitpdfufile-wq.github.io/nova-web/builds/novasafe/","store":"https://payhip.com/b/xTzWq"},"openheart":{"demo":"https://legitpdfufile-wq.github.io/nova-web/builds/openheart/","store":"https://payhip.com/mynxai"},"profitpilot":{"demo":"https://legitpdfufile-wq.github.io/nova-web/builds/profitpilot/","store":"https://payhip.com/b/I85OA"},"reader":{"demo":"https://legitpdfufile-wq.github.io/nova-web/builds/reader/","store":"https://payhip.com/mynxai"},"rook":{"demo":"https://legitpdfufile-wq.github.io/nova-web/builds/rook/","store":"https://payhip.com/b/ILGWR"},"seller":{"demo":"https://legitpdfufile-wq.github.io/nova-web/builds/seller/","store":"https://payhip.com/mynxai"},"studio":{"demo":"https://legitpdfufile-wq.github.io/nova-web/builds/studio/","store":"https://payhip.com/b/BEm6T"},"vault":{"demo":"https://legitpdfufile-wq.github.io/nova-web/builds/vault/","store":"https://payhip.com/b/LcxBJ"},"collection":{"demo":"https://legitpdfufile-wq.github.io/nova-web/builds/","store":"https://payhip.com/mynxai"},"company":{"demo":"https://legitpdfufile-wq.github.io/nova-web/company/","store":"https://payhip.com/mynxai"},"haven":{"demo":"https://legitpdfufile-wq.github.io/nova-web/haven/","store":"https://payhip.com/b/f5OEM"}};
let key=location.pathname.split('/').filter(Boolean),at=key.indexOf('builds');key=at>=0?(key[at+1]||'collection'):(key[0]||'collection');
if(key==='play.html')key='game';
const item=links[key]||links.collection;
function boot(){
const box=document.createElement('section');box.className='mynx-share-links';box.setAttribute('aria-label','Demo and store links');
const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('share-links.css',base).href;document.head.append(style);
const title=document.createElement('h2');title.textContent='Try it. Share it. Make it yours.';
const actions=document.createElement('div');
for(const [label,url] of [['Open demo',item.demo],['Visit the store',item.store]]){const a=document.createElement('a');a.href=url;a.textContent=label+' ↗';actions.append(a)}
const copy=document.createElement('button');copy.type='button';copy.textContent='Copy demo + store links';actions.append(copy);
const status=document.createElement('p');status.setAttribute('role','status');
const manual=document.createElement('textarea');manual.readOnly=true;manual.hidden=true;manual.setAttribute('aria-label','Demo and store links to copy');
const text=(key==='minglekind'?'MingleKind · Free normal use · Adults 18+':key==='openheart'?'OpenHeart · Free normal use · Adults 18+':document.title.split(' · ')[0])+'\nDemo: '+item.demo+'\nStore: '+item.store;
manual.value=text;
async function copyBoth(){try{await navigator.clipboard.writeText(text);status.textContent='Both links copied. Ready for your post, reel caption or message.'}catch{manual.hidden=false;manual.focus();manual.select();status.textContent='Copy both links from the selected text below.'}}
copy.addEventListener('click',copyBoth);
document.addEventListener('click',e=>{if(e.target.closest('#share')){e.preventDefault();e.stopImmediatePropagation();copyBoth()}},true);
box.append(title,actions,manual,status);
if(key==='minglekind'||key==='openheart'){const note=document.createElement('p');note.textContent='This community is free to use. The store is for optional MYNX products; no purchase is needed to join.';box.append(note)}
const footer=document.querySelector('body > footer');if(footer)footer.before(box);else document.body.append(box);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
