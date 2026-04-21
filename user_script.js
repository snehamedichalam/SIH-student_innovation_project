// Simple SPA state
const S = {
  user: JSON.parse(localStorage.getItem('cit_user')||'null'),
  lang: localStorage.getItem('cit_lang') || 'English',
  chosenService: null,
  cases: JSON.parse(localStorage.getItem('cit_cases')||'[]'),
  wallet: JSON.parse(localStorage.getItem('cit_wallet')||'[]'),
  profiles: JSON.parse(localStorage.getItem('cit_profiles')||'[{"name":"You","phone":"98•••"}]'),
  selectedSlot: null,
};

function go(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(id==='dashboard') renderDashboard();
  if(id==='wallet') renderWallet();
  if(id==='helper') renderProfiles();
  if(id==='services') updateServiceSel();
  if(id==='form') setupForm();
  if(id==='queue') setupQueue();
  if(id==='status') document.getElementById('statusResult').textContent='Enter your phone or token to view status.';
}

function toggleTheme(){ document.body.classList.toggle('light'); }

function setLang(v){ S.lang=v; localStorage.setItem('cit_lang', v); }

// Register / OTP
function sendOtp(){
  const name = document.getElementById('regName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const lang = document.getElementById('regLang').value;
  if(!name || !phone){ alert('Please enter name & phone'); return; }
  S._otp = '123456';
  document.getElementById('otpBox').classList.remove('hide');
  S._tmp = {name, phone, lang, consents:[
    document.getElementById('c1').checked,
    document.getElementById('c2').checked,
    document.getElementById('c3').checked
  ]};
}

function verifyOtp(){
  const otp = document.getElementById('otp').value.trim();
  if(otp !== S._otp){ alert('Invalid OTP (hint: 123456)'); return; }
  S.user = { ...S._tmp, id: 'U'+Date.now() };
  localStorage.setItem('cit_user', JSON.stringify(S.user));
  document.getElementById('loginBtn').textContent = S.user.name.split(' ')[0];
  go('dashboard');
}

// Services
function chooseService(s){ S.chosenService=s; updateServiceSel(); }
function updateServiceSel(){
  document.getElementById('selService').textContent = S.chosenService || '—';
  document.getElementById('goForm').disabled = !S.chosenService;
}

// Form
function setupForm(){
  document.getElementById('svcTitle').textContent = S.chosenService || 'Demo';
  const fN = document.getElementById('fName');
  const fD = document.getElementById('fDob');
  const fA = document.getElementById('fAddr');
  [fN,fD,fA].forEach(inp=> inp.addEventListener('input', validateForm));
  validateForm();
}
function autofill(){
  if(S.user){
    document.getElementById('fName').value = S.user.name;
    document.getElementById('fAddr').value = 'Kothapet, Hyderabad';
    document.getElementById('fDob').value = '1999-01-10';
    validateForm();
  } else alert('Login first');
}
function validateForm(){
  const name = document.getElementById('fName').value.trim();
  const dob = document.getElementById('fDob').value;
  const addr = document.getElementById('fAddr').value.trim();
  document.getElementById('pvName').textContent = 'Name: ' + (name||'—');
  document.getElementById('pvDob').textContent = 'DOB: ' + (dob||'—');
  document.getElementById('pvAddr').textContent = 'Address: ' + (addr||'—');
  document.getElementById('toQueueBtn').disabled = !(name && dob && addr);
}
function toQueue(){ go('queue'); }

// Queue
function setupQueue(){
  const bars = document.getElementById('qBars');
  const hours = ['9','10','11','12','13','14','15','16'];
  const vals = [80,70,60,40,30,22,24,35];
  bars.innerHTML = '';
  const max = Math.max(...vals);
  hours.forEach((h,i)=>{
    const d = document.createElement('div');
    d.className = 'bars';
  });
  hours.forEach((h,i)=>{
    const b = document.createElement('div');
    b.style.height = (40 + (vals[i]/max)*140)+'px';
    b.style.background = 'var(--g1)';
    b.style.borderRadius = '12px';
    b.style.boxShadow = 'inset 0 -10px 20px rgba(0,0,0,.2)';
    b.title = h;
    const wrap = document.createElement('div');
    wrap.style.display='flex'; wrap.style.flexDirection='column'; wrap.style.alignItems='center';
    wrap.appendChild(b);
    const lbl = document.createElement('div'); lbl.textContent=h; lbl.style.color='var(--muted)'; lbl.style.marginTop='6px'; lbl.style.fontSize='12px';
    wrap.appendChild(lbl);
    bars.appendChild(wrap);
  });

  const slots = ['12:15','12:45','13:15','13:45','14:15','14:45','15:15','15:45'];
  const list = document.getElementById('slotList'); list.innerHTML='';
  slots.forEach(t=>{
    const el = document.createElement('div');
    el.className = 'slot'; el.textContent = t;
    el.onclick = ()=>{
      document.querySelectorAll('.slot').forEach(s=>s.classList.remove('active'));
      el.classList.add('active'); S.selectedSlot=t;
      document.getElementById('bookBtn').disabled=false;
    };
    list.appendChild(el);
  });
}

function bookSlot(){
  const smart = document.getElementById('smartNotify')?.checked;
  const token = 'CX-' + Math.floor(10000 + Math.random()*89999);
  const sms = '' + Math.floor(10000 + Math.random()*89999);
  // Save case & wallet item
  const caseItem = { service:S.chosenService, status:'Booked', slot:S.selectedSlot, token };
  S.cases.unshift(caseItem);
  localStorage.setItem('cit_cases', JSON.stringify(S.cases));
  S.wallet.unshift({ title:S.chosenService, ref:token, type:'Token'});
  localStorage.setItem('cit_wallet', JSON.stringify(S.wallet));
  // Start queue notifications
  if(smart){ startTracker(token, 'Today, ' + S.selectedSlot); }
  // Show QR
  document.getElementById('qrToken').textContent = token;
  document.getElementById('qrSlot').textContent = 'Today, ' + S.selectedSlot;
  document.getElementById('qrSms').textContent = sms;
  document.getElementById('qrModal').classList.remove('hide');
  renderDashboard(); renderWallet();
}

function closeQR(){ document.getElementById('qrModal').classList.add('hide'); go('dashboard'); }

// Dashboard render
function renderDashboard(){
  document.getElementById('loginBtn').textContent = S.user ? (S.user.name.split(' ')[0]) : 'Register / Login';
  document.getElementById('kForms').textContent = S.cases.filter(c=>c.status==='In Progress').length;
  document.getElementById('kDone').textContent = S.cases.filter(c=>c.status==='Completed').length;
  document.getElementById('kNext').textContent = S.cases.find(c=>c.status==='Booked')?.slot || '—';

  const list = document.getElementById('caseList'); list.innerHTML='';
  S.cases.slice(0,6).forEach(c=>{
    const li = document.createElement('li');
    li.innerHTML = `<div><b>${c.service}</b><div class="muted">${c.status} • ${c.slot||'—'} • ${c.token||''}</div></div>
    <button class="chip" onclick="go('wallet')">Open</button>`;
    list.appendChild(li);
  });
  // Sparklines = simple moving background stripes already in CSS.
}

// Wallet
function renderWallet(){
  const wrap = document.getElementById('walletList'); wrap.innerHTML='';
  S.wallet.slice(0,6).forEach(w=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `<div class="card-title">${w.title}</div>
      <div class="muted">Ref: ${w.ref}</div>
      <div class="row"><button class="chip" onclick="document.getElementById('qrModal').classList.remove('hide'); document.getElementById('qrToken').textContent='${w.ref}'; document.getElementById('qrSlot').textContent='Saved Pass'; document.getElementById('qrSms').textContent='—';">Show QR</button>
      <button class="chip">Download</button></div>`;
    wrap.appendChild(card);
  });
}

