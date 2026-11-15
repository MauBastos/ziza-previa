const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

if (!reducedMotion.matches) {
  for (const copy of document.querySelectorAll('.film-title, .film-offer')) {
    let wordCount = 0;
    for (const line of copy.querySelectorAll('h1, h2, p:not(.eyebrow)')) {
      const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      for (const node of nodes) {
        const words = document.createDocumentFragment();
        for (const part of node.data.split(/(\s+)/)) {
          if (!part.trim()) {
            words.append(part);
            continue;
          }
          const word = document.createElement('span');
          word.className = 'film-word';
          word.style.setProperty('--word-delay', `${wordCount++ * 27}ms`);
          words.append(word);
          word.textContent = part;
        }
        node.replaceWith(words);
      }
    }
    copy.style.setProperty('--copy-end', `${(wordCount - 1) * 27 + 260}ms`);
  }

  const brand = document.querySelector('header .brand');
  const bounds = brand.getBoundingClientRect();
  const cinema = document.querySelector('.cinema');

  if (scrollY === 0 && !location.hash && bounds.width && brand.animate) {
    const x = innerWidth / 2 - (bounds.left + bounds.width / 2);
    const y = innerHeight / 2 - (bounds.top + bounds.height / 2);
    const scale = Math.min(innerWidth * 0.48, 325) / bounds.width;
    const center = `translate(${x}px, ${y}px) scale(${scale})`;
    cinema.classList.add('brand-arriving');
    const arrival = brand.animate([
      {transform: center, offset: 0},
      {transform: center, offset: .23, easing: 'cubic-bezier(.28,.72,.24,1)'},
      {transform: 'none', offset: 1},
    ], 780);
    const events = new AbortController();
    const skip = () => arrival.cancel();
    window.addEventListener('scroll', skip, {once: true, signal: events.signal});
    window.addEventListener('resize', skip, {once: true, signal: events.signal});
    document.addEventListener('focusin', skip, {once: true, signal: events.signal});
    reducedMotion.addEventListener('change', skip, {once: true, signal: events.signal});
    const finish = () => {
      cinema.classList.remove('brand-arriving');
      events.abort();
    };
    arrival.finished.then(finish, finish);
  }
}
