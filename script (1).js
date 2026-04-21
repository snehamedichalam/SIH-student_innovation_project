// ---- Demo Data ----
const state = {
  hours: ['8','9','10','11','12','13','14','15'],
  forecast: [86,74,62,58,42,30,26,34],
  footfall: [220,260,310,380,420,360,300,260],
  donut: [
    {name:'Passport', val:34, color:'#ff5f6d'},
    {name:'RTO', val:26, color:'#ffc371'},
    {name:'Hospital', val:22, color:'#38f9d7'},
    {name:'Certificates', val:18, color:'#a18cd1'}
  ],
  offices: [
    {name:'RTO LB Nagar', queue:128, wait:14, status:'Low'},
    {name:'Passport Ameerpet', queue:302, wait:24, status:'Med'},
    {name:'Gandhi Hosp', queue:480, wait:19, status:'High'},
    {name:'MeeSeva Kothapet', queue:96, wait:9, status:'Low'},
    {name:'RTO Uppal', queue:210, wait:16, status:'Med'}
  ],
  pins: [
    {name:'LB Nagar', x:120, y:220, level:'Low'},
    {name:'Ameerpet', x:300, y:120, level:'Med'},
    {name:'Gandhi', x:380, y:140, level:'High'},
    {name:'Kothapet', x:160, y:210, level:'Low'},
    {name:'Uppal', x:230, y:170, level:'Med'}
  ],
  alerts: [
    {type:'warn', msg:'Heavy footfall expected 11–12 AM at Passport Ameerpet'},
    {type:'bad', msg:'System slowdown reported at Gandhi Hospital counters'},
    {type:'ok', msg:'Extra counter opened at RTO LB Nagar; wait reduced'}
  ]
};

// ---- Helpers ----
function $(sel){ return document.querySelector(sel); }
function el(tag, cls){ const e = document.createElement(tag); if(cls) e.className=cls; return e; }

// ---- Sparklines (tiny bars) ----
function sparkline(target, values, color) {
  const w = target.clientWidth || 180, h = target.clientHeight || 28;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', w); svg.setAttribute('height', h);
  const max = Math.max(...values);
  const barW = w / values.length;
  values.forEach((v,i)=>{
    const rect = document.createElementNS(svg.namespaceURI,'rect');
    rect.setAttribute('x', (i*barW+1));
    rect.setAttribute('y', h - (v/max)*(h-4));
    rect.setAttribute('width', barW - 2);
    rect.setAttribute('height', (v/max)*(h-4));
    rect.setAttribute('fill', color || 'url(#gradSpark)');
    svg.appendChild(rect);
  });
  target.innerHTML = ''; target.appendChild(svg);
}