// Helper Mode
function renderProfiles(){
  const ul = document.getElementById('profList'); ul.innerHTML='';
  S.profiles.forEach(p=>{
    const li = document.createElement('li');
    li.innerHTML = `<div>${p.name} — ${p.phone}</div><button class="chip">Manage</button>`;
    ul.appendChild(li);
  });
  const sel = document.getElementById('actOn'); sel.innerHTML='';
  S.profiles.forEach((p,i)=>{
    const opt = document.createElement('option'); opt.value=i; opt.textContent=p.name + ' ('+p.phone+')';
    sel.appendChild(opt);
  });
}
function addProfile(){
  const n = document.getElementById('profName').value.trim();
  const ph = document.getElementById('profPhone').value.trim();
  if(!n || !ph){ alert('Enter name & phone'); return; }
  S.profiles.push({name:n, phone:ph});
  localStorage.setItem('cit_profiles', JSON.stringify(S.profiles));
  document.getElementById('profName').value=''; document.getElementById('profPhone').value='';
  renderProfiles();
}

// Status
function checkStatus(){
  const q = document.getElementById('statusInput').value.trim();
  if(!q){ alert('Enter phone or token'); return; }
  const byToken = S.cases.find(c=> (c.token||'').toLowerCase()===q.toLowerCase());
  const res = byToken || S.cases[0];
  document.getElementById('statusResult').innerHTML = res ?
    `<b>${res.service}</b><div class="muted">${res.status} • ${res.slot||'—'} • ${res.token||''}</div>` :
    'No records found yet.';
}

