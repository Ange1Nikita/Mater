/* ================================================================
   CANVAS: optimized particles + lines
================================================================ */
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  // Skip canvas on reduced motion or low-end devices
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  let W, H, raf, pts = [];

  const COLORS = [[75,124,243],[139,92,246],[245,158,11]];
  const DIST = 130;
  const DIST_SQ = DIST * DIST; // avoid sqrt

  const isMobile = window.innerWidth < 768;

  function mkP() {
    const c = COLORS[(Math.random() * 3) | 0];
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: 1 + Math.random() * 2,
      a: 0.18 + Math.random() * 0.22,
      c
    };
  }

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    const count = isMobile ? Math.min(20, (W * H / 40000) | 0) : Math.min(50, (W * H / 22000) | 0);
    pts = Array.from({ length: count }, mkP);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Update positions
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W;
      else if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      else if (p.y > H) p.y = 0;
    }

    // Draw lines — squared distance to avoid sqrt
    ctx.lineWidth = 0.8;
    for (let i = 0, len = pts.length; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const dSq = dx * dx + dy * dy;
        if (dSq < DIST_SQ) {
          const alpha = (1 - Math.sqrt(dSq) / DIST) * 0.12;
          const [r, g, b] = pts[i].c;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.stroke();
        }
      }
    }

    // Draw dots — batch by color
    for (let ci = 0; ci < COLORS.length; ci++) {
      const [r, g, b] = COLORS[ci];
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (p.c !== COLORS[ci]) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832); // 2*PI
        ctx.fillStyle = `rgba(${r},${g},${b},${p.a})`;
        ctx.fill();
      }
    }

    raf = requestAnimationFrame(draw);
  }

  // Throttled mousemove parallax (skip on mobile — no mouse)
  if (!isMobile) {
    let mx = 0, my = 0, applied = false;
    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!applied) {
        applied = true;
        requestAnimationFrame(() => {
          const ox = (mx / W - 0.5) * 12;
          const oy = (my / H - 0.5) * 12;
          canvas.style.transform = `translate3d(${ox}px,${oy}px,0) scale(1.02)`;
          applied = false;
        });
      }
    }, { passive: true });
  }

  // Debounced resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); draw(); }, 150);
  }, { passive: true });

  resize();
  draw();
})();

