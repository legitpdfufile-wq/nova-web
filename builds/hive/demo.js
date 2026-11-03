/* MYNX Hive Command public tool. No owner connection, uploads or stored credentials. */
(function(root){'use strict';
function text(v,max=500){return typeof v==='string'?v.slice(0,max):''}
function normalizeReport(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Open a Hive JSON object.');
 let rows=[];let supported=false;
 for(const kind of ['links','events','commands','devices']){
  if(value[kind]!==undefined){supported=true;if(!Array.isArray(value[kind]))throw Error(kind+' must be a list.');if(value[kind].length>10000)throw Error('This viewer accepts up to 10,000 rows.');
   for(const r of value[kind]){if(!r||typeof r!=='object'||Array.isArray(r))continue;
    const stamp=r.stamp??r.created??r.last_seen;rows.push({kind,device:text(r.device||r.device_id,120),detail:text(r.path||r.kind||r.action||r.type,4096),status:text(r.status,80),stamp:typeof stamp==='number'&&Number.isFinite(stamp)?stamp:null});}
  }
 }
 if(!supported)throw Error('Expected a Hive export containing links, events, commands or devices.');
 if(rows.length>10000)throw Error('This viewer accepts up to 10,000 rows in total.');
 return rows;
}
if(typeof module!=='undefined'&&module.exports){module.exports={normalizeReport};return}
const $=id=>document.getElementById(id), el=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=String(value);return n};
let active=false,timer=null,inflight=false,started=0,checks=0,events=[],rows=[],controller=null;
function event(kind,result){events.unshift({stamp:Date.now()/1000,kind,result});events=events.slice(0,200);const parent=$('signal-events');parent.replaceChildren();for(const e of events){const tr=el('tr');tr.append(el('td',new Date(e.stamp*1000).toLocaleTimeString()),el('td',e.kind),el('td',e.result));parent.append(tr)}}
async function check(){
 if(!active||inflight)return;inflight=true;controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000),begin=performance.now();
 try{const response=await fetch('signal.txt?t='+Date.now(),{cache:'no-store',credentials:'omit',signal:controller.signal});if(!response.ok||(await response.text()).trim()!=='MYNX_HIVE_PUBLIC_SIGNAL_1')throw Error('Signal file unavailable');
  if(!active)return;const latency=Math.round(performance.now()-begin);checks++;$('signal-state').textContent='Responding';$('signal-latency').textContent=latency+' ms';$('signal-count').textContent=checks;$('signal-message').textContent='Signal received from this hosted page. Next check in about 5 seconds.';event('page_response',latency+' ms');
 }catch(error){if(active){$('signal-state').textContent='Unavailable';$('signal-message').textContent='This check failed. Your browser or the page connection may be unavailable; no device failure is inferred.';event('page_response_failed',error.name==='AbortError'?'Timed out after 8 seconds':'Request failed')}}
 finally{clearTimeout(timeout);inflight=false;controller=null}
}
$('start').addEventListener('click',()=>{if(active)return;active=true;started=performance.now();$('start').disabled=true;$('pause').disabled=false;event('monitor_started','This browser page only');check();timer=setInterval(check,5000)});
$('pause').addEventListener('click',()=>{active=false;clearInterval(timer);controller?.abort();$('start').disabled=false;$('pause').disabled=true;$('signal-state').textContent='Paused';$('signal-message').textContent='Monitoring paused. This session remains available to export.';event('monitor_paused','No further connection checks')});
setInterval(()=>{if(active)$('signal-elapsed').textContent=Math.floor((performance.now()-started)/1000)+'s'},1000);
document.addEventListener('visibilitychange',()=>{if(active)event('page_visibility',document.visibilityState)});
$('export').addEventListener('click',()=>{const value={product:'MYNX Hive Command browser monitor',scope:'This page signal; no Wi-Fi devices or system telemetry',events:events.map(e=>({stamp:e.stamp,kind:e.kind,status:e.result})),successful_checks:checks,exported_at:new Date().toISOString()};const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),a=el('a');a.href=url;a.download='Hive-browser-session.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
function renderReport(){const q=$('filter').value.toLowerCase(),parent=$('report-rows'),table=el('table'),head=el('tr');for(const name of ['Record','Device','Path / event','Snapshot time'])head.append(el('th',name));table.append(head);for(const r of rows.filter(r=>[r.kind,r.device,r.detail,r.status].join(' ').toLowerCase().includes(q)).slice(0,500)){const tr=el('tr');tr.append(el('td',r.kind+(r.status?' · '+r.status:'')),el('td',r.device||'—'),el('td',r.detail||'—'),el('td',r.stamp?new Date(r.stamp*1000).toLocaleString():'Not supplied'));table.append(tr)}parent.replaceChildren(table);const summary=$('report-summary');summary.replaceChildren();for(const kind of ['links','events','commands','devices']){const div=el('div');div.append(el('span','Imported '+kind),el('b',rows.filter(r=>r.kind===kind).length));summary.append(div)}}
$('report').addEventListener('change',async()=>{const file=$('report').files[0];if(!file)return;try{if(file.size>5*1024*1024)throw Error('Choose a JSON file smaller than 5 MB.');rows=normalizeReport(JSON.parse(await file.text()));renderReport();$('report-message').textContent=file.name+' · '+rows.length+' imported snapshot rows. Displaying up to 500 matching rows. Nothing uploaded.'}catch(error){rows=[];$('report-rows').replaceChildren();$('report-summary').replaceChildren();$('report-message').textContent=error.message}});
$('filter').addEventListener('input',renderReport);
$('clear-report').addEventListener('click',()=>{rows=[];$('report').value='';$('filter').value='';$('report-rows').replaceChildren();$('report-summary').replaceChildren();$('report-message').textContent='Report cleared from this page.'});
})(typeof window!=='undefined'?window:globalThis);
