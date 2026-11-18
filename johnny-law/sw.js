const CACHE="johnny-law-v5-2-zip-rights-20261117";
const FILES=["./","index.html","style.css","app.js","evidence-store.js","traffic-rights.js","zip-states.json","manifest.webmanifest","johnny-law-icon.svg"].map(p=>new URL(p,self.registration.scope).href);
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith("johnny-law-")&&x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{const key=new URL(e.request.url);key.search="";if(e.request.method!=="GET"||!FILES.includes(key.href))return;
e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(key.href,copy))}return r}).catch(()=>caches.match(key.href).then(r=>r||(e.request.mode==="navigate"?caches.match(new URL("index.html",self.registration.scope).href):Response.error()))));});
