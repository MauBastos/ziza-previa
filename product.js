const {collections, illustration} = zizaCatalog;
const id = new URLSearchParams(location.search).get('id');
const items = Object.entries(collections).flatMap(([type, collection]) =>
  collection.products.map(item => ({...item, type, collection: collection.label}))
);
const product = items.find(item => item.id === id);
const page = document.querySelector('#product-page');

if (!product) {
  page.innerHTML = '<h1>Modelo indisponível</h1><a href="index.html#catalogo">Voltar ao catálogo</a>';
} else {
  const lens = product.type === 'azul';
  const collectionsPages = {sol:'solares.html', grau:'grau.html', azul:'luz-azul.html'};
  const colors = lens ? [] : [
    {name:product.variant, value:product.color},
    {name:'Preto', value:'#282526'},
    {name:'Mel', value:'#9c633c'},
    {name:'Vinho', value:'#683844'}
  ].filter((color, index, list) => list.findIndex(option => option.name === color.name) === index);
  const sizes = [['P',48,18,135],['M',51,19,140],['G',54,20,145]];
  const views = [
    ['Frente',''],
    ['Em ângulo','translate(110 0) skewY(-7) scale(.77 1)'],
    ['Vista superior','translate(0 78) scale(1 .58)']
  ];
  document.title = product.name + ' — Ziza Óticas';
  page.innerHTML = `
    <a class="detail-back" href="${collectionsPages[product.type]}">← ${product.collection}</a>
    <div class="product-layout">
      <section aria-label="Galeria do produto">
        <div class="product-preview" id="product-preview"></div>
        <div id="product-views" class="product-controls" ${lens ? 'hidden' : ''}></div>
        <div class="product-controls" ${lens ? 'hidden' : ''}>
          <button id="zoom-out" type="button" aria-label="Reduzir zoom">−</button>
          <output id="zoom-level">100%</output>
          <button id="zoom-in" type="button" aria-label="Aumentar zoom">+</button>
        </div>
      </section>
      <section>
        <p class="eyebrow">${product.collection}</p>
        <h1>${product.name}</h1>
        <p class="store-price">${zizaStore.price(id)}</p>
        <p class="demo-note">${lens ? 'Opção e preço ilustrativos.' : 'Visualizações, cores, medidas e preço ilustrativos.'}</p>
        <fieldset id="product-colors" ${lens ? 'hidden' : ''}><legend>Cor</legend></fieldset>
        <fieldset id="product-sizes" ${lens ? 'hidden' : ''}><legend>Tamanho</legend></fieldset>
        <details ${lens ? 'hidden' : ''}><summary>Guia de tamanhos</summary>
          <p>Confira os três números gravados na haste de uma armação que já veste bem em você.</p>
          <table><caption>Medidas ilustrativas em milímetros</caption>
            <thead><tr><th>Tamanho</th><th>Lente</th><th>Ponte</th><th>Haste</th></tr></thead>
            <tbody>${sizes.map(row => '<tr>' + row.map(value => '<td>'+value+'</td>').join('') + '</tr>').join('')}</tbody>
          </table>
        </details>
        <button class="primary" id="product-add" type="button">Adicionar à sacola</button>
        <p id="product-status" role="status"></p>
      </section>
    </div>`;

  const preview = document.querySelector('#product-preview');
  const viewControls = document.querySelector('#product-views');
  const colorControls = document.querySelector('#product-colors');
  const sizeControls = document.querySelector('#product-sizes');
  const add = document.querySelector('#product-add');
  const status = document.querySelector('#product-status');
  let color = 0;
  let size = 1;
  let view = 0;
  let zoom = 1;
  const key = () => lens ? id : [id, colors[color].name, sizes[size][0]].join('|');
  function render() {
    const alreadyAdded = zizaStore.has(key());
    add.textContent = alreadyAdded ? 'Adicionado à sacola ✓' : 'Adicionar à sacola';
    if (lens) {
      preview.textContent = product.name;
      return;
    }
    preview.innerHTML = illustration({...product, color:colors[color].value}, 'gallery');
    const svg = preview.querySelector('svg');
    svg.style.transform = 'scale(' + zoom + ')';
    const group = document.createElementNS(svg.namespaceURI, 'g');
    [...svg.children].filter(child => child.localName !== 'defs').forEach(child => group.append(child));
    svg.append(group);
    group.setAttribute('transform', views[view][1]);
    svg.setAttribute('aria-label', product.name + ' · ' + views[view][0] + ' · ' + colors[color].name);
    const output = document.querySelector('#zoom-level');
    output.textContent = Math.round(zoom * 100) + '%';
    document.querySelector('#zoom-out').disabled = zoom <= 1;
    document.querySelector('#zoom-in').disabled = zoom >= 2.5;
  }
  function choices(container, labels, initial, onSelect) {
    labels.forEach((label, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.setAttribute('aria-pressed', String(index === initial));
      button.onclick = () => {
        container.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        onSelect(index);
        status.textContent = '';
        render();
      };
      container.append(button);
    });
  }
  if (!lens) {
    choices(viewControls, views.map(([name]) => name), view, index => { view = index; zoom = 1; });
    choices(colorControls, colors.map(option => option.name), color, index => { color = index; });
    choices(sizeControls, sizes.map(([name]) => name), size, index => { size = index; });
    document.querySelector('#zoom-in').onclick = () => { zoom = Math.min(2.5, zoom + .25); render(); };
    document.querySelector('#zoom-out').onclick = () => { zoom = Math.max(1, zoom - .25); render(); };
  }
  add.onclick = () => {
    zizaStore.add(key());
    render();
    status.textContent = 'Opção adicionada à sacola.';
  };
  render();
}
