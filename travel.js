(async function () {
 const container=document.getElementById('travel-map'),status=document.getElementById('map-status');
 try {
  const [world,places]=await Promise.all(['assets/world.json','travel.json?v=6'].map(async url=>{const r=await fetch(url);if(!r.ok)throw Error('Map data unavailable');return r.json()}));
  const map=L.map(container,{scrollWheelZoom:false,minZoom:0.25,maxZoom:10,zoomSnap:0.25,maxBounds:[[-80,-180],[85,180]],maxBoundsViscosity:0.8}).setView([35,10],2);
  L.geoJSON(world,{interactive:false,style:{color:'#bdcbd1',weight:0.7,fillColor:'#e6edf0',fillOpacity:1}}).addTo(map);
  map.attributionControl.setPrefix('<a href="https://leafletjs.com/">Leaflet</a>');map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/">Natural Earth</a>');
  const markers=places.map(p=>{
   const color=p.status==='next'?'#ae9142':'#0c2340';
   const m=L.circleMarker([p.lat,p.lng],{radius:5,weight:1.5,color:'#fff',fillColor:color,fillOpacity:1}).addTo(map);
   const box=document.createElement('div'),title=document.createElement('strong');title.textContent=p.name;box.append(title,document.createElement('br'),document.createTextNode(p.group+(p.kind==='City'?'':' · '+p.kind)),document.createElement('br'),document.createTextNode(p.status==='next'?'October 20–31, 2026':'Visited'));
   m.bindPopup(box);return m;
  });
  const overlay=document.createElement('div');overlay.className='map-labels';container.append(overlay);L.DomEvent.disableClickPropagation(overlay);
  const lines=document.createElementNS('http://www.w3.org/2000/svg','svg');lines.classList.add('map-leaders');lines.setAttribute('aria-hidden','true');overlay.append(lines);
  const labels=places.map((p,i)=>{const b=document.createElement('button');b.type='button';b.className='map-place-label'+(p.status==='next'?' upcoming':'');b.textContent=p.name;b.setAttribute('aria-label',p.name+', '+p.group+(p.status==='next'?', next trip':', visited'));b.addEventListener('click',()=>markers[i].openPopup());overlay.append(b);return b});
  let active=places.map((_,i)=>i);
  function layoutLabels(){
   const size=map.getSize();lines.setAttribute('viewBox',`0 0 ${size.x} ${size.y}`);lines.replaceChildren();
   labels.forEach(b=>b.hidden=true);
   const occupied=[{x:0,y:0,w:52,h:86},{x:size.x-180,y:size.y-25,w:180,h:25}];
   const points=active.map(i=>({i,p:map.latLngToContainerPoint([places[i].lat,places[i].lng])})).filter(({p})=>p.x>8&&p.x<size.x-8&&p.y>8&&p.y<size.y-8);
   const overlap=(a,b)=>a.x<b.x+b.w+4&&a.x+a.w+4>b.x&&a.y<b.y+b.h+3&&a.y+a.h+3>b.y;
   for(const {i,p} of points){
    const label=labels[i];label.hidden=false;const w=label.offsetWidth,h=label.offsetHeight;let best=null;
    for(let radius=12;radius<=420&&!best;radius+=10){
     for(let j=0;j<24;j++){const a=j*Math.PI/12,x=p.x+Math.cos(a)*radius-w/2,y=p.y+Math.sin(a)*radius-h/2;const rect={x,y,w,h};
      if(x<7||y<7||x+w>size.x-7||y+h>size.y-26||occupied.some(r=>overlap(rect,r))||points.some(q=>overlap(rect,{x:q.p.x-5,y:q.p.y-5,w:10,h:10})))continue;
      best=rect;break;
     }
    }
    if(!best){label.hidden=true;continue}occupied.push(best);label.style.left=best.x+'px';label.style.top=best.y+'px';
    const x=Math.max(best.x,Math.min(p.x,best.x+w)),y=Math.max(best.y,Math.min(p.y,best.y+h));
    const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('x1',p.x);line.setAttribute('y1',p.y);line.setAttribute('x2',x);line.setAttribute('y2',y);line.setAttribute('stroke',places[i].status==='next'?'#ae9142':'#546b86');lines.append(line);
   }
  }
  function setView(view){
   active=places.map((p,i)=>({p,i})).filter(({p})=>view==='all'||view==='next'&&p.status==='next'||view==='us'&&p.group==='United States'||view==='asia'&&['China','Japan'].includes(p.group)||view==='west'&&!['China','Japan','United States'].includes(p.group)).map(x=>x.i);
   map.closePopup();map.fitBounds(active.map(i=>[places[i].lat,places[i].lng]),{padding:[55,65],maxZoom:5,animate:false});
   document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));layoutLabels();
  }
  map.on('moveend zoomend resize',layoutLabels);map.on('movestart',()=>overlay.style.visibility='hidden');map.on('moveend',()=>overlay.style.visibility='visible');
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  document.querySelector('.travel-list').hidden=true;
  new ResizeObserver(()=>{map.invalidateSize();layoutLabels()}).observe(container);
  setView('all');
 } catch(e){status.textContent='The map could not load. Please refresh to try again.';document.querySelectorAll('.map-tools button').forEach(b=>b.disabled=true);document.querySelector('.travel-list').open=true;}
}());