// Init
window.addEventListener('load', ()=>{
  document.getElementById('langSel').value = S.lang;
  document.getElementById('loginBtn').textContent = S.user ? (S.user.name.split(' ')[0]) : 'Register / Login';
});


// === Smart Queue Notifications (minimal) ===
const N = {
  inbox: JSON.parse(localStorage.getItem('cit_notify')||'[]'),
  trackers: JSON.parse(localStorage.getItem('cit_trackers')||'[]'), // [{token, ahead, slot, active}]
  timer: null,
};

function pushNotif(msg, type='ok'){
  const item = { msg, type, ts: Date.now() };
  N.inbox.unshift(item);
  localStorage.setItem('cit_notify', JSON.stringify(N.inbox));
  renderInbox();
  const wrap = document.getElementById('toastWrap');
  if(wrap){ const t=document.createElement('div'); t.className='toast'+(type==='warn'?' warn':type==='bad'?' danger':''); t.textContent=msg; wrap.appendChild(t); setTimeout(()=>t.remove(), 3800); }
}

function renderInbox(){
  const ul = document.getElementById('inboxList'); if(!ul) return;
  ul.innerHTML='';
  N.inbox.slice(0,25).forEach(n=>{
    const li = document.createElement('li'); li.className='inbox-item';
    li.innerHTML = `<div>${n.msg}</div><time>${new Date(n.ts).toLocaleTimeString()}</time>`;
    ul.appendChild(li);
  });
  const bell = document.getElementById('bellCount'); if(bell) bell.textContent = N.inbox.length;
}
function toggleInbox(){ const el=document.getElementById('inbox'); if(el) el.classList.toggle('hide'); }
function clearInbox(){ N.inbox=[]; localStorage.setItem('cit_notify','[]'); renderInbox(); }

function startTracker(token, slot){
  const tracker = { token, slot, ahead: Math.floor(14 + Math.random()*12), active:true };
  N.trackers = N.trackers.filter(t=>t.token!==token); N.trackers.unshift(tracker);
  localStorage.setItem('cit_trackers', JSON.stringify(N.trackers));
  pushNotif(`Slot booked for ${slot}. Currently ~${tracker.ahead} ahead. We'll ping you when close.`, 'warn');
  scheduleTicker();
}

function scheduleTicker(){
  if(N.timer) return;
  N.timer = setInterval(()=>{
    if(N.trackers.length===0){ clearInterval(N.timer); N.timer=null; return; }
    N.trackers.forEach(t=>{
      if(!t.active) return;
      const drop = Math.random()<0.7 ? Math.floor(1 + Math.random()*3) : 0;
      t.ahead = Math.max(0, t.ahead - drop);
      if(t.ahead>10){ if(Math.random()<0.4) pushNotif(`Still crowded near your counter. ~${t.ahead} ahead. Come after 20 mins.`, 'warn'); }
      else if(t.ahead>5){ if(Math.random()<0.6) pushNotif(`Getting closer: ~${t.ahead} ahead. Start towards the office in ~10 mins.`, 'ok'); }
      else if(t.ahead>2){ pushNotif(`${t.ahead} more in the queue. Please reach the counter.`, 'ok'); }
      else if(t.ahead>0){ pushNotif(`Almost your turn—${t.ahead} ahead. Be at the counter.`, 'ok'); }
      else { pushNotif(`It's your turn now! Proceed to the counter for token ${t.token}.`, 'bad'); t.active=false; }
    });
    localStorage.setItem('cit_trackers', JSON.stringify(N.trackers));
  }, 20000); // every ~20s
}

window.addEventListener('load', ()=> { renderInbox(); if(N.trackers.some(t=>t.active)) scheduleTicker(); });

