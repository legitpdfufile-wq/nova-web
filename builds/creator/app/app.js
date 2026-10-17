/* Studio reusable components; actual HTML selectors, no test data. */
const STUDIO_RECORD_CONFIG = {"version": "actual-record-components-v1", "storageKey": "studio-workspace-557d65c5b9f1eda69230", "collections": [{"entity": "content", "container": "#content-list", "rowClass": "record", "create": "#content-form > button:nth-of-type(1)", "primary": "#content-title", "fields": [{"selector": "#content-title", "key": "content-title", "label": "Title", "type": "text", "required": true}, {"selector": "#content-channel", "key": "content-channel", "label": "Channel", "type": "text", "required": false}, {"selector": "#content-due-date", "key": "content-due-date", "label": "Due Date", "type": "date", "required": false}], "search": "#search-drops", "clear": "#content-form > button:nth-of-type(2)", "paid": null, "unpaid": null, "price": null, "total": null}, {"entity": "paid-requests", "container": "#paid-requests-list", "rowClass": "record", "create": "#paid-requests-form > button:nth-of-type(1)", "primary": "#client-alias", "fields": [{"selector": "#client-alias", "key": "client-alias", "label": "Client Alias", "type": "text", "required": true}, {"selector": "#request-price", "key": "request-price", "label": "Price (USD)", "type": "number", "required": true}, {"selector": "#brief", "key": "brief", "label": "Brief", "type": "text", "required": false}], "search": null, "clear": null, "paid": "#paid-unpaid-state", "unpaid": "#paid-unpaid-state-2", "price": "request-price", "total": "#paid-total"}], "editor": {"entity": "content", "picker": "#edit-select", "title": "#edit-title", "status": "#edit-status", "defaultStatus": "pending", "update": "#edit-form > button:nth-of-type(1)", "delete": "#edit-form > button:nth-of-type(2)"}, "feedback": "#validation-message", "export": "#controls > button:nth-of-type(1)"};
(() => {
 'use strict';
 const cfg=STUDIO_RECORD_CONFIG;
 const $=selector=>document.querySelector(selector);
 const make=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
 const start=()=>{
  const feedback=$(cfg.feedback),state={version:1,collections:Object.create(null)};let selected='',storageHealthy=true;
  feedback.classList.add('studio-notice');
  const tell=(text,error=false)=>{feedback.textContent=text;feedback.hidden=!text;feedback.dataset.kind=error?'error':'success';feedback.setAttribute('role',error?'alert':'status');};
  try{
   const raw=localStorage.getItem(cfg.storageKey);
   if(raw){const saved=JSON.parse(raw);if(saved.version!==1||!saved.collections)throw Error('Saved workspace format is not supported.');
    for(const c of cfg.collections){const rows=saved.collections[c.entity]||[];if(!Array.isArray(rows)||rows.some(r=>!r||typeof r.id!=='string'||!r.values||typeof r.values!=='object'))throw Error('Saved workspace needs recovery.');state.collections[c.entity]=rows;}}
  }catch(error){storageHealthy=false;tell('Saved data could not be read. Your saved copy has been preserved. Export a backup before troubleshooting this browser.',true);}
  for(const c of cfg.collections)state.collections[c.entity]??=[];
  const save=()=>{if(!storageHealthy){tell('Storage is unavailable. Existing browser data has not been overwritten.',true);return false;}
   try{localStorage.setItem(cfg.storageKey,JSON.stringify(state));return true;}catch(error){tell('Your browser could not save this change. Export a backup before closing.',true);return false;}};
  const rows=c=>state.collections[c.entity];
  const primary=c=>c.primary.slice(1);
  const editor=cfg.editor;
  const editable=editor&&cfg.collections.find(c=>c.entity===editor.entity);
  const selectRecord=id=>{selected=id;const row=editable&&rows(editable).find(r=>r.id===id);if(!editor)return;$(editor.picker).value=row?id:'';$(editor.title).value=row?row.values[primary(editable)]:'';$(editor.status).value=row?row.status:editor.defaultStatus;};
  const renderPicker=()=>{if(!editor)return;const picker=$(editor.picker);picker.replaceChildren();const empty=make('option','Choose a saved record');empty.value='';picker.append(empty);
   for(const row of rows(editable)){const option=make('option',row.values[primary(editable)]);option.value=row.id;picker.append(option);}selectRecord(selected);};
  const remove=(c,id)=>{const before=rows(c);state.collections[c.entity]=before.filter(r=>r.id!==id);if(!save()){state.collections[c.entity]=before;return;}if(selected===id)selected='';render(c);renderPicker();tell('Record deleted.');};
  const button=(label,handler)=>{const b=make('button',label,'studio-row-action');b.type='button';b.addEventListener('click',handler);return b;};
  const render=c=>{
   const list=$(c.container);list.replaceChildren();const query=c.search?$(c.search).value.trim().toLocaleLowerCase():'';
   const shown=rows(c).filter(r=>String(r.values[primary(c)]||'').toLocaleLowerCase().includes(query));
   for(const row of shown){const card=make('article',undefined,c.rowClass+' studio-record');card.dataset.recordId=row.id;
    card.append(make('h3',row.values[primary(c)]));const detail=make('dl',undefined,'studio-details');
    for(const f of c.fields){if(f.key===primary(c))continue;detail.append(make('dt',f.label),make('dd',f.type==='number'&&c.price===f.key?'$'+Number(row.values[f.key]).toFixed(2):row.values[f.key]||'—'));}
    if(c.paid)detail.append(make('dt','State'),make('dd',row.paid?'Paid':'Unpaid'));
    if(row.status)detail.append(make('dt','Status'),make('dd',row.status));card.append(detail);
    const actions=make('div',undefined,'studio-row-actions');if(editable===c)actions.append(button('Edit',()=>{selectRecord(row.id);$(editor.title).focus();}));
    actions.append(button('Delete',()=>remove(c,row.id)));card.append(actions);list.append(card);}
   if(!shown.length)list.append(make('p',query?'No matching records. Clear the search to see your workspace.':'Nothing saved yet. Add your first record above.','studio-empty'));
   if(c.total){const cents=rows(c).reduce((sum,r)=>sum+(r.paid?Math.round(Number(r.values[c.price])*100):0),0);$(c.total).textContent='$'+(cents/100).toFixed(2);}
  };
  const decorate=(node,label)=>{if(node.closest('.studio-field'))return;const field=make('div',undefined,'studio-field');node.before(field);
   const labels=[...(node.labels||[])],flag=['checkbox','radio'].includes(node.type),existing=flag?labels.at(-1):labels[0];if(flag)for(const old of labels)if(old!==existing)old.remove();if(existing)field.append(existing);else if(label){const l=make('label',label);if(node.id)l.htmlFor=node.id;field.append(l);}field.append(node);
   if(['checkbox','radio'].includes(node.type))field.classList.add('studio-flag');};
  for(const c of cfg.collections){const create=$(c.create),form=create.closest('form');$(c.container).closest('section')?.classList.add('studio-collection');
   for(const f of c.fields)decorate($(f.selector),f.label);if(c.search)decorate($(c.search),'Search records');
   for(const selector of [c.paid,c.unpaid].filter(Boolean))decorate($(selector));for(const br of form.querySelectorAll('br'))br.remove();if(c.paid&&form.querySelectorAll('button').length===1){form.append(create);create.classList.add('studio-primary-wide');}
   const resetFlags=()=>{if(c.paid){$(c.paid).checked=false;$(c.unpaid).checked=true;}};resetFlags();
   if(c.paid){$(c.paid).addEventListener('change',()=>{if($(c.paid).checked)$(c.unpaid).checked=false;});$(c.unpaid).addEventListener('change',()=>{if($(c.unpaid).checked)$(c.paid).checked=false;});}
   create.addEventListener('click',event=>{event.preventDefault();if(!storageHealthy)return tell('Storage is unavailable. Existing saved data is preserved.',true);
    const values={};for(const f of c.fields){const input=$(f.selector),text=input.value.trim();if(f.required&&!text){input.focus();return tell(f.label+' is required.',true);}if(f.type==='number'&&text){const number=Number(text);if(!Number.isFinite(number)||c.price===f.key&&number<0){input.focus();return tell('Enter a valid '+f.label.toLowerCase()+'.',true);}values[f.key]=c.price===f.key?Math.round(number*100)/100:number;}else values[f.key]=text;}
    if(c.paid&&!$(c.paid).checked&&!$(c.unpaid).checked)return tell('Choose Paid or Unpaid.',true);
    const row={id:crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2),values};if(c.paid)row.paid=$(c.paid).checked;if(editable===c)row.status=editor.defaultStatus;
    rows(c).push(row);if(!save()){rows(c).pop();return;}for(const f of c.fields)$(f.selector).value='';resetFlags();render(c);renderPicker();tell('Record saved.');
   });
   form.addEventListener('submit',event=>{event.preventDefault();create.click();});
   if(c.search){$(c.search).addEventListener('input',()=>render(c));$(c.clear).addEventListener('click',()=>{$(c.search).value='';render(c);});}
   render(c);
  }
  if(editor){for(const selector of [editor.picker,editor.title,editor.status])decorate($(selector));$(editor.update).closest('section')?.classList.add('studio-editor-section');
   $(editor.picker).addEventListener('change',()=>selectRecord($(editor.picker).value));
   $(editor.update).addEventListener('click',event=>{event.preventDefault();const row=rows(editable).find(r=>r.id===$(editor.picker).value);if(!row)return tell('Choose a saved record first.',true);const title=$(editor.title).value.trim();if(!title)return tell('Title is required.',true);const previous={title:row.values[primary(editable)],status:row.status};row.values[primary(editable)]=title;row.status=$(editor.status).value;if(!save()){row.values[primary(editable)]=previous.title;row.status=previous.status;return;}selected=row.id;render(editable);renderPicker();tell('Changes saved.');});
   $(editor.delete).addEventListener('click',event=>{event.preventDefault();const id=$(editor.picker).value;if(!id)return tell('Choose a saved record first.',true);remove(editable,id);});renderPicker();
  }
  if(cfg.export)$(cfg.export).addEventListener('click',()=>{let payload={...state,exportedAt:new Date().toISOString()};if(!storageHealthy){try{payload={recovery:true,unparsedLocalStorage:localStorage.getItem(cfg.storageKey)};}catch(error){return tell('Your browser blocked access to the saved data. No empty backup was created.',true);}}const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),link=make('a');link.href=url;link.download=storageHealthy?'workspace-backup.json':'workspace-recovery.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);tell(storageHealthy?'Workspace backup downloaded.':'Original browser data downloaded for recovery.');});
  for(const form of document.querySelectorAll('form'))for(const br of form.querySelectorAll('br'))br.remove();
  const header=document.querySelector('header');if(header){header.prepend(make('p','YOUR WORKSPACE, ORGANIZED','studio-eyebrow'));header.append(make('p','Keep your records organized. Find what you need. Pick up where you left off.','studio-intro'),make('span','Private workspace · works offline','studio-offline'));}
  const footer=document.querySelector('footer');if(footer)for(const node of footer.querySelectorAll('p'))if(/^©\s+\d{4}\b/.test(node.textContent.trim()))node.textContent=node.textContent.replace(/©\s+\d{4}\b/,'© '+new Date().getFullYear());
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
