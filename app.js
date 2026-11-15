(function () {
  'use strict';

  var API = 'https://script.google.com/macros/s/AKfycbz5kj8AdV60dorjY87FhXt9KiE1f8wJuP9yk4gqfjTa6-hg0UO96XclV6bCPVmoKXkk/exec';
  var SPEC = window.DEPO;
  var Q = SPEC.q;
  var OTHER = '__other';
  var DRAFT = 'depo3_draft', DONE = 'depo3_done';

  var S = { code: '', page: 0, t0: 0, ans: {}, oth: {} };
  var $ = function (id) { return document.getElementById(id); };
  var screens = { full: [], short: [] };
  var busy = false;

  function store(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function load(k) { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function drop(k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  function save() { if (S.code) store(DRAFT, S); }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // Keeps "Đề-Pô" on one line so the hyphen never splits the brand name.
  function rich(tag, cls, text) {
    var e = el(tag, cls);
    text.split('Đề-Pô').forEach(function (part, i) {
      if (i) e.appendChild(el('span', 'nb', 'Đề-Pô'));
      e.appendChild(document.createTextNode(part));
    });
    return e;
  }

  function flow() { return SPEC.shortSegs.indexOf(S.ans.seg) >= 0 ? 'short' : 'full'; }
  function pages() { return SPEC.flows[flow()]; }
  function boxes(key) { return document.querySelectorAll('.qb[data-key="' + key + '"]'); }

  function picked(key) {
    var v = S.ans[key];
    if (Q[key].type === 'many') return v || [];
    return v == null || v === '' ? [] : [v];
  }

  function buildQuestion(fl, key, num, total) {
    var q = Q[key];
    var box = el('div', 'card qb');
    box.setAttribute('data-key', key);
    var name = fl + '-' + key;
    box.appendChild(el('span', 'qn', 'Câu ' + num + '/' + total));
    var title = rich('p', 'q', q.t + ' ');
    title.appendChild(q.type === 'text' ? el('span', 'opt-tag', '(Không bắt buộc)') : el('span', 'req', '*'));
    box.appendChild(title);
    if (q.h) box.appendChild(rich('p', 'hint', q.h));
    box.appendChild(el('p', 'err'));

    if (q.type === 'text') {
      var t = q.short ? el('input') : el('textarea');
      if (q.short) { t.type = 'text'; t.maxLength = 40; t.className = 'one-word'; } else { t.maxLength = 300; }
      t.placeholder = q.short ? 'Một từ của bạn' : 'Bạn có thể bỏ qua nếu chưa nghĩ ra';
      t.setAttribute('data-text', key);
      t.addEventListener('input', function () { S.ans[key] = t.value; syncText(key, t); save(); });
      box.appendChild(t);
      return box;
    }

    if (q.type === 'scale') {
      var legend = el('div', 'legend');
      [['0', q.lo], ['10', q.hi]].forEach(function (p) {
        var row = el('div', 'lg-row');
        row.appendChild(el('span', 'lg-n', p[0]));
        row.appendChild(el('span', '', '= ' + p[1]));
        legend.appendChild(row);
      });
      box.appendChild(legend);
      var grid = el('div', 'scale');
      grid.setAttribute('role', 'radiogroup');
      for (var n = 0; n <= 10; n++) {
        (function (n) {
          var b = el('button', 'sc', String(n));
          b.type = 'button';
          b.setAttribute('role', 'radio');
          b.setAttribute('data-v', String(n));
          b.setAttribute('aria-label', n + ' trên 10');
          b.addEventListener('click', function () { S.ans[key] = n; afterPick(key); });
          grid.appendChild(b);
        })(n);
      }
      box.appendChild(grid);
      return box;
    }

    var wrap = el('div', 'opts');
    var list = q.o.slice();
    if (q.other) list.push(OTHER);
    list.forEach(function (v) {
      var lab = el('label', 'o' + (q.type === 'many' ? ' cb' : ''));
      var inp = el('input');
      inp.type = q.type === 'many' ? 'checkbox' : 'radio';
      inp.name = name;
      inp.value = v;
      lab.appendChild(inp);
      lab.appendChild(el('span', 'mk'));
      lab.appendChild(el('span', 'ot', v === OTHER ? 'Khác (bạn ghi rõ)' : v));
      inp.addEventListener('change', function () { onPick(key, v, inp.checked); });
      wrap.appendChild(lab);
    });
    box.appendChild(wrap);

    if (q.other) {
      var oi = el('input', 'other');
      oi.type = 'text';
      oi.maxLength = 150;
      oi.placeholder = 'Bạn ghi rõ ở đây';
      oi.hidden = true;
      oi.setAttribute('data-other', key);
      oi.addEventListener('input', function () { S.oth[key] = oi.value; syncText(key, oi, true); clearErr(key); save(); });
      box.appendChild(oi);
    }
    if (q.type === 'many') {
      var fn = el('p', 'full-note', 'Đã chọn đủ ' + q.max + '. Muốn đổi, bạn bỏ chọn một ô trước.');
      fn.hidden = true;
      box.appendChild(fn);
    }
    return box;
  }

  function onPick(key, v, on) {
    var q = Q[key];
    if (q.type === 'many') {
      var cur = picked(key).filter(function (x) { return x !== v; });
      if (on) {
        if (q.excl && v === q.excl) cur = [];
        else if (q.excl) cur = cur.filter(function (x) { return x !== q.excl; });
        if (cur.length < q.max) cur.push(v);
      }
      S.ans[key] = cur;
    } else {
      S.ans[key] = v;
    }
    afterPick(key);
    if (v === OTHER && on) {
      var vis = Array.prototype.filter.call(document.querySelectorAll('input[data-other="' + key + '"]'), function (i) { return i.offsetParent; });
      if (vis[0] && !vis[0].value) vis[0].focus();
    }
  }

  function afterPick(key) {
    syncQuestion(key);
    clearErr(key);
    if (key === 'seg') {
      var n = SPEC.flows[flow()].reduce(function (a, p) { return a + p.qs.length; }, 0);
      boxes('seg').forEach(function (b) { b.querySelector('.qn').textContent = 'Câu 1/' + n; });
      updateChrome();
    }
    save();
  }

  function syncText(key, src, other) {
    var sel = other ? 'input[data-other="' + key + '"]' : '[data-text="' + key + '"]';
    document.querySelectorAll(sel).forEach(function (t) { if (t !== src) t.value = other ? (S.oth[key] || '') : (S.ans[key] || ''); });
  }

  function syncQuestion(key) {
    var q = Q[key], cur = picked(key);
    boxes(key).forEach(function (box) {
      if (q.type === 'scale') {
        box.querySelectorAll('.sc').forEach(function (b) {
          var on = String(S.ans[key]) === b.getAttribute('data-v');
          b.classList.toggle('on', on);
          b.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        return;
      }
      if (q.type === 'text') { var t = box.querySelector('[data-text]'); if (t) t.value = S.ans[key] || ''; return; }
      var full = q.type === 'many' && cur.length >= q.max;
      box.querySelectorAll('label.o').forEach(function (lab) {
        var inp = lab.querySelector('input');
        var on = cur.indexOf(inp.value) >= 0;
        inp.checked = on;
        lab.classList.toggle('on', on);
        inp.disabled = full && !on;
        lab.classList.toggle('off', full && !on);
      });
      var fnote = box.querySelector('.full-note');
      if (fnote) fnote.hidden = !full;
      var oi = box.querySelector('input.other');
      if (oi) { oi.hidden = cur.indexOf(OTHER) < 0; oi.value = S.oth[key] || ''; }
    });
  }

  function clearErr(key) {
    boxes(key).forEach(function (b) { b.classList.remove('bad'); b.querySelector('.err').textContent = ''; });
  }

  function visibleBox(key) {
    var arr = Array.prototype.filter.call(boxes(key), function (b) { return b.offsetParent; });
    return arr[0];
  }

  function validatePage(i) {
    var first = null;
    pages()[i - 1].qs.forEach(function (key) {
      var q = Q[key];
      if (q.type === 'text') return;
      clearErr(key);
      var box = visibleBox(key);
      var msg = '';
      if (q.type === 'scale') { if (S.ans[key] == null || S.ans[key] === '') msg = 'Bạn vui lòng chạm vào một số từ 0 đến 10.'; }
      else if (!picked(key).length) msg = q.type === 'many' ? 'Bạn vui lòng chọn ít nhất một phương án.' : 'Bạn vui lòng chọn một phương án.';
      else if (picked(key).indexOf(OTHER) >= 0 && !(S.oth[key] || '').trim()) msg = 'Bạn vui lòng ghi rõ ở ô “Khác”.';
      if (msg) {
        box.classList.add('bad');
        box.querySelector('.err').textContent = msg;
        first = first || box;
      }
    });
    if (first) window.scrollTo({ top: first.getBoundingClientRect().top + window.scrollY - 96, behavior: 'smooth' });
    return !first;
  }

  function isLast() { return S.page === pages().length; }

  function updateChrome() {
    if (!$('done').hidden) return;
    $('back').hidden = S.page === 0;
    $('next').textContent = S.page === 0 ? 'Bắt đầu' : (isLast() ? 'Gửi khảo sát' : 'Tiếp tục');
    var pr = $('progress');
    pr.hidden = S.page === 0;
    if (S.page > 0) {
      var total = pages().length;
      $('ptitle').textContent = pages()[S.page - 1].sec;
      $('pstep').textContent = S.page + '/' + total;
      $('pfill').style.width = Math.round(S.page / total * 100) + '%';
    }
  }

  function show(i) {
    S.page = i;
    $('s0').hidden = i !== 0;
    ['full', 'short'].forEach(function (f) {
      screens[f].forEach(function (s, k) { s.hidden = !(i > 0 && f === flow() && k === i - 1); });
    });
    $('done').hidden = true;
    updateChrome();
    window.scrollTo(0, 0);
    save();
  }

  function buildPages() {
    var main = $('app'), done = $('done');
    ['full', 'short'].forEach(function (f) {
      var total = SPEC.flows[f].reduce(function (a, p) { return a + p.qs.length; }, 0);
      var num = 0;
      SPEC.flows[f].forEach(function (p) {
        var sec = el('section', 'screen');
        sec.hidden = true;
        p.qs.forEach(function (k) { num += 1; sec.appendChild(buildQuestion(f, k, num, total)); });
        main.insertBefore(sec, done);
        screens[f].push(sec);
      });
    });
    Object.keys(Q).forEach(syncQuestion);
  }

  function netMsg(msg) { var n = $('netErr'); n.textContent = msg; n.hidden = !msg; }
  function codeErr(msg) { $('codeErr').textContent = msg; }

  function getJSON(url, opts) {
    return fetch(url, opts).then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); });
  }

  function startWithCode() {
    var d = ($('code').value || '').replace(/\D/g, '');
    if (!d || +d === 0) { codeErr('Bạn nhập 3 chữ số nhân viên đọc cho bạn, ví dụ 007.'); $('code').focus(); return; }
    var code = 'DP' + ('00' + d).slice(-3);
    $('code').blur();
    setBusy(true, 'Đang kiểm tra mã…');
    getJSON(API + '?check=' + encodeURIComponent(code)).then(function (r) {
      if (!r.ok && r.err === 'closed') { codeErr('Khảo sát đã kết thúc. Cảm ơn bạn!'); return; }
      if (!r.ok) { codeErr('Mã ' + code + ' chưa đúng. Bạn hỏi lại nhân viên giúp nhé.'); return; }
      if (r.used) { codeErr('Mã ' + code + ' đã được dùng. Bạn hỏi nhân viên mã khác giúp nhé.'); return; }
      codeErr('');
      if (S.code !== code) { S.code = code; S.t0 = Date.now(); }
      show(1);
    }).catch(function () {
      codeErr('Chưa kết nối được. Bạn kiểm tra mạng (có thể dùng wifi quán) rồi bấm lại.');
    }).then(function () { setBusy(false); });
  }

  function payload() {
    var p = { code: S.code, dur: (Date.now() - S.t0) / 1000, hp: $('hp').value };
    pages().forEach(function (pg) {
      pg.qs.forEach(function (k) {
        var q = Q[k], v = S.ans[k];
        var fix = function (x) { return x === OTHER ? 'Khác: ' + (S.oth[k] || '').trim() : x; };
        if (q.type === 'text') p[k] = (v || '').trim();
        else if (q.type === 'scale') p[k] = v;
        else if (q.type === 'many') p[k] = (v || []).map(fix);
        else p[k] = v ? fix(v) : '';
      });
    });
    return p;
  }

  function submit() {
    setBusy(true, 'Đang gửi…');
    netMsg('');
    getJSON(API, { method: 'POST', body: JSON.stringify(payload()) }).then(function (r) {
      if (r.ok) { finish(r); return; }
      if (r.err === 'used') netMsg('Mã ' + S.code + ' đã được dùng. Bạn báo nhân viên giúp nhé.');
      else if (r.err === 'closed') netMsg('Khảo sát đã kết thúc. Cảm ơn bạn!');
      else if (r.err === 'busy') netMsg('Hệ thống đang bận, bạn bấm “Gửi khảo sát” lại giúp nhé.');
      else netMsg('Còn câu chưa trả lời. Bạn bấm “Quay lại” để kiểm tra giúp nhé.');
    }).catch(function () {
      netMsg('Chưa gửi được. Bạn kiểm tra mạng rồi bấm “Gửi khảo sát” lại. Câu trả lời vẫn được giữ nguyên.');
    }).then(function () { setBusy(false); });
  }

  function finish(r) {
    var d = { code: r.code, time: r.time, gift: r.gift };
    store(DONE, d);
    drop(DRAFT);
    showDone(d);
  }

  function showDone(d) {
    $('s0').hidden = true;
    ['full', 'short'].forEach(function (f) { screens[f].forEach(function (s) { s.hidden = true; }); });
    $('progress').hidden = true;
    $('bar').hidden = true;
    netMsg('');
    $('doneCode').textContent = d.code;
    $('doneTime').textContent = 'Gửi lúc ' + d.time;
    $('doneGift').textContent = d.gift;
    $('done').hidden = false;
    window.scrollTo(0, 0);
  }

  function setBusy(on, label) {
    busy = on;
    $('next').disabled = on;
    $('back').disabled = on;
    if (on) $('next').textContent = label; else updateChrome();
  }

  $('next').addEventListener('click', function () {
    if (busy) return;
    if (S.page === 0) { startWithCode(); return; }
    if (!validatePage(S.page)) return;
    if (isLast()) { submit(); return; }
    show(S.page + 1);
  });

  $('back').addEventListener('click', function () {
    if (busy || S.page === 0) return;
    netMsg('');
    show(S.page - 1);
  });

  $('code').addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').slice(0, 3);
    codeErr('');
  });
  $('code').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('next').click(); });

  var done = load(DONE);
  var draft = load(DRAFT);
  if (draft && draft.code) {
    S = draft;
    $('code').value = draft.code.slice(2);
  }
  buildPages();
  if (done) showDone(done);
  else show(Math.min(S.page || 0, pages().length));
})();
