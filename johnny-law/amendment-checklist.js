/* Transparent topic checks, not a legal determination or a language model. */
window.JohnnyConstitution=(()=>{
 const version='all-amendment-checklist-20261118';
 const early='https://www.archives.gov/founding-docs/bill-of-rights-transcript';
 const later='https://www.archives.gov/founding-docs/amendments-11-27';
 const definitions=[
 [1,'Religion, expression, assembly and petition.',/speech|record|film|camera|protest|religio|retaliat|petition|complaint/i,'Check reported restrictions or retaliation.'],
 [2,'Keeping and bearing arms.',/firearm|pistol|rifle|weapon|\bgun\b/i,'Identify whose weapon and the conduct involved.'],
 [3,'Limits on quartering soldiers.',/quartering|soldiers?.*(?:home|house)/i,'Confirm whether quartering is actually alleged.'],
 [4,'Unreasonable searches and seizures; warrant requirements.',/stop|detain|search|seiz|traffic|pull.*over|frisk|force|touch|grab|tow|impound/i,'Ask the factual basis; examine scope, duration and force.'],
 [5,'Self-incrimination, due process, double jeopardy, takings and grand juries.',/question|answer|admi[ts]|silent|silence|identify|license|document|confess|propert|seiz|incrimin/i,'Separate required conduct from compelled testimony; identify missing facts.'],
 [6,'Criminal-prosecution counsel, trial and defense protections.',/arrest|handcuff|booking|charg|criminal|prosecut|trial|lawyer|attorney|counsel|court/i,'Confirm prosecution stage; questioning may also raise Fifth concerns.'],
 [7,'Federal civil-jury protections.',/civil.*(?:jury|trial|lawsuit)|suing|damages/i,'Confirm the proceeding and jurisdiction.'],
 [8,'Excessive bail, excessive fines and cruel punishment.',/bail|fine|ticket|fee|penalt|punish|sentence/i,'Preserve amounts, conditions and procedural stage.'],
 [9,'Other rights retained by the people.',null,'Consider retained rights; no blanket exemption is established.'],
 [10,'Powers reserved to states or people.',null,'Identify claimed government power and its limits.'],
 [11,'Limits certain federal suits against states.',/su(?:e|ing).*(?:state|government)|state.*immun/i,'Identify defendant and requested remedy.'],
 [12,'Presidential election procedures.',/president.*elect|electoral|electors/i,'Check only when electoral procedures are involved.'],
 [13,'Prohibits slavery and involuntary servitude, with a stated exception.',/slavery|slave|forced labo[u]?r|involuntary servitude|trafficking/i,'Describe the alleged compulsion precisely.'],
 [14,'Citizenship, state privileges, due process and equal protection.',/officer|police|sheriff|state|detain|handcuff|booking|unequal|discrimin|racial|citizen|tow|impound|property/i,'Identify actor, treatment and any liberty/property deprivation.'],
 [15,'Race-related voting protections.',/vot|ballot|polling/i,'Identify the voting restriction and asserted basis.'],
 [16,'Federal income-tax power.',/income tax|federal tax|irs/i,'Distinguish income taxes from tickets and fees.'],
 [17,'Direct election of senators.',/senat.*elect|elect.*senat/i,'Check when Senate elections are involved.'],
 [18,'Historical alcohol prohibition; repealed.',null,'Repealed by Amendment 21; not an operative prohibition.'],
 [19,'Sex-related voting protections.',/vot|ballot|polling/i,'Identify the restriction and asserted basis.'],
 [20,'Federal terms and succession timing.',/president.*term|inaugurat|congress.*term/i,'Check the federal office and timing.'],
 [21,'Repeals Amendment 18; addresses alcohol importation.',/alcohol|liquor|drunk|dui|dwi/i,'An alcohol topic does not establish a driving exemption.'],
 [22,'Presidential term limits.',/president.*term|third term/i,'Check only presidential eligibility issues.'],
 [23,'District of Columbia presidential electors.',/district of columbia.*(?:elect|vot)|dc.*elector/i,'Identify the electoral issue.'],
 [24,'Federal-election voting without poll taxes.',/poll tax|pay.*vot|vot.*tax/i,'Identify the voting condition; not every fee is a poll tax.'],
 [25,'Presidential succession and inability.',/president.*(?:incapac|inabil|success)|acting president/i,'Identify the federal succession issue.'],
 [26,'Voting-age protection beginning at eighteen.',/vot|ballot|polling/i,'Identify the age-related voting restriction.'],
 [27,'Timing of congressional pay changes.',/congress.*(?:pay|salary|compensation)/i,'Applies to congressional compensation changes.']
 ];
 const ordinals=['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth','thirteenth','fourteenth','fifteenth','sixteenth','seventeenth','eighteenth','nineteenth','twentieth','twenty-first','twenty-second','twenty-third','twenty-fourth','twenty-fifth','twenty-sixth','twenty-seventh'];
 const romans=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI','XXII','XXIII','XXIV','XXV','XXVI','XXVII'];
 const references=ordinals.map((word,i)=>new RegExp('\\b(?:amendment\\s*(?:'+(i+1)+'|'+romans[i]+')|'+(i+1)+'(?:st|nd|rd|th)?\\s+amendment|'+word.replace('-','[- ]')+'\\s+amendment)\\b','i'));
 function review(c){
  const reports=(c?.timeline||[]).filter(x=>x.who==='User'||x.kind==='rights-report');
  const account=reports.map(x=>x.text||'').join('\n');
  const items=definitions.map(([number,summary,pattern,prompt])=>{
   const baseline=number===9||number===10;
   const requested=references[number-1].test(account);
   const matched=requested||(number===4&&c?.type==='traffic')||!!pattern?.test(account);
   const status=number===18?'Historical / repealed':matched?'Review suggested':baseline?'Foundational cross-check':'Not raised in this account';
   return {number,summary,status,prompt:matched||baseline||number===18?(requested?'You requested review of this amendment. ':'')+prompt:'No matching topic reported; this is not a finding that the right is absent or unviolated.',source:number<=10?early:later};
  });
  return {version,reportCount:reports.length,items,flagged:items.filter(x=>x.status==='Review suggested').map(x=>x.number)};
 }
 function text(c){const r=review(c);return 'ALL-AMENDMENT TOPIC CHECKLIST\n'+r.version+'\nBrief issue spotting, not full text or a legal finding. Absence of a flagged topic does not rule out a violation.\n'+r.items.map(x=>`Amendment ${x.number}: ${x.summary}\n${x.status}. ${x.prompt}\n${x.source}`).join('\n\n')+'\n\nArticle VI cross-check: constitutional supremacy and officials\' oaths.\nhttps://www.archives.gov/founding-docs/constitution-transcript'}
 return {review,text,version};
})();
