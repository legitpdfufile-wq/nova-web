(() => {
  'use strict';

  const dogs = [
    {id:'maple',name:'Maple',breed:'Golden Retriever',age:'puppy',ageLabel:'14 weeks',fit:['family','active'],summary:'Bright, gentle, and happiest wherever the people are.',story:'Maple settles quickly after play, checks in naturally, and approaches new people with a soft confidence. She is a promising fit for a family ready for daily walks, training games, and a dog who wants to be included.',color:'#d3dfca'},
    {id:'ranger',name:'Ranger',breed:'Labrador Retriever',age:'young',ageLabel:'11 months',fit:['active','family'],summary:'A steady adventure partner with an excellent off switch.',story:'Ranger loves a job, a trail, and a good nap afterward. He has foundational leash skills, enjoys children, and will thrive with someone who values both outdoor time and structure.',color:'#e8caa5'},
    {id:'olive',name:'Olive',breed:'Cavalier Mix',age:'young',ageLabel:'16 months',fit:['calm','family'],summary:'Observant, affectionate, and built for the quieter side of life.',story:'Olive is happiest curled near her person. She warms up thoughtfully, bonds deeply, and would fit a calm home looking for a gentle companion rather than a nonstop athlete.',color:'#b9ced0'}
  ];
  const faqs = [
    ['Can we meet a dog before deciding?','Yes. A real meeting is part of a thoughtful match. We schedule calm visits so you can observe temperament and ask direct questions.'],
    ['What comes home with our dog?','You receive health and care records, current routine, feeding guidance, transition notes, the written health agreement, and our direct support contact.'],
    ['How do you choose the right match?','We combine your household, pace, experience, and goals with what we have observed daily. Color and order of inquiry never outrank temperament fit.'],
    ['What happens if we need help later?','You contact us. Homecoming questions, adolescence, training transitions, and life changes are normal. Lifetime support means the conversation stays open.']
  ];
  const testimonials = [
    ['“They described Juniper exactly—the confidence, the sensitivity, even the strange way she naps. We never felt sold to; we felt matched.”','Maya & Chris · Oregon'],
    ['“Our vet called the records unusually thorough. The first-week plan made homecoming calmer for our kids and for Murphy.”','The Reed family · Washington'],
    ['“A year later, they still answer. That told us the promise was real, not a sentence written for a website.”','Daniel & Scout · California']
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const storeKey = 'buried-bonds-favorites-v1';
  const readFavorites = () => {
    try { return new Set(JSON.parse(localStorage.getItem(storeKey) || '[]')); }
    catch { return new Set(); }
  };
  const writeFavorites = set => localStorage.setItem(storeKey, JSON.stringify([...set]));
  let favorites = readFavorites();

  function dogCard(dog) {
    const selected = favorites.has(dog.id);
    return `<article class="dog-card" data-dog-id="${dog.id}" data-breed="${dog.breed}" data-age="${dog.age}" data-fit="${dog.fit.join(' ')}">
      <div class="dog-portrait" style="background:${dog.color}" aria-hidden="true"></div>
      <div class="dog-body"><div class="dog-top"><div><h3>${dog.name}</h3><p class="dog-meta">${dog.breed} · ${dog.ageLabel}</p></div></div>
      <p>${dog.summary}</p><div class="dog-tags">${dog.fit.map(tag => `<span>${tag}</span>`).join('')}</div>
      <div class="card-actions"><button class="details" type="button" data-action="details">Meet ${dog.name}</button><button class="favorite${selected ? ' is-favorite' : ''}" type="button" data-action="favorite" aria-pressed="${selected}">${selected ? '♥ Saved' : '♡ Favorite'}</button></div></div></article>`;
  }

  function currentFilters() {
    return {breed:$('#breed').value, age:$('#age').value, fit:$('#fit').value};
  }
  function renderDogs() {
    const filter = currentFilters();
    const visible = dogs.filter(dog =>
      (filter.breed === 'all' || dog.breed === filter.breed) &&
      (filter.age === 'all' || dog.age === filter.age) &&
      (filter.fit === 'all' || dog.fit.includes(filter.fit))
    );
    $('#dog-cards').innerHTML = visible.map(dogCard).join('') || '<p>No exact match is available today. Change a filter or include your ideal companion in the application.</p>';
    $('#result-count').textContent = `${visible.length} thoughtful match${visible.length === 1 ? '' : 'es'} shown`;
  }
  function populateBreeds() {
    [...new Set(dogs.map(dog => dog.breed))].forEach(breed => {
      const option = document.createElement('option'); option.value = breed; option.textContent = breed; $('#breed').append(option);
    });
  }
  function openDetails(id) {
    const dog = dogs.find(item => item.id === id); if (!dog) return;
    $('#dog-detail').innerHTML = `<div class="detail-content"><p class="eyebrow">Potential companion</p><h2>${dog.name}</h2><p>${dog.story}</p><div class="detail-facts"><span>${dog.breed}</span><span>${dog.ageLabel}</span><span>${dog.fit.join(' + ')}</span></div><a class="button" href="#apply" data-dialog-apply>Ask about ${dog.name}</a></div>`;
    const dialog = $('#dog-dialog');
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open','');
  }
  function toggleFavorite(id) {
    favorites.has(id) ? favorites.delete(id) : favorites.add(id); writeFavorites(favorites); renderDogs();
  }
  function renderFAQs() {
    $('#faq-questions').innerHTML = faqs.map(([question,answer],i) => `<article class="faq-item"><button class="faq-question" type="button" aria-expanded="false" aria-controls="answer-${i}"><span>${question}</span><span aria-hidden="true">+</span></button><div class="faq-answer" id="answer-${i}" hidden>${answer}</div></article>`).join('');
  }
  function renderTestimonials() {
    $('#testimonials-list').innerHTML = testimonials.map(([quote,cite]) => `<blockquote>${quote}<cite>${cite}</cite></blockquote>`).join('');
  }
  function validateForm(form) {
    const fields = {
      email: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a complete email address.'],
      phone: [/[0-9].*[0-9].*[0-9].*[0-9].*[0-9].*[0-9].*[0-9]/, 'Enter a phone number with at least seven digits.'],
      message: [/.{20,}/s, 'Tell us a little more—at least 20 characters.']
    };
    let valid = true;
    Object.entries(fields).forEach(([name,[pattern,message]]) => {
      const input = form.elements[name]; const okay = pattern.test(input.value.trim());
      input.setAttribute('aria-invalid', String(!okay)); input.parentElement.querySelector('small').textContent = okay ? '' : message; valid = valid && okay;
    });
    return valid;
  }
  function handleApplication(form) {
    const status = $('#form-status');
    if (!validateForm(form)) { status.textContent = 'Please correct the marked fields.'; return false; }
    const application = Object.fromEntries(new FormData(form));
    localStorage.setItem('buried-bonds-draft-v1', JSON.stringify(application));
    status.textContent = 'Application validated and saved privately in this browser.'; return true;
  }

  function bindEvents() {
    $('#filter-form').addEventListener('submit', event => { event.preventDefault(); renderDogs(); });
    $('#dog-cards').addEventListener('click', event => {
      const button = event.target.closest('button[data-action]'); if (!button) return;
      const id = button.closest('.dog-card').dataset.dogId;
      button.dataset.action === 'favorite' ? toggleFavorite(id) : openDetails(id);
    });
    $('#faq-questions').addEventListener('click', event => {
      const button = event.target.closest('.faq-question'); if (!button) return;
      const answer = document.getElementById(button.getAttribute('aria-controls')); const open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!open)); button.lastElementChild.textContent = open ? '+' : '−'; answer.hidden = open;
    });
    $('#contact-form').addEventListener('submit', event => { event.preventDefault(); handleApplication(event.currentTarget); });
    $('.dialog-close').addEventListener('click', () => $('#dog-dialog').close());
    $('#dog-dialog').addEventListener('click', event => { if (event.target === event.currentTarget) event.currentTarget.close(); });
  }

  function runProductSelfTest() {
    const originalFavorites = new Set(favorites); const checks = [];
    const check = (name, passed) => checks.push({name, passed:Boolean(passed)});
    check('three real dog cards rendered', $$('.dog-card').length === dogs.length);
    toggleFavorite('maple');
    check('favorite action writes persistent localStorage', JSON.parse(localStorage.getItem(storeKey) || '[]').includes('maple') === favorites.has('maple'));
    $('#breed').value = 'Labrador Retriever'; $('#filter-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    check('breed filter changes rendered results', $$('.dog-card').length === 1 && $('.dog-card').dataset.dogId === 'ranger');
    $('#breed').value = 'all'; renderDogs();
    const faqButton = $('.faq-question'); faqButton.click(); check('FAQ click reveals its answer', !document.getElementById(faqButton.getAttribute('aria-controls')).hidden);
    const form = $('#contact-form'); form.elements.email.value='family@example.com'; form.elements.phone.value='555 123 4567'; form.elements.message.value='We are ready for a gentle family companion.';
    check('application validates and saves locally', handleApplication(form) && Boolean(localStorage.getItem('buried-bonds-draft-v1')));
    openDetails('olive'); check('dog details open in a real dialog', $('#dog-dialog').hasAttribute('open')); $('#dog-dialog').close();
    favorites = originalFavorites; writeFavorites(favorites); renderDogs();
    const passed = checks.every(item => item.passed); const proof = document.createElement('pre');
    proof.id='product-self-test'; proof.dataset.status=passed?'passed':'failed'; proof.hidden=true; proof.textContent=JSON.stringify({passed,checks}); document.body.append(proof);
    return {passed,checks};
  }

  function boot() {
    populateBreeds(); renderDogs(); renderFAQs(); renderTestimonials(); bindEvents(); $('#year').textContent = new Date().getFullYear();
    window.__PRODUCT_TEST__ = {run:runProductSelfTest};
    if (new URLSearchParams(location.search).get('selftest') === '1') runProductSelfTest();
    document.documentElement.dataset.productReady = 'true';
  }
  boot();
})();
