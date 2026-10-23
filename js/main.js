// =========================================================
// 설정값
// =========================================================
const GITHUB_USERNAME = 'ytyt0339-sun';
const SCROLL_TOP_THRESHOLD = 300; // 이 값(px) 이상 스크롤하면 맨 위로 버튼 표시
const HEADER_SCROLL_THRESHOLD = 50; // 이 값(px) 이상 스크롤하면 헤더 스타일 변경
const THEME_STORAGE_KEY = 'theme';

// =========================================================
// DOM 요소 선택
// =========================================================
const root = document.documentElement;
const header = document.querySelector('#header');
const navMenu = document.querySelector('#nav-menu');
const hamburger = document.querySelector('#hamburger');
const navLinks = document.querySelectorAll('.nav__link');
const anchorLinks = document.querySelectorAll('a[href^="#"]');
const sections = document.querySelectorAll('main section[id]');
const themeToggle = document.querySelector('#theme-toggle');
const themeIcon = document.querySelector('.theme-toggle__icon');
const scrollTopBtn = document.querySelector('#scroll-top');
const projectsGrid = document.querySelector('#projects-grid');
const projectsStatus = document.querySelector('#projects-status');
const repoSearch = document.querySelector('#repo-search');
const contactForm = document.querySelector('#contact-form');
const formResult = document.querySelector('#form-result');
const messageCounter = document.querySelector('#message-counter');

// =========================================================
// 1. 다크 모드 (이벤트 → 상태 변경 → DOM 업데이트 + localStorage 저장)
// =========================================================
const getInitialTheme = () => {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved) return saved;
  // 저장된 값이 없으면 OS 설정을 따른다
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme) => {
  root.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeToggle.setAttribute('aria-label', theme === 'dark' ? '라이트 모드 전환' : '다크 모드 전환');
};

let currentTheme = getInitialTheme();
applyTheme(currentTheme);

themeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
  applyTheme(currentTheme);
});

// =========================================================
// 2. 햄버거 메뉴 토글
// =========================================================
const closeMenu = () => {
  navMenu.classList.remove('active');
  hamburger.classList.remove('active');
  document.body.classList.remove('no-scroll');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', '메뉴 열기');
};

hamburger.addEventListener('click', () => {
  const isOpen = navMenu.classList.toggle('active');
  hamburger.classList.toggle('active');
  document.body.classList.toggle('no-scroll', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
  hamburger.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
});

// 화면이 태블릿 이상으로 커지면 열린 모바일 메뉴를 정리
window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) closeMenu();
});

// =========================================================
// 3. 부드러운 스크롤
// =========================================================
anchorLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href');
    const target = document.querySelector(targetId);
    if (!target) return;

    event.preventDefault(); // 기본 점프 이동 방지
    target.scrollIntoView({ behavior: 'smooth' });
    history.pushState(null, '', targetId);
    closeMenu();
  });
});

// =========================================================
// 4. 스크롤 이벤트: 헤더 스타일 / 맨 위로 버튼 / 현재 섹션 메뉴 강조
// =========================================================
const highlightCurrentSection = () => {
  const scrollPos = window.scrollY + header.offsetHeight + 10;
  let currentId = '';

  sections.forEach((section) => {
    const { offsetTop, offsetHeight, id } = section; // 구조분해 할당
    if (scrollPos >= offsetTop && scrollPos < offsetTop + offsetHeight) {
      currentId = id;
    }
  });

  navLinks.forEach((link) => {
    link.classList.toggle('current', link.getAttribute('href') === `#${currentId}`);
  });
};

const handleScroll = () => {
  const { scrollY } = window;
  header.classList.toggle('scrolled', scrollY > HEADER_SCROLL_THRESHOLD);
  scrollTopBtn.classList.toggle('show', scrollY >= SCROLL_TOP_THRESHOLD);
  highlightCurrentSection();
};

window.addEventListener('scroll', handleScroll);
handleScroll(); // 새로고침 시 중간 위치에서 시작하는 경우 대비

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// =========================================================
// 5. 스크롤 애니메이션 (화면에 들어오면 .visible 추가)
// =========================================================
const revealTargets = document.querySelectorAll('.section__title, .about__content, .skill-card, .contact__form');

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(({ isIntersecting, target }) => {
    if (!isIntersecting) return;
    target.classList.add('visible');
    observer.unobserve(target); // 한 번만 실행
  });
}, { threshold: 0.15 });

revealTargets.forEach((el) => {
  el.classList.add('reveal');
  revealObserver.observe(el);
});

// =========================================================
// 6. GitHub API 연동 (로딩 / 성공 / 에러 / 빈 상태)
// =========================================================
let repos = []; // 상태: 불러온 저장소 목록
let searchQuery = ''; // 상태: 검색어

// API 데이터를 innerHTML에 넣기 전에 HTML 특수문자를 이스케이프 (XSS 방지)
const escapeHTML = (str) =>
  String(str).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch]);

