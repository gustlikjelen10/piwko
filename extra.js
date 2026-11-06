/* Dodatki: przerwa, wspomnienia, wykresy, osiągnięcia, znajomi, eksport, edytor odznak.
   Korzysta z funkcji i zmiennych z głównego skryptu w index.html. */
const BADGES_DEFAULT=BADGES.slice();
let rkPeriod='count',rkCache=null,feedCache=null,bedList=[];
const dayNum=s=>Math.round(Date.parse(s+'T12:00:00Z')/864e5);
const yrs=y=>y===1?'Rok temu':(y%10>=2&&y%10<=4&&(y%100<12||y%100>14))?y+' lata temu':y+' lat temu';
const dd=k=>k.split('-').reverse().join('.');
const MSH=['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paź','lis','gru'];

/* ---- przerwa (dni bez piwa) ---- */
function gapInfo(){
  const ds=[...new Set(allDrinks().map(x=>x.d).filter(Boolean))].sort();
  if(!ds.length)return {cur:null,max:0};
  let max=0;for(let i=1;i<ds.length;i++)max=Math.max(max,dayNum(ds[i])-dayNum(ds[i-1])-1);
  const cur=Math.max(0,dayNum(today())-dayNum(ds[ds.length-1]));
  return {cur,max:Math.max(max,cur)};
}
function breakHTML(){
  const g=gapInfo();if(g.cur===null)return '';
  const msg=g.cur===0?'Dziś już było piwo 🍺':g.cur===1?'1 dzień bez piwa':g.cur+' dni bez piwa';
  return `<div class="panel"><div class="sub">Licznik przerwy</div><div class="big">🧘 ${msg}</div><div class="sub">Najdłuższa przerwa: ${g.max} ${g.max===1?'dzień':'dni'}</div></div>`;
}

/* ---- wspomnienia ---- */
function memoriesHTML(){
  const t=today(),md=t.slice(5),yr=+t.slice(0,4),L=allDrinks().filter(x=>x.d);
  const same=L.filter(x=>x.d.slice(5)===md&&+x.d.slice(0,4)<yr);
  if(same.length)return `<div class="panel"><h2>🕰️ Wspomnienia</h2>${same.map(x=>`<div>${yrs(yr-(+x.d.slice(0,4)))}: <b>${esc(x.b.nm)}</b>${x.b.rt?' ⭐'+x.b.rt+'/10':''}</div>`).join('')}</div>`;
  const old=L.filter(x=>dayNum(t)-dayNum(x.d)>=30);
  if(!old.length)return '';
  const x=old[dayNum(t)%old.length];
  return `<div class="panel"><h2>🕰️ Pamiętasz?</h2><div>${dd(x.d)}: <b>${esc(x.b.nm)}</b>${x.b.br?' ('+esc(x.b.br)+')':''}${x.b.rt?' ⭐'+x.b.rt+'/10':''}</div>${x.b.nt?'<div class="sub">'+esc(x.b.nt)+'</div>':''}</div>`;
}

/* ---- wykresy ---- */
function vbars(vals,labels,fmt){
  const mx=Math.max(1,...vals);
  return `<div class="vb">${vals.map((v,i)=>`<div class="vc"><span class="vn">${v?fmt(v):''}</span><i style="height:${Math.round(v/mx*100)}%"></i><span class="vl">${labels[i]}</span></div>`).join('')}</div>`;
}
function hbars(rows){
  const mx=Math.max(1,...rows.map(r=>r[1]));
  return rows.map(r=>`<div class="hb"><span class="hn">${esc(r[0])}</span><div class="ht"><i style="width:${Math.round(r[1]/mx*100)}%"></i></div><b>${r[1]}</b></div>`).join('');
}
function chartsHTML(){
  const L=allDrinks().filter(x=>x.d);if(!L.length)return '';
  const now=new Date(),keys=[],labels=[];
  for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);keys.push(d.getFullYear()+'-'+pad(d.getMonth()+1));labels.push(MSH[d.getMonth()]);}
  const cnt=keys.map(k=>L.filter(x=>x.d.startsWith(k)).length);
  const sp=keys.map(k=>Math.round(L.filter(x=>x.d.startsWith(k)).reduce((s,x)=>s+(+x.pr||0),0)));
  const sc={};L.forEach(x=>{const s=(x.b.st||'').trim();if(s)sc[s]=(sc[s]||0)+1;});
  const top=Object.entries(sc).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const rc=Array(10).fill(0);data.beers.forEach(b=>{if(+b.rt>=1&&+b.rt<=10)rc[+b.rt-1]++;});
  return `<div class="panel"><details open><summary>📈 Wykresy</summary>
    <div class="sub" style="margin-top:8px">Piwa w ostatnich 12 miesiącach</div>${vbars(cnt,labels,v=>v)}
    <div class="sub" style="margin-top:12px">Wydatki w ostatnich 12 miesiącach (zł)</div>${vbars(sp,labels,v=>v)}
    ${top.length?'<div class="sub" style="margin-top:12px">Najczęstsze style</div>'+hbars(top):''}
    <div class="sub" style="margin-top:12px">Rozkład ocen (liczba piw)</div>${vbars(rc,['1','2','3','4','5','6','7','8','9','10'],v=>v)}
  </details></div>`;
}