/* === Add-on: Voice & Location === */
(function(){
  // Toast helper (use existing if available)
  function ADD_toast(msg){ try{ pushNotif(msg,'ok'); }catch(e){ console.log('[INFO]', msg); } }

  // ---- Location Settings (namespaced) ----
  const ADD_OFFICES = {
    rto_lb: { name: 'RTO LB Nagar', lat: 17.3575, lon: 78.5576 },
    pass_kendra: { name: 'Passport Kendra, Ameerpet', lat: 17.4381, lon: 78.4489 },
    osmania_hosp: { name: 'Osmania General Hospital', lat: 17.3715, lon: 78.4803 },
  };
  const ADD_STORE_KEY = 'add_loc_settings_v1';

  function ADD_LOC_get(){
    try{ return JSON.parse(localStorage.getItem(ADD_STORE_KEY)||'{}'); }catch{ return {}; }
  }
  function ADD_LOC_set(v){
    localStorage.setItem(ADD_STORE_KEY, JSON.stringify(v||{}));
  }
  function ADD_LOC_open(){
    const m = document.getElementById('ADD_locModal'); if(!m) return;
    // populate offices
    const sel = document.getElementById('ADD_defOffice'); if(sel){ sel.innerHTML=''; Object.entries(ADD_OFFICES).forEach(([k,v])=>{ const o=document.createElement('option'); o.value=k; o.textContent=v.name; sel.appendChild(o); }); }
    // load saved
    const saved = ADD_LOC_get();
    const lat = document.getElementById('ADD_locLat'); const lon = document.getElementById('ADD_locLon');
    if(lat) lat.value = saved.lat ?? '';
    if(lon) lon.value = saved.lon ?? '';
    if(sel) sel.value = saved.officeKey || 'rto_lb';
    document.getElementById('ADD_locInfo').textContent = saved.lat && saved.lon ? `Saved: ${(+saved.lat).toFixed(5)}, ${(+saved.lon).toFixed(5)} • ${ADD_OFFICES[sel.value]?.name}` : `Saved office: ${ADD_OFFICES[sel.value]?.name} • No coords saved`;
    m.classList.remove('ADD_hide');
  }
  function ADD_LOC_close(){ const m = document.getElementById('ADD_locModal'); if(m) m.classList.add('ADD_hide'); }
  function ADD_LOC_useCurrent(){
    const info = document.getElementById('ADD_locInfo');
    if(!('geolocation' in navigator)){ if(info) info.textContent='Geolocation not supported.'; return; }
    if(info) info.textContent='Fetching your location...';
    navigator.geolocation.getCurrentPosition((pos)=>{
      document.getElementById('ADD_locLat').value = pos.coords.latitude.toFixed(6);
      document.getElementById('ADD_locLon').value = pos.coords.longitude.toFixed(6);
      if(info) info.textContent='Location captured. Click Save.';
    }, ()=>{ if(info) info.textContent='Could not get location. Please allow permission and retry.'; }, { enableHighAccuracy:true, timeout:8000 });
  }
  function ADD_LOC_save(){
    const lat = parseFloat(document.getElementById('ADD_locLat').value);
    const lon = parseFloat(document.getElementById('ADD_locLon').value);
    const officeKey = document.getElementById('ADD_defOffice').value || 'rto_lb';
    const v = { lat: isFinite(lat)?lat:null, lon: isFinite(lon)?lon:null, officeKey };
    ADD_LOC_set(v);
    const info = document.getElementById('ADD_locInfo');
    if(info) info.textContent = v.lat && v.lon ? `Saved: ${(+v.lat).toFixed(5)}, ${(+v.lon).toFixed(5)} • ${ADD_OFFICES[officeKey]?.name}` : `Saved office: ${ADD_OFFICES[officeKey]?.name} • No coords saved`;
    ADD_toast('Location settings saved.');
  }
  // expose
  window.ADD_LOC_open = ADD_LOC_open;
  window.ADD_LOC_close = ADD_LOC_close;
  window.ADD_LOC_useCurrent = ADD_LOC_useCurrent;
  window.ADD_LOC_save = ADD_LOC_save;

  // ---- Voice Assistant (namespaced, browser-only) ----
  const ADD_STR = {
    'en-IN': {
      name:'Please say your full name.',
      dob:'Say your date of birth in year dash month dash day. For example, 1999 dash 01 dash 10.',
      addr:'Please dictate your address.',
      done:'All fields captured. Review and submit.',
      test:'Voice check. If you can hear this, text to speech is working.',
      listen:'Listening for 5 seconds... please say something.',
      no:'No speech detected. Try again closer to the mic.',
      err:'Listen error: ',
      opened:'Voice Assistant opened.'
    },
    'hi-IN': {
      name:'कृपया अपना पूरा नाम बताइए।',
      dob:'अपनी जन्म तिथि वर्ष- माह- दिन के रूप में बताइए। उदाहरण: 1999-01-10।',
      addr:'कृपया अपना पता बताइए।',
      done:'सभी फ़ील्ड भर दिए गए हैं। कृपया जाँच कर सबमिट करें।',
      test:'आवाज़ जाँच: यदि आप यह सुन रहे हैं तो TTS काम कर रहा है।',
      listen:'5 सेकंड तक सुन रहा हूँ... कृपया कुछ बोलें।',
      no:'कोई आवाज़ नहीं मिली। कृपया फिर से प्रयास करें।',
      err:'सुनने में त्रुटि: ',
      opened:'वॉइस असिस्टेंट खोला गया।'
    },
    'te-IN': {
      name:'దయచేసి మీ పూర్తి పేరు చెప్పండి.',
      dob:'మీ పుట్టిన తేదీని సంవత్సరం-నెల-తేదీ రూపంలో చెప్పండి. ఉదా: 1999-01-10.',
      addr:'దయచేసి మీ చిరునామా చెప్పండి.',
      done:'అన్ని వివరాలు పొందాయి. దయచేసి చెక్ చేసి సమర్పించండి.',
      test:'వాయిస్ చెక్: ఇది వినిపిస్తే TTS సక్రమంగా పనిచేస్తోంది.',
      listen:'5 సెకన్ల పాటు వింటున్నాను... దయచేసి ఏదైనా చెప్పండి.',
      no:'శబ్దం వినిపించలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.',
      err:'వినడంలో లోపం: ',
      opened:'వాయిస్ అసిస్టెంట్ తెరిచారు.'
    }
  };
  function TL(key){
    const code = document.getElementById('ADD_vaLang')?.value || 'en-IN';
    const dict = ADD_STR[code] || ADD_STR['en-IN']; return dict[key] || key;
  }

  let ADD_synth = window.speechSynthesis || null;
  let ADD_rec = null;
  let ADD_running = false;

  function ADD_VA_open(){
    const m=document.getElementById('ADD_vaModal'); if(!m) return;
    // voices
    ADD_VA_loadVoices();
    // default language is English; user may change
    const st=document.getElementById('ADD_vaStatus'); if(st) st.textContent = TL('opened');
    m.classList.remove('ADD_hide');
  }
  function ADD_VA_close(){ const m=document.getElementById('ADD_vaModal'); if(m) m.classList.add('ADD_hide'); ADD_VA_stop(); }
  function ADD_VA_loadVoices(){
    const sel = document.getElementById('ADD_vaVoice'); if(!sel) return;
    const voices = ADD_synth ? ADD_synth.getVoices() : [];
    sel.innerHTML='';
    voices.forEach(v=>{ const o=document.createElement('option'); o.value=v.name; o.textContent=`${v.name} — ${v.lang}`; sel.appendChild(o); });
  }
  if(ADD_synth){ window.speechSynthesis.onvoiceschanged = ADD_VA_loadVoices; }

  function ADD_VA_speak(text){
    if(!ADD_synth) return;
    const lang = document.getElementById('ADD_vaLang')?.value || 'en-IN';
    const voiceName = document.getElementById('ADD_vaVoice')?.value;
    const u = new SpeechSynthesisUtterance(text); u.lang = lang;
    if(voiceName){ const v = ADD_synth.getVoices().find(v=>v.name===voiceName); if(v) u.voice = v; }
    ADD_synth.cancel(); ADD_synth.speak(u);
  }
  function ADD_VA_listenOnce(){
    return new Promise((resolve,reject)=>{
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if(!SR) return reject('Speech recognition not supported');
      const rec = new SR(); ADD_rec = rec;
      rec.lang = document.getElementById('ADD_vaLang')?.value || 'en-IN';
      rec.interimResults = false; rec.maxAlternatives = 1;
      rec.onresult = (e)=> resolve(e.results[0][0].transcript);
      rec.onerror = (e)=> reject(e.error||'mic_error');
      rec.onend = ()=>{};
      rec.start();
    });
  }

  async function ADD_VA_start(){
    if(ADD_running) return; ADD_running = true;
    const st = document.getElementById('ADD_vaStatus');
    try{
      ADD_VA_speak(TL('name')); const name = await ADD_VA_listenOnce();
      ADD_FILL_fields('name', name);

      ADD_VA_speak(TL('dob')); let dob = await ADD_VA_listenOnce();
      dob = (dob||'').replace(/\s+/g,'').replace(/[^\d-]/g,''); ADD_FILL_fields('dob', dob);

      ADD_VA_speak(TL('addr')); const addr = await ADD_VA_listenOnce();
      ADD_FILL_fields('addr', addr);

      ADD_VA_speak(TL('done'));
      if(st) st.textContent = 'Captured: Name, DOB, Address.';
      ADD_toast('Form filled by voice');
    }catch(e){
      if(st) st.textContent = TL('err') + e;
    }finally{ ADD_running = false; }
  }
  function ADD_VA_stop(){ try{ if(ADD_rec && ADD_rec.stop) ADD_rec.stop(); }catch{} try{ if(ADD_synth) ADD_synth.cancel(); }catch{} ADD_running=false; }

  async function ADD_VA_testSpeak(){ ADD_VA_speak(TL('test')); }
  async function ADD_VA_testListen(){
    const st = document.getElementById('ADD_vaStatus'); if(st) st.textContent = TL('listen');
    try{
      const text = await Promise.race([ ADD_VA_listenOnce(), new Promise((_,rej)=> setTimeout(()=>rej('timeout'), 6000)) ]);
      if(st) st.textContent = 'Heard: ' + text;
    }catch(e){ if(st) st.textContent = e==='timeout' ? TL('no') : (TL('err') + e); }
  }

  // Fill helper (non-destructive; tries common ids/labels)
  function ADD_FILL_fields(kind, value){
    const ids = { name:['fName','name','fullName'], dob:['fDob','dob','dateOfBirth'], addr:['fAddr','addr','address'] }[kind] || [];
    for(const id of ids){ const el = document.getElementById(id); if(el){ el.value = value||''; return; } }
    // fallback: first matching input by placeholder
    const hint = kind==='name' ? /name/i : kind==='dob' ? /(dob|birth|yyyy|date)/i : /(addr|address)/i;
    const inputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'));
    const el2 = inputs.find(i=> hint.test(i.placeholder||'') || hint.test(i.name||''));
    if(el2) el2.value = value||'';
  }

  // Expose minimal API
  window.ADD_VA_open = ADD_VA_open;
  window.ADD_VA_close = ADD_VA_close;
  window.ADD_VA_start = ADD_VA_start;
  window.ADD_VA_stop = ADD_VA_stop;
  window.ADD_VA_testSpeak = ADD_VA_testSpeak;
  window.ADD_VA_testListen = ADD_VA_testListen;

  // done
})();
/* WAL4 */
(function(){
  const OFFICES = {
    rto_lb: { name: 'RTO LB Nagar', lat: 17.3575, lon: 78.5576 },
    pass_kendra: { name: 'Passport Kendra, Ameerpet', lat: 17.4381, lon: 78.4489 },
    osmania_hosp: { name: 'Osmania General Hospital', lat: 17.3715, lon: 78.4803 },
  };
  const KEY = 'wal4_places_v1';
  const LOC_KEY = 'add_loc_settings_v1'; // used by STA3_useSaved()

  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch{ return {}; } }
  function save(obj){ localStorage.setItem(KEY, JSON.stringify(obj||{})); }

  function open(){ render(); document.getElementById('WAL4_modal').classList.remove('WAL4_hide'); }
  function close(){ document.getElementById('WAL4_modal').classList.add('WAL4_hide'); }

  function render(){
    const st = load();
    document.getElementById('WAL4_home_lat').value = st.home?.lat ?? '';
    document.getElementById('WAL4_home_lon').value = st.home?.lon ?? '';
    document.getElementById('WAL4_work_lat').value = st.work?.lat ?? '';
    document.getElementById('WAL4_work_lon').value = st.work?.lon ?? '';

    const info = document.getElementById('WAL4_nearby_info');
    info.textContent = 'No location yet. Save Home/Work or use GPS.';
    document.getElementById('WAL4_nearby_list').innerHTML = '';
  }

  function useGPS(which){
    const latEl = document.getElementById(which==='home' ? 'WAL4_home_lat' : 'WAL4_work_lat');
    const lonEl = document.getElementById(which==='home' ? 'WAL4_home_lon' : 'WAL4_work_lon');
    const info = document.getElementById('WAL4_nearby_info');
    if(!('geolocation' in navigator)){ info.textContent='Geolocation not supported.'; return; }
    info.textContent='Fetching your location...';
    navigator.geolocation.getCurrentPosition((pos)=>{
      latEl.value = pos.coords.latitude.toFixed(6);
      lonEl.value = pos.coords.longitude.toFixed(6);
      info.textContent='Location captured. Click Save.';
    }, ()=> info.textContent='Could not get location. Please allow permission.', { enableHighAccuracy:true, timeout:8000 });
  }

  function savePlace(which){
    const st = load();
    const lat = parseFloat(document.getElementById(which==='home' ? 'WAL4_home_lat' : 'WAL4_work_lat').value);
    const lon = parseFloat(document.getElementById(which==='home' ? 'WAL4_home_lon' : 'WAL4_work_lon').value);
    st[which] = { lat: isFinite(lat)?lat:null, lon: isFinite(lon)?lon:null };
    save(st);
    tip('Saved '+which+'.');
  }

  function useAsCurrent(which){
    const st = load(); const p = st[which];
    if(!p || !p.lat || !p.lon){ tip('No '+which+' saved.'); return; }
    // write to LOC_KEY so STA3_useSaved can pick it up
    localStorage.setItem(LOC_KEY, JSON.stringify({ lat:p.lat, lon:p.lon, officeKey:'rto_lb' }));
    tip('Set '+which+' as current for Advisor.');
  }

  function distKm(a,b){ const R=6371, toRad=(d)=>d*Math.PI/180; const dLat=toRad(b.lat-a.lat), dLon=toRad(b.lon-a.lon); const A=Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)**2; return 2*R*Math.atan2(Math.sqrt(A), Math.sqrt(1-A)); }

  function getCurrentBase(){
    // Prefer Home, else Work, else null (user can use GPS in Nearby)
    const st = load();
    if(st.home?.lat && st.home?.lon) return { src:'home', lat:st.home.lat, lon:st.home.lon };
    if(st.work?.lat && st.work?.lon) return { src:'work', lat:st.work.lat, lon:st.work.lon };
    return null;
  }

  function refreshNearby(){
    const info = document.getElementById('WAL4_nearby_info');
    const list = document.getElementById('WAL4_nearby_list');
    list.innerHTML='';
    const base = getCurrentBase();
    const fill = (origin)=>{
      const arr = Object.entries(OFFICES).map(([k,v])=> ({ key:k, name:v.name, lat:v.lat, lon:v.lon, d: distKm({lat:origin.lat,lon:origin.lon}, v) }));
      arr.sort((a,b)=> a.d - b.d);
      info.textContent = `From ${origin.src}: ${origin.lat.toFixed(5)}, ${origin.lon.toFixed(5)}`;
      arr.forEach(o=>{
        const row = document.createElement('div'); row.className='WAL4_item';
        row.innerHTML = `<div><div class="WAL4_item_name">${o.name}</div><div class="WAL4_muted">${o.d.toFixed(1)} km</div></div>`;
        const go = document.createElement('button'); go.className='WAL4_btn WAL4_primary'; go.textContent='Send to Advisor'; go.onclick = ()=> pickOffice(o.key, origin);
        row.appendChild(go); list.appendChild(row);
      });
    };
    if(base){ fill(base); }
    else{
      // try GPS
      if(!('geolocation' in navigator)){ info.textContent='No saved places. Geolocation not supported.'; return; }
      info.textContent='Fetching your location...';
      navigator.geolocation.getCurrentPosition((pos)=> fill({ src:'gps', lat:pos.coords.latitude, lon:pos.coords.longitude }), ()=> info.textContent='Could not get location. Save Home/Work first.', { enableHighAccuracy:true, timeout:8000 });
    }
  }

  function pickOffice(officeKey, origin){
    // save current origin for Advisor
    localStorage.setItem(LOC_KEY, JSON.stringify({ lat:origin.lat, lon:origin.lon, officeKey }));
    // also set the Advisor select if present
    const sel = document.getElementById('STA3_office'); if(sel) sel.value = officeKey;
    tip('Office sent to Advisor.');
  }

  function sendToAdvisor(){
    // Ensure queue prefs applied
    const q = document.getElementById('WAL4_queue')?.value || '30';
    const mpp = document.getElementById('WAL4_mpp')?.value || '3';
    const spd = document.getElementById('WAL4_speed')?.value || '22';
    // Open Advisor if present
    if(window.STA3_open) STA3_open();
    // Apply values if fields exist
    const qEl = document.getElementById('STA3_queue'); if(qEl) qEl.value = q;
    const mEl = document.getElementById('STA3_mpp'); if(mEl) mEl.value = mpp;
    const sEl = document.getElementById('STA3_speed'); if(sEl) sEl.value = spd;
    // Use saved location and calculate
    if(window.STA3_useSaved) STA3_useSaved();
    if(window.STA3_calc) STA3_calc();
    const msg = document.getElementById('WAL4_msg'); if(msg) msg.textContent = 'Advisor updated. Check the ⏱ modal.';
  }

  function tip(t){ try{ pushNotif(t,'ok'); }catch{ console.log('[WAL4]', t); } }

  // Expose
  window.WAL4_open = open;
  window.WAL4_close = close;
  window.WAL4_save = savePlace;
  window.WAL4_useGPS = useGPS;
  window.WAL4_useAsCurrent = useAsCurrent;
  window.WAL4_refreshNearby = refreshNearby;
  window.WAL4_sendToAdvisor = sendToAdvisor;
})();


