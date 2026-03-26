/* ─── Reading Progress Bar ─── */
(function() {
  const bar = document.getElementById('reading-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const doc = document.documentElement;
    const scrolled = doc.scrollTop;
    const max = doc.scrollHeight - doc.clientHeight;
    bar.style.width = (max > 0 ? (scrolled / max) * 100 : 0) + '%';
  });
})();

/* ─── Back to Top ─── */
(function() {
  const btn = document.getElementById('back-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ─── Hamburger Nav ─── */
(function() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  if (!hamburger || !navLinks) return;
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
    }
  });
})();

/* ─── Tab Navigation ─── */
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.panel');
  if (!tabBtns.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetPanel = document.getElementById(target);
      if (targetPanel) {
        targetPanel.classList.add('active');
        // Smooth scroll to just below sticky nav
        const tabNav = document.querySelector('.tab-nav');
        const top = (tabNav ? tabNav.offsetTop + tabNav.offsetHeight : 0);
        window.scrollTo({ top: top + 10, behavior: 'smooth' });
      }
    });
  });

  // URL hash support
  const hash = window.location.hash.slice(1);
  if (hash) {
    const btn = document.querySelector(`.tab-btn[data-tab="${hash}"]`);
    if (btn) btn.click();
  }
}

/* ─── Toggle Scenario Answers ─── */
function initScenarioAnswers() {
  document.querySelectorAll('.s-answer.hidden-answer').forEach(el => {
    el.addEventListener('click', () => el.classList.remove('hidden-answer'));
  });
}

/* ─── Worksheet Save (localStorage) ─── */
function initWorksheet() {
  const wsInputs = document.querySelectorAll('.answer-line, .ws-table-input input');
  wsInputs.forEach(input => {
    const key = 'ws_' + (input.id || input.name || input.placeholder || Math.random());
    const saved = localStorage.getItem(key);
    if (saved) input.value = saved;
    input.addEventListener('input', () => localStorage.setItem(key, input.value));
  });

  const printBtn = document.getElementById('print-ws');
  if (printBtn) printBtn.addEventListener('click', () => window.print());

  const clearBtn = document.getElementById('clear-ws');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (confirm('هل تريد مسح جميع إجاباتك؟')) {
      wsInputs.forEach(input => {
        const key = 'ws_' + (input.id || input.name || input.placeholder || '');
        localStorage.removeItem(key);
        input.value = '';
      });
    }
  });
}

/* ─── Feedback Form ─── */
function initFeedback() {
  const form = document.getElementById('feedback-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    // Store locally
    const key = 'feedback_' + Date.now();
    localStorage.setItem(key, JSON.stringify(data));
    form.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--green-dark)"><div style="font-size:3rem">✅</div><h3 style="margin:.5rem 0">شكراً لمراجعتك!</h3><p>تم حفظ ملاحظاتك بنجاح.</p></div>';
  });
}

/* ─── Interactive Quiz ─── */
function showFeedback(qEl, state, points, correctIdx, opts) {
  const fb = qEl.querySelector('.q-feedback');
  if (!fb) return;
  if (state === 'correct') {
    fb.className = 'q-feedback fb-correct';
    fb.textContent = '✅ إجابة صحيحة! +' + points + (points === 1 ? ' نقطة' : ' نقاط');
  } else if (state === 'wrong') {
    const cn = opts ? opts[correctIdx].textContent.trim() : '';
    fb.className = 'q-feedback fb-wrong';
    fb.textContent = '❌ إجابة خاطئة. الإجابة الصحيحة: ' + cn;
  } else {
    fb.className = 'q-feedback fb-skip';
    fb.textContent = '⚠️ لم تختر إجابة';
  }
}

function showResult(resultId, score, total) {
  const el = document.getElementById(resultId);
  if (!el) return;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  let msg = '', emoji = '';
  if (pct >= 90)      { msg = 'ممتاز! أحسنت 🌟';         emoji = '🏆'; }
  else if (pct >= 75) { msg = 'جيد جداً، واصل! 💪';      emoji = '🥈'; }
  else if (pct >= 60) { msg = 'جيد، يمكنك الأفضل 👍';    emoji = '🥉'; }
  else                { msg = 'حاول مرة أخرى — لا بأس!'; emoji = '📖'; }
  el.innerHTML =
    '<div class="qr-score">' + emoji + ' ' + score + ' / ' + total + '</div>' +
    '<div class="qr-label">' + pct + '%</div>' +
    '<div class="qr-bar"><div class="qr-bar-fill" style="width:' + pct + '%"></div></div>' +
    '<div class="qr-message">' + msg + '</div>' +
    '<button class="qr-retry" onclick="location.reload()">🔄 إعادة المحاولة</button>';
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function initQuiz(formId, submitBtnId, resultId) {
  const btn = document.getElementById(submitBtnId);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const questions = document.querySelectorAll('#' + formId + ' .quiz-q');
    let score = 0, total = 0;
    questions.forEach(q => {
      const correct = parseInt(q.dataset.correct, 10);
      const points  = parseInt(q.dataset.points  || 1, 10);
      total += points;
      const opts    = q.querySelectorAll('.opt');
      const checked = q.querySelector('input[type=radio]:checked');
      /* always show correct answer */
      if (opts[correct]) opts[correct].classList.add('opt-correct-mark');
      if (checked) {
        const val = parseInt(checked.value, 10);
        if (val === correct) {
          score += points;
          q.classList.add('q-correct');
          checked.closest('.opt').classList.add('opt-selected-correct');
          showFeedback(q, 'correct', points);
        } else {
          q.classList.add('q-wrong');
          checked.closest('.opt').classList.add('opt-selected-wrong');
          showFeedback(q, 'wrong', points, correct, opts);
        }
      } else {
        q.classList.add('q-skipped');
        showFeedback(q, 'skip', 0);
      }
      q.querySelectorAll('input[type=radio]').forEach(r => { r.disabled = true; });
    });
    btn.disabled = true;
    showResult(resultId, score, total);
  });
}

/* ─── Lesson Catalog ─── */
async function initLessonCatalog() {
  const container = document.getElementById('lesson-cards');
  if (!container) return;

  try {
    const response = await fetch('assets/data/lessons.json');
    if (!response.ok) throw new Error('تعذر تحميل الدروس');

    const data = await response.json();
    container.innerHTML = data.lessons.map(lesson => `
      <a href="lessons/${lesson.slug}/" class="card">
        <div class="card-icon">${lesson.icon}</div>
        <h3>${lesson.title}</h3>
        <p>${lesson.summary}</p>
        <span class="card-badge">${lesson.sections.length} مواد جاهزة</span>
      </a>
    `).join('');
  } catch (error) {
    container.innerHTML = `
      <div class="card" style="text-decoration:none">
        <div class="card-icon">⚠️</div>
        <h3>تعذر تحميل الدروس</h3>
        <p>تأكد من تشغيل الموقع من خادم محلي أو من GitHub Pages حتى يمكن تحميل ملفات المحتوى.</p>
      </div>
    `;
  }
}

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initScenarioAnswers();
  initWorksheet();
  initFeedback();
  initLessonCatalog();
  initQuiz('form-questions',  'submit-questions',  'result-questions');
  initQuiz('form-worksheet',  'submit-worksheet',  'result-worksheet');
});
