(() => {
  const collections = {
    sol: { label: 'Óculos de sol', products: [
      { id:'solar-aurora', name:'Aurora', variant:'Tartaruga', color:'#4b2c1c', lens:'#65513c' },
      { id:'solar-riviera', name:'Riviera', variant:'Mel', color:'#ac7e48', lens:'#696043' },
      { id:'solar-horizonte', name:'Horizonte', variant:'Preto', color:'#292725', lens:'#495349' }
    ] },
    grau: { label: 'Óculos de grau', products: [
      { id:'grau-essencial', name:'Essencial', variant:'Oliva', color:'#585a42', lens:'#e3e5dc' },
      { id:'grau-poema', name:'Poema', variant:'Caramelo', color:'#8a5338', lens:'#e7e0d6' },
      { id:'grau-clara', name:'Clara', variant:'Champanhe', color:'#b6a187', lens:'#e9e5db' }
    ] },
    azul: { label: 'Lentes com filtro de luz azul', products: [
      { id:'lente-sem-grau', name:'Sem grau', variant:'Opção ilustrativa' },
      { id:'lente-com-grau', name:'Com grau', variant:'Opção ilustrativa' }
    ] }
  };
  function illustration(p,suffix='card') {
    if(p.type==='azul') return '';
    const lens = p.lens;
    const clear = p.type==='grau';
    const uid=p.id+'-'+suffix;
    return `<svg viewBox="0 0 800 380" role="img" aria-label="Ilustração do modelo ${p.name}"><defs><linearGradient id="frame-${uid}" x2=".8" y2="1"><stop stop-color="#c3a071"/><stop offset=".3" stop-color="${p.color}"/><stop offset=".8" stop-color="${p.color}"/><stop offset="1" stop-color="#84684c"/></linearGradient><linearGradient id="lens-${uid}" x2=".2" y2="1"><stop stop-color="${lens}"/><stop offset="1" stop-color="${clear?'#ffffff':lens}" stop-opacity="${clear?'.28':'.7'}"/></linearGradient></defs><path d="M85 150 L274 73 Q286 69 302 79 L435 146 M711 151 L557 77 Q545 71 528 81 L391 145" fill="none" stroke="${p.color}" stroke-width="13"/><path d="M64 132 Q154 109 288 122 Q343 128 365 146 Q401 134 434 146 Q469 122 525 118 Q645 109 736 135 L730 164 L707 177 Q692 277 615 294 Q506 313 468 244 L438 181 Q404 164 366 182 L338 243 Q307 309 202 296 Q110 290 95 182 L69 168Z" fill="url(#frame-${uid})"/><path d="M118 156 Q179 135 284 147 Q322 151 330 177 Q335 218 305 256 Q275 285 205 278 Q137 270 127 221 Q118 188 118 156Z M469 176 Q476 150 520 144 Q622 134 684 156 Q686 196 672 231 Q652 277 594 278 Q512 285 488 242 Q472 214 469 176Z" fill="url(#lens-${uid})" stroke="#30271e66" stroke-width="2"/><path d="M137 157 Q201 143 274 156 M491 159 Q572 140 662 159" fill="none" stroke="#fff5" stroke-width="3"/><path d="M76 146 L94 148 M710 147 L728 146" stroke="#c5b18d" stroke-width="4" stroke-linecap="round"/></svg>`;
  }
  window.zizaCatalog = {collections, illustration};
})();
