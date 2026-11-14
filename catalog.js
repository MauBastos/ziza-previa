(() => {
  const category = document.body.dataset.catalog;
  const {collections, illustration} = zizaCatalog;
  const collection = collections[category];
  document.getElementById('catalog-products').innerHTML=collection.products.map(p=>`<a class="catalog-product" href="produto.html?id=${p.id}" aria-label="Ver detalhes: ${p.name}"><div class="product-art ${category==='azul'?'lens-card':''}"><span class="illustration-label">${category==='azul'?'OPÇÃO ILUSTRATIVA':'MODELO ILUSTRATIVO'}</span>${illustration({...p,type:category})}<span class="product-arrow" aria-hidden="true">↗</span></div><div class="product-caption"><h3>${p.name}</h3><p>${p.variant}</p></div><p class="product-info">${zizaStore.price(p.id)}</p></a>`).join('');
  document.getElementById('catalog-year').textContent=new Date().getFullYear();
})();