/* ---- osiągnięcia ---- */
function achCtx(){
  const B=data.beers,n=s=>String(s||'').trim().toLowerCase(),has=re=>B.some(b=>re.test(n(b.st)));
  const set=f=>new Set(B.map(b=>n(b[f])).filter(Boolean)).size;
  return {n:totalDrinks(),beers:B.length,styles:set('st'),brews:set('br'),cos:set('co'),notes:B.filter(b=>b.nt).length,photos:B.filter(b=>b.ph).length,
    ten:B.some(b=>+b.rt===10)?1:0,hunt:B.filter(b=>b.fw).length,rep:Math.max(0,...B.map(b=>drinks(b).length)),gap:gapInfo().max,
    ipa:has(/ipa/)?1:0,stout:has(/stout/)?1:0,sour:has(/sour|kwa|gose|lambic/)?1:0,wheat:has(/weiz|pszen|wit|hefe/)?1:0,lager:has(/lager|pils|jasne/)?1:0};
}
const ACH=[
 {id:'first',i:'🍺',n:'Pierwszy łyk',t:'Dodaj pierwsze piwo',k:'n',m:1},
 {id:'ipa',i:'🌿',n:'Chmielowy debiut',t:'Wypij pierwszą IPA',k:'ipa',m:1},
 {id:'stout',i:'☕',n:'Ciemna strona mocy',t:'Wypij pierwszego stouta',k:'stout',m:1},
 {id:'sour',i:'🍋',n:'Kwaśna mina',t:'Wypij pierwsze piwo kwaśne (sour, gose, lambic)',k:'sour',m:1},
 {id:'wheat',i:'🌾',n:'Pszeniczny wielbiciel',t:'Wypij pierwsze piwo pszeniczne',k:'wheat',m:1},
 {id:'lager',i:'🥇',n:'Klasyk gatunku',t:'Wypij pierwszego lagera lub pilsa',k:'lager',m:1},
 {id:'st5',i:'🎨',n:'Smakosz stylów',t:'Piwa w 5 różnych stylach',k:'styles',m:5},
 {id:'st10',i:'🧪',n:'Kolekcjoner stylów',t:'Piwa w 10 różnych stylach',k:'styles',m:10},
 {id:'br10',i:'🏭',n:'Znawca browarów',t:'Piwa z 10 różnych browarów',k:'brews',m:10},
 {id:'br25',i:'🏰',n:'Mistrz browarów',t:'Piwa z 25 różnych browarów',k:'brews',m:25},
 {id:'co5',i:'🌍',n:'Globtroter',t:'Piwa z 5 różnych krajów',k:'cos',m:5},
 {id:'b25',i:'📚',n:'Kolekcjoner',t:'25 różnych piw',k:'beers',m:25},
 {id:'b100',i:'🏛️',n:'Stulatek',t:'100 różnych piw',k:'beers',m:100},
 {id:'nt10',i:'📝',n:'Krytyk',t:'10 piw z opisem smaku',k:'notes',m:10},
 {id:'ph10',i:'📸',n:'Fotograf',t:'10 piw ze zdjęciem',k:'photos',m:10},
 {id:'ten',i:'💯',n:'Perfekcja',t:'Daj ocenę 10/10',k:'ten',m:1},
 {id:'hunt3',i:'🎯',n:'Łowca',t:'Upoluj 3 piwa z listy celów',k:'hunt',m:3},
 {id:'rep5',i:'🔁',n:'Stały bywalec',t:'To samo piwo 5 razy',k:'rep',m:5},
 {id:'g7',i:'🧘',n:'Tydzień przerwy',t:'7 dni bez piwa',k:'gap',m:7},
 {id:'g14',i:'🍃',n:'Dwa tygodnie',t:'14 dni bez piwa',k:'gap',m:14},
 {id:'g30',i:'🏔️',n:'Miesiąc przerwy',t:'30 dni bez piwa',k:'gap',m:30}
];
function achSet(){const c=achCtx();return new Set(ACH.filter(a=>c[a.k]>=a.m).map(a=>a.id));}
function achHTML(){
  const c=achCtx(),done=ACH.filter(a=>c[a.k]>=a.m).length;
  return `<div class="panel"><h2>🏆 Osiągnięcia (${done}/${ACH.length})</h2><div class="bgrid">${ACH.map(a=>{
    const v=Math.min(c[a.k],a.m),ok=c[a.k]>=a.m;
    return `<div class="bd ${ok?'':'lock'}"><div class="bigemo" style="font-size:40px">${a.i}</div><div><b>${a.n}</b></div><div class="sub">${a.t}</div>${ok?'<div class="sub">✅ zdobyte</div>':`<div class="bar" style="height:10px"><i style="width:${Math.round(v/a.m*100)}%"></i></div><div class="sub">${v}/${a.m}</div>`}</div>`;}).join('')}</div></div>`;
}

