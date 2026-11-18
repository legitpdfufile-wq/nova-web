/* Binary evidence is stored separately from the existing jl4 case/settings keys. */
window.JohnnyEvidence=(()=>{
 let promise;
 function ready(){return promise||=new Promise((resolve,reject)=>{const req=indexedDB.open('johnny-law-evidence',1);req.onupgradeneeded=()=>{req.result.createObjectStore('media');req.result.createObjectStore('chunks');req.result.createObjectStore('pending')};req.onsuccess=()=>resolve(req.result);req.onerror=()=>{promise=null;reject(req.error)};req.onblocked=()=>reject(Error('Close other Johnny tabs to unlock evidence storage'))})}
 async function run(store,mode,action){const db=await ready();return new Promise((resolve,reject)=>{const tx=db.transaction(store,mode);const req=action(tx.objectStore(store));tx.oncomplete=()=>resolve(req?.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Evidence transaction aborted'))})}
 const put=(id,value)=>run('media','readwrite',s=>s.put(value,id));
 const get=id=>run('media','readonly',s=>s.get(id));
 const begin=(id,value)=>run('pending','readwrite',s=>s.put(value,id));
 const chunk=(id,n,blob)=>run('chunks','readwrite',s=>s.put(blob,id+':'+String(n).padStart(8,'0')));
 async function recover(id){const meta=await run('pending','readonly',s=>s.get(id));if(!meta)return null;const db=await ready();const parts=await new Promise((resolve,reject)=>{const tx=db.transaction('chunks');const req=tx.objectStore('chunks').openCursor(IDBKeyRange.bound(id+':',id+':\uffff'));const out=[];req.onsuccess=()=>{const cursor=req.result;if(cursor){out.push(cursor.value);cursor.continue()}else resolve(out)};req.onerror=()=>reject(req.error)});return parts.length?{blob:new Blob(parts,{type:meta.mime||'audio/webm'}),interrupted:true}:null}
 async function finish(id,blob){const digest=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());const value={blob,sha256:Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('')};await put(id,value);await run('pending','readwrite',s=>s.delete(id));await run('chunks','readwrite',s=>s.delete(IDBKeyRange.bound(id+':',id+':\uffff')));return value}
 async function clear(){for(const store of ['media','chunks','pending'])await run(store,'readwrite',s=>s.clear())}
 return {ready,put,get,begin,chunk,finish,recover,clear};
})();