// ===== Camera / Capture =====
let CAM = { stream:null, facing:'environment', mode:'document', deviceId:null, docs:[], selfie:null };

async function enumerateCameras(){
  try{
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter(d=>d.kind==='videoinput');
    const sel = document.getElementById('camSelect');
    sel.innerHTML = '';
    cams.forEach((d,i)=>{
      const opt = document.createElement('option');
      opt.value = d.deviceId;
      opt.textContent = d.label || `Camera ${i+1}`;
      sel.appendChild(opt);
    });
    if(cams[0]) CAM.deviceId = cams[0].deviceId;
    sel.onchange = (e)=>{ CAM.deviceId = e.target.value; startCamera(true); };
  }catch(e){ console.warn('enumerate error', e); }
}

async function startCamera(restart=false){
  try{
    if(restart) stopCamera();
    const constraints = {
      video: CAM.deviceId ? {deviceId: {exact: CAM.deviceId}} : { facingMode: CAM.facing },
      audio: false
    };
    CAM.stream = await navigator.mediaDevices.getUserMedia(constraints);
    const v = document.getElementById('camVideo');
    v.srcObject = CAM.stream;
    v.play();
    document.getElementById('capCanvas').classList.add('hide');
  }catch(err){
    alert('Camera error: ' + err.message);
  }
}