/* ================================================================
   SERVICE PRICE DATA — средние цены по Краснодару
================================================================ */
const SERVICE_DATA = {
  plumbing: {
    icon: '🔧',
    title: 'Сантехника',
    subtitle: 'Установка, ремонт, замена сантехнического оборудования',
    prices: [
      ['Установка смесителя', '1 500 – 2 500 ₽'],
      ['Замена смесителя с демонтажом старого', '2 000 – 3 000 ₽'],
      ['Установка унитаза', '2 500 – 4 000 ₽'],
      ['Замена сифона раковины/ванны', '800 – 1 500 ₽'],
      ['Замена гибкой подводки', '500 – 1 000 ₽'],
      ['Установка стиральной машины', '1 500 – 2 500 ₽'],
      ['Установка посудомоечной машины', '2 000 – 3 000 ₽'],
      ['Подключение электрического полотенцесушителя', '3 000 – 5 000 ₽'],
      ['Установка водонагревателя', '3 000 – 5 000 ₽'],
      ['Замена шарового крана', '1 000 – 2 000 ₽'],
      ['Замена гофры унитаза', '800 – 1 500 ₽'],
      ['Герметизация ванны/душевой', '1 000 – 2 000 ₽'],
    ]
  },
  electric: {
    icon: '💡',
    title: 'Электрика',
    subtitle: 'Монтаж, замена, подключение электрооборудования',
    prices: [
      ['Замена розетки / выключателя', '300 – 600 ₽'],
      ['Установка новой розетки (с штроблением)', '1 200 – 2 500 ₽'],
      ['Подключение люстры / светильника', '800 – 1 500 ₽'],
      ['Установка точечных светильников (шт.)', '400 – 800 ₽'],
      ['Замена автомата в щитке', '500 – 1 000 ₽'],
      ['Установка УЗО / дифавтомата', '800 – 1 500 ₽'],
      ['Подключение духового шкафа', '1 200 – 2 000 ₽'],
      ['Установка дверного звонка', '500 – 1 000 ₽'],
      ['Прокладка кабеля (за метр)', '150 – 400 ₽'],
      ['Установка выключателя с диммером', '600 – 1 200 ₽'],
      ['Перенос розетки / выключателя', '1 500 – 3 000 ₽'],
    ]
  },
  mounting: {
    icon: '🖼️',
    title: 'Навеска и монтаж',
    subtitle: 'Карнизы, полки, телевизоры, зеркала и другое',
    prices: [
      ['Навеска полки (одна)', '500 – 1 000 ₽'],
      ['Установка карниза', '800 – 1 500 ₽'],
      ['Навеска телевизора на стену', '1 500 – 2 500 ₽'],
      ['Навеска зеркала', '800 – 1 500 ₽'],
      ['Установка рейлинга на кухню', '600 – 1 200 ₽'],
      ['Навеска картины / фоторамки', '300 – 600 ₽'],
      ['Установка вешалки в прихожую', '500 – 1 000 ₽'],
      ['Монтаж настенного шкафчика', '800 – 1 500 ₽'],
      ['Установка сушилки для белья', '800 – 1 500 ₽'],
      ['Установка жалюзи / рулонных штор', '600 – 1 200 ₽'],
      ['Монтаж полотенцедержателя', '400 – 800 ₽'],
      ['Установка зеркального шкафчика', '1 000 – 2 000 ₽'],
    ]
  },
  doors: {
    icon: '🚪',
    title: 'Двери и замки',
    subtitle: 'Замена замков и фурнитуры',
    prices: [
      ['Замена дверного замка', '800 – 2 000 ₽'],
      ['Установка доводчика двери', '1 000 – 2 000 ₽'],
      ['Регулировка двери', '500 – 1 200 ₽'],
      ['Установка порога', '500 – 1 000 ₽'],
      ['Установка глазка', '300 – 600 ₽'],
    ]
  },
  repair: {
    icon: '🏠',
    title: 'Мелкий ремонт',
    subtitle: 'Бытовые задачи, починка, установка — одним визитом',
    prices: [
      ['Ремонт мебельных петель', '300 – 600 ₽'],
      ['Монтаж плинтуса (за метр)', '150 – 350 ₽'],
      ['Заделка отверстий в стене', '300 – 800 ₽'],
      ['Мелкий ремонт плитки', '800 – 2 000 ₽'],
      ['Замена ручки / фурнитуры (шт.)', '200 – 500 ₽'],
      ['Установка москитной сетки', '500 – 1 000 ₽'],
      ['Мастер на час (1 час работы)', '1 000 – 1 800 ₽'],
      ['Сварка петли на ворота/калитку', '800 – 1 500 ₽'],
      ['Реставрация ворот (сварка)', '2 500 – 5 000 ₽'],
      ['Ремонт забора (сварочные работы)', '1 500 – 4 000 ₽'],
      ['Мелкие сварочные работы (за час)', '1 200 – 2 000 ₽'],
    ]
  }
};

