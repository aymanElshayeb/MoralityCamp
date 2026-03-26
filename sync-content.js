const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SOURCE_DIR = path.resolve(ROOT, '../study/outputs/camp/md');
const TARGET_DIR = path.join(ROOT, 'content', 'camp', 'md');
const DATA_DIR = path.join(ROOT, 'assets', 'data');
const LESSONS_DIR = path.join(ROOT, 'lessons');

const SECTION_CONFIG = [
  { prefix: '1_', id: 'teacher', label: '📋 مادة المعلم' },
  { prefix: '2_', id: 'student', label: '🎓 بطاقة الطالب' },
  { prefix: '3_', id: 'questions', label: '❓ أسئلة النقاش' },
  { prefix: '4_', id: 'activities', label: '🎯 الأنشطة التفاعلية' },
  { prefix: '5_', id: 'worksheet', label: '✏️ ورقة العمل' },
];

const LESSON_OVERRIDES = {
  'العجب_والكبر': {
    slug: 'ojb',
    icon: '💎',
    order: 1,
    summary: 'داء العُجب وآثاره وعلاجه من شرح نظم محمد مولود في أمراض القلوب.',
  },
  'أخلاق -حامل-القران': {
    slug: 'quran-adab',
    icon: '📖',
    order: 2,
    summary: 'آداب حامل القرآن وشرفه ومسؤولية من يحمل كلام الله تعالى.',
  },
  'الكلمة_الطيبة': {
    slug: 'kind-word',
    icon: '🗣️',
    order: 3,
    summary: 'أثر الكلمة الطيبة في تزكية النفس وبناء العلاقات والأجواء الإيمانية.',
  },
  'بر_الوالدين': {
    slug: 'birr-alwalidayn',
    icon: '🤲',
    order: 4,
    summary: 'حقوق الوالدين ووجوه البر العملية للشباب في الحياة اليومية.',
  },
  'محارم_اللسان_-_حكم_الغيبة': {
    slug: 'ghibah',
    icon: '🛡️',
    order: 5,
    title: 'محارم اللسان وآفات اللسان',
    summary: 'الغيبة والنميمة وتزكية النفس والشماتة وتمني الضرر وكثرة المزاح وآداب حماية اللسان.',
  },
};

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function prettifyFolderName(folderName) {
  return folderName.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractTitle(markdown, folderName) {
  const h2Line = markdown
    .split(/\r?\n/)
    .find(line => line.startsWith('## '));

  if (!h2Line) return prettifyFolderName(folderName);

  const title = h2Line.replace(/^##\s+/, '').trim();
  return title.split(' — ')[0].trim();
}

function extractDescription(markdown, fallback) {
  const lines = markdown.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const preferred = lines.find(line => line.startsWith('### '));
  if (preferred) {
    return preferred.replace(/^###\s+/, '').trim();
  }

  const paragraph = lines.find(
    line => !line.startsWith('#') && !line.startsWith('- ') && !line.startsWith('|') && !line.startsWith('> ')
  );

  return paragraph || fallback;
}

function buildLessonPage(lesson) {
  const contentTabsHtml = lesson.sections
    .map((section, index) => {
      const activeClass = index === 0 ? ' active' : '';
      return `<button class="tab-btn${activeClass}" data-tab="${section.id}">${section.label}</button>`;
    })
    .join('\n    ');

  const quizTabsHtml = [
    '<button class="tab-btn" data-tab="teacher-test">🧪 اختبار المعلم</button>',
    '<button class="tab-btn" data-tab="learner-test">🧪 اختبار المتعلم</button>',
  ].join('\n    ');

  const contentPanelsHtml = lesson.sections
    .map((section, index) => {
      const activeClass = index === 0 ? ' active' : '';
      return `
<div class="panel${activeClass}" id="${section.id}">
  <div class="container">
    <div class="content-body markdown-body is-loading" data-section-id="${section.id}">
      <p>جارٍ تحميل المحتوى...</p>
    </div>
  </div>
</div>`;
    })
    .join('\n');

  const quizPanelsHtml = `
<div class="panel" id="teacher-test">
  <div class="container">
    <div class="content-body quiz-host is-loading" data-quiz-role="teacher">
      <p>جارٍ تحميل اختبار المعلم...</p>
    </div>
  </div>
</div>

<div class="panel" id="learner-test">
  <div class="container">
    <div class="content-body quiz-host is-loading" data-quiz-role="learner">
      <p>جارٍ تحميل اختبار المتعلم...</p>
    </div>
  </div>
</div>`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(lesson.title)} — مخيم الأخلاق</title>
  <meta name="description" content="${escapeHtml(lesson.summary)}">
  <link rel="stylesheet" href="../../assets/css/style.css">
</head>
<body data-lesson-slug="${escapeHtml(lesson.slug)}">

<div class="reading-progress" id="reading-progress"></div>

<nav class="top-nav">
  <a class="brand" href="../../index.html">مخيم <span>الأخلاق</span></a>
  <button class="hamburger" id="hamburger" aria-label="قائمة">☰</button>
  <ul class="nav-links" id="nav-links">
    <li><a href="../../index.html">الرئيسية</a></li>
    <li><a href="./" class="active">الدروس</a></li>
    <li><a href="../../review/">مراجعة الزملاء</a></li>
  </ul>
</nav>

<section class="hero" style="padding:3rem 2rem">
  <div style="max-width:760px;margin:0 auto">
    <div class="hero-badge" id="lesson-badge">درس مخيم الأخلاق</div>
    <h1 style="font-size:2.2rem" id="lesson-title">${escapeHtml(lesson.title)} <em>${escapeHtml(lesson.icon)}</em></h1>
    <p id="lesson-description">${escapeHtml(lesson.description)}</p>
    <div class="hero-verse" id="lesson-summary">
      ${escapeHtml(lesson.summary)}
    </div>
  </div>
</section>

<div class="tab-nav">
  <div class="tab-nav-inner container">
    ${contentTabsHtml}
    ${quizTabsHtml}
  </div>
</div>

${contentPanelsHtml}
${quizPanelsHtml}

<footer>
  <strong>مخيم الأخلاق</strong> — ${escapeHtml(lesson.title)} | محتوى متزامن مع مخرجات مشروع الدراسة
</footer>

<a class="back-top" id="back-top" href="#" title="العودة للأعلى">↑</a>

<script src="../../assets/js/main.js"></script>
<script src="../../assets/js/lesson.js"></script>
</body>
</html>
`;
}

function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Source content not found: ${SOURCE_DIR}`);
  }

  fs.rmSync(TARGET_DIR, { recursive: true, force: true });
  copyDir(SOURCE_DIR, TARGET_DIR);

  const lessonFolders = fs
    .readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);

  const lessons = lessonFolders
    .map(folderName => {
      const sourceFolder = path.join(SOURCE_DIR, folderName);
      const files = fs.readdirSync(sourceFolder).sort();
      const teacherFileName = files.find(file => file.startsWith('1_'));
      const teacherMarkdown = teacherFileName
        ? fs.readFileSync(path.join(sourceFolder, teacherFileName), 'utf8')
        : '';

      const override = LESSON_OVERRIDES[folderName] || {};
      const title = override.title || extractTitle(teacherMarkdown, folderName);
      const description = extractDescription(teacherMarkdown, override.summary || prettifyFolderName(folderName));
      const summary = override.summary || description;
      const slug = override.slug || `lesson-${folderName}`;
      const icon = override.icon || '📚';
      const order = override.order || 999;

      const sections = SECTION_CONFIG.map(section => {
        const fileName = files.find(file => file.startsWith(section.prefix));
        if (!fileName) return null;
        return {
          id: section.id,
          label: section.label,
          fileName,
          path: `content/camp/md/${folderName}/${fileName}`,
        };
      }).filter(Boolean);

      return {
        slug,
        title,
        icon,
        order,
        summary,
        description,
        sourceFolder: folderName,
        sections,
      };
    })
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'ar'));

  ensureDir(DATA_DIR);
  fs.writeFileSync(path.join(DATA_DIR, 'lessons.json'), JSON.stringify({ lessons }, null, 2));

  for (const lesson of lessons) {
    const lessonDir = path.join(LESSONS_DIR, lesson.slug);
    fs.rmSync(lessonDir, { recursive: true, force: true });
    ensureDir(lessonDir);
    fs.writeFileSync(path.join(lessonDir, 'index.html'), buildLessonPage(lesson));
  }

  console.log(`Synced ${lessons.length} lesson(s) from ${SOURCE_DIR}`);
}

main();
