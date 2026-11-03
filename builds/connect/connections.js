(()=>{'use strict';
const link=document.getElementById('minglekind-enter')||document.getElementById('openheart-enter');
if(!link)return;
const mingle=link.id==='minglekind-enter',name=mingle?'MingleKind':'OpenHeart';
const status=document.getElementById('connection-status'),refresh=document.getElementById('refresh-connection');
let busy=false;
async function resolve(){
 if(busy)return;busy=true;if(refresh)refresh.disabled=true;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{
  const response=await fetch('https://legitpdfufile-wq.github.io/nova-web/',{cache:'no-store',signal:controller.signal});
  if(!response.ok)throw Error('Directory unavailable');
  const dom=new DOMParser().parseFromString(await response.text(),'text/html');
  const a=[...dom.querySelectorAll('a[href]')].find(a=>a.textContent.toLowerCase().includes(name.toLowerCase()));
  if(!a)throw Error('No current app address');
  const u=new URL(a.getAttribute('href'));
  if(u.protocol!=='https:'||u.username||u.password||!(/^[a-z0-9-]+\.trycloudflare\.com$/.test(u.hostname)))throw Error('Unrecognized app address');
  if(mingle){for(const item of document.querySelectorAll('[data-minglekind-path]')){const path=item.getAttribute('data-minglekind-path');if(['/join','/login','/preview'].includes(path))item.href=new URL(path,u.origin).href}}
  else link.href=u.href;
  if(status)status.textContent=mingle?'Current app link loaded. Free normal use · 18+ · No invitation or ChatGPT account.':'Current directory link loaded. OpenHeart asks for 18+ confirmation. The link is not a live-availability guarantee.';
 }catch{if(status)status.textContent='The directory could not refresh. The last known app links remain available; if they fail, try again later or contact Joshua.'}
 finally{clearTimeout(timer);busy=false;if(refresh)refresh.disabled=false}
}
refresh?.addEventListener('click',resolve);resolve();
})();