function stopCamera(){
  if(CAM.stream){
    CAM.stream.getTracks().forEach(t=>t.stop());
    CAM.stream = null;
  }
}

function toggleFacing(){
  CAM.facing = CAM.facing === 'environment' ? 'user' : 'environment';
  startCamera(true);
}

function snap(){
  const v = document.getElementById('camVideo');
  const c = document.getElementById('capCanvas');
  const ctx = c.getContext('2d');
  const w = v.videoWidth || 720, h = v.videoHeight || 960;
  c.width = w; c.height = h;
  ctx.drawImage(v, 0, 0, w, h);
  c.classList.remove('hide');
}

function retake(){ document.getElementById('capCanvas').classList.add('hide'); }

function dataURLFromCanvas(){
  const c = document.getElementById('capCanvas');
  return c.toDataURL('image/jpeg', 0.92);
}

async function saveCapture(){
  const dataURL = dataURLFromCanvas();
  if(!dataURL) { alert('Capture first'); return; }
  if(CAM.mode === 'document'){
    CAM.docs.push({ts: Date.now(), img: dataURL});
    // persist to wallet
    const wallet = JSON.parse(localStorage.getItem('cit_wallet')||'[]');
    wallet.push({type:'Document Scan', when: new Date().toISOString(), dataURL});
    localStorage.setItem('cit_wallet', JSON.stringify(wallet));
    S.wallet = wallet;
    renderWallet();
  }else{
    // selfie mode: store as reference and try optional face detection
    localStorage.setItem('cit_selfie_ref', dataURL);
    CAM.selfie = dataURL;
    document.getElementById('capNote').textContent = 'Selfie saved as reference. Use Verify to compare.';
  }
  // show preview
  const p = document.getElementById('capPreview');
  const img = new Image();
  img.src = dataURL;
  p.prepend(img);
  alert('Saved!');
}

