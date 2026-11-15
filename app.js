(function () {
  'use strict';

  var API = 'https://script.google.com/macros/s/AKfycbz5kj8AdV60dorjY87FhXt9KiE1f8wJuP9yk4gqfjTa6-hg0UO96XclV6bCPVmoKXkk/exec';
  var EARLY = ['1–2 lần', 'Không nhớ rõ'];
  var OTHER = '__other';

  var Q = {
    q1: { n: 1, type: 'one', t: 'Trong 30 ngày gần đây, tính cả hôm nay, bạn đã đến Đề-Pô khoảng bao nhiêu lần?',
      o: ['1–2 lần', '3–4 lần', '5–8 lần', 'Từ 9 lần trở lên', 'Không nhớ rõ'] },
    q2: { n: 2, type: 'one', t: 'Bạn bắt đầu đến Đề-Pô từ khoảng thời gian nào?',
      o: ['Dưới 3 tháng', 'Từ 3 tháng đến dưới 1 năm', 'Từ 1 năm đến dưới 2 năm', 'Từ 2 năm trở lên', 'Không nhớ rõ'] },
    q3: { n: 3, type: 'one', other: true, t: 'Hôm nay, bạn đến Đề-Pô chủ yếu để làm gì?',
      o: ['Thưởng thức cà phê hoặc đồ uống', 'Gặp gỡ, trò chuyện', 'Làm việc hoặc học tập', 'Nghỉ ngơi, thư giãn', 'Tiện đường ghé quán'] },
    q4: { n: 4, type: 'text', t: 'Điều gì ở Đề-Pô mà bạn mong quán giữ lại nhất?',
      h: 'Có thể là một món nước, không gian, cách phục vụ hoặc bất kỳ điều gì bạn trân trọng.' },
    q5: { n: 5, type: 'one', other: true, t: 'Nếu Đề-Pô có thể làm tốt hơn một điều, bạn muốn điều gì nhất?',
      o: ['Hương vị hoặc chất lượng đồ uống', 'Sự đa dạng của menu', 'Giá cả', 'Tốc độ phục vụ', 'Cách phục vụ của nhân viên', 'Không gian hoặc tiện nghi', 'Vệ sinh', 'Hiện tại tôi chưa thấy cần cải thiện điều gì'] },
    q6: { n: 6, type: 'text', t: 'Trong lần ghé Đề-Pô gần nhất (kể cả hôm nay), bạn đã gọi món nước gì?',
      h: 'Nếu không nhớ tên món, bạn có thể mô tả ngắn; hoặc bỏ qua câu này.' },
    q7: { n: 7, type: 'one', t: 'Nhìn chung, bạn hài lòng ở mức nào với đồ uống tại Đề-Pô?',
      o: ['Rất không hài lòng', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Rất hài lòng', 'Chưa đủ trải nghiệm để đánh giá'] },
    q8: { n: 8, type: 'text', t: 'Có điều gì về đồ uống mà bạn muốn Đề-Pô có thêm hoặc làm tốt hơn không?',
      h: 'Bạn có thể nói về hương vị, đặc điểm hoặc một loại đồ uống; không cần nghĩ ra món mới.' },
    q9: { n: 9, type: 'many', max: 2, other: true, t: 'Khi chọn đồ uống tại Đề-Pô, những yếu tố nào quan trọng nhất với bạn?',
      h: 'Chọn tối đa 2 phương án.',
      o: ['Hương vị hợp khẩu vị', 'Giá cả phù hợp', 'Chất lượng ổn định giữa các lần uống', 'Nguyên liệu hoặc thành phần đồ uống', 'Có thể điều chỉnh độ ngọt hoặc độ đậm', 'Có những hương vị mới lạ'] },
    q10: { n: 10, type: 'one', other: true, t: 'Khi chọn món hoặc uống tại Đề-Pô, điều nào dưới đây khiến bạn chưa hài lòng nhất?',
      o: ['Tôi chưa gặp vấn đề đáng kể', 'Ít món hợp khẩu vị', 'Chất lượng cùng một món chưa ổn định', 'Khó điều chỉnh độ ngọt hoặc độ đậm', 'Giá một số món chưa phù hợp', 'Lượng nước chưa phù hợp', 'Menu khó xem hoặc khó chọn món'] },
    q11: { n: 11, type: 'one', other: true, t: 'Nếu Đề-Pô làm mới menu, bạn mong quán ưu tiên điều gì nhất?',
      o: ['Giữ những món quen thuộc mà tôi yêu thích', 'Cải thiện chất lượng các món đang có', 'Bổ sung một số món mới', 'Làm menu rõ ràng, dễ xem và dễ chọn hơn', 'Tôi chưa có mong đợi thay đổi cụ thể'] }
  };

  var PAGES = [
    { sec: 'Phần A · Thói quen đến Đề-Pô', qs: ['q1'] },
    { sec: 'Phần A · Thói quen đến Đề-Pô', qs: ['q2', 'q3'] },
    { sec: 'Phần B · Điều bạn muốn giữ lại và cải thiện', qs: ['q4', 'q5'] },
    { sec: 'Phần C · Đồ uống tại Đề-Pô', qs: ['q6', 'q7', 'q8'] },
    { sec: 'Phần C · Đồ uống tại Đề-Pô', qs: ['q9', 'q10', 'q11'] }
  ];

  var S = { code: '', page: 0, t0: 0, ans: {}, oth: {} };
  var $ = function (id) { return document.getElementById(id); };
  var screens = [$('s0')];
  var busy = false;

  function store(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function load(k) { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function drop(k) { try { sessionStorage.removeItem(k); } catch (e) {} }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function buildQuestion(key) {
    var q = Q[key];
    var box = el('div', 'card qb');
    box.id = 'box-' + key;
    box.appendChild(el('span', 'qn', 'Câu ' + q.n + '/11'));
    var title = el('p', 'q', q.t + ' ');
    title.appendChild(q.type === 'text' ? el('span', 'opt-tag', '(Không bắt buộc)') : el('span', 'req', '*'));
    box.appendChild(title);
    if (q.h) box.appendChild(el('p', 'hint', q.h));
    box.appendChild(el('p', 'err'));

    if (q.type === 'text') {
      var ta = el('textarea');
      ta.maxLength = 300;
      ta.placeholder = 'Câu trả lời của bạn';
      ta.value = S.ans[key] || '';
      ta.addEventListener('input', function () { S.ans[key] = ta.value; save(); });
      box.appendChild(ta);
      return box;
    }

    var wrap = el('div', 'opts');
    var list = q.o.slice();
    if (q.other) list.push(OTHER);
    list.forEach(function (v) {
      var lab = el('label', 'o' + (q.type === 'many' ? ' cb' : ''));
      var inp = el('input');
      inp.type = q.type === 'many' ? 'checkbox' : 'radio';
      inp.name = key;
      inp.value = v;
      lab.appendChild(inp);
      lab.appendChild(el('span', 'mk'));
      lab.appendChild(el('span', '', v === OTHER ? 'Khác (bạn ghi rõ)' : v));
      inp.addEventListener('change', function () { onPick(key); });
      wrap.appendChild(lab);
    });
    box.appendChild(wrap);

    if (q.other) {
      var oi = el('input');
      oi.type = 'text';
      oi.maxLength = 150;
      oi.placeholder = 'Ghi rõ ý kiến của bạn';
      oi.className = 'other';
      oi.hidden = true;
      oi.value = S.oth[key] || '';
      oi.addEventListener('input', function () { S.oth[key] = oi.value; save(); });
      var ow = el('div', 'other');
      ow.appendChild(oi);
      box.appendChild(ow);
    }
    return box;
  }

  function syncQuestion(key) {
    var q = Q[key], box = $('box-' + key);
    if (!box || q.type === 'text') return;
    var cur = S.ans[key];
    var picked = q.type === 'many' ? (cur || []) : (cur ? [cur] : []);
    var full = q.type === 'many' && picked.length >= q.max;
    box.querySelectorAll('label.o').forEach(function (lab) {
      var inp = lab.querySelector('input');
      var on = picked.indexOf(inp.value) >= 0;
      inp.checked = on;
      lab.classList.toggle('on', on);
      inp.disabled = full && !on;
      lab.classList.toggle('off', full && !on);
    });
    var oi = box.querySelector('input.other');
    if (oi) oi.hidden = picked.indexOf(OTHER) < 0;
  }

  function onPick(key) {
    var q = Q[key], box = $('box-' + key);
    if (q.type === 'many') {
      S.ans[key] = Array.prototype.filter.call(box.querySelectorAll('input:checked'), function (i) { return i.name === key; })
        .map(function (i) { return i.value; }).slice(0, q.max);
    } else {
      var c = box.querySelector('input[name="' + key + '"]:checked');
      S.ans[key] = c ? c.value : '';
    }
    syncQuestion(key);
    clearErr(key);
    var oi = box.querySelector('input.other');
    if (oi && !oi.hidden && !oi.value) oi.focus();
    if (key === 'q1') updateButtons();
    save();
  }

  function clearErr(key) {
    var box = $('box-' + key);
    box.classList.remove('bad');
    box.querySelector('.err').textContent = '';
  }

  function setErr(key, msg) {
    var box = $('box-' + key);
    box.classList.add('bad');
    box.querySelector('.err').textContent = msg;
  }

  function validatePage(i) {
    var first = null;
    PAGES[i - 1].qs.forEach(function (key) {
      var q = Q[key];
      if (q.type === 'text') return;
      var v = S.ans[key];
      var picked = q.type === 'many' ? (v || []) : (v ? [v] : []);
      clearErr(key);
      if (!picked.length) { setErr(key, 'Bạn vui lòng chọn một phương án.'); first = first || key; return; }
      if (picked.indexOf(OTHER) >= 0 && !(S.oth[key] || '').trim()) { setErr(key, 'Bạn vui lòng ghi rõ ý kiến ở ô “Khác”.'); first = first || key; }
    });
    if (first) {
      var b = $('box-' + first);
      window.scrollTo({ top: b.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
    }
    return !first;
  }

  function isEarly() { return EARLY.indexOf(S.ans.q1) >= 0; }
  function isLast() { return S.page === PAGES.length || (S.page === 1 && isEarly()); }

  function updateButtons() {
    $('back').hidden = S.page === 0;
    $('next').textContent = S.page === 0 ? 'Bắt đầu' : (isLast() ? 'Gửi khảo sát' : 'Tiếp tục ›');
  }

  function show(i) {
    screens.forEach(function (s, k) { if (s) s.hidden = k !== i; });
    $('done').hidden = true;
    S.page = i;
    var pr = $('progress');
    pr.hidden = i === 0;
    if (i > 0) {
      var total = isEarly() ? 1 : PAGES.length;
      $('ptitle').textContent = 'Tiến độ';
      $('pstep').textContent = 'Trang ' + i + '/' + total;
      $('pfill').style.width = Math.round(i / total * 100) + '%';
    }
    updateButtons();
    window.scrollTo(0, 0);
    save();
  }

  function buildPages() {
    var main = $('app'), done = $('done');
    PAGES.forEach(function (p, idx) {
      var sec = el('section', 'screen');
      sec.hidden = true;
      sec.appendChild(el('div', 'sec', p.sec));
      p.qs.forEach(function (k) { sec.appendChild(buildQuestion(k)); });
      main.insertBefore(sec, done);
      screens[idx + 1] = sec;
    });
    Object.keys(Q).forEach(syncQuestion);
  }

  function netMsg(msg) {
    var n = $('netErr');
    n.textContent = msg;
    n.hidden = !msg;
  }

  function codeErr(msg) { $('codeErr').textContent = msg; }

  function getJSON(url, opts) {
    return fetch(url, opts).then(function (r) {
      if (!r.ok) throw new Error('http');
      return r.json();
    });
  }

  function startWithCode() {
    var d = ($('code').value || '').replace(/\D/g, '');
    if (!d || d.length > 3 || +d === 0) { codeErr('Mã gồm 3 chữ số do nhân viên đưa, ví dụ 007.'); return; }
    var code = 'DP' + ('00' + d).slice(-3);
    setBusy(true, 'Đang kiểm tra…');
    getJSON(API + '?check=' + encodeURIComponent(code)).then(function (r) {
      if (!r.ok && r.err === 'closed') { codeErr('Khảo sát đã kết thúc. Cảm ơn bạn!'); return; }
      if (!r.ok) { codeErr('Mã ' + code + ' không hợp lệ. Bạn vui lòng hỏi lại nhân viên.'); return; }
      if (r.used) { codeErr('Mã ' + code + ' đã được dùng. Bạn vui lòng hỏi nhân viên mã khác.'); return; }
      codeErr('');
      if (S.code !== code) { S.code = code; S.t0 = Date.now(); }
      show(1);
    }).catch(function () {
      codeErr('Chưa kết nối được. Bạn kiểm tra mạng (wifi quán) rồi bấm lại.');
    }).then(function () { setBusy(false); });
  }

  function payload() {
    var p = { code: S.code, dur: (Date.now() - S.t0) / 1000, hp: $('hp').value };
    Object.keys(Q).forEach(function (k) {
      var q = Q[k], v = S.ans[k];
      if (q.type === 'text') { p[k] = (v || '').trim(); return; }
      var fix = function (x) { return x === OTHER ? 'Khác: ' + (S.oth[k] || '').trim() : x; };
      p[k] = q.type === 'many' ? (v || []).map(fix) : (v ? fix(v) : '');
    });
    return p;
  }

  function submit() {
    setBusy(true, 'Đang gửi…');
    netMsg('');
    getJSON(API, { method: 'POST', body: JSON.stringify(payload()) }).then(function (r) {
      if (r.ok) { finish(r.code, r.time); return; }
      if (r.err === 'used') netMsg('Mã ' + S.code + ' đã được dùng. Bạn vui lòng báo nhân viên.');
      else if (r.err === 'closed') netMsg('Khảo sát đã kết thúc. Cảm ơn bạn!');
      else if (r.err === 'busy') netMsg('Hệ thống đang bận, bạn bấm “Gửi khảo sát” lại giúp nhé.');
      else netMsg('Còn câu chưa trả lời. Bạn kiểm tra lại giúp nhé.');
    }).catch(function () {
      netMsg('Chưa gửi được. Bạn kiểm tra mạng rồi bấm “Gửi khảo sát” lại. Câu trả lời vẫn được giữ.');
    }).then(function () { setBusy(false); });
  }

  function finish(code, time) {
    store('depo_done', { code: code, time: time });
    drop('depo_draft');
    showDone(code, time);
  }

  function showDone(code, time) {
    screens.forEach(function (s) { if (s) s.hidden = true; });
    $('progress').hidden = true;
    $('bar').hidden = true;
    netMsg('');
    $('doneCode').textContent = code;
    $('doneTime').textContent = 'Gửi lúc ' + time;
    $('done').hidden = false;
    window.scrollTo(0, 0);
  }

  function setBusy(on, label) {
    busy = on;
    $('next').disabled = on;
    $('back').disabled = on;
    if (on) $('next').textContent = label; else updateButtons();
  }

  function save() {
    if (!S.code) return;
    store('depo_draft', S);
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

  var done = load('depo_done');
  var draft = load('depo_draft');
  if (draft && draft.code) {
    S = draft;
    $('code').value = draft.code.slice(2);
  }
  buildPages();
  if (done) showDone(done.code, done.time);
  else show(S.page || 0);
})();
