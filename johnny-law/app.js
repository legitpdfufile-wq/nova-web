(() => {
"use strict";
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const STATES=["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","District of Columbia"];
const NAMES={general:"General Legal Question",traffic:"Traffic Stop",door:"Police at the Door",accident:"Car Accident",custody:"Custody Situation",court:"Court Papers",landlord:"Landlord Issue",work:"Workplace Issue"};
const ICONS={general:"⚖️",traffic:"🚔",door:"🚪",accident:"🚗",custody:"👨‍👧",court:"🏛️",landlord:"🏠",work:"💼"};

let settings=readJSON("jl4_settings",{state:"",location:false,voice:true,autoRecord:false,continuous:false,setup:false});
let cases=readJSON("jl4_cases",[]);
let activeId=localStorage.getItem("jl4_active")||"";
let audio=readJSON("jl4_audio",{});
let files=readJSON("jl4_files",{});
let recordingDone=Promise.resolve(),recordingBusy=false;
let recorder=null,chunks=[],recStart=0,timer=null,continuousRec=null,continuousWanted=false,isSpeaking=false,silentMode=false;

const DISTRESS_RE=/(i(?:'m| am) (?:really )?(?:scared|afraid|terrified|panicking)|i can(?:not|'t) breathe|i(?:'m| am) freaking out|panic attack|i think i(?:'m| am) going to pass out|i can(?:not|'t) do this|i(?:'m| am) losing it)/i;
const SILENCE_RE=/(?:johnny[, ]*)?(?:shh+|quiet|stop talking|go silent|he(?:'s| is) coming back|she(?:'s| is) coming back|hold up.*coming back)/i;
const RESUME_RE=/(?:johnny[, ]*)?(?:talk again|you can talk|resume|come back|i need you|what now)/i;

function readJSON(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
function save(){try{localStorage.setItem("jl4_settings",JSON.stringify(settings));localStorage.setItem("jl4_cases",JSON.stringify(cases));localStorage.setItem("jl4_active",activeId);return true}catch(e){toast("Storage is full or unavailable. Export your timeline now; recent changes are not saved.");document.querySelector("#storageWarning").classList.remove("hidden");return false}}
function active(){return cases.find(c=>c.id===activeId)}
function show(id){$$(".screen").forEach(x=>x.classList.toggle("active",x.id===id));window.scrollTo(0,0)}
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1800)}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function stamp(){return new Date().toISOString()}
function pretty(d){return new Date(d).toLocaleString()}
function fillStates(el){el.innerHTML='<option value="">Choose state</option>'+STATES.map(s=>`<option ${settings.state===s?"selected":""}>${s}</option>`).join("")}
function say(t){if(silentMode||!settings.voice||!("speechSynthesis"in window))return;isSpeaking=true;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.rate=1.08;u.pitch=.92;u.onend=()=>{isSpeaking=false;restartContinuous()};speechSynthesis.speak(u)}
function addTimeline(c,who,text,kind="note"){const offset=c.liveStart?Math.max(0,(Date.now()-new Date(c.liveStart).getTime())/1000):0;c.timeline.push({time:stamp(),offset,who,text,kind});c.updated=stamp();refreshConstitutionChecklist(c);save()}
function mark(c,label,kind="point"){if(!c.highlights)c.highlights=[];const offset=c.liveStart?Math.max(0,(Date.now()-new Date(c.liveStart).getTime())/1000):0;c.highlights.push({time:stamp(),offset,label,kind});addTimeline(c,"Johnny",`Highlight marked: ${label}`,"highlight");toast("Point marked for replay.")}
function setFact(c,key,value){c.facts[key]=value;c.updated=stamp();save()}
function msg(text,who="johnny",speak=true){const d=document.createElement("div");d.className="msg "+who;d.innerHTML=`<b>${who==="johnny"?"Johnny":"You"}</b>${esc(text)}`;$("#messages").appendChild(d);const c=active();if(c)addTimeline(c,who==="johnny"?"Johnny":"User",text);if(who==="johnny"&&speak)say(text);window.scrollTo(0,document.body.scrollHeight)}
function suggest(items){const box=$("#suggestions");box.innerHTML="";items.forEach(t=>{const b=document.createElement("button");b.textContent=t;b.onclick=()=>handle(t);box.appendChild(b)})}
function ask(t,o=[]){msg(t);suggest(o)}
function updateState(){const status=$("#jurisdictionStatus");if(status)status.textContent=(settings.state||"Choose your state")+" · "+(settings.role||"driver")+" · "+"Constitutional protections and your account";fillStates($("#setupState"));fillStates($("#settingsState"));$("#stateLabel").textContent=settings.state||"Not set";$("#voiceBtn").textContent=settings.voice?"🔊":"🔇"}
function newCase(type="general",open=true,live=false){if((recordingBusy||(recorder&&recorder.state!=="inactive"))&&active()){if(open){chatStatus();show("chat")}return active()}silentMode=false;const c={id:"c"+Date.now(),type,title:NAMES[type],status:live?"Live":"Active",state:settings.state,coords:null,created:stamp(),updated:stamp(),liveStart:live?stamp():null,liveEnd:null,stage:0,stageName:"start",lastEvent:"",asked:{},facts:{},timeline:[],highlights:[],outcome:"",dates:[],recordings:[],files:[]};cases.unshift(c);activeId=c.id;save();if(settings.location&&navigator.geolocation){navigator.geolocation.getCurrentPosition(p=>{c.coords={lat:+p.coords.latitude.toFixed(5),lon:+p.coords.longitude.toFixed(5),accuracy:Math.round(p.coords.accuracy)};addTimeline(c,"System",`Location logged: ${c.coords.lat}, ${c.coords.lon}`)},()=>{})}if(open)openChat(type,live);return c}
function chatStatus(){const c=active();$("#chatCase").textContent=c?`${c.title} • ${c.state||"State not set"} • ${c.status}`:"No active case"}
async function openChat(type,live=false){const c=active()||newCase(type,false,live);$("#messages").innerHTML="";suggest([]);$("#chatTitle").textContent=live?"Live Action Mode":(type==="general"?"Ask Johnny":"Situation Review");chatStatus();show("chat");if(type==="general")msg(live?"I'm here. Tell me what's happening.":"I've got you. What's happening?");else msg("I'm here.","johnny",false);if(live){mark(c,"Live Action started","start");if(settings.autoRecord)await startRecording(true);startContinuous()}if(type!=="general")setTimeout(()=>startFlow(c),80)}
function askOnce(c,key,text,opts=[]){if(c.asked[key])return;c.asked[key]=true;save();ask(text,opts)}
function startFlow(c){if(c.type==="traffic")askOnce(c,"trafficStart","What's happening right now?",["I'm stopped","Officer is at my window","I'm getting pulled over","They asked to search"]);else if(c.type==="door")askOnce(c,"doorStart","Are officers at your door right now, and have they mentioned a warrant?",["At the door","They say they have a warrant","They already entered"]);else if(c.type==="accident")askOnce(c,"accidentStart","Is anyone injured or in immediate danger?",["No injuries","Someone is injured","I'm not sure"]);else if(c.type==="custody")askOnce(c,"custodyStart","Is a child in immediate danger, or is this a custody or visitation disagreement?",["Immediate danger","Custody disagreement","Visitation problem","Court order issue"]);else if(c.type==="court")askOnce(c,"courtStart","Do the papers show a hearing date, response deadline, or case number?",["Yes","No","I'm not sure"]);else if(c.type==="landlord")askOnce(c,"landlordStart","What happened or what notice did you receive?",["Changed the locks","Shut off utilities","Eviction notice","Repairs not done"]);else if(c.type==="work")askOnce(c,"workStart","What happened at work?",["Fired","Harassment","Pay problem","Injury","Retaliation"]);else askOnce(c,"generalStart","Tell me what's happening. Keep it simple—I'll remember confirmed facts and ask only what matters next.")}
function detect(t){t=t.toLowerCase();if(/pulled over|getting pulled|about to get pulled|cop(?:s)? (?:is|are) (?:behind|following)|police (?:is|are) following|traffic stop|officer.*window|license|registration|vehicle search/.test(t))return"traffic";if(/police.*door|warrant|search.*house/.test(t))return"door";if(/accident|crash|wreck/.test(t))return"accident";if(/custody|visitation|my kid|child/.test(t))return"custody";if(/court|summons|subpoena|hearing/.test(t))return"court";if(/landlord|rent|evict/.test(t))return"landlord";if(/boss|fired|work|paycheck/.test(t))return"work";return null}
function goSilent(c){
 silentMode=true;
 try{speechSynthesis.cancel()}catch{}
 isSpeaking=false;
 addTimeline(c,"Johnny","Johnny entered silent mode while recording and listening continued.","silent");
 msg("Going silent.","johnny",false);
 suggest(["Johnny, you can talk"]);
}
function resumeJohnny(c){
 silentMode=false;
 addTimeline(c,"Johnny","Johnny resumed speaking.","resume");
 return["I'm back. I'm right here. What changed while I was quiet?",["Officer asked a question","They asked to search","They told me to step out","Nothing changed"]];
}
function distressReply(c,t){
 setFact(c,"distressDetected",true);
 mark(c,"User expressed fear or panic","support");
 return["I've got you. I'm right here. Take one deep breath.", ["I took a breath","Tell me the next step","The officer is here"]];
}
function afterBreath(c){
 setFact(c,"grounded",true);
 return["Okay. Now we're in this together. Let's go. Tell me what is happening right now.",["Officer is at my window","They asked for documents","They asked to search","They told me to step out"]];
}
function timeEstimateReply(c){
 return["I cannot predict jail time or whether an arrest will happen. Stay calm, do not flee or physically resist, and keep your hands visible. Exact charges and facts matter; speak with a lawyer when safe.",["I'm pulling over safely","I'm already stopped","Officer is coming back"]];
}
const TRAFFIC_STAGE={start:0,following:1,pulling_over:2,stopped:3,contact:4,documents:5,questions:6,search:7,exit:8,detained:9,handcuffed:10,transport:11,booking:12,citation:13,released:14,court:15,review:16,closed:17};
function setStage(c,name,label){const n=TRAFFIC_STAGE[name]??0;if(n>=(c.stage||0)){c.stage=n;c.stageName=name;c.lastEvent=label||name;c.updated=stamp();save()}return n}
function currentStage(c){return c.stageName||Object.keys(TRAFFIC_STAGE).find(k=>TRAFFIC_STAGE[k]===(c.stage||0))||"start"}
function isBacktrack(c,target){return (c.stage||0)>TRAFFIC_STAGE[target]+1}
function placeEarlier(c,description,target){setFact(c,"pendingEarlierEvent",{description,target,time:stamp()});return[`That sounds like it may have happened earlier. Did ${description} happen earlier in this same stop, or is this a new encounter?`,["Earlier in this stop","New encounter","No, happening now"]]}
function nextPrompt(c){const st=currentStage(c);if(st==="transport")return["I'm with you. What happens when you arrive?",["Arrived at station","Still transporting me","They are questioning me"]];if(st==="booking")return["What are they doing now—booking, questioning, or releasing you?",["Booking me","Questioning me","Released me"]];if(st==="citation")return["What happened after you received the citation?",["Released me","Still detained","Court date listed"]];if(st==="released")return["You're released. Are you adding something that happened earlier, or are you ready to finish and save everything?",["Earlier in the stop","End Live Action","Bye Johnny"]];return["What are they doing right now?",["Asked for documents","Asked to search","Said step out","They handcuffed me","Released me"]]}
async function closeWithJohnny(c){if(c.status==="Closed")return null;if(recorder&&recorder.state!=="inactive")await stopRecording();else if(recordingBusy)await recordingDone;continuousWanted=false;try{continuousRec?.stop()}catch{}c.liveEnd=c.liveEnd||stamp();c.status="Closed";setStage(c,"closed","Conversation closed");mark(c,"Case closed by user","end");addTimeline(c,"Johnny","Conversation closed. Timeline and notes updated. Check Evidence to confirm and export any recording.","end");save();msg("The case is closed. Check Evidence and download backups before leaving this browser. Take care of yourself.");setTimeout(()=>show("home"),900);return null}
function traffic(c,t){const x=t.toLowerCase().trim();
 if(/not (?:being )?arrested|not in (?:handcuffs|cuffs)|not searching|did not (?:arrest|search)|no search (?:happened|occurred)/.test(x))return["I will not treat that as a search or arrest. Tell me what is actually happening now.",["Asked for documents","Asked to search","Said step out","Released me"]];
 if(SILENCE_RE.test(t)){goSilent(c);return null}
 if(RESUME_RE.test(t))return resumeJohnny(c);
 if(silentMode)return null;
 if(/^(?:bye|goodbye)(?: johnny)?$|bye johnny|thanks johnny.*(?:done|bye)|we(?:'re| are) done|that(?:'s| is) it|close (?:it|the case)|finish (?:it|the case)/i.test(x))return closeWithJohnny(c);
 if(DISTRESS_RE.test(t))return distressReply(c,t);
 if(/i took a breath|took a breath|okay.*breath|did it/.test(x)&&c.facts.distressDetected)return afterBreath(c);
 if(/how long.*(?:get|jail|locked up|in for)|how much time|am i going to jail/.test(x))return timeEstimateReply(c);
 if(/take off|ditch|run from|lose (?:him|them)|should i run/.test(x))return["Do not try to evade a stop. Signal, pull over safely, keep your hands visible, and stay with me. I've got you.",["I'm pulling over","I'm already stopped"]];
 if(/no (?:driver'?s )?license|don'?t have (?:a )?license|license is suspended|suspended license|never had a license/.test(x)){setFact(c,"licenseProblem",true);return["Okay. Don't run and don't make sudden movements. Get through this safely first. If questioning turns to another offense, you can say you want to remain silent and want a lawyer. After we're done, I'll help you make a plan for the license issue.",["Maybe I have a warrant","I'm already stopped","Officer is coming up"]]}
 if(/(?:maybe|think|might).*(?:warrant)|i have a warrant|there'?s a warrant/.test(x)){setFact(c,"possibleWarrant",true);return["Okay. Don't run or resist. We don't know yet whether a warrant is active or what it's for. Stay calm, keep your hands visible, and don't guess out loud. I've got you.",["Officer is at my window","I'm already stopped","How long am I going to get?"]]}
 if(/cop(?:s)? (?:is|are) following me|police (?:is|are) following me/.test(x)){setFact(c,"policeFollowing",true);setStage(c,"following","Police following");return["Are the emergency lights on, or are they just behind you?",["Lights are on","Just following me"]]}
 if(/just following me/.test(x))return["Drive normally. Don't speed up or make sudden turns. Tell me if the lights come on.",["Lights are on","They turned away"]];
 if(/(?:about to|get(?:ting)?|trying to) (?:be )?pulled over|lights (?:are )?on|cop(?:s)? (?:is|are) behind me/.test(x)){setFact(c,"stopBeginning",true);setStage(c,"pulling_over","Stop beginning");return["Signal and pull over at the first safe spot. I'm here. Tell me when you're stopped.",["I'm stopped","Officer is walking up"]]}
 if(/^(?:i(?:'m| am) )?pulled over$|^pulled over$|i got pulled over|already stopped|i'm stopped|^stopped$|^i am stopped$/.test(x)){setFact(c,"stopped",true);setStage(c,"stopped","Vehicle stopped");return["Got it. Keep your hands visible. What is the officer doing now?",["Walking up","At my window","Asked for documents","Asked to search"]]}
 if(/\b(?:step|get|come) out\b/.test(x)){
  if(isBacktrack(c,"exit"))return placeEarlier(c,"the order to step out","exit");
  setFact(c,"exitRequested",true);setStage(c,"exit","Ordered out of vehicle");mark(c,"Officer ordered user out (reported)","detention");
  const both=/(?:roll|lower|open).*window|window.*down/.test(x);
  if(both){setFact(c,"windowRequested",true);mark(c,"Officer ordered window lowered (reported)","detention")}
  return[both?"Your rights to silence and protection against unreasonable searches and seizures continue. Both orders you reported are in this timeline. You choose your response. Johnny has not determined whether these orders are lawful. Avoid physical resistance.":"Your rights to silence and protection against unreasonable seizures continue. The exit order you reported is in this timeline. You choose your response. Johnny has not determined whether this order is lawful. Avoid physical resistance.",["They gave a reason","Still detained","Released me"]];
 }
 if(/(?:roll|lower|open).*window|window.*down/.test(x)){
  setFact(c,"windowRequested",true);setStage(c,"contact","Window order reported");mark(c,"Officer ordered window lowered (reported)","detention");
  return["Your rights to silence and protection against unreasonable searches continue. The window order you reported is in this timeline. You choose your response. Johnny has not determined whether this order is lawful. Keep your hands visible.",["Said step out","They gave a reason","Released me"]];
 }
 if(/^(?:i (?:remain|stay|stayed|remained|am remaining|am staying) silent|i(?:'m| am) (?:exercising|invoking) my right to remain silent)[.!]?$/.test(x)){
  setFact(c,"userReportsSilence",true);return["You have the right to remain silent and not be compelled to incriminate yourself. Your statement is in this timeline. You choose what to say next.",["Roll down your window","Said step out","Released me"]];
 }
 if(/officer is at my window|officer.*window|at my window|walking up/.test(x)){setFact(c,"officerAtWindow",true);setStage(c,"contact","Officer contact");return["I'm with you. Keep your hands visible. What did the officer say or ask for?",["Asked for documents","Asked questions","Asked to search","Said step out"]]}
 if(/documents|license|registration|insurance/.test(x)){if(isBacktrack(c,"documents"))return placeEarlier(c,"the document request","documents");setFact(c,"documentsRequested",true);setStage(c,"documents","Documents requested");return["Record the exact document request and the stated authority. You can ask whether it is voluntary or being presented as an order. Silence about investigative questions does not establish that a document demand is optional. Your decision remains yours; legal context is available separately. If reaching, explain your movements first. What happens next?",["Asked questions","Asked to search","Said step out","Gave citation"]]}
 if(/asked to search|want(?:s|ed)? to search|search my car/.test(x)){if(isBacktrack(c,"search"))return placeEarlier(c,"the search request","search");setFact(c,"searchRequested",true);setStage(c,"search","Search requested");return["Did you give permission, say no, or did the search start without them asking?",["I gave permission","I said no","They never asked and started searching","They are already searching"]]}
 if(/already searching|started searching|never asked.*search|search is happening/.test(x)){setFact(c,"searchInProgress",true);setStage(c,"search","Vehicle search began");mark(c,"Vehicle search began","search");return["Don't physically interfere. If accurate, say calmly: ‘I do not consent to this search.’ Did the officer give a reason?",["No reason given","They gave a reason","I couldn't hear","They found something"]]}
 if(/i said no|do not consent|didn't consent/.test(x)){setFact(c,"consentGiven",false);return["Logged. Stay calm and don't physically interfere. Is the search happening now, and did they state a reason?",["Search is happening","No reason given","They gave a reason"]]}
 if(/gave permission/.test(x)){setFact(c,"consentGiven",true);return["Understood. Tell me what they search, open, or remove.",["Glove box","Trunk","Bags or containers","They removed something"]]}
 if(/removed something|took something|seized|found something/.test(x)){setFact(c,"itemRemoved",true);mark(c,"Item removed during search","evidence");return["I logged that something was removed. What was it, and did the officer say why they were taking it?",[]]}
 if(/no reason given/.test(x)){setFact(c,"reasonGiven",false);mark(c,"No search reason documented","concern");return["Logged: no reason was stated. Don't argue roadside. Tell me what they search or remove next.",["Searching trunk","Searching bags","Removed something","Search ended"]]}
 if(/they gave a reason/.test(x)){setFact(c,"reasonGiven",true);return["Tell me their exact words as closely as you can. I'll preserve them.",[]]}
 if(/they didn't answer|did not answer|no answer/.test(x))return["Okay. Don't repeat it over and over. Follow clear instructions without arguing and tell me what they do next.",["They handcuffed me","They are questioning me","Still standing here"]];
 if(/detained/.test(x)){setFact(c,"detained",true);setStage(c,"detained","Detained");mark(c,"User told they were detained","detention");return["Understood. Don't argue the facts roadside. What is their next instruction?",["They are questioning me","They handcuffed me","They gave citation","They released me"]]}
 if(/handcuff|cuffs|arrest|locked up|going to jail|being taken in/.test(x)){setFact(c,"arrested",true);setStage(c,"handcuffed","Handcuffed or arrested");mark(c,"Handcuffs or arrest reported","critical");return["I'm here. Don't resist or pull away. Say clearly that you want to remain silent and want a lawyer. What are they doing next?",["Transporting me","Still roadside","They are questioning me"]]}
 if(/transporting|taking me downtown|taking me in|in the police car|headed to (?:jail|station)/.test(x)){setFact(c,"transporting",true);setStage(c,"transport","Transport started");mark(c,"Transport began","critical");return["Understood. You're in the transport stage now. Stay calm and don't discuss the incident in the vehicle. Tell me what happens when you arrive.",["Arrived at station","Still transporting me","They are questioning me"]]}
 if(/arrived at (?:the )?(?:station|jail)|booking me|being booked|fingerprints|mugshot/.test(x)){setFact(c,"booking",true);setStage(c,"booking","Booking");return["Okay. I'm tracking booking now. Don't discuss the facts of the case. Ask for a lawyer if questioning continues. What happens next?",["They are questioning me","Gave citation","Released me"]]}
 if(/ticket|citation|gave citation/.test(x)){if(isBacktrack(c,"citation")&&currentStage(c)==="released")return placeEarlier(c,"the citation","citation");setFact(c,"citation",true);setStage(c,"citation","Citation issued");mark(c,"Citation issued","citation");return["Keep every page. Does it list a court date or a deadline?",["Yes, court date","Yes, deadline","No","I'll review later"]]}
 if(/yes,? court date|court date listed|got to court|have to go to court/.test(x)){setFact(c,"courtDateListed",true);setStage(c,"court","Court date identified");return["Yes—unless the ticket or court tells you otherwise, treat that date as something you must handle. We'll review the exact instructions after you're safe. What happened next?",["Released me","Still detained","That's everything"]]}
 if(/yes,? deadline|deadline listed/.test(x)){setFact(c,"deadlineListed",true);return["Good. Keep that deadline. We'll save it to the case and can add a reminder after this is over. What happened next?",["Released me","Still detained","That's everything"]]}
 if(/free to leave|released(?: me)?|let me go|i'm free|im free/.test(x)){setFact(c,"released",true);setStage(c,"released","Released");mark(c,"Traffic stop ended","end");return["Good. Get somewhere safe. I'm still here. Are you adding something from earlier, or are you ready to end and save everything?",["Earlier in the stop","End Live Action","Bye Johnny"]]}
 if(/keep documenting/.test(x)){const r=nextPrompt(c);return["Absolutely. "+r[0],r[1]]}
 if(/earlier in this stop|happened earlier|i forgot to mention/.test(x)){setFact(c,"timelineMode","backfill");return["Got it—we're filling in an earlier part of the same stop. Tell me what happened, and I'll place it in the timeline without moving the current stage backward.",[]]}
 if(/new encounter|stopped again/.test(x)){setFact(c,"newEncounter",true);setStage(c,"contact","New police encounter");return["Understood—this is a new encounter. What are they doing right now?",["At my window","Asked for documents","Asked to search"]]}
 if(/no, happening now/.test(x)){return["Understood. Tell me exactly what is happening right now.",[]]}
 if(/that's everything|that is everything|done now/.test(x))return closeWithJohnny(c);
 return nextPrompt(c)}
function general(c,t){const x=t.toLowerCase();
if(SILENCE_RE.test(t)){goSilent(c);return null}
if(RESUME_RE.test(t))return resumeJohnny(c);
if(silentMode)return null;
if(DISTRESS_RE.test(t))return distressReply(c,t);
if(/i took a breath|took a breath|okay.*breath|did it/.test(x)&&c.facts.distressDetected)return afterBreath(c);if(/mark that/.test(x)){mark(c,"User-marked point of interest","manual");return["Marked. I saved the time so you can replay the lead-up later.",[]]}if(/start recording/.test(x)){startRecording(false);return null}if(/stop recording/.test(x)){stopRecording();return null}if(/end live action|situation is over|we are done/.test(x)){endLive();return null}if(/fight|hit them|resist/.test(x))return["No. Keep everyone safe—no threats, sudden moves, or physical resistance. I’ll document what happens and we can review it afterward.",[]];return[`I heard you. What changed most recently, and is anyone in immediate danger?`,["No immediate danger","Someone may be hurt","Police are present","Situation ended"]]}
function handle(t){if(/can(?:not|\'t) breathe|chest pain|severely injured|serious injury|unconscious|overdose/i.test(t)){msg(t,"user",false);ask("This may be a medical emergency. Call local emergency services or ask someone nearby to call when safe. Tell the officer you need medical help. Johnny cannot summon help or assess your condition.");return}if("speechSynthesis" in window){speechSynthesis.cancel();isSpeaking=false}const c=active()||newCase("general",false,false);msg(t,"user",false);suggest([]);const rights=JohnnyTraffic.reply({state:c.state||settings.state,role:settings.role||"driver"},t);if(rights){msg(rights);suggest(["Asked for documents","Said step out","Released me"]);return}if(/mark that|start recording|stop recording|end live action|situation is over/i.test(t)){const r=general(c,t);if(r)setTimeout(()=>{if(Array.isArray(r))ask(r[0],r[1])},80);return}if(c.type==="general"){const d=detect(t);if(d){c.type=d;c.title=NAMES[d];save();const first=d==="traffic"?traffic(c,t):general(c,t);chatStatus();if(Array.isArray(first))setTimeout(()=>ask(first[0],first[1]),80);return}}const r=c.type==="traffic"?traffic(c,t):general(c,t);save();chatStatus();if(r)setTimeout(()=>{if(Array.isArray(r))ask(r[0],r[1])},80)}
async function endLive(){const c=active();if(!c)return;if(recorder&&recorder.state!=="inactive")await stopRecording();else if(recordingBusy)await recordingDone;continuousWanted=false;try{continuousRec?.stop()}catch{}c.liveEnd=stamp();c.status="Review";mark(c,"Live Action ended","end");addTimeline(c,"Johnny","Live Action ended. Post-incident review is ready.","end");save();msg("Live mode ended. Review the saved timeline and Evidence status. Download original files as a backup; this browser is the only storage location.");setTimeout(()=>openCase(c.id),600)}
function startContinuous(){if(!settings.continuous)return;const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return toast("Always-listening commands are not supported here. Use the mic button.");continuousWanted=true;if(!continuousRec){continuousRec=new SR();continuousRec.lang="en-US";continuousRec.continuous=true;continuousRec.interimResults=false;continuousRec.onresult=e=>{const text=e.results[e.results.length-1][0].transcript.trim();if(/^johnny\b/i.test(text)||/mark that|start recording|stop recording|end live action|shh|quiet|stop talking|you can talk|resume/i.test(text))handle(text)};continuousRec.onend=()=>restartContinuous();continuousRec.onerror=e=>{if(["not-allowed","service-not-allowed","audio-capture"].includes(e.error)){continuousWanted=false;toast("Voice listening stopped. You can type instead.")}}}try{continuousRec.start()}catch{}}
function restartContinuous(){if(continuousWanted&&!isSpeaking)setTimeout(()=>{try{continuousRec?.start()}catch{}},500)}
function renderCases(){const box=$("#casesList");box.innerHTML="";if(!cases.length)box.innerHTML='<div class="card"><h3>No cases yet</h3><p>Say “Johnny, get my back” to begin.</p></div>';cases.forEach(c=>{const d=document.createElement("div");d.className="case-row";d.innerHTML=`<span>${ICONS[c.type]}</span><div><strong>${esc(c.title)}</strong><small>${esc(c.status)} • ${esc(c.state||"No state")} • ${esc(pretty(c.updated))}</small></div><button>Open</button>`;d.querySelector("button").onclick=()=>openCase(c.id);box.appendChild(d)});show("cases")}
function openCase(id){activeId=id;save();const c=active();if(!c)return;refreshConstitutionChecklist(c);$("#caseHeading").textContent=c.title;$("#caseSub").textContent=`${c.status} • ${c.state||"No state"}`;$("#caseTitleInput").value=c.title;$("#caseOutcome").value=c.outcome||"";$("#factsView").textContent=buildReview(c);renderTimeline();renderRecordings();renderFiles();renderDates();showTab("summary");show("case")}
function showTab(n){$$(".tabs button").forEach(b=>b.classList.toggle("active",b.dataset.tab===n));$$(".panel").forEach(p=>p.classList.toggle("active",p.id===`tab-${n}`))}
function buildReview(c){const lines=["JOHNNY QUICK REVIEW","","Reported information:"];Object.entries(c.facts||{}).forEach(([k,v])=>lines.push(`• ${k}: ${v}`));lines.push("", "Points worth reviewing:");if(c.facts.searchInProgress&&c.facts.consentAsked===false)lines.push("⚠ Search began without a consent request documented.");if(c.facts.searchInProgress&&c.facts.reasonGiven===false)lines.push("⚠ No officer-stated reason was documented.");if(c.facts.arrested)lines.push("⚠ Handcuffs or arrest were reported; attorney review may be important.");if(!lines.some(x=>x.startsWith("⚠")))lines.push("• No specific procedure concern is identified from the saved facts yet.");lines.push("", "General information:", "A search without consent is not automatically unlawful because other legal grounds may exist. Johnny does not determine legality. A licensed attorney can evaluate the complete facts and current law.", "", "Replay highlights:");(c.highlights||[]).forEach(h=>lines.push(`• ${Math.floor(h.offset/60)}:${String(Math.floor(h.offset%60)).padStart(2,"0")} — ${h.label}`));if(c.rightsReports?.length){lines.push("", "PERSON-REPORTED EVENTS AND RIGHTS CONCERNS — NOT LEGAL FINDINGS");c.rightsReports.forEach(r=>lines.push(`${r.time} — ${r.kind}\n${r.account}\nOfficer/agency: ${r.officer||"Not supplied"}`))}return lines.join("\n")}
function renderTimeline(){const c=active();$("#timelineText").value=`JOHNNY LAW CASE SUMMARY\n\nCase: ${c.title}\nStatus: ${c.status}\nState: ${c.state||"Not set"}\nStarted: ${pretty(c.created)}\n\nTIMELINE\n${c.timeline.map(x=>`[${pretty(x.time)}] ${x.who}: ${x.text}`).join("\n\n")}\n\nOUTCOME\n${c.outcome||""}\n\n${window.JohnnyConstitution?.text(c)||"Constitutional checklist unavailable. Reopen online to load the update; original timeline remains above."}`}
function download(name,data,type="text/plain"){const b=new Blob([data],{type}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function safe(s){return s.replace(/[^\w-]+/g,"_")||"Johnny_Law"}
async function startRecording(auto=false){
 if(recordingBusy)return toast("A recording is already starting or saving.");
 if(recorder&&recorder.state!=="inactive")return toast("Johnny is already recording.");
 const c=active()||newCase("general",false);
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)return toast("Recording is unavailable. Use HTTPS and a supported browser; you can still keep notes.");
 if(!auto&&!confirm(`Recording rules vary. Confirm recording is lawful where you are. Keep your hands visible; never reach suddenly for the phone. Start audio recording?`))return;
 recordingBusy=true;let stream;
 try{
  await JohnnyEvidence.ready();
  stream=await navigator.mediaDevices.getUserMedia({audio:true});
  const mime=["audio/webm;codecs=opus","audio/mp4","audio/webm"].find(t=>MediaRecorder.isTypeSupported(t));
  const current=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);recorder=current;
  const started=Date.now(),id="r"+started+"_"+Math.random().toString(16).slice(2),parts=[];let writes=Promise.resolve(),writeError=null,seq=0,resolveDone;
  recordingDone=new Promise(resolve=>resolveDone=resolve);
  const item={id,time:stamp(),duration:0,state:"recording"};c.recordings.push(item);
  await JohnnyEvidence.begin(id,{caseId:c.id,time:item.time,mime:current.mimeType});
  current.ondataavailable=e=>{if(e.data.size){parts.push(e.data);const n=seq++;writes=writes.then(()=>JohnnyEvidence.chunk(id,n,e.data)).catch(err=>{writeError=err;toast("Evidence storage failed. Keep this page open and download the audio when stopped.")})}};
  current.onerror=()=>{toast("The recorder encountered an error. Stop and export available audio.");if(current.state!=="inactive")current.stop()};
  current.onstop=async()=>{
   clearInterval(timer);$("#recordBar").classList.add("hidden");$("#startRecordBtn").disabled=false;$("#stopRecordBtn").disabled=true;
   stream.getTracks().forEach(t=>t.stop());
   await writes;const blob=new Blob(parts,{type:current.mimeType||"audio/webm"});
   item.duration=Math.round((Date.now()-started)/1000);
   try{
    if(!blob.size)throw Error("No audio was captured");
    const saved=await JohnnyEvidence.finish(id,blob);
    item.state="saved";item.sha256=saved.sha256;item.mime=blob.type;
    const metadataSaved=save();addTimeline(c,"System","Audio saved to this browser's evidence store. Export a backup; this is not cloud storage.");
    toast(metadataSaved?"Audio saved. Download a backup from Evidence.":"Audio stored; case index could not save. Download a backup now.");
   }catch(e){
    item.state="save_failed";save();
    document.querySelector("#storageWarning").classList.remove("hidden");
    toast("Audio could not be saved. Download the captured audio now and keep this page open.");
    if(blob.size)downloadBlob("Johnny_Unsaved_Audio"+(blob.type.includes("mp4")?".mp4":".webm"),blob);
   }finally{recordingBusy=false;resolveDone();if(activeId===c.id)renderRecordings()}
  };
  chunks=parts;recStart=started;current.start(1000);save();addTimeline(c,"System","Audio recording started. Keep the page open and awake.");
  $("#recordBar").classList.remove("hidden");$("#recordTimer").textContent="00:00";$("#startRecordBtn").disabled=true;$("#stopRecordBtn").disabled=false;
  timer=setInterval(()=>{const s=Math.floor((Date.now()-started)/1000);$("#recordTimer").textContent=`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`},1000);
  recordingBusy=false;if(!auto)say("Recording started.");
 }catch(e){stream?.getTracks().forEach(t=>t.stop());recordingBusy=false;toast(e.name==="NotAllowedError"?"Microphone access denied. Notes still work; enable microphone access in browser settings to record.":"Recording could not start. Check microphone, browser and storage access.")}
}
async function stopRecording(){if(recorder&&recorder.state!=="inactive"){recordingBusy=true;recorder.stop();toast("Saving captured audio…");await recordingDone}else if(recordingBusy){await recordingDone}else toast("Johnny is not recording.")}
async function renderRecordings(){const c=active(),box=$("#recordingsList");box.innerHTML="";if(!c)return;
 for(const r of c.recordings||[]){
  const d=document.createElement("div");d.className="file-row";box.appendChild(d);
  let stored;try{stored=await JohnnyEvidence.get(r.id)||await JohnnyEvidence.recover(r.id)}catch{}
  if(activeId!==c.id)return;
  const legacy=audio[r.id];const blob=stored?.blob;
  const name=legacy?.name||`Johnny_Record_${r.id}${(blob?.type||r.mime||"").includes("mp4")?".mp4":".webm"}`;
  const title=document.createElement("strong");title.textContent=name;d.appendChild(title);
  const detail=document.createElement("small");detail.textContent=pretty(r.time)+" • "+(stored?.interrupted?"Recovered interrupted capture; may be incomplete":r.state==="save_failed"?"Save failed; export any available capture":r.state==="recording"?"Capture may be incomplete—check and export":`${r.duration}s`);d.appendChild(detail);
  if(blob||legacy){const player=document.createElement("audio");player.controls=true;player.src=blob?URL.createObjectURL(blob):legacy.data;d.appendChild(player);const button=document.createElement("button");button.textContent="Download original audio";button.onclick=()=>blob?downloadBlob(name,blob):downloadData(name,legacy.data);d.appendChild(button)}
  else{const note=document.createElement("p");note.textContent="No saved audio found. Do not assume this recording was preserved.";d.appendChild(note)}
  if(stored?.sha256){const hash=document.createElement("small");hash.textContent="SHA-256: "+stored.sha256;d.appendChild(hash)}
 }
}
async function renderFiles(){const c=active(),box=$("#filesList");box.innerHTML="";for(const f of c.files||[]){const old=files[f.id];let stored;try{stored=await JohnnyEvidence.get(f.id)}catch{}if(activeId!==c.id)return;if(!old&&!stored)continue;const name=old?.name||stored.name;const d=document.createElement("div");d.className="file-row";const title=document.createElement("strong");title.textContent=name;d.appendChild(title);const b=document.createElement("button");b.textContent="Download original file";b.onclick=()=>old?downloadData(old.name,old.data):downloadBlob(name,stored.blob);d.appendChild(b);box.appendChild(d)}}
function renderDates(){const c=active(),box=$("#datesList");box.innerHTML="";(c.dates||[]).forEach(d=>{const e=document.createElement("div");e.className="file-row";e.innerHTML=`<strong>${esc(d.label)}</strong><small>${pretty(d.time)} • reminder ${d.reminder} minutes before</small>`;box.appendChild(e)})}
function icsEscape(value){return String(value).replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;")}
function icsDate(d){return new Date(d).toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"")}
function addDate(){const c=active(),label=$("#dateLabel").value.trim()||"Court appearance",v=$("#dateTime").value;if(!v)return toast("Choose a date and time.");const d={id:"d"+Date.now(),label,time:new Date(v).toISOString(),reminder:+$("#reminderSelect").value};c.dates.push(d);addTimeline(c,"System",`${label} saved for ${pretty(d.time)}`);const end=new Date(new Date(d.time).getTime()+3600000);const ics=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:${d.id}@johnnylaw.local\r\nDTSTAMP:${icsDate(new Date())}\r\nDTSTART:${icsDate(d.time)}\r\nDTEND:${icsDate(end)}\r\nSUMMARY:${icsEscape(label)}\r\nBEGIN:VALARM\r\nTRIGGER:-PT${d.reminder}M\r\nACTION:DISPLAY\r\nDESCRIPTION:${icsEscape(label)}\r\nEND:VALARM\r\nEND:VEVENT\r\nEND:VCALENDAR`;download(`${safe(label)}.ics`,ics,"text/calendar");renderDates();toast("Date saved and calendar file downloaded.")}
let rightsReportReturnFocus=null;
function openRightsReport(){rightsReportReturnFocus=document.activeElement;$("#rightsReportWords").value="";$("#rightsReportOfficer").value="";$("#rightsReportFeedback").textContent="";$("#saveRightsReport").disabled=false;$("#rightsReportModal").classList.remove("hidden");$("#rightsReportWords").focus()}
function closeRightsReport(){$("#rightsReportModal").classList.add("hidden");rightsReportReturnFocus?.focus()}
function recordRightsReport(e){e.preventDefault();const words=$("#rightsReportWords").value;const feedback=$("#rightsReportFeedback");if(!words.trim()){feedback.textContent="Describe what happened before saving.";return}
 const c=active()||newCase("traffic",false);const item={id:"rights_"+Date.now()+"_"+Math.random().toString(16).slice(2),kind:$("#rightsReportKind").value,account:words,officer:$("#rightsReportOfficer").value.trim(),time:stamp(),status:"reported; not a legal finding"};
 c.rightsReports??=[];c.rightsReports.push(item);const offset=c.liveStart?Math.max(0,(Date.now()-new Date(c.liveStart).getTime())/1000):0;c.highlights??=[];c.highlights.push({time:item.time,offset,label:"Encounter / rights concern: "+item.kind,kind:"rights-report"});c.timeline.push({time:item.time,offset,who:"Person's report",kind:"rights-report",text:item.kind+"\nStatus: "+item.status+"\nDevice time: "+item.time+"\nOfficer/agency: "+(item.officer||"Not supplied")+"\nAccount, verbatim:\n"+item.account});c.updated=item.time;
 refreshConstitutionChecklist(c);if(save()){closeRightsReport();toast("Your report and timeline marker were saved. Export a backup.");if($("#case").classList.contains("active")){ $("#factsView").textContent=buildReview(c);renderTimeline()}}
 else{feedback.textContent="Not saved to browser storage. Your report remains in memory. Close this form, open Case → Timeline, and download a backup now.";$("#saveRightsReport").disabled=true}
}

function refreshConstitutionChecklist(c){if(!window.JohnnyConstitution||!c)return;const r=JohnnyConstitution.review(c);c.constitutionChecklist={version:r.version,reviewedAt:stamp(),reportsConsidered:r.reportCount,flagged:r.flagged};if(c.id!==activeId)return;const summary=$("#constitutionSummary"),box=$("#constitutionTopics");if(!summary||!box)return;summary.textContent=`27 amendment topics checked · ${r.flagged.length} suggested for review`;box.replaceChildren();for(const item of r.items){const row=document.createElement("div");row.className="amendment-row";row.dataset.amendment=item.number;const title=document.createElement("strong");title.textContent=`${item.number}. ${item.summary}`;const status=document.createElement("p");status.className="amendment-status";status.textContent=item.status;const why=document.createElement("p");why.textContent=item.prompt;const link=document.createElement("a");link.href=item.source;link.target="_blank";link.rel="noopener noreferrer";link.textContent="Read full source";row.append(title,status,why,link);box.appendChild(row)}}

function wire(){
 $("#openLegalContext").onclick=e=>{e.preventDefault();show("home");const notice=$("#legalContextNotice");notice.closest("details").open=true;notice.scrollIntoView({behavior:"smooth",block:"start"})};
 $("#homeRightsReport").onclick=openRightsReport;$("#rightsReportBtn").onclick=openRightsReport;$("#rightsReportForm").onsubmit=recordRightsReport;$("#cancelRightsReport").onclick=closeRightsReport;$("#rightsReportModal").addEventListener("keydown",e=>{if(e.key==="Escape")closeRightsReport()});
 async function findZip(prefix){const out=$("#"+prefix+"ZipResult"),state=$("#"+prefix+"State");try{const choices=await JohnnyTraffic.lookup($("#"+prefix+"Zip").value.trim());if(choices.length===1&&STATES.includes(choices[0])){state.value=choices[0];out.textContent="Suggested: "+choices[0]+". Confirm this is where the stop is happening."}else out.textContent="ZIP covers: "+choices.join(", ")+". Choose the actual stop state manually."}catch(e){out.textContent=e.message}}
 $("#lookupSetupZip").onclick=()=>findZip("setup");$("#lookupSettingsZip").onclick=()=>findZip("settings");
 $$("[data-rights]").forEach(b=>b.onclick=()=>{newCase("traffic",true);setTimeout(()=>handle(b.dataset.rights),100)});

 $("#dismissStorage").onclick=()=>$("#storageWarning").classList.add("hidden");
  fillStates($("#setupState"));fillStates($("#settingsState"));updateState();
  if(!settings.setup)$("#setup").classList.remove("hidden");
  $("#setupContinue").onclick=()=>{if(!$("#setupState").value)return toast("Choose your state.");if(!$("#setupAgree").checked)return toast("Confirm the recording notice.");settings={zip:$("#setupZip").value,role:$("#setupRole").value,state:$("#setupState").value,location:$("#setupLocation").checked,voice:true,autoRecord:$("#setupAutoRecord").checked,continuous:false,setup:true};save();updateState();$("#setup").classList.add("hidden")};
  $("#homeLogo").onclick=()=>show("home");$("#chatHome").onclick=()=>show("home");$("#casesHome").onclick=()=>show("home");$("#helpHome").onclick=()=>show("home");
  $("#getBackBtn").onclick=()=>newCase("traffic",true,true);$("#askBtn").onclick=()=>newCase("traffic",true);$("#replayBtn").onclick=renderCases;$("#casesBtn").onclick=renderCases;$("#helpBtn").onclick=()=>show("help");
  $$("[data-scenario]").forEach(b=>b.onclick=()=>newCase(b.dataset.scenario,true));
  $("#composer").onsubmit=e=>{e.preventDefault();const t=$("#input").value.trim();if(t){$("#input").value="";handle(t)}};
  $("#openCaseBtn").onclick=()=>openCase(activeId);$("#newCaseBtn").onclick=()=>newCase("general",true);$("#caseBack").onclick=renderCases;
  $$(".tabs button").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
  $("#saveCaseBtn").onclick=()=>{const c=active();c.title=$("#caseTitleInput").value.trim()||c.title;c.outcome=$("#caseOutcome").value.trim();c.updated=stamp();save();toast("Case saved.")};
  $("#closeCaseBtn").onclick=async()=>{const c=active();if(recorder&&recorder.state!=="inactive")await stopRecording();continuousWanted=false;try{continuousRec?.stop()}catch{}c.status="Closed";c.updated=stamp();save();renderCases()};
  $("#copyTimeline").onclick=async()=>{try{await navigator.clipboard.writeText($("#timelineText").value);toast("Copied.")}catch{toast("Clipboard unavailable. Use Download or select and copy the timeline.")}};$("#downloadTimeline").onclick=()=>download(`${safe(active().title)}_Timeline.txt`,$("#timelineText").value);
  $("#startRecordBtn").onclick=()=>startRecording(false);$("#stopRecordBtn").onclick=stopRecording;$("#stopRecordBar").onclick=stopRecording;$("#markRecordBar").onclick=()=>mark(active(),"Manual point of interest","manual");$("#endLiveBar").onclick=endLive;
  $("#fileInput").onchange=async e=>{const c=active();for(const f of Array.from(e.target.files)){if(f.size>25000000){toast(`${f.name} is over the 25 MB per-file limit.`);continue}try{const id="f"+Date.now()+Math.random();await JohnnyEvidence.put(id,{name:f.name,blob:f});c.files.push({id,time:stamp()});if(!save())toast("File stored, but case index is full. Keep the original file.");await renderFiles()}catch{toast("File could not be saved. Keep your original file.")}}e.target.value=""};
  $("#addDateBtn").onclick=addDate;
  $("#legalAidBtn").onclick=()=>window.open(`https://www.google.com/search?q=${encodeURIComponent((settings.state||"")+" official legal aid free consultation")}`,"_blank");$("#stateBarBtn").onclick=()=>window.open(`https://www.google.com/search?q=${encodeURIComponent((settings.state||"")+" official state bar lawyer referral")}`,"_blank");
  $("#settingsBtn").onclick=()=>{$("#settingsZip").value=settings.zip||"";$("#settingsRole").value=settings.role||"driver";$("#settingsState").value=settings.state;$("#settingsLocation").checked=settings.location;$("#settingsVoice").checked=settings.voice;$("#settingsAutoRecord").checked=settings.autoRecord;$("#settingsContinuous").checked=settings.continuous;$("#settings").classList.remove("hidden")};$("#changeStateBtn").onclick=()=>$("#settingsBtn").click();$("#cancelSettings").onclick=()=>$("#settings").classList.add("hidden");
  $("#saveSettings").onclick=()=>{if(!$("#settingsState").value)return toast("Choose a state.");settings.zip=$("#settingsZip").value;settings.role=$("#settingsRole").value;settings.state=$("#settingsState").value;settings.location=$("#settingsLocation").checked;settings.voice=$("#settingsVoice").checked;settings.autoRecord=$("#settingsAutoRecord").checked;settings.continuous=$("#settingsContinuous").checked;settings.setup=true;save();updateState();$("#settings").classList.add("hidden");toast("Settings saved.")};
  $("#voiceBtn").onclick=()=>{settings.voice=!settings.voice;save();updateState();toast(settings.voice?"Voice on.":"Voice muted.")};
  $("#resetApp").onclick=()=>{if(confirm("Erase all Johnny Law data on this device?")){["jl4_settings","jl4_cases","jl4_active","jl4_audio","jl4_files"].forEach(k=>localStorage.removeItem(k));JohnnyEvidence.clear().then(()=>location.reload()).catch(()=>toast("Could not clear evidence storage. Close other Johnny tabs and retry."))}};
  $("#fatalReset").onclick=()=>location.reload();
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(SR){const r=new SR();r.lang="en-US";$("#micBtn").onclick=()=>{try{r.start()}catch{toast("Voice input is already active. You can type instead.")}};r.onerror=()=>toast("Voice input unavailable. Type your message instead.");r.onresult=e=>handle(e.results[0][0].transcript)}else $("#micBtn").onclick=()=>toast("Voice input works best in Chrome or Edge.");
  if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
  $("#jsStatus").textContent="Ready";$("#jsStatus").className="status good";
}
window.addEventListener("beforeunload",e=>{if(recorder&&recorder.state!=="inactive"){e.preventDefault();e.returnValue="Recording is active"}});
window.addEventListener("error",e=>{console.error(e.error||e.message);$("#fatal").classList.remove("hidden")});
function downloadBlob(name,blob){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),10000)}
function downloadData(name,data){const a=document.createElement("a");a.href=data;a.download=name;a.click()}
wire();
})();