function openCapture(mode='document'){
  CAM.mode = mode;
  document.getElementById('capTitle').textContent = mode==='document' ? 'Scan Documents' : 'Selfie Capture & Verify';
  go('capture');
  enumerateCameras().then(startCamera);
  document.getElementById('capNote').textContent = mode==='document'
    ? 'Tip: Use back camera. Capture each page; they will be saved to Wallet.'
    : 'Tip: Center your face and capture a clear selfie. Optional verify uses face-api if available.';
}

// Optional: basic face verify using face-api.js if loaded
async function verifySelfieAgainstReference(currentDataURL){
  if(typeof faceapi === 'undefined') return {ok:false, reason:'faceapi not available'};
  // load lightweight models once
  if(!verifySelfieAgainstReference._loaded){
    const url = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/';
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(url),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(url),
      faceapi.nets.faceRecognitionNet.loadFromUri(url)
    ]);
    verifySelfieAgainstReference._loaded = true;
  }
  const refURL = localStorage.getItem('cit_selfie_ref');
  if(!refURL) return {ok:false, reason:'no reference selfie saved'};
  const [refImg, curImg] = await Promise.all([
    faceapi.fetchImage(refURL),
    faceapi.fetchImage(currentDataURL)
  ]);
  const opt = new faceapi.TinyFaceDetectorOptions({scoreThreshold:0.5});
  const [refDesc, curDesc] = await Promise.all([
    faceapi.computeFaceDescriptor(refImg, opt),
    faceapi.computeFaceDescriptor(curImg, opt)
  ]);
  if(!refDesc || !curDesc) return {ok:false, reason:'face not detected'};
  const dist = faceapi.euclideanDistance(refDesc, curDesc);
  return {ok: dist < 0.6, distance: dist};
}

// Add a simple Verify button for selfie mode
(function(){
  const container = document.getElementById('capPreview');
  const btnId = 'verifyBtn';
  // Create once
  setTimeout(()=>{
    let btn = document.getElementById(btnId);
    if(!btn){
      btn = document.createElement('button');
      btn.id = btnId;
      btn.className = 'btn';
      btn.textContent = 'Verify (selfie vs reference)';
      btn.onclick = async ()=>{
        if(CAM.mode!=='selfie'){ alert('Switch to Selfie mode'); return; }
        snap();
        const cur = dataURLFromCanvas();
        const res = await verifySelfieAgainstReference(cur);
        if(res.ok) alert('Face match ✓  distance=' + res.distance.toFixed(3));
        else alert('Cannot verify: ' + (res.reason||('distance='+(res.distance?.toFixed(3)||'?'))));
      };
      document.getElementById('capture').appendChild(btn);
    }
  }, 500);
})();