/* ================================================================
   DOM READY
================================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ========== SCROLL REVEAL (IntersectionObserver) ========== */
  const revealObserver = new IntersectionObserver((entries) => {
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].isIntersecting) {
        const el = entries[i].target;
        const parent = el.parentElement;
        const siblings = parent.querySelectorAll('.reveal');
        let idx = 0;
        for (let j = 0; j < siblings.length; j++) {
          if (siblings[j] === el) { idx = j; break; }
        }
        setTimeout(() => { el.classList.add('visible'); }, idx * 70);
        revealObserver.unobserve(el);
      }
    }
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  const reveals = document.querySelectorAll('.reveal');
  for (let i = 0; i < reveals.length; i++) revealObserver.observe(reveals[i]);

  /* ========== BURGER ========== */
  const burger = document.querySelector('.burger');
  const mobileMenu = document.getElementById('mobileMenu');

  function closeMenu() {
    burger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      burger.classList.toggle('open');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close button
    var closeBtn = mobileMenu.querySelector('.mobile-menu__close');
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    // Close on link click
    var mobileLinks = mobileMenu.querySelectorAll('a');
    for (let i = 0; i < mobileLinks.length; i++) {
      mobileLinks[i].addEventListener('click', closeMenu);
    }
  }

  /* ========== SERVICE MODAL ========== */
  const modal = document.getElementById('serviceModal');

  if (modal) {
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubtitle = document.getElementById('modalSubtitle');
    const modalPrices = document.getElementById('modalPrices');
    const modalContent = modal.querySelector('.service-modal__content');
    function openModal(key) {
      const d = SERVICE_DATA[key];
      if (!d) return;

      modalIcon.textContent = d.icon;
      modalTitle.textContent = d.title;
      modalSubtitle.textContent = d.subtitle;

      let h = '';
      for (let i = 0; i < d.prices.length; i++) {
        h += '<div class="price-row"><span class="price-row__name">' + d.prices[i][0] + '</span><span class="price-row__val">' + d.prices[i][1] + '</span></div>';
      }
      modalPrices.innerHTML = h;

      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
      modal.classList.add('open');
      modalContent.scrollTop = 0;
    }

    function closeModal() {
      modal.classList.remove('open');
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
    }

    // Open — click on service card
    document.querySelector('.services__grid').addEventListener('click', function(e) {
      var card = e.target.closest('[data-service]');
      if (card) openModal(card.getAttribute('data-service'));
    });

    // Close — backdrop
    modal.querySelector('.service-modal__backdrop').addEventListener('click', closeModal);

    // Close — X button
    modal.querySelector('.service-modal__close').addEventListener('click', closeModal);

    // Close — CTA button, then scroll to form
    modal.querySelector('.service-modal__cta').addEventListener('click', function() {
      closeModal();
      setTimeout(function() {
        var el = document.getElementById('cta');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    });

    // Close — Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });
  }

  /* ========== FAQ (event delegation) ========== */
  const faqList = document.querySelector('.faq__list');
  if (faqList) {
    faqList.addEventListener('click', (e) => {
      const btn = e.target.closest('.faq-item__question');
      if (!btn) return;
      const item = btn.parentElement;
      const isActive = item.classList.contains('active');
      const items = faqList.querySelectorAll('.faq-item');
      for (let i = 0; i < items.length; i++) items[i].classList.remove('active');
      if (!isActive) item.classList.add('active');
    });
  }

  /* ========== SMOOTH SCROLL (event delegation) ========== */
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    const id = anchor.getAttribute('href');
    if (id.length <= 1) return;
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  /* ========== FORM ========== */
  const form = document.getElementById('orderForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const data = Object.fromEntries(new FormData(form));
      const btn = form.querySelector('button[type="submit"]');
      const orig = btn.innerHTML;
      btn.innerHTML = 'Отправляем...';
      btn.disabled = true;

      try {
        const res = await fetch('/api/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          showToast('Заявка отправлена! Мы свяжемся с вами в ближайшее время.');
          form.reset();
        } else {
          throw 0;
        }
      } catch {
        showToast('Ошибка отправки. Попробуйте позже или позвоните нам.', true);
      } finally {
        btn.innerHTML = orig;
        btn.disabled = false;
      }
    });
  }

  /* ========== NAV SCROLL (throttled with rAF) ========== */
  const nav = document.querySelector('.nav');
  let navScrolled = false, scrollTicking = false;

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(() => {
        const shouldAdd = window.scrollY > 60;
        if (shouldAdd !== navScrolled) {
          nav.classList.toggle('scrolled', shouldAdd);
          navScrolled = shouldAdd;
        }
        scrollTicking = false;
      });
    }
  }, { passive: true });
});