const formatDate = (iso) => new Date(iso).toLocaleDateString('ko-KR');

const renderLoading = () => {
  projectsGrid.innerHTML = '';
  projectsStatus.innerHTML = `
    <div class="status">
      <div class="spinner" aria-hidden="true"></div>
      <p>저장소를 불러오는 중입니다...</p>
    </div>`;
};

const renderError = (message) => {
  projectsGrid.innerHTML = '';
  projectsStatus.innerHTML = `
    <div class="status status--error">
      <p>⚠️ 저장소를 불러오지 못했습니다.</p>
      <p>${escapeHTML(message)}</p>
      <button type="button" class="btn btn--outline" id="retry-btn">다시 시도</button>
    </div>`;
  document.querySelector('#retry-btn').addEventListener('click', loadRepos);
};

const renderEmpty = (message) => {
  projectsGrid.innerHTML = '';
  projectsStatus.innerHTML = `<div class="status"><p>📭 ${escapeHTML(message)}</p></div>`;
};

const createRepoCard = ({ name, description, html_url, language, stargazers_count, updated_at }) => `
  <article class="project-card">
    <h3 class="project-card__title">${escapeHTML(name)}</h3>
    <p class="project-card__desc">${escapeHTML(description || '설명이 없습니다.')}</p>
    <div class="project-card__meta">
      <span>💻 ${escapeHTML(language || 'N/A')}</span>
      <span>⭐ ${stargazers_count}</span>
      <span>🕒 ${formatDate(updated_at)}</span>
    </div>
    <a href="${escapeHTML(html_url)}" class="project-card__link" target="_blank" rel="noopener noreferrer">GitHub에서 보기 →</a>
  </article>`;

// 상태(repos, searchQuery)를 기반으로 화면을 다시 그린다
const renderRepos = () => {
  if (repos.length === 0) {
    renderEmpty('아직 공개된 저장소가 없습니다.');
    return;
  }

  const keyword = searchQuery.trim().toLowerCase();
  const filtered = repos.filter(({ name, language }) =>
    name.toLowerCase().includes(keyword) || (language || '').toLowerCase().includes(keyword));

  if (filtered.length === 0) {
    renderEmpty(`"${searchQuery}"에 해당하는 저장소가 없습니다.`);
    return;
  }

  projectsStatus.innerHTML = '';
  projectsGrid.innerHTML = filtered.map(createRepoCard).join('');
};

async function loadRepos() {
  renderLoading();
  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`);
    if (!response.ok) {
      const reason = response.status === 403 ? 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' : `HTTP ${response.status}`;
      throw new Error(reason);
    }
    const data = await response.json();
    repos = data.filter((repo) => !repo.fork); // 포크한 저장소는 제외
    renderRepos();
  } catch (error) {
    renderError(error.message);
  }
}

repoSearch.addEventListener('input', (event) => {
  searchQuery = event.target.value;
  if (repos.length > 0) renderRepos();
});

loadRepos();

// =========================================================
// 7. 문의 폼 유효성 검사
// =========================================================
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validators = {
  name: (value) => (value.trim().length >= 2 ? '' : '이름을 2자 이상 입력해주세요.'),
  email: (value) => {
    if (!value.trim()) return '이메일을 입력해주세요.';
    return EMAIL_PATTERN.test(value.trim()) ? '' : '올바른 이메일 형식이 아닙니다.';
  },
  message: (value) => (value.trim().length >= 10 ? '' : '메시지를 10자 이상 입력해주세요.'),
};

const validateField = (field) => {
  const errorMessage = validators[field.name](field.value);
  const errorEl = document.querySelector(`#${field.id}-error`);

  errorEl.textContent = errorMessage;
  field.classList.toggle('invalid', Boolean(errorMessage));
  field.classList.toggle('valid', !errorMessage);
  field.setAttribute('aria-invalid', String(Boolean(errorMessage)));
  return !errorMessage;
};

const formFields = contactForm.querySelectorAll('.input');

// 입력할 때마다 실시간 검사
formFields.forEach((field) => {
  field.addEventListener('input', () => {
    formResult.textContent = '';
    validateField(field);
    if (field.name === 'message') {
      messageCounter.textContent = `${field.value.length} / 500`;
    }
  });
});

contactForm.addEventListener('submit', (event) => {
  event.preventDefault(); // 페이지 새로고침 방지

  const results = [...formFields].map(validateField);
  const isValid = results.every(Boolean);

  if (!isValid) {
    formResult.textContent = '';
    contactForm.querySelector('.invalid').focus();
    return;
  }

  const { name } = Object.fromEntries(new FormData(contactForm));
  formResult.textContent = `${name}님, 메시지가 전송되었습니다. 감사합니다! 🙌`;
  contactForm.reset();
  messageCounter.textContent = '0 / 500';
  formFields.forEach((field) => field.classList.remove('valid', 'invalid'));
});

// =========================================================
// 8. 푸터 연도 자동 표시
// =========================================================
document.querySelector('#year').textContent = new Date().getFullYear();
