/* Enduro Store Павловск — © 2026 Полунин Лев */
(function () {
  'use strict';

  /* ===== НАСТРОЙКИ ===== */
  var CONFIG = {
    phone: '+79631152576',
    phoneHuman: '+7 (963) 115-25-76',
    // Если у Дмитрия есть username в Telegram (например, uhlebin), впишите его сюда без @ —
    // тогда текст заявки подставится в чат автоматически.
    tgUsername: 'pjota3',
    // Иначе открывается чат по номеру телефона, а текст копируется в буфер обмена.
    tgChat: 'https://t.me/pjota3'
  };

  var d = document, root = d.documentElement;
  root.classList.add('js');
  var PRODUCTS = window.PRODUCTS || [];
  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });
  var CATS = { enduro: 'Эндуро и кросс', pit: 'Питбайки', atv: 'Квадроциклы', gear: 'Экипировка' };

  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rub(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + '\u00a0₽'; }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== год ===== */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ===== тахометр в hero ===== */
  var hero = $('.hero');
  if (hero) requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('is-on'); }); });

  /* ===== бургер ===== */
  var burger = $('.burger'), nav = $('#nav');
  function setMenu(open) {
    if (!burger) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('is-open', open);
    d.body.classList.toggle('menu-open', open);
  }
  if (burger) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1080) setMenu(false); });
  }

  /* ===== toast ===== */
  var toastEl = $('#toast'), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 5000);
  }

  /* ===== копирование + Telegram ===== */
  function copyText(text) {
    var ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).catch(function () {}); ok = true; }
    } catch (e) {}
    try {
      var ta = d.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px';
      d.body.appendChild(ta);
      var range = d.createRange(); range.selectNodeContents(ta);
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
      ta.setSelectionRange(0, text.length);
      ok = d.execCommand('copy') || ok;
      sel.removeAllRanges(); d.body.removeChild(ta);
    } catch (e) {}
    return ok;
  }
  function sendToTelegram(text) {
    var copied = copyText(text);
    var url = CONFIG.tgUsername
      ? 'https://t.me/' + CONFIG.tgUsername + '?text=' + encodeURIComponent(text)
      : CONFIG.tgChat;
    var w = window.open(url, '_blank', 'noopener');
    if (!w) window.location.href = url;
    toast(copied
      ? 'Текст заявки скопирован. Вставьте его в чат с Дмитрием и отправьте.'
      : 'Открываем Telegram. Если чат не открылся, позвоните: ' + CONFIG.phoneHuman);
  }

  /* ===== валидация формы ===== */
  function validate(form) {
    var ok = true;
    $$('[required]', form).forEach(function (inp) {
      var fld = inp.closest('.fld'), old = $('.fld__err', fld);
      if (old) old.parentNode.removeChild(old);
      var v = inp.value.trim(), bad = !v;
      if (!bad && inp.type === 'tel') bad = v.replace(/\D/g, '').length < 10;
      fld.classList.toggle('is-err', bad);
      inp.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad) {
        ok = false;
        var e = d.createElement('span'); e.className = 'fld__err';
        e.textContent = inp.type === 'tel' ? 'Введите номер телефона полностью' : 'Заполните это поле';
        fld.appendChild(e);
      }
    });
    if (!ok) { var first = $('[aria-invalid="true"]', form); if (first) first.focus(); }
    return ok;
  }
  d.addEventListener('input', function (e) {
    var fld = e.target.closest && e.target.closest('.fld.is-err');
    if (fld) { fld.classList.remove('is-err'); var er = $('.fld__err', fld); if (er) er.parentNode.removeChild(er); }
  });

  /* ===== форма «под заказ из Китая» ===== */
  $$('#china-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      var f = form.elements;
      var lines = ['Здравствуйте, Дмитрий! Хочу заказать технику из Китая.', 'Ищу: ' + f.what.value.trim()];
      if (f.budget.value.trim()) lines.push('Бюджет: ' + f.budget.value.trim());
      lines.push('Имя: ' + f.name.value.trim(), 'Телефон: ' + f.phone.value.trim(), 'Заявка с сайта: ' + location.href.split('#')[0]);
      sendToTelegram(lines.join('\n'));
    });
  });

  /* ===== карта (ленивая загрузка) ===== */
  var map = $('[data-map]');
  if (map) {
    var loadMap = function () {
      if (map.dataset.loaded) return; map.dataset.loaded = '1';
      var f = d.createElement('iframe');
      f.src = map.getAttribute('data-map'); f.title = 'Карта: Enduro Store, Павловск';
      f.setAttribute('loading', 'lazy'); f.setAttribute('allowfullscreen', '');
      map.innerHTML = ''; map.appendChild(f);
    };
    $('.map__load', map).addEventListener('click', loadMap);
    if ('IntersectionObserver' in window) {
      var mo = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { loadMap(); mo.disconnect(); } }, { rootMargin: '300px' });
      mo.observe(map);
    }
  }

  /* ===== слайдер отзывов ===== */
  $$('[data-slider]').forEach(function (slider) {
    var track = $('.slider__track', slider), slides = $$('.rv', track);
    var sec = slider.closest('section'), prev = $('[data-slide="prev"]', sec), next = $('[data-slide="next"]', sec), dotsBox = $('[data-dots]', sec);
    var i = 0, perView = 1, max = 0;
    function calc() {
      var w = slides[0].getBoundingClientRect().width;
      perView = Math.max(1, Math.round(slider.getBoundingClientRect().width / w));
      max = Math.max(0, slides.length - perView);
      dotsBox.innerHTML = '';
      for (var k = 0; k <= max; k++) {
        var b = d.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Отзыв ' + (k + 1));
        (function (k) { b.addEventListener('click', function () { go(k); }); })(k);
        dotsBox.appendChild(b);
      }
      go(Math.min(i, max));
    }
    function go(n) {
      i = Math.max(0, Math.min(max, n));
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 20;
      var x = (slides[0].getBoundingClientRect().width + gap) * i;
      track.style.transform = 'translate3d(' + (-x) + 'px,0,0)';
      $$('button', dotsBox).forEach(function (b, k) { b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      slides.forEach(function (s, k) { s.setAttribute('aria-hidden', (k < i || k >= i + perView) ? 'true' : 'false'); });
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === max;
    }
    if (prev) prev.addEventListener('click', function () { go(i - 1); });
    if (next) next.addEventListener('click', function () { go(i + 1); });
    var sx = 0, sy = 0, drag = false;
    slider.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; drag = true; }, { passive: true });
    slider.addEventListener('touchend', function (e) {
      if (!drag) return; drag = false;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(i + (dx < 0 ? 1 : -1));
    }, { passive: true });
    slider.setAttribute('tabindex', '0');
    slider.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') go(i + 1); if (e.key === 'ArrowLeft') go(i - 1); });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(calc, 150); });
    calc();
  });

  /* ===== модалка товара ===== */
  var modal = $('#modal'), body = $('#m-body'), box = modal && $('.modal__box', modal);
  var lastFocus = null, scrollY = 0, current = null;
  var onCatalog = d.body.classList.contains('page-catalog');

  function pic(stem, alt, sizes, eager) {
    return '<picture><source type="image/webp" srcset="img/p/' + stem + '-640.webp 640w, img/p/' + stem + '-1280.webp 1280w" sizes="' + sizes + '">' +
      '<img src="img/p/' + stem + '-1280.jpg" alt="' + esc(alt) + '" ' + (eager ? '' : 'loading="lazy" ') + 'decoding="async"></picture>';
  }
  function render(p) {
    var arr = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
    var arrN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
    var multi = p.images.length > 1;
    var gal = '<div class="pm__gal"><div class="pm__main" data-gal>' + pic(p.images[0], p.title, '(max-width: 860px) 100vw, 560px', true) +
      (multi ? '<button class="pm__arr pm__arr--p" type="button" data-g="-1" aria-label="Предыдущее фото">' + arr + '</button><button class="pm__arr pm__arr--n" type="button" data-g="1" aria-label="Следующее фото">' + arrN + '</button>' : '') +
      (multi ? '<span class="pm__count" data-count>1 / ' + p.images.length + '</span>' : '') + '</div>' + (multi ? '<div class="pm__thumbs">' + p.images.map(function (s, k) {
        return '<button type="button" data-thumb="' + k + '" aria-label="Фото ' + (k + 1) + '" aria-current="' + (k === 0) + '"><img src="img/p/' + s + '-640.webp" alt="" loading="lazy"></button>';
      }).join('') + '</div>' : '') + '</div>';
    var price = '<div class="plate' + (p.price ? '' : ' plate--ask') + '"><b class="plate__price">' + (p.price ? rub(p.price) : 'Цена по запросу') + '</b>' +
      (p.oldPrice ? '<s class="plate__old">' + rub(p.oldPrice) + '</s><span class="plate__off">−' + Math.round((1 - p.price / p.oldPrice) * 100) + '%</span>' : '') + '</div>';
    var specs = p.specs && p.specs.length ? '<h3>Характеристики</h3><dl class="specs">' + p.specs.map(function (s) { return '<div><dt>' + esc(s[0]) + '</dt><dd>' + esc(s[1]) + '</dd></div>'; }).join('') + '</dl>' : '';
    var note = p.note ? '<div class="pm__note"><b>' + esc(p.note[0]) + '</b><ul class="pm__feat">' + p.note[1].map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></div>' : '';
    var feat = p.features && p.features.length ? '<h3>Особенности</h3><ul class="pm__feat">' + p.features.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : '';
    var opts = p.options ? '<label class="fld fld--full"><span>Комплектация</span><select name="opt">' + p.options.map(function (o) { return '<option>' + esc(o[0]) + ' — ' + rub(o[1]) + '</option>'; }).join('') + '</select></label>' : '';
    var size = p.sizes && p.sizes.length ? '<label class="fld"><span>Размер</span><select name="size">' + p.sizes.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('') + '</select></label>' : '';
    var form = '<div class="pm__order" id="m-order"><h3>Заинтересовал этот товар?</h3>' +
      '<form class="form" data-order novalidate>' +
      '<label class="fld"><span>Ваше имя</span><input name="name" type="text" required autocomplete="given-name"></label>' +
      '<label class="fld"><span>Телефон</span><input name="phone" type="tel" required placeholder="+7" autocomplete="tel" inputmode="tel"></label>' +
      (size || opts || '<label class="fld"><span>Город доставки</span><input name="city" type="text" placeholder="Павловск" autocomplete="address-level2"></label>') +
      '<label class="fld fld--full"><span>Комментарий</span><textarea name="comment" rows="2" placeholder="Расцветка, вопрос по комплектации, удобное время для звонка"></textarea></label>' +
      '<div class="pm__btns"><button class="btn btn--dark" type="submit">Отправить заявку в Telegram</button><a class="btn btn--line" href="tel:' + CONFIG.phone + '">Позвонить</a></div>' +
      '<p class="form__hint">Текст заявки скопируется и откроется чат с Дмитрием. Сайт ваши данные не хранит.</p></form></div>';
    return '<article class="pm">' + gal + '<div class="pm__side"><div class="pm__info"><p class="pm__cat">' + CATS[p.cat] + '</p><h2 class="pm__title" id="m-title">' + esc(p.title) + '</h2>' + price +
      (p.views ? '<p class="pm__cat" style="margin-top:10px">Посмотрели ' + p.views + ' человек</p>' : '') +
      '<p class="pm__lead">' + esc(p.lead) + '</p>' + specs + feat + note + (p.outro ? '<p class="pm__more">' + esc(p.outro) + '</p>' : '') + '</div>' + form + '</div></article>';
  }

  function lock() {
    scrollY = window.pageYOffset;
    d.body.style.position = 'fixed'; d.body.style.top = (-scrollY) + 'px'; d.body.style.left = '0'; d.body.style.right = '0';
    d.body.classList.add('modal-open');
  }
  function unlock() {
    d.body.style.position = ''; d.body.style.top = ''; d.body.style.left = ''; d.body.style.right = '';
    d.body.classList.remove('modal-open');
    root.style.scrollBehavior = 'auto'; window.scrollTo(0, scrollY); root.style.scrollBehavior = '';
  }

  function openProduct(id, toForm) {
    var p = byId[id]; if (!p || !modal) return false;
    current = p;
    lastFocus = d.activeElement;
    body.innerHTML = render(p);
    modal.hidden = false; lock();
    setupGallery(p);
    var form = $('[data-order]', body);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      var f = form.elements;
      var lines = ['Здравствуйте, Дмитрий! Хочу купить:', p.title + (p.price ? ' — ' + rub(p.price).replace(/\u00a0/g, ' ') : ' (цена по запросу)')];
      if (f.opt) lines.push('Комплектация: ' + f.opt.value.replace(/\u00a0/g, ' '));
      if (f.size) lines.push('Размер: ' + f.size.value);
      if (f.city && f.city.value.trim()) lines.push('Город доставки: ' + f.city.value.trim());
      lines.push('Имя: ' + f.name.value.trim(), 'Телефон: ' + f.phone.value.trim());
      if (f.comment.value.trim()) lines.push('Комментарий: ' + f.comment.value.trim());
      lines.push('Товар на сайте: ' + location.href.split('#')[0].replace(/index\.html$/, '').replace(/[^/]*$/, '') + 'catalog.html#p=' + p.id);
      sendToTelegram(lines.join('\n'));
    });
    if (onCatalog && location.hash !== '#p=' + id) history.replaceState(null, '', '#p=' + id);
    setTimeout(function () {
      var side = $('.pm__side', body), wide = window.innerWidth > 860, sc = wide ? side : box;
      if (toForm) { var o = $('#m-order', body); sc.scrollTop = wide ? o.offsetTop - 16 : o.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 10; $('input', o).focus({ preventScroll: true }); }
      else { sc.scrollTop = 0; box.scrollTop = 0; box.focus({ preventScroll: true }); }
    }, 30);
    return true;
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true; body.innerHTML = ''; unlock(); current = null;
    if (/^#p=/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function setupGallery(p) {
    var main = $('[data-gal]', body); if (!main) return;
    var k = 0, thumbs = $$('[data-thumb]', body);
    function show(n) {
      k = (n + p.images.length) % p.images.length;
      var old = $('picture', main);
      var tmp = d.createElement('div'); tmp.innerHTML = pic(p.images[k], p.title + ', фото ' + (k + 1), '(max-width: 860px) 100vw, 560px', true);
      main.replaceChild(tmp.firstChild, old);
      thumbs.forEach(function (t, j) { t.setAttribute('aria-current', j === k ? 'true' : 'false'); });
      var cnt = $('[data-count]', main); if (cnt) cnt.textContent = (k + 1) + ' / ' + p.images.length;
      if (thumbs[k] && thumbs[k].scrollIntoView) { try { thumbs[k].scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) {} }
    }
    $$('[data-g]', main).forEach(function (b) { b.addEventListener('click', function () { show(k + parseInt(b.getAttribute('data-g'), 10)); }); });
    thumbs.forEach(function (t) { t.addEventListener('click', function () { show(parseInt(t.getAttribute('data-thumb'), 10)); }); });
    var sx = 0, sy = 0;
    main.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    main.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (p.images.length > 1 && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(k + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  if (modal) {
    d.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target : e.target.parentNode;
      var open = t.closest('[data-open]'), buy = t.closest('[data-buy]'), close = t.closest('[data-close]');
      if (open && openProduct(open.getAttribute('data-open'), false)) e.preventDefault();
      else if (buy) { e.preventDefault(); openProduct(buy.getAttribute('data-buy'), true); }
      else if (close) closeModal();
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeModal(); setMenu(false); }
      if (e.key === 'Tab' && !modal.hidden) {
        var f = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', box).filter(function (el) { return el.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && (d.activeElement === first || d.activeElement === box)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      if (!modal.hidden && current && current.images.length > 1 && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !/INPUT|TEXTAREA|SELECT/.test(d.activeElement.tagName)) {
        var b = $('[data-g="' + (e.key === 'ArrowRight' ? 1 : -1) + '"]', body); if (b) b.click();
      }
    });
  }

  /* ===== каталог: фильтр, сортировка, hash ===== */
  var grid = $('#cards');
  var state = { cat: 'all', sort: 'default' };
  function word(n) { var m = n % 10, h = n % 100; return (m === 1 && h !== 11) ? 'товар' : (m >= 2 && m <= 4 && (h < 12 || h > 14)) ? 'товара' : 'товаров'; }
  function applyCatalog() {
    if (!grid) return;
    var cards = $$('.card', grid);
    cards.forEach(function (c, k) { if (!c.dataset.idx) c.dataset.idx = k; });
    cards.sort(function (a, b) {
      var pa = +a.dataset.price || 0, pb = +b.dataset.price || 0;
      if (state.sort === 'asc') return (pa || 1e12) - (pb || 1e12);
      if (state.sort === 'desc') return pb - pa;
      return a.dataset.idx - b.dataset.idx;
    }).forEach(function (c) { grid.appendChild(c); });
    var n = 0;
    cards.forEach(function (c) { var show = state.cat === 'all' || c.dataset.cat === state.cat; c.hidden = !show; if (show) n++; });
    $$('[data-filter]').forEach(function (b) { var on = b.dataset.filter === state.cat; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    var cnt = $('#count'); if (cnt) cnt.textContent = n + ' ' + word(n) + ' в наличии';
  }
  if (grid) {
    $$('[data-filter]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.cat = b.dataset.filter; applyCatalog();
        history.replaceState(null, '', state.cat === 'all' ? location.pathname : '#cat=' + state.cat);
      });
    });
    var sort = $('#sort'); if (sort) sort.addEventListener('change', function () { state.sort = sort.value; applyCatalog(); });
  }
  function readHash() {
    var h = location.hash;
    var mc = h.match(/^#cat=(\w+)/); if (mc && grid && CATS[mc[1]]) state.cat = mc[1];
    applyCatalog();
    var mp = h.match(/^#p=([\w-]+)/);
    if (mp && byId[mp[1]]) { if (!current || current.id !== mp[1]) openProduct(mp[1], false); }
    else if (current) closeModal();
  }
  window.addEventListener('hashchange', readHash);
  readHash();
})();