/* ========== ELECTRIC EDGE — импульс по контуру блоков ========== */
(function() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Общие SVG defs (градиент + glow фильтр) — один на страницу
  var defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  defs.setAttribute('width', '0');
  defs.setAttribute('height', '0');
  defs.style.position = 'absolute';
  defs.innerHTML =
    '<defs>' +
      '<linearGradient id="elecGrad" x1="0%" y1="0%" x2="100%" y2="0%">' +
        '<stop offset="0%" stop-color="rgba(139,92,246,0)" />' +
        '<stop offset="30%" stop-color="rgba(168,85,247,0.8)" />' +
        '<stop offset="50%" stop-color="#fff" />' +
        '<stop offset="70%" stop-color="rgba(168,85,247,0.8)" />' +
        '<stop offset="100%" stop-color="rgba(139,92,246,0)" />' +
      '</linearGradient>' +
      '<filter id="elecGlow" x="-50%" y="-50%" width="200%" height="200%">' +
        '<feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />' +
        '<feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
      '</filter>' +
    '</defs>';
  document.body.appendChild(defs);

  var selectors = [
    '.service-card', '.step', '.review-card', '.showcase-row',
    '.advantage', '.faq-item', '.trust-strip',
    '.cta__inner', '.map-card'
  ];

  var allEls = [];

  function setupEl(el) {
    el.classList.add('electric');
    var pos = getComputedStyle(el).position;
    if (pos === 'static') el.style.position = 'relative';

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'elec-svg');
    svg.setAttribute('preserveAspectRatio', 'none');

    // Получаем border-radius
    var r = parseFloat(getComputedStyle(el).borderRadius) || 0;
    var w = el.offsetWidth;
    var h = el.offsetHeight;

    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

    // Путь по контуру с скруглениями
    var path = buildRoundedPath(w, h, Math.min(r, w / 2, h / 2));

    // Flash line (фоновая рамка)
    var flash = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    flash.setAttribute('d', path);
    flash.setAttribute('class', 'elec-flash');

    // Main impulse line
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('d', path);
    line.setAttribute('class', 'elec-line');

    // Вычисляем длину пути
    svg.appendChild(flash);
    svg.appendChild(line);
    el.appendChild(svg);

    // После вставки — обновим dasharray по реальной длине
    requestAnimationFrame(function() {
      var len = line.getTotalLength();
      var seg = len * 0.12; // длина искры = 12% периметра
      line.style.strokeDasharray = seg + ' ' + (len + seg);
      line.style.strokeDashoffset = len + seg;
      line._len = len;
      line._seg = seg;
    });

    return { el: el, svg: svg, line: line, flash: flash };
  }

  function buildRoundedPath(w, h, r) {
    // Строим path по контуру прямоугольника с закруглениями
    return 'M ' + r + ' 0 ' +
      'L ' + (w - r) + ' 0 ' +
      'Q ' + w + ' 0 ' + w + ' ' + r + ' ' +
      'L ' + w + ' ' + (h - r) + ' ' +
      'Q ' + w + ' ' + h + ' ' + (w - r) + ' ' + h + ' ' +
      'L ' + r + ' ' + h + ' ' +
      'Q 0 ' + h + ' 0 ' + (h - r) + ' ' +
      'L 0 ' + r + ' ' +
      'Q 0 0 ' + r + ' 0 Z';
  }

  function fireImpulse(item) {
    var line = item.line;
    var flash = item.flash;
    if (!line._len) return;

    var len = line._len;
    var seg = line._seg;

    // Убираем старую анимацию
    line.classList.remove('fire');
    flash.classList.remove('fire');
    item.el.classList.remove('elec-glow');

    void line.offsetWidth; // force reflow

    // Рандомное направление (50/50)
    if (Math.random() > 0.5) {
      line.style.strokeDashoffset = len + seg;
      line.style.setProperty('--elec-end', (-seg) + '');
    } else {
      line.style.strokeDashoffset = -(seg);
      line.style.setProperty('--elec-end', (len + seg) + '');
    }

    // Fire!
    line.classList.add('fire');
    flash.classList.add('fire');
    item.el.classList.add('elec-glow');

    // Убираем glow после анимации
    setTimeout(function() {
      item.el.classList.remove('elec-glow');
    }, 600);

    // Cleanup
    setTimeout(function() {
      line.classList.remove('fire');
      flash.classList.remove('fire');
    }, 1000);
  }

  // IntersectionObserver — инициализируем при появлении
  var obs = new IntersectionObserver(function(entries) {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].isIntersecting && !entries[i].target._elec) {
        entries[i].target._elec = true;
        var item = setupEl(entries[i].target);
        allEls.push(item);
        obs.unobserve(entries[i].target);

        // Первый импульс через 1-3 секунды
        setTimeout(function(it) {
          return function() { fireImpulse(it); };
        }(item), 1000 + Math.random() * 2000);
      }
    }
  }, { threshold: 0.05 });

  // Собираем все элементы
  for (var s = 0; s < selectors.length; s++) {
    var els = document.querySelectorAll(selectors[s]);
    for (var i = 0; i < els.length; i++) obs.observe(els[i]);
  }

  // Рандомные вспышки — каждые 2-5 секунд один случайный элемент
  setInterval(function() {
    if (!allEls.length) return;
    var idx = Math.floor(Math.random() * allEls.length);
    fireImpulse(allEls[idx]);

    // Иногда двойная вспышка (20% шанс)
    if (Math.random() < 0.2 && allEls.length > 1) {
      var idx2 = (idx + 1 + Math.floor(Math.random() * (allEls.length - 1))) % allEls.length;
      setTimeout(function() { fireImpulse(allEls[idx2]); }, 100 + Math.random() * 200);
    }
  }, 2500 + Math.random() * 2500);

  // Hover — усиленный импульс
  document.addEventListener('mouseenter', function(e) {
    var el = e.target.closest('.electric');
    if (!el) return;
    for (var i = 0; i < allEls.length; i++) {
      if (allEls[i].el === el) { fireImpulse(allEls[i]); break; }
    }
  }, true);
})();

