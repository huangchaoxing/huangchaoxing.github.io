/* Floating gallery: photos drift inside a frame; click one to freeze it and reveal where it was taken. */
(function () {
  var wrapper = document.querySelector('.cx-float');
  if (!wrapper) return;
  var stage = wrapper.querySelector('.cx-float__stage');
  var items = Array.prototype.slice.call(wrapper.querySelectorAll('.cx-float__item'));
  if (!stage || !items.length) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  wrapper.classList.add('is-floating');

  var state = [];
  var W = 0;
  var H = 0;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, max) { return v < 0 ? 0 : (v > max ? max : v); }

  function measure() {
    W = stage.clientWidth;
    H = stage.clientHeight;
  }

  function draw(el, s) {
    el.style.transform = 'translate3d(' + Math.round(s.x) + 'px,' + Math.round(s.y) + 'px,0) rotate(' + s.rot.toFixed(2) + 'deg)';
  }

  function place() {
    measure();
    var cols = W < 620 ? 2 : 4;
    var rows = Math.ceil(items.length / cols);
    var cellW = W / cols;
    var cellH = H / rows;
    items.forEach(function (el, i) {
      var w = el.offsetWidth || 200;
      var h = el.offsetHeight || 150;
      if (!state[i]) {
        var c = i % cols;
        var r = Math.floor(i / cols);
        state[i] = {
          x: clamp(c * cellW + rand(0, Math.max(0, cellW - w)), Math.max(0, W - w)),
          y: clamp(r * cellH + rand(0, Math.max(0, cellH - h)), Math.max(0, H - h)),
          vx: Math.random() < 0.5 ? rand(-30, -14) : rand(14, 30),
          vy: Math.random() < 0.5 ? rand(-24, -11) : rand(11, 24),
          rot: rand(-3.5, 3.5),
          paused: false
        };
        el.style.zIndex = String(10 + i);
      }
      var s = state[i];
      s.x = clamp(s.x, Math.max(0, W - w));
      s.y = clamp(s.y, Math.max(0, H - h));
      draw(el, s);
    });
  }

  var last = 0;
  function tick(now) {
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      var s = state[i];
      if (!s || s.paused) continue;
      var w = el.offsetWidth;
      var h = el.offsetHeight;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.x < 0) { s.x = 0; s.vx = Math.abs(s.vx); }
      if (s.y < 0) { s.y = 0; s.vy = Math.abs(s.vy); }
      if (s.x + w > W) { s.x = W - w; s.vx = -Math.abs(s.vx); }
      if (s.y + h > H) { s.y = H - h; s.vy = -Math.abs(s.vy); }
      draw(el, s);
    }
    window.requestAnimationFrame(tick);
  }

  function resumeOthers(except) {
    for (var i = 0; i < items.length; i++) {
      if (i === except) continue;
      if (state[i] && state[i].paused) {
        state[i].paused = false;
        items[i].classList.remove('is-paused');
      }
    }
  }

  function toggle(el, i, ev) {
    if (ev) { ev.stopPropagation(); }
    var s = state[i];
    s.paused = !s.paused;
    el.classList.toggle('is-paused', s.paused);
    if (s.paused) { resumeOthers(i); }
  }

  items.forEach(function (el, i) {
    el.addEventListener('click', function (ev) { toggle(el, i, ev); });
  });

  Array.prototype.slice.call(wrapper.querySelectorAll('.cx-float__link')).forEach(function (a) {
    a.addEventListener('click', function (ev) { ev.stopPropagation(); });
  });

  stage.addEventListener('click', function () { resumeOthers(-1); });

  window.addEventListener('resize', place);
  place();
  window.requestAnimationFrame(tick);
})();