/* ---- znajomi ---- */
function friendsHTML(){
  if(!rkCache)return '<div class="msg">Ładuję…</div>';
  const P={count:'Ogółem',month:'Miesiąc',week:'Tydzień'},medal=['🥇','🥈','🥉'];
  const rows=[...rkCache].sort((a,b)=>b[rkPeriod]-a[rkPeriod]||b.count-a.count);
  const lead=rkPeriod!=='count'&&rows[0]&&rows[0][rkPeriod]>0?`<div class="sub" style="margin-bottom:6px">👑 ${rkPeriod==='week'?'Mistrz tygodnia':'Mistrz miesiąca'}: <b>${esc(rows[0].name)}</b> (${rows[0][rkPeriod]})</div>`:'';
  const rk=`<div class="panel"><h2>🏆 Ranking</h2><div class="tabs" style="margin:0 0 8px">${Object.keys(P).map(k=>`<button class="rkp ${k===rkPeriod?'on':''}" data-p="${k}">${P[k]}</button>`).join('')}</div>${lead}${rows.map((u,i)=>`<div class="tile" style="cursor:default"><span class="pl">${medal[i]||(i+1)+'.'}</span>${av(u.av,44)}<div class="ri"><b>${esc(u.name)}${u.id===me.id?' (Ty)':''}</b><small>${esc(RANKS[rankIndex(u.count)])}</small></div><div class="cnt">${u[rkPeriod]}<small style="font-size:14px"> 🍺</small></div></div>`).join('')}</div>`;
  const feed=feedCache&&feedCache.length?feedCache.map(f=>`<div class="card" style="cursor:default;transform:none">${f.ph?`<img class="th" style="width:56px;height:74px" src="${esc(f.ph)}" loading="lazy">`:'<div class="th ph" style="width:56px;height:74px">🍺</div>'}<div class="i"><div class="nm">${esc(f.nm)}</div><div class="sub">${esc([f.br,f.st].filter(Boolean).join(' · '))}</div><div class="sub">${esc(f.name)} · ${dd(f.d)}</div></div><div class="sc"><b>${f.rt||'–'}</b><span>/10</span></div></div>`).join(''):'<div class="msg">Na ścianie jeszcze pusto.</div>';
  return rk+'<div class="panel"><h2>🧱 Ściana znajomych</h2><div class="sub">Ostatnio wypite. Swoje piwa możesz ukryć w ⚙️ Moim profilu.</div></div>'+feed;
}
async function renderFriends(){
  try{
    const [rk,fd]=await Promise.all([api('/api/ranking?t='+Date.now()),api('/api/social',{method:'POST',headers:H(),body:JSON.stringify({action:'feed'})})]);
    rkCache=rk;feedCache=fd;
  }catch(e){if(tab==='friends')$('list').innerHTML='<div class="msg">Nie udało się wczytać: '+esc(e.message)+'</div>';return;}
  if(tab==='friends')render();
}
async function loadFriendRatings(b){
  const el=$('fr');el.textContent='';
  try{
    const r=await api('/api/social',{method:'POST',headers:H(),body:JSON.stringify({action:'ratings',nm:b.nm,br:b.br||''})});
    if(cur!==b)return;
    const rated=r.filter(x=>x.rt>0);
    el.textContent=rated.length?'👥 Znajomi ocenili: '+rated.map(x=>x.name+' '+x.rt+'/10').join(', ')+(rated.length>1?' · średnia '+(rated.reduce((s,x)=>s+x.rt,0)/rated.length).toFixed(1).replace('.',','):''):(r.length?'👥 Znajomi pili to piwo, ale jeszcze go nie ocenili.':'');
  }catch(_){}
}
async function openRec(){
  if(!cur)return;
  try{users=await api('/api/users');}catch(_){}
  const fr=users.filter(u=>u.id!==me.id);
  $('rcmList').innerHTML=fr.length?fr.map(u=>`<button type="button" class="tile" style="width:100%" data-id="${u.id}">${av(u.av,36)}<span class="ri"><b>${esc(u.name)}</b></span></button>`).join(''):'<div class="msg">Nie ma jeszcze innych użytkowników.</div>';
  $('rcm').classList.add('on');
}
document.getElementById('rec').onclick=openRec;
document.getElementById('rcmNo').onclick=()=>$('rcm').classList.remove('on');
document.getElementById('rcmList').onclick=async e=>{
  const t=e.target.closest('[data-id]');if(!t||!cur)return;const u=users.find(x=>x.id===t.dataset.id);if(!u)return;
  try{
    await api('/api/social',{method:'POST',headers:H(),body:JSON.stringify({action:'recommend',to:u.id,nm:cur.nm,br:cur.br,st:cur.st,nt:cur.rt?'Ocena polecającego: '+cur.rt+'/10':''})});
    $('rcm').classList.remove('on');toast('Polecone: '+u.name+' ✅');
  }catch(err){alert(err.message);}
};
async function refreshWish(){
  if(!me)return;
  try{const d=await api('/api/data',{headers:H()});
    if(JSON.stringify(d.wish)!==JSON.stringify(data.wish)){data.wish=d.wish;if(tab==='wish'||tab==='home')render();}}catch(_){}
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshWish();});