/* ========== TOAST ========== */
function showToast(msg, isError) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => { t.className = 'toast'; }, 4000);
}

/* ================================================================
   REVIEWS — localStorage
================================================================ */
(function() {
  var grid = document.getElementById('reviewsGrid');
  var openBtn = document.getElementById('openReviewForm');
  var modal = document.getElementById('reviewModal');
  var form = document.getElementById('reviewForm');
  var starsContainer = document.getElementById('reviewStars');
  if (!grid || !modal || !form) return;

  var rating = 5;

  // Load saved reviews
  function loadReviews() {
    var saved = [];
    try { saved = JSON.parse(localStorage.getItem('masterpro_reviews') || '[]'); } catch(e) {}
    // Remove old user reviews from DOM
    grid.querySelectorAll('.review-card--user').forEach(function(el) { el.remove(); });
    // Add saved reviews
    for (var i = 0; i < saved.length; i++) {
      var r = saved[i];
      var stars = '';
      for (var s = 0; s < r.rating; s++) stars += '⭐';
      var el = document.createElement('article');
      el.className = 'review-card review-card--user visible';
      el.innerHTML =
        '<div class="review-card__new">Новый</div>' +
        '<div class="review-card__stars">' + stars + '</div>' +
        '<p class="review-card__text">"' + escapeHtml(r.text) + '"</p>' +
        '<div class="review-card__author"><div class="review-card__avatar">' + escapeHtml(r.name.charAt(0).toUpperCase()) + '</div><div><div class="review-card__name">' + escapeHtml(r.name) + '</div><div class="review-card__date">' + r.date + '</div></div></div>';
      grid.appendChild(el);
    }
  }

  function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function openModal() {
    modal.classList.add('open');
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');
    // Reset form
    form.reset();
    rating = 5;
    updateStars(5);
    // Show form, hide success
    form.style.display = '';
    var succ = modal.querySelector('.review-form__success');
    if (succ) succ.remove();
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
  }

  function updateStars(val) {
    rating = val;
    var stars = starsContainer.querySelectorAll('.review-form__star');
    for (var i = 0; i < stars.length; i++) {
      stars[i].classList.toggle('active', (i + 1) <= val);
    }
  }

  // Star click
  starsContainer.addEventListener('click', function(e) {
    var star = e.target.closest('.review-form__star');
    if (star) updateStars(parseInt(star.getAttribute('data-val')));
  });

  // Star hover
  starsContainer.addEventListener('mouseover', function(e) {
    var star = e.target.closest('.review-form__star');
    if (!star) return;
    var val = parseInt(star.getAttribute('data-val'));
    var stars = starsContainer.querySelectorAll('.review-form__star');
    for (var i = 0; i < stars.length; i++) {
      stars[i].classList.toggle('active', (i + 1) <= val);
    }
  });

  starsContainer.addEventListener('mouseleave', function() {
    updateStars(rating);
  });

  // Open
  openBtn.addEventListener('click', openModal);

  // Close
  modal.querySelector('.review-modal__backdrop').addEventListener('click', closeModal);
  modal.querySelector('.review-modal__close').addEventListener('click', closeModal);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  // Submit
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var name = form.querySelector('[name="name"]').value.trim();
    var text = form.querySelector('[name="text"]').value.trim();
    if (!name || !text) return;

    // Save
    var saved = [];
    try { saved = JSON.parse(localStorage.getItem('masterpro_reviews') || '[]'); } catch(e) {}

    var now = new Date();
    var dateStr = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

    saved.push({ name: name, text: text, rating: rating, date: dateStr });
    localStorage.setItem('masterpro_reviews', JSON.stringify(saved));

    // Show success
    form.style.display = 'none';
    var succ = document.createElement('div');
    succ.className = 'review-form__success';
    succ.innerHTML = '<div class="review-form__success-icon">✅</div><div class="review-form__success-title">Спасибо за отзыв!</div><div class="review-form__success-text">Ваш отзыв добавлен на страницу</div>';
    modal.querySelector('.review-modal__content').appendChild(succ);

    // Reload reviews
    loadReviews();

    // Auto close after 2s
    setTimeout(closeModal, 2000);
  });

  // Init
  loadReviews();
})();

