(() => {
  const products = [
    ['solar-aurora', 'Aurora', 29990], ['grau-essencial', 'Essencial', 27990],
    ['solar-riviera', 'Riviera', 32990], ['grau-poema', 'Poema', 30990],
    ['solar-horizonte', 'Horizonte', 28990], ['grau-clara', 'Clara', 31990],
    ['lente-sem-grau', 'Sem grau', 14990], ['lente-com-grau', 'Com grau', 22990]
  ];
  const store = 'ziza-public-demo-bag';
  const format = new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'});
  const money = cents => format.format(cents / 100);
  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  const baseId = key => key.split('|')[0];
  function bag() {
    const stored = read(store, []);
    return [...new Set(Array.isArray(stored) ? stored : [])].filter(id => typeof id === 'string' && products.some(p => p[0] === baseId(id)));
  }
  const controls = document.querySelector('.store-actions');
  const header = controls.closest('header');
  header.classList.add('store-header');
  const filmSection = document.querySelector('.cinema');
  if (filmSection) {
    const syncHeaderColor = () => {
      const brand = header.querySelector('.brand').getBoundingClientRect();
      const overLightContent = filmSection.getBoundingClientRect().bottom <= brand.top + brand.height / 2;
      header.classList.toggle('over-light-content', overLightContent);
    };
    window.addEventListener('scroll', syncHeaderColor, {passive: true});
    window.addEventListener('resize', syncHeaderColor);
    new ResizeObserver(syncHeaderColor).observe(filmSection);
    syncHeaderColor();
  }

  document.querySelector('main').insertAdjacentHTML('afterend', `
    <dialog class="store-dialog" id="store-bag" aria-labelledby="store-bag-title">
      <button class="store-close" data-store-close aria-label="Fechar sacola">×</button>
      <h2 id="store-bag-title">Sua sacola</h2>
      <div id="store-items"></div>
      <form id="store-checkout" hidden>
        <p class="store-total">Total <strong id="store-total"></strong></p>
        <fieldset><legend>Forma de pagamento</legend>
          <label><input type="radio" name="payment" value="Pix" required> Pix</label>
          <label><input type="radio" name="payment" value="Cartão de crédito"> Cartão de crédito</label>
          <label><input type="radio" name="payment" value="Boleto"> Boleto</label>
        </fieldset>
        <p>Preços ilustrativos. Nenhum valor será cobrado nesta simulação.</p>
        <button class="primary" type="submit">Simular pagamento</button>
      </form>
      <p id="store-payment-status" role="status"></p>
    </dialog>`);
  const bagDialog = document.querySelector('#store-bag');
  const checkout = document.querySelector('#store-checkout');
  const paymentStatus = document.querySelector('#store-payment-status');
  function refresh() {
    document.querySelector('#store-count').textContent = bag().length;
  }
  function updateBag(ids) {
    write(store, ids);
    refresh();
  }
  function renderBag() {
    const selected = bag().map(key => {
      const [, color, size] = key.split('|');
      const [, name, price] = products.find(p => p[0] === baseId(key));
      return [key, name, price, [color, size].filter(Boolean).join(' · ')];
    });
    document.querySelector('#store-items').innerHTML = selected.length
      ? selected.map(([id, name, price, variant]) => `<div class="store-item"><div><strong>${name}</strong><small class="store-variant"></small></div><span>${money(price)}</span><button type="button" data-remove-store="${encodeURIComponent(id)}" aria-label="Remover ${name}">Remover</button></div>`).join('')
      : '<p>Sua sacola está vazia.</p>';
    document.querySelectorAll('.store-variant').forEach((node, index) => { node.textContent = selected[index][3]; });
    document.querySelector('#store-total').textContent = money(selected.reduce((total, item) => total + item[2], 0));
    checkout.hidden = !selected.length;
    paymentStatus.textContent = '';
  }
  controls.addEventListener('click', event => {
    if (event.target.closest('[data-store-bag]')) {
      checkout.reset();
      renderBag();
      bagDialog.showModal();
    }
  });
  document.querySelectorAll('[data-store-close]').forEach(button => {
    button.addEventListener('click', () => button.closest('dialog').close());
  });
  bagDialog.addEventListener('click', event => {
    const button = event.target.closest('[data-remove-store]');
    if (!button) return;
    updateBag(bag().filter(id => id !== decodeURIComponent(button.dataset.removeStore)));
    renderBag();
  });
  checkout.addEventListener('change', () => { paymentStatus.textContent = ''; });
  checkout.addEventListener('submit', event => {
    event.preventDefault();
    if (!bag().length) return;
    const method = new FormData(checkout).get('payment');
    paymentStatus.textContent = 'Pagamento por ' + method + ' simulado. Nenhum pedido foi criado.';
  });
  window.addEventListener('storage', () => { refresh(); if (bagDialog.open) renderBag(); });
  window.zizaStore = {
    money,
    homeId: id => products[id - 1][0],
    price: id => money(products.find(p => p[0] === id)[2]),
    has: id => bag().includes(id),
    add: id => updateBag([...new Set([...bag(), id])])
  };
  refresh();
})();
