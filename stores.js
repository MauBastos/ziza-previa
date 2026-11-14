const stores = [
  ['Itapuã','Av. Dorival Caymmi, 13-A · Itapuã','41635-151','7225054994612530385'],
  ['Cajazeiras 10','Estrada do Coqueiro Grande, 2007 · Cajazeiras X','41340-050','15708029673581664477'],
  ['Hangar Business Park','Av. Luís Viana Filho, 13223, loja 09 · São Cristóvão','41500-300','7691222249067869649']
];
const input = document.querySelector('#store-search');
const list = document.querySelector('#store-results');
const map = document.querySelector('#stores-map');
const status = document.querySelector('#stores-status');
const normalize = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
function showMap(store) {
  const query = store ? 'Óticas Alta Visão ' + store[0] + ' Salvador BA' : 'Óticas Alta Visão Salvador BA';
  map.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(query) + '&output=embed&hl=pt-BR';
  map.title = 'Google Maps · ' + query;
}
function renderStores() {
  const terms = input.value.trim().split(/\s+/).map(normalize).filter(Boolean);
  const matches = stores.filter(store => {
    const haystack = normalize('Óticas Alta Visão Salvador BA ' + store.slice(0, 3).join(' '));
    return terms.every(term => haystack.includes(term));
  });
  list.innerHTML = matches.map(([name, address, cep, cid]) => `
    <article><h2>${name}</h2><address>${address}<br>Salvador – BA · CEP ${cep}</address>
      <div class="product-controls"><button type="button" data-map="${cid}">Ver no mapa</button>
      <a href="https://www.google.com/maps?cid=${cid}" target="_blank" rel="noopener">Abrir no Google Maps ↗</a></div>
    </article>`).join('');
  status.textContent = matches.length ? '' : 'Nenhuma unidade encontrada. Busque pelo bairro, endereço ou CEP.';
  if (matches.length) showMap(matches.length === 1 ? matches[0] : null);
}
list.onclick = event => {
  const button = event.target.closest('[data-map]');
  if (!button) return;
  showMap(stores.find(store => store[3] === button.dataset.map));
};
document.querySelector('#stores-search-form').onsubmit = event => { event.preventDefault(); renderStores(); };
input.addEventListener('search', renderStores);
renderStores();
