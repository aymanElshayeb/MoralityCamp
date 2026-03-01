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

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initScenarioAnswers();
  initWorksheet();
  initFeedback();
});
