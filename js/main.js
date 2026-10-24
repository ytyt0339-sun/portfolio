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
// 상태(State) 관리
// 화면에 영향을 주는 값은 모두 state 객체 한 곳에 모으고,
// setState()로만 변경한다. 변경된 값에 연결된 render 함수만 다시 실행된다.
//   이벤트 → setState(상태 변경) → render(DOM 업데이트)
// =========================================================
const getInitialTheme = () => {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved) return saved;
  // 저장된 값이 없으면 OS 설정을 따른다
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const state = {
  theme: getInitialTheme(), // 'light' | 'dark'
  isMenuOpen: false, // 모바일 햄버거 메뉴 열림 여부
  repoStatus: 'loading', // 'loading' | 'success' | 'error'
  repoError: '', // 에러 메시지
  repos: [], // GitHub 저장소 목록
  searchQuery: '', // 저장소 검색어
};

// 어떤 상태가 바뀌면 어떤 화면을 다시 그릴지 연결 (render 함수는 아래에 정의)
const renderers = {
  theme: () => renderTheme(),
  isMenuOpen: () => renderMenu(),
  repoStatus: () => renderProjects(),
  repoError: () => renderProjects(),
  repos: () => renderProjects(),
  searchQuery: () => renderProjects(),
};

const setState = (changes) => {
  Object.assign(state, changes);
  // 같은 render 함수가 여러 번 실행되지 않도록 Set으로 중복 제거
  const toRender = new Set(Object.keys(changes).map((key) => renderers[key]));
  toRender.forEach((render) => render());
};

// =========================================================
// 1. 다크 모드 (localStorage에 저장 → 새로고침 후에도 유지)
// =========================================================
function renderTheme() {
  const { theme } = state;
  root.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeToggle.setAttribute('aria-label', theme === 'dark' ? '라이트 모드 전환' : '다크 모드 전환');
}

themeToggle.addEventListener('click', () => {
  const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  setState({ theme: nextTheme });
});

// =========================================================
// 2. 햄버거 메뉴 토글
// =========================================================
function renderMenu() {
  const { isMenuOpen } = state;
  navMenu.classList.toggle('active', isMenuOpen);
  hamburger.classList.toggle('active', isMenuOpen);
  document.body.classList.toggle('no-scroll', isMenuOpen);
  hamburger.setAttribute('aria-expanded', String(isMenuOpen));
  hamburger.setAttribute('aria-label', isMenuOpen ? '메뉴 닫기' : '메뉴 열기');
}

hamburger.addEventListener('click', () => {
  setState({ isMenuOpen: !state.isMenuOpen });
});

// 화면이 태블릿 이상으로 커지면 열린 모바일 메뉴를 닫는다
window.addEventListener('resize', () => {
  if (window.innerWidth >= 768 && state.isMenuOpen) setState({ isMenuOpen: false });
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
    if (state.isMenuOpen) setState({ isMenuOpen: false });
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

// 저장소 객체 1개 → 카드 HTML 문자열 1개 (매개변수 구조분해 할당)
const createRepoCard = ({ name, description, html_url, language, stargazers_count, updated_at }) => `
  <article class="project-card">
    <h3 class="project-card__title">${escapeHTML(name)}</h3>
    <p class="project-card__desc">${escapeHTML(description || '설명이 없습니다.')}</p>
    <div class="project-card__meta">
      <span>💻 ${escapeHTML(language || 'N/A')}</span>
      <span>⭐ Stars: ${stargazers_count}</span>
      <span>🕒 ${formatDate(updated_at)}</span>
    </div>
    <a href="${escapeHTML(html_url)}" class="project-card__link" target="_blank" rel="noopener noreferrer">GitHub에서 보기 →</a>
  </article>`;

const showStatus = (html) => {
  projectsGrid.innerHTML = '';
  projectsStatus.innerHTML = html;
};

// state(repoStatus, repos, searchQuery)만 보고 Projects 영역 전체를 그린다
function renderProjects() {
  const { repoStatus, repoError, repos, searchQuery } = state;

  // 1) 로딩 상태
  if (repoStatus === 'loading') {
    showStatus(`
      <div class="status">
        <div class="spinner" aria-hidden="true"></div>
        <p>저장소를 불러오는 중입니다...</p>
      </div>`);
    return;
  }

  // 2) 에러 상태
  if (repoStatus === 'error') {
    showStatus(`
      <div class="status status--error">
        <p>⚠️ 저장소를 불러오지 못했습니다.</p>
        <p>${escapeHTML(repoError)}</p>
        <button type="button" class="btn btn--outline" id="retry-btn">다시 시도</button>
      </div>`);
    document.querySelector('#retry-btn').addEventListener('click', loadRepos);
    return;
  }

  // 3) 빈 상태 - 저장소가 하나도 없음
  if (repos.length === 0) {
    showStatus('<div class="status"><p>📭 아직 공개된 저장소가 없습니다.</p></div>');
    return;
  }

  // 4) 성공 - 검색어로 filter → 카드 HTML로 map → join
  const keyword = searchQuery.trim().toLowerCase();
  const filtered = repos.filter(({ name, language }) =>
    name.toLowerCase().includes(keyword) || (language || '').toLowerCase().includes(keyword));

  // 3-2) 빈 상태 - 검색 결과 없음
  if (filtered.length === 0) {
    showStatus(`<div class="status"><p>🔍 "${escapeHTML(searchQuery)}"에 해당하는 저장소가 없습니다.</p></div>`);
    return;
  }

  projectsStatus.innerHTML = '';
  projectsGrid.innerHTML = filtered.map(createRepoCard).join('');
}

async function loadRepos() {
  setState({ repoStatus: 'loading', repoError: '' });
  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`);
    // fetch는 404/403 같은 HTTP 에러에서도 reject되지 않으므로 직접 확인해서 throw
    if (!response.ok) {
      const reason = response.status === 403 ? 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' : `HTTP ${response.status}`;
      throw new Error(reason);
    }
    const data = await response.json();
    const ownRepos = data.filter((repo) => !repo.fork); // 포크한 저장소는 제외
    setState({ repos: ownRepos, repoStatus: 'success' });
  } catch (error) {
    // 네트워크 끊김(fetch reject)과 위에서 throw한 HTTP 에러가 모두 여기로 온다
    setState({ repoStatus: 'error', repoError: error.message });
  }
}

repoSearch.addEventListener('input', (event) => {
  setState({ searchQuery: event.target.value });
});

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

formFields.forEach((field) => {
  // 입력할 때마다 즉시 검사
  field.addEventListener('input', () => {
    formResult.textContent = '';
    validateField(field);
    if (field.name === 'message') {
      messageCounter.textContent = `${field.value.length} / 500`;
    }
  });
  // 아무것도 입력하지 않고 다음 칸으로 넘어가도 바로 검사
  field.addEventListener('blur', () => validateField(field));
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
// 8. 초기 렌더링
// =========================================================
renderTheme();
renderMenu();
handleScroll(); // 새로고침 시 중간 위치에서 시작하는 경우 대비
loadRepos();
document.querySelector('#year').textContent = new Date().getFullYear();
