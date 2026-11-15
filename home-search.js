function fold(text) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');
}

export function bindHomeSearch() {
  const button = document.querySelector('.home-search');
  const dialog = document.querySelector('#home-search');
  const input = dialog.querySelector('input');
  const results = dialog.querySelector('ul');
  const status = dialog.querySelector('[role="status"]');
  const categories = [...document.querySelectorAll('.film-offer')].map(offer => ({
    name: offer.querySelector('.film-cta-label').textContent,
    terms: offer.dataset.scene === 'solar' ? 'solar solares' : offer.dataset.scene,
    href: offer.href
  }));
  const products = (window.zizaProducts || []).map(product => ({
    name: product.name, terms: product.label, href: 'produto.html?id=' + window.zizaStore.homeId(product.id)
  }));
  const items = [...categories, ...products];

  function render() {
    const query = fold(input.value.trim()).split(/\s+/).filter(Boolean);
    const matches = items.filter(item => query.every(word => fold(item.name + ' ' + item.terms).includes(word)));
    results.replaceChildren(...matches.map(item => {
      const row = document.createElement('li');
      const link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.name;
      row.append(link);
      return row;
    }));
    status.textContent = !query.length ? '' : matches.length ? `${matches.length} ${matches.length === 1 ? 'resultado' : 'resultados'}` : 'Nenhum resultado.';
  }

  input.addEventListener('input', render);
  button.addEventListener('click', () => {
    render();
    dialog.showModal();
    input.focus();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      dialog.close();
    }
  });
  dialog.addEventListener('close', () => button.focus({preventScroll: true}));
}