/* ================================================================
   LIGHTBOX
================================================================ */
(function() {
  var lb = document.getElementById('lightbox');
  if (!lb) return;

  var img = document.getElementById('lightboxImg');
  var caption = document.getElementById('lightboxCaption');
  var items = [];
  var currentIdx = 0;

  function collectItems() {
    items = [];
    document.querySelectorAll('.portfolio__item img, .gallery-grid__item img').forEach(function(el) {
      items.push({ src: el.src, alt: el.alt });
    });
  }

  function open(idx) {
    collectItems();
    if (idx < 0 || idx >= items.length) return;
    currentIdx = idx;
    img.src = items[idx].src;
    img.alt = items[idx].alt;
    caption.textContent = items[idx].alt;
    lb.classList.add('open');
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');
  }

  function close() {
    lb.classList.remove('open');
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
  }

  function nav(dir) {
    var next = currentIdx + dir;
    if (next < 0) next = items.length - 1;
    if (next >= items.length) next = 0;
    currentIdx = next;
    img.src = items[next].src;
    img.alt = items[next].alt;
    caption.textContent = items[next].alt;
  }

  // Click on portfolio/gallery image
  document.addEventListener('click', function(e) {
    var item = e.target.closest('.portfolio__item, .gallery-grid__item');
    if (!item) return;
    var imgEl = item.querySelector('img');
    if (!imgEl) return;
    collectItems();
    for (var i = 0; i < items.length; i++) {
      if (items[i].src === imgEl.src) { open(i); break; }
    }
  });

  lb.querySelector('.lightbox__close').addEventListener('click', close);
  lb.addEventListener('click', function(e) {
    if (e.target === lb) close();
  });
  lb.querySelector('.lightbox__nav--prev').addEventListener('click', function(e) { e.stopPropagation(); nav(-1); });
  lb.querySelector('.lightbox__nav--next').addEventListener('click', function(e) { e.stopPropagation(); nav(1); });

  document.addEventListener('keydown', function(e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') nav(-1);
    if (e.key === 'ArrowRight') nav(1);
  });
})();
