function fold(text) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');
}

export function bindHomeSearch() {
  const button = document.querySelector('.home-search');
  const box = document.querySelector('#home-search');
  const input = box.querySelector('input');
  const results = box.querySelector('ul');
  const status = box.querySelector('[role="status"]');
  const panel = results.parentElement;
  let animation;
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
    const previousHeight = panel.hidden ? 0 : panel.getBoundingClientRect().height;
    animation?.cancel();
    const matches = query.length ? items.filter(item => query.every(word => fold(item.name + ' ' + item.terms).includes(word))) : [];
    results.replaceChildren(...matches.map(item => {
      const row = document.createElement('li');
      const link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.name;
      row.append(link);
      return row;
    }));
    panel.hidden = !query.length;
    status.hidden = matches.length > 0;
    status.textContent = !query.length ? '' : matches.length ? `${matches.length} ${matches.length === 1 ? 'resultado' : 'resultados'}` : 'Nenhum resultado.';
    if (!panel.hidden && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animation = panel.animate([{height: previousHeight + 'px'}, {height: panel.getBoundingClientRect().height + 'px'}], {duration: 260, easing: 'ease-out'});
    }
  }

  function close(returnFocus = false) {
    box.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if (returnFocus) button.focus({preventScroll: true});
  }

  input.addEventListener('input', render);
  button.addEventListener('click', () => {
    if (!box.hidden) { close(true); return; }
    box.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    render();
    input.focus({preventScroll: true});
  });
  const header = button.closest('header');
  header.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !box.hidden) {
      event.preventDefault();
      close(true);
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!box.hidden && !button.contains(event.target) && !box.contains(event.target)) close();
  });
}
