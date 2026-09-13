(async function () {
  const container = document.getElementById('travel-map');
  const status = document.getElementById('map-status');
  try {
    const results = await Promise.all(['assets/world.json', 'travel.json'].map(async url => {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Map data unavailable');
      return response.json();
    }));
    const [world, places] = results;
    const map = L.map(container, {scrollWheelZoom:false, minZoom:0.25, maxZoom:10, zoomSnap:0.25, maxBounds:[[-80,-180],[85,180]],maxBoundsViscosity:0.8}).setView([35,10],2);
    L.geoJSON(world, {interactive:false, style:{color:'#c4cdd1',weight:0.6,fillColor:'#e8edef',fillOpacity:1}}).addTo(map);
    map.attributionControl.setPrefix('<a href="https://leafletjs.com/">Leaflet</a>');
    map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/">Natural Earth</a>');
    const markers = places.map(p => {
      const next = p.status === 'next';
      const regional = p.kind !== 'City';
      const marker = L.circleMarker([p.lat,p.lng], {radius:next?6:4.5,weight:1.7,color:next?'#ae641d':'#087daf',fillColor:regional?'#fff':next?'#ae641d':'#087daf',fillOpacity:1}).addTo(map);
      const popup = document.createElement('div');
      const title = document.createElement('strong'); title.textContent = p.name; popup.append(title,document.createElement('br'));
      popup.append(document.createTextNode(p.group + (regional?' · '+p.kind+' (approximate location)':'')),document.createElement('br'));
      popup.append(document.createTextNode(next?'Next trip · October 20–31, 2026':'Visited'));
      marker.bindPopup(popup).bindTooltip(p.name,{direction:'top'});
      if(next) marker.bringToFront();
      return marker;
    });
    function setView(view) {
      const selected = places.filter(p => view==='all' || (view==='next'&&p.status==='next') || (view==='us'&&p.group==='United States') || (view==='asia'&&['China','Japan'].includes(p.group)) || (view==='west'&& !['China','Japan','United States'].includes(p.group)));
      map.closePopup();
      map.fitBounds(selected.map(p=>[p.lat,p.lng]),{padding:[28,28],maxZoom:5,animate:false});
      document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
    }
    setView('all');
    document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
    document.querySelectorAll('[data-place]').forEach(b=>b.addEventListener('click',()=>{
      const i=Number(b.dataset.place),p=places[i];
      map.setView([p.lat,p.lng],p.kind==='City'?7:4,{animate:false});markers[i].openPopup();
      document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false'));
      container.scrollIntoView({block:'center',behavior:'auto'});
    }));
    new ResizeObserver(()=>map.invalidateSize()).observe(container);
  } catch(error) {
    status.textContent='The map could not load. The full list of places is available below.';
    document.querySelectorAll('.map-tools button').forEach(b=>b.disabled=true);
    document.querySelector('.travel-list').open=true;
  }
}());
