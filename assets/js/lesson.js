(function() {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function applyInlineMarkdown(text) {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
  }

  function renderMarkdownTable(lines) {
    if (lines.length < 2) return lines.map(line => `<p>${applyInlineMarkdown(line)}</p>`).join('');

    const rows = lines.map(line =>
      line
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map(cell => cell.trim())
    );

    const header = rows[0];
    const bodyRows = rows.slice(2);

    return `
      <table class="content-table">
        <thead>
          <tr>${header.map(cell => `<th>${applyInlineMarkdown(cell)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${bodyRows
            .map(row => `<tr>${row.map(cell => `<td>${applyInlineMarkdown(cell)}</td>`).join('')}</tr>`)
            .join('')}
        </tbody>
      </table>
    `;
  }

  function fallbackParseMarkdown(markdown) {
    const lines = markdown.replace(/\r/g, '').split('\n');
    const html = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      if (!line) {
        i += 1;
        continue;
      }

      if (/^---+$/.test(line)) {
        html.push('<hr>');
        i += 1;
        continue;
      }

      if (line.startsWith('### ')) {
        html.push(`<h4>${applyInlineMarkdown(line.slice(4))}</h4>`);
        i += 1;
        continue;
      }

      if (line.startsWith('## ')) {
        html.push(`<h3>${applyInlineMarkdown(line.slice(3))}</h3>`);
        i += 1;
        continue;
      }

      if (line.startsWith('# ')) {
        html.push(`<h2>${applyInlineMarkdown(line.slice(2))}</h2>`);
        i += 1;
        continue;
      }

      if (line.startsWith('>')) {
        const block = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          block.push(lines[i].trim().replace(/^>\s?/, ''));
          i += 1;
        }
        html.push(`<blockquote>${block.map(item => `<p>${applyInlineMarkdown(item)}</p>`).join('')}</blockquote>`);
        continue;
      }

      if (line.startsWith('|')) {
        const tableLines = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableLines.push(lines[i].trim());
          i += 1;
        }
        html.push(renderMarkdownTable(tableLines));
        continue;
      }

      if (line.startsWith('- ')) {
        const items = [];
        while (i < lines.length && lines[i].trim().startsWith('- ')) {
          items.push(lines[i].trim().slice(2));
          i += 1;
        }
        html.push(`<ul>${items.map(item => `<li>${applyInlineMarkdown(item)}</li>`).join('')}</ul>`);
        continue;
      }

      const paragraph = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].trim().startsWith('#') &&
        !lines[i].trim().startsWith('>') &&
        !lines[i].trim().startsWith('- ') &&
        !lines[i].trim().startsWith('|') &&
        !/^---+$/.test(lines[i].trim())
      ) {
        paragraph.push(lines[i].trim());
        i += 1;
      }
      html.push(`<p>${applyInlineMarkdown(paragraph.join(' '))}</p>`);
    }

    return html.join('\n');
  }

  function parseMarkdown(markdown) {
    if (window.marked && typeof window.marked.parse === 'function') {
      return window.marked.parse(markdown);
    }

    return fallbackParseMarkdown(markdown);
  }

  function encodePath(pathname) {
    return pathname
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');
  }

  function applyMarkdownEnhancements(container) {
    container.querySelectorAll('table').forEach(table => table.classList.add('content-table'));

    container.querySelectorAll('blockquote').forEach(blockquote => {
      blockquote.classList.add('markdown-blockquote');
    });
  }

  function getQuizMessage(percent) {
    if (percent >= 90) return 'ممتاز جداً. يظهر أنك استوعبت المادة بعناية.';
    if (percent >= 75) return 'نتيجة قوية. بقيت نقاط بسيطة ويمكنك تحسينها بسهولة.';
    if (percent >= 60) return 'بداية جيدة. مراجعة سريعة ستجعل فهمك أمتن.';
    return 'لا بأس. راجع الدرس مرة أخرى ثم أعد المحاولة بهدوء.';
  }

  function renderQuizQuestion(question, index, role) {
    const points = question.points || 1;
    return `
      <div class="quiz-q" data-correct="${question.answer}" data-points="${points}">
        <div class="q-header">
          <div class="q-num">${index + 1}</div>
          <div class="q-text">${escapeHtml(question.prompt)}</div>
          <div class="q-points">${points} نقطة</div>
        </div>
        <div class="q-options">
          ${question.options.map((option, optionIndex) => `
            <label class="opt">
              <input type="radio" name="${role}-q-${index}" value="${optionIndex}">
              <span>${escapeHtml(option)}</span>
            </label>
          `).join('')}
        </div>
        <div class="q-feedback"></div>
      </div>
    `;
  }

  function buildQuizMarkup(quiz, role) {
    const totalPoints = quiz.questions.reduce((sum, question) => sum + (question.points || 1), 0);
    return `
      <div class="quiz-shell">
        <div class="quiz-intro-card">
          <div class="quiz-intro-kicker">${role === 'teacher' ? 'للمعلم' : 'للمتعلم'}</div>
          <h3>${escapeHtml(quiz.title)}</h3>
          <p>${escapeHtml(quiz.intro)}</p>
          <div class="quiz-meta-row">
            <span class="quiz-meta-pill">${quiz.questions.length} أسئلة</span>
            <span class="quiz-meta-pill">${totalPoints} نقطة</span>
            <span class="quiz-meta-pill">اختيار من متعدد</span>
          </div>
        </div>
        <form class="quiz-form" novalidate>
          ${quiz.questions.map((question, index) => renderQuizQuestion(question, index, role)).join('')}
          <button type="submit" class="quiz-submit-btn">إرسال الاختبار</button>
        </form>
        <div class="quiz-result-banner"></div>
      </div>
    `;
  }

  function attachQuizBehavior(container, quiz, role) {
    const form = container.querySelector('.quiz-form');
    const resultBanner = container.querySelector('.quiz-result-banner');
    if (!form || !resultBanner) return;

    form.addEventListener('submit', event => {
      event.preventDefault();

      let score = 0;
      let total = 0;
      let correctCount = 0;

      container.querySelectorAll('.quiz-q').forEach((questionEl, index) => {
        const data = quiz.questions[index];
        const correctIndex = data.answer;
        const points = data.points || 1;
        const optionEls = Array.from(questionEl.querySelectorAll('.opt'));
        const inputs = Array.from(questionEl.querySelectorAll('input[type="radio"]'));
        const checked = questionEl.querySelector('input[type="radio"]:checked');
        const feedback = questionEl.querySelector('.q-feedback');
        const correctOption = optionEls[correctIndex];
        const correctText = data.options[correctIndex];
        const explanation = data.explanation ? ` ${escapeHtml(data.explanation)}` : '';

        total += points;
        questionEl.classList.remove('q-correct', 'q-wrong', 'q-skipped');
        optionEls.forEach(optionEl => {
          optionEl.classList.remove('opt-selected-correct', 'opt-selected-wrong', 'opt-correct-mark');
        });

        if (correctOption) correctOption.classList.add('opt-correct-mark');

        if (checked) {
          const chosenIndex = Number(checked.value);
          const chosenText = data.options[chosenIndex];
          const selectedLabel = checked.closest('.opt');
          if (chosenIndex === correctIndex) {
            score += points;
            correctCount += 1;
            questionEl.classList.add('q-correct');
            if (selectedLabel) selectedLabel.classList.add('opt-selected-correct');
            feedback.className = 'q-feedback fb-correct';
            feedback.innerHTML = `إجابتك صحيحة. ${explanation.trim()}`.trim();
          } else {
            questionEl.classList.add('q-wrong');
            if (selectedLabel) selectedLabel.classList.add('opt-selected-wrong');
            feedback.className = 'q-feedback fb-wrong';
            feedback.innerHTML = `إجابتك: <strong>${escapeHtml(chosenText)}</strong><br>الإجابة الصحيحة: <strong>${escapeHtml(correctText)}</strong>.${explanation}`;
          }
        } else {
          questionEl.classList.add('q-skipped');
          feedback.className = 'q-feedback fb-skip';
          feedback.innerHTML = `لم تختر إجابة لهذا السؤال.<br>الإجابة الصحيحة: <strong>${escapeHtml(correctText)}</strong>.${explanation}`;
        }

        feedback.style.display = 'block';
        inputs.forEach(input => {
          input.disabled = true;
        });
      });

      const percent = total > 0 ? Math.round((score / total) * 100) : 0;
      resultBanner.classList.add('show');
      resultBanner.innerHTML = `
        <div class="qr-score">${score} / ${total}</div>
        <div class="qr-label">${percent}% • ${correctCount} من ${quiz.questions.length} صحيحة</div>
        <div class="qr-bar"><div class="qr-bar-fill" style="width:${percent}%"></div></div>
        <div class="qr-message">${getQuizMessage(percent)}</div>
        <div class="quiz-review-note">راجِع التغذية الراجعة أسفل كل سؤال لتعرف لماذا كانت الإجابة صحيحة أو غير صحيحة.</div>
        <button type="button" class="qr-retry">إعادة الاختبار</button>
      `;

      const retryBtn = resultBanner.querySelector('.qr-retry');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          container.innerHTML = buildQuizMarkup(quiz, role);
          attachQuizBehavior(container, quiz, role);
          container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }

      const submitBtn = form.querySelector('.quiz-submit-btn');
      if (submitBtn) submitBtn.disabled = true;
      resultBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  function renderQuizPanel(container, quiz, role) {
    container.innerHTML = buildQuizMarkup(quiz, role);
    container.classList.remove('is-loading');
    attachQuizBehavior(container, quiz, role);
  }

  function renderQuizError(container, message) {
    container.classList.remove('is-loading');
    container.innerHTML = `<div class="warn-box"><span class="icon">⚠️</span><p>${escapeHtml(message)}</p></div>`;
  }

  async function loadLesson() {
    const lessonSlug = document.body.dataset.lessonSlug;
    if (!lessonSlug) return;

    const [lessonsResponse, quizzesResponse] = await Promise.all([
      fetch('../../assets/data/lessons.json'),
      fetch('../../assets/data/quizzes.json')
    ]);

    if (!lessonsResponse.ok) {
      throw new Error('تعذر تحميل فهرس الدروس');
    }

    if (!quizzesResponse.ok) {
      throw new Error('تعذر تحميل بيانات الاختبارات');
    }

    const lessonsData = await lessonsResponse.json();
    const quizzesData = await quizzesResponse.json();
    const lesson = lessonsData.lessons.find(item => item.slug === lessonSlug);
    const lessonQuizzes = quizzesData.quizzes && quizzesData.quizzes[lessonSlug];

    if (!lesson) {
      throw new Error('تعذر العثور على بيانات هذا الدرس');
    }

    document.title = `${lesson.title} — مخيم الأخلاق`;

    const lessonTitle = document.getElementById('lesson-title');
    const lessonDescription = document.getElementById('lesson-description');
    const lessonSummary = document.getElementById('lesson-summary');

    if (lessonTitle) lessonTitle.innerHTML = `${lesson.title} <em>${lesson.icon}</em>`;
    if (lessonDescription) lessonDescription.textContent = lesson.description;
    if (lessonSummary) lessonSummary.textContent = lesson.summary;

    await Promise.all(
      lesson.sections.map(async section => {
        const panel = document.querySelector(`[data-section-id="${section.id}"]`);
        if (!panel) return;

        const markdownResponse = await fetch(`../../${encodePath(section.path)}`);
        if (!markdownResponse.ok) {
          throw new Error(`تعذر تحميل القسم: ${section.label}`);
        }

        const markdown = await markdownResponse.text();
        panel.innerHTML = parseMarkdown(markdown);
        panel.classList.remove('is-loading');
        applyMarkdownEnhancements(panel);
      })
    );

    const teacherQuizPanel = document.querySelector('[data-quiz-role="teacher"]');
    const learnerQuizPanel = document.querySelector('[data-quiz-role="learner"]');

    if (teacherQuizPanel) {
      if (lessonQuizzes && lessonQuizzes.teacher) {
        renderQuizPanel(teacherQuizPanel, lessonQuizzes.teacher, 'teacher');
      } else {
        renderQuizError(teacherQuizPanel, 'اختبار المعلم غير متوفر لهذا الدرس بعد.');
      }
    }

    if (learnerQuizPanel) {
      if (lessonQuizzes && lessonQuizzes.learner) {
        renderQuizPanel(learnerQuizPanel, lessonQuizzes.learner, 'learner');
      } else {
        renderQuizError(learnerQuizPanel, 'اختبار المتعلم غير متوفر لهذا الدرس بعد.');
      }
    }
  }

  async function setupLessonNavigation() {
    const lessonSlug = document.body.dataset.lessonSlug;
    if (!lessonSlug) return;

    try {
      const response = await fetch('../../assets/data/lessons.json');
      if (!response.ok) return;
      const data = await response.json();
      const lessons = data.lessons;
      const currentIndex = lessons.findIndex(l => l.slug === lessonSlug);
      if (currentIndex === -1) return;

      const current = lessons[currentIndex];
      const prev = currentIndex > 0 ? lessons[currentIndex - 1] : null;
      const next = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

      // Update breadcrumb
      const breadcrumbName = document.getElementById('breadcrumb-lesson-name');
      if (breadcrumbName) breadcrumbName.textContent = current.title;

      // Update prev/next buttons
      const prevBtn = document.getElementById('lesson-prev');
      const nextBtn = document.getElementById('lesson-next');

      if (prevBtn) {
        if (prev) {
          prevBtn.href = '../' + prev.slug + '/';
          prevBtn.title = prev.title;
        } else {
          prevBtn.classList.add('disabled');
          prevBtn.removeAttribute('href');
        }
      }

      if (nextBtn) {
        if (next) {
          nextBtn.href = '../' + next.slug + '/';
          nextBtn.title = next.title;
        } else {
          nextBtn.classList.add('disabled');
          nextBtn.removeAttribute('href');
        }
      }
    } catch (_) { /* silent fail */ }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadLesson().catch(error => {
      document.querySelectorAll('.markdown-body, .quiz-host').forEach(container => {
        container.classList.remove('is-loading');
      });

      const firstPanel = document.querySelector('.markdown-body, .quiz-host');
      if (firstPanel) {
        firstPanel.innerHTML = `<div class="warn-box"><span class="icon">⚠️</span><p>${escapeHtml(error.message)}</p></div>`;
      }
    });
    setupLessonNavigation();
  });
})();