/* ---- eksport do Excela ---- */
async function loadXLSX(){
  if(window.XLSX)return window.XLSX;
  await new Promise((ok,err)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=ok;s.onerror=err;document.head.appendChild(s);});
  return window.XLSX;
}
async function exportXlsx(){
  const num=v=>v===''||v==null||isNaN(+v)?'':+v;
  const s1=[['Nazwa','Browar','Styl','Kraj','% alk.','Ocena (1-10)','Cena (zł)','Data pierwszego wypicia','Liczba wypić','Gdzie','Smak i wrażenia','Zdjęcie (link)']]
    .concat(data.beers.map(b=>[b.nm,b.br||'',b.st||'',b.co||'',num(b.ab),num(b.rt),num(b.pr),b.dt||'',drinks(b).length,b.pl||'',b.nt||'',b.ph||'']));
  const s2=[['Data','Piwo','Browar','Styl','Cena (zł)','Ocena']]
    .concat(allDrinks().sort((a,b)=>(b.d||'').localeCompare(a.d||'')).map(x=>[x.d||'',x.b.nm,x.b.br||'',x.b.st||'',num(x.pr),num(x.b.rt)]));
  const s3=[['Nazwa','Browar','Styl','Gdzie szukać / dlaczego']].concat(data.wish.map(w=>[w.nm,w.br||'',w.st||'',w.nt||'']));
  const fname='piwko-'+String(me.name).replace(/[^\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ-]+/g,'_')+'-'+today();
  try{
    const X=await loadXLSX(),wb=X.utils.book_new();
    X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet(s1),'Piwa');
    X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet(s2),'Wypicia');
    X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet(s3),'Lista celów');
    X.writeFile(wb,fname+'.xlsx');toast('Pobrano plik Excel 📥');
  }catch(_){
    const csv='\ufeff'+s2.map(r=>r.map(c=>'"'+String(c==null?'':c).replace(/"/g,'""')+'"').join(';')).join('\r\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=fname+'.csv';a.click();
    toast('Nie udało się wczytać modułu Excela, pobrano plik CSV (też otworzysz go w Excelu)');
  }
}
document.getElementById('pxl').onclick=exportXlsx;

/* ---- edytor odznak (admin) ---- */
const fmtDm=k=>k.slice(3)+'.'+k.slice(0,2);
function parseDates(s){
  const out=[];
  for(const p of String(s).split(/[,;]+/)){
    const t=p.trim();if(!t)continue;const m=t.match(/^(\d{1,2})\.(\d{1,2})$/);if(!m)return null;
    const d=+m[1],mo=+m[2],mx=[31,29,31,30,31,30,31,31,30,31,30,31][mo-1];
    if(!mx||d<1||d>mx)return null;out.push(pad(mo)+'-'+pad(d));
  }
  return out.length?out:null;
}
function drawBed(){
  $('bedRows').innerHTML=bedList.map((x,i)=>`<div class="panel" style="margin:0 0 8px"><div class="row"><input data-i="${i}" data-f="n" value="${esc(x.n)}" placeholder="Imię i nazwisko"><button type="button" class="d" data-del="${i}">🗑️</button></div>
    <input data-i="${i}" data-f="d" value="${esc(x.d)}" placeholder="Daty urodzin, np. 17.08 lub 30.11, 01.12" style="margin-top:6px">
    <textarea data-i="${i}" data-f="t" placeholder="Opis w oknie z odznaką" style="min-height:56px;margin-top:6px">${esc(x.t)}</textarea></div>`).join('')||'<div class="msg">Lista jest pusta.</div>';
}
async function openBed(){
  let list=null;
  try{const r=await api('/api/badgelist');list=r.list;}catch(_){}
  if(!list)list=BADGES_DEFAULT;
  bedList=list.map(x=>({n:x.n,d:x.d.map(fmtDm).join(', '),t:x.t||''}));
  drawBed();$('bed').classList.add('on');
}
document.getElementById('bedRows').oninput=e=>{const i=e.target.dataset.i;if(i!==undefined)bedList[+i][e.target.dataset.f]=e.target.value;};
document.getElementById('bedRows').onclick=e=>{const b=e.target.closest('[data-del]');if(!b)return;const i=+b.dataset.del;if(confirm('Usunąć „'+bedList[i].n+'” z listy?')){bedList.splice(i,1);drawBed();}};
document.getElementById('bedAdd').onclick=()=>{bedList.unshift({n:'',d:'',t:''});drawBed();$('bed').scrollTo(0,0);};
document.getElementById('bedx').onclick=()=>$('bed').classList.remove('on');
document.getElementById('bedSave').onclick=async()=>{
  const list=[];
  for(const x of bedList){
    const d=parseDates(x.d);
    if(!x.n.trim()||!d){alert('Popraw wpis: „'+(x.n||'(bez nazwy)')+'”. Potrzebne imię i daty w formacie dd.mm, np. 17.08');return;}
    list.push({n:x.n.trim(),d,t:x.t.trim()});
  }
  try{const r=await adm('saveBadges',{list});toast('Zapisano '+r.count+' odznak ✅');}catch(e){alert(e.message);}
};
document.getElementById('bedReset').onclick=async()=>{
  if(!confirm('Przywrócić domyślną listę odznak z pliku? Twoje zmiany z edytora zostaną usunięte.'))return;
  try{await adm('resetBadges');await openBed();toast('Przywrócono listę domyślną');}catch(e){alert(e.message);}
};