// ---- Area Chart ----
function drawArea(targetId, values) {
  const svg = document.getElementById(targetId);
  const w = 700, h = 260, pad = 18;
  svg.innerHTML = '';
  const max = Math.max(...values) * 1.2;
  // gradient
  const defs = document.createElementNS(svg.namespaceURI,'defs');
  const lg = document.createElementNS(svg.namespaceURI,'linearGradient');
  lg.id='gradA'; lg.setAttribute('x1','0'); lg.setAttribute('x2','0'); lg.setAttribute('y1','0'); lg.setAttribute('y2','1');
  const s1 = document.createElementNS(svg.namespaceURI,'stop'); s1.setAttribute('offset','0%'); s1.setAttribute('stop-color','#ff5f6d'); s1.setAttribute('stop-opacity','0.9');
  const s2 = document.createElementNS(svg.namespaceURI,'stop'); s2.setAttribute('offset','100%'); s2.setAttribute('stop-color','#ffc371'); s2.setAttribute('stop-opacity','0.1');
  lg.appendChild(s1); lg.appendChild(s2); defs.appendChild(lg); svg.appendChild(defs);
  // path
  const step = (w - pad*2) / (values.length -1);
  let d = `M ${pad} ${h-pad}`;
  values.forEach((v,i)=>{
    const x = pad + i*step;
    const y = h - pad - (v/max)*(h - pad*2);
    d += ` L ${x} ${y}`;
  });
  d += ` L ${w-pad} ${h-pad} L ${pad} ${h-pad} Z`;
  const path = document.createElementNS(svg.namespaceURI,'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'url(#gradA)');
  path.setAttribute('stroke', '#ff9aa5');
  path.setAttribute('stroke-width', '2');
  svg.appendChild(path);
}

// ---- Bars ----
function drawBars(containerId, hours, vals){
  const c = document.getElementById(containerId);
  c.innerHTML = '';
  const max = Math.max(...vals);
  hours.forEach((h,i)=>{
    const b = el('div','bar');
    const pct = (vals[i]/max)*100;
    b.style.height = (40 + pct*1.6) + 'px';
    b.dataset.x = h;
    c.appendChild(b);
  });
}

// ---- Donut ----
function drawDonut(data){
  const svg = document.getElementById('donut');
  svg.innerHTML='';
  const r = 100, cx=130, cy=130, circ = 2*Math.PI*r;
  let off = 0;
  const total = data.reduce((a,b)=>a+b.val,0);
  data.forEach(d=>{
    const val = d.val/total;
    const circle = document.createElementNS(svg.namespaceURI,'circle');
    circle.setAttribute('cx', cx); circle.setAttribute('cy', cy); circle.setAttribute('r', r);
    circle.setAttribute('fill','transparent');
    circle.setAttribute('stroke', d.color);
    circle.setAttribute('stroke-width','26');
    circle.setAttribute('stroke-dasharray', `${circ*val} ${circ*(1-val)}`);
    circle.setAttribute('stroke-dashoffset', -off*circ);
    circle.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
    svg.appendChild(circle);
    off += val;
  });
  // legend
  const legend = document.getElementById('donut-legend'); legend.innerHTML='';
  data.forEach(d=>{
    const chip = el('div','chip');
    const box = el('span','box'); box.style.background=d.color;
    chip.appendChild(box);
    chip.appendChild(document.createTextNode(`${d.name} — ${d.val}%`));
    legend.appendChild(chip);
  });
}

// ---- Map Pins ----
function drawPins(){
  const map = document.getElementById('map'); map.innerHTML='';
  state.pins.forEach(p=>{
    const dot = el('div','pin');
    dot.style.left = p.x+'px'; dot.style.top = p.y+'px';
    dot.dataset.name = p.name;
    dot.style.background = p.level==='Low' ? 'var(--ok)' : p.level==='Med' ? 'var(--warn)' : 'var(--bad)';
    map.appendChild(dot);
  });
}

// ---- Table ----
function drawTable(){
  const wrap = document.getElementById('table-offices'); wrap.innerHTML='';
  const head = el('div','row'); head.style.fontWeight='800';
  ['Office','Queue','Avg Wait','Load'].forEach(t=> head.appendChild(document.createTextNode(t)) );
  wrap.appendChild(head);
  state.offices.forEach(o=>{
    const row = el('div','row');
    row.innerHTML = `<div>${o.name}</div>
      <div>${o.queue}</div>
      <div>${o.wait}m</div>
      <div class="meter"><span style="width:${Math.min(100,(o.queue/500)*100)}%"></span></div>`;
    wrap.appendChild(row);
  });
}

// ---- Alerts ----
function drawAlerts(){
  const list = document.getElementById('alerts-list'); list.innerHTML='';
  state.alerts.forEach(a=>{
    const li = el('li','alert');
    const b = el('span','badge '+a.type); b.textContent = a.type.toUpperCase();
    li.appendChild(b); li.appendChild(document.createTextNode(a.msg));
    list.appendChild(li);
  });
}

// ---- Theme ----
function switchTheme(){
  document.body.classList.toggle('light');
}

// ---- Cycle Demo (randomize numbers) ----
function cycleDemo(){
  // random tweak
  state.footfall = state.footfall.map(v=> Math.max(120, v + Math.round((Math.random()-0.5)*80)));
  state.forecast = state.forecast.map(v=> Math.max(18, v + Math.round((Math.random()-0.5)*20)));
  state.offices.forEach(o=> { o.queue = Math.max(50, o.queue + Math.round((Math.random()-0.5)*120)); o.wait = Math.max(6, o.wait + Math.round((Math.random()-0.5)*8)) });
  init();
}

// ---- KPI sparklines ----
function drawKpis(){
  $('#kpi-queue').textContent = state.offices.reduce((a,b)=>a+b.queue,0);
  $('#kpi-wait').textContent = Math.round(state.offices.reduce((a,b)=>a+b.wait,0)/state.offices.length);
  $('#kpi-appts').textContent = '12,960';
  $('#kpi-complete').textContent = '92%';
  $('#kpi-noshow').textContent = '4.8%';
  sparkline($('#spark-queue'), [8,9,10,11,12,13,14,15].map((h,i)=> state.footfall[i] || 0), '#ff5f6d');
  sparkline($('#spark-wait'), state.offices.map(o=>o.wait), '#a18cd1');
  sparkline($('#spark-appts'), [1400,1600,1800,2200,2100,2000,1900,1960], '#38f9d7');
  sparkline($('#spark-complete'), [88,89,90,91,92,93,92,92], '#43e97b');
  sparkline($('#spark-noshow'), [6,6,5.5,5.2,5,4.9,4.8,4.8], '#ffc371');
}

// ---- Init ----
function init(){
  drawKpis();
  drawArea('area-footfall', state.footfall);
  drawBars('bars-forecast', state.hours, state.forecast);
  drawDonut(state.donut);
  drawPins();
  drawTable();
  drawAlerts();
}
window.addEventListener('load', init);
