# 구현 설명 (평가 항목별 답변)

평가 체크리스트의 질문마다 답변과 해당 코드 위치를 정리했습니다.
코드 링크는 GitHub에서 열면 해당 줄로 이동합니다.

---

## 항목 1. 기능 동작

| 질문 | 동작 | 코드 |
|---|---|---|
| 창을 줄이면 모바일 레이아웃으로 바뀌는가? | 767px 이하에서 메뉴가 숨겨지고 햄버거 버튼이 나타납니다. 카드는 1열로 바뀝니다. | [style.css `@media`](../css/style.css#L694) |
| 테마 토글 + 새로고침 후 유지 | 클릭하면 `data-theme`이 바뀌고 `localStorage`에 저장됩니다. 페이지를 열 때 저장값을 먼저 읽습니다. | [main.js:35](../js/main.js#L35), [main.js:78](../js/main.js#L78) |
| 햄버거 / 스크롤 애니메이션 / 맨 위로 | 햄버거는 `classList.toggle('active')`, 애니메이션은 `IntersectionObserver`, 맨 위로 버튼은 300px 이상에서 표시됩니다. | [main.js:87](../js/main.js#L87) |
| GitHub API + 로딩/에러/빈 상태 | `repoStatus`에 따라 스피너, 에러와 "다시 시도" 버튼, "저장소 없음"/"검색 결과 없음"을 각각 다르게 보여줍니다. | [main.js:206](../js/main.js#L206) |
| 폼 즉시 피드백 | `input`(입력 중)과 `blur`(칸을 떠날 때)마다 검사하고, 제출할 때 전체를 다시 검사합니다. | [main.js:314](../js/main.js#L314) |

---

## 항목 2. 파일 분리, 시맨틱 태그, CSS 변수, addEventListener

### HTML / CSS / JS를 왜 나눴나?
- **역할이 다르기 때문입니다.** HTML은 **구조**(무엇이 있는가), CSS는 **표현**(어떻게 보이는가), JS는 **동작**(무엇을 하는가)을 맡습니다.
- 디자인을 바꿀 때는 `style.css`만, 기능을 고칠 때는 `main.js`만 열면 됩니다. 수정 범위가 좁아지고 서로 영향을 덜 줍니다.
- 브라우저가 CSS와 JS 파일을 **캐시**하므로, 다시 방문할 때 더 빨리 뜹니다.
- JS는 `<script src="js/main.js" defer>`로 연결했습니다([index.html:10](../index.html#L10)). `defer`를 쓰면 HTML을 끝까지 읽은 뒤 스크립트가 실행되므로 `querySelector`가 요소를 항상 찾을 수 있습니다.

### 시맨틱 태그를 어떤 기준으로 골랐나?
| 태그 | 사용한 곳 | 고른 기준 |
|---|---|---|
| `<header>` | 상단 고정 바 | 페이지의 머리말(로고, 메뉴) |
| `<nav>` | 메뉴 목록 | 사이트 내 이동을 위한 링크 묶음 |
| `<main>` | Hero~Contact | 페이지의 핵심 내용(한 페이지에 하나) |
| `<section>` | Hero, About, Skills, Projects, Contact | 제목(`h2`)을 가진 주제별 구역 |
| `<article>` | 스킬 카드, 프로젝트 카드 | 따로 떼어도 의미가 완결되는 독립 콘텐츠 |
| `<footer>` | 저작권, 소셜 링크 | 페이지의 꼬리말 |

- `div`만 쓰면 사람은 class 이름으로 짐작해야 하고, 스크린 리더나 검색엔진은 구조를 알 수 없습니다. 시맨틱 태그를 쓰면 **태그 이름만으로 역할이 드러나서** 접근성, SEO, 코드 가독성이 함께 좋아집니다.
- 기준은 "**이 영역의 의미가 무엇인가?**"입니다. 의미 없이 레이아웃만 묶을 때만 `div`를 썼습니다(예: `.container`).

### CSS 변수(`:root`)의 이점
- 색상, 폰트, 간격을 [style.css:4](../css/style.css#L4)에 한 번만 정의하고 `var(--color-primary)`처럼 가져다 씁니다.
- **한 곳만 고치면 전체가 바뀝니다.** 예를 들어 메인 색을 바꾸려면 `--color-primary` 한 줄만 고치면 됩니다.
- **다크 모드가 쉬워집니다.** [style.css:42](../css/style.css#L42)의 `[data-theme="dark"]`에서 같은 변수 이름에 다른 값을 넣었습니다. JS는 `data-theme` 속성 하나만 바꾸고, 나머지 색은 CSS가 알아서 전부 바꿉니다.
- 반응형에서도 `@media` 안에서 `--fs-hero` 값만 바꿔 글자 크기를 조절했습니다.

### `onclick` 대신 `addEventListener`를 쓴 이유
| | `onclick="..."` (HTML 속성) | `addEventListener` |
|---|---|---|
| 위치 | HTML 안에 JS가 섞임 | JS 파일 안에만 있음 → 역할 분리 유지 |
| 개수 | 요소 하나에 핸들러 **하나만** (덮어씀) | 같은 이벤트에 **여러 개** 등록 가능 |
| 제거 | 어려움 | `removeEventListener`로 제거 가능 |
| 옵션 | 없음 | `{ once, passive }` 등 옵션 사용 가능 |
| 이벤트 객체 | 쓰기 불편 | `(event) => event.preventDefault()`처럼 자연스럽게 사용 |

---

## 항목 3. 이벤트 → 상태 → 화면, async/await, map/filter, Flexbox vs Grid

### "이벤트 → 상태 변경 → 화면 업데이트" 예시: 다크 모드
```js
// ① 이벤트: 버튼 클릭
themeToggle.addEventListener('click', () => {
  const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme); // 새로고침 대비 저장
  setState({ theme: nextTheme });                     // ② 상태 변경
});

// setState는 바뀐 키(theme)에 연결된 render 함수를 실행
function renderTheme() {                              // ③ DOM 업데이트
  root.setAttribute('data-theme', state.theme);
  themeIcon.textContent = state.theme === 'dark' ? '☀️' : '🌙';
}
```
- 이벤트 핸들러는 **DOM을 직접 바꾸지 않고 상태만 바꿉니다**. 화면은 render 함수가 **상태를 보고** 그립니다.
- 검색도 같은 흐름입니다. `input` 이벤트 → `setState({ searchQuery })` → `renderProjects()` ([main.js:270](../js/main.js#L270))

### async/await + try/catch로 성공/실패를 나누는 흐름 ([main.js:252](../js/main.js#L252))
1. `setState({ repoStatus: 'loading' })` → 화면에 스피너가 나옵니다.
2. `await fetch(...)`로 응답이 올 때까지 기다립니다. 그 사이에도 페이지는 멈추지 않습니다.
3. `if (!response.ok) throw new Error(...)`: **fetch는 404/500 같은 HTTP 에러에서도 실패(reject)하지 않기 때문에** 직접 확인해서 에러를 던집니다. 403이면 "요청 한도 초과" 안내를 띄웁니다.
4. `await response.json()` → `setState({ repos, repoStatus: 'success' })` → 카드를 그립니다.
5. `catch (error)`: 인터넷 끊김(fetch reject)과 3번에서 던진 에러가 **모두 여기로 모입니다**. `setState({ repoStatus: 'error' })`가 실행되면 에러 메시지와 "다시 시도" 버튼이 나옵니다.

`.then().catch()` 체인 대신 async/await를 쓰면 위에서 아래로 읽히는 동기 코드처럼 보여서 흐름을 따라가기 쉽습니다.

### map / filter로 GitHub 데이터를 카드로 바꾸는 단계
```
API 응답(JSON 배열 100개까지)
  │ data.filter(repo => !repo.fork)         ← 1. 포크한 저장소 제외     (main.js:262)
  ▼
state.repos
  │ repos.filter(({ name, language }) => …) ← 2. 검색어로 거르기      (main.js:239)
  ▼
filtered
  │ filtered.map(createRepoCard)            ← 3. 객체 → 카드 HTML 문자열 (main.js:249)
  ▼
['<article>…', '<article>…', …]
  │ .join('')                               ← 4. 하나의 문자열로 합치기
  ▼
projectsGrid.innerHTML = …                  ← 5. DOM에 한 번에 반영
```
- `createRepoCard`는 **화살표 함수 + 매개변수 구조분해 할당**(`({ name, description, ... }) =>`)으로 필요한 값만 꺼냅니다([main.js:188](../js/main.js#L188)).
- for문 대신 `map`/`filter`를 쓰면 **원본 배열을 바꾸지 않고** 새 배열을 돌려줍니다. 그리고 "무엇을 하는지"(거른다/바꾼다)가 메서드 이름에 드러납니다.
- API에서 받은 문자열은 `escapeHTML()`로 특수문자를 바꾼 뒤 `innerHTML`에 넣습니다. 이렇게 하면 저장소 설명에 `<script>` 같은 내용이 있어도 실행되지 않습니다(XSS 방지).

### Flexbox와 Grid를 어디에, 왜 썼나
| | 사용한 곳 | 이유 |
|---|---|---|
| **Flexbox** (1차원: 한 줄) | 네비게이션 [style.css:135](../css/style.css#L135), Hero 버튼, 스킬 태그, Footer | 요소를 **한 방향으로 나열하고 정렬**만 하면 됩니다. `justify-content: space-between` 하나로 "로고 왼쪽, 메뉴 오른쪽"이 됩니다. |
| **Grid** (2차원: 행+열) | 프로젝트 카드 [style.css:488](../css/style.css#L488), 스킬 카드, 폼(라벨-입력칸) | 카드를 **행과 열 격자로** 맞춰야 합니다. `repeat(auto-fit, minmax(260px, 1fr))` 한 줄로 화면 폭에 따라 1→2→3열이 **미디어 쿼리 없이** 자동으로 바뀝니다. |

정리하면 **한 줄 정렬은 Flexbox, 줄과 칸을 동시에 맞추는 배치는 Grid**입니다.

---

## 항목 4. 상태 객체, 모바일 퍼스트

### 상태(state) 객체를 따로 만든 이유 ([main.js:42](../js/main.js#L42))
```js
const state = {
  theme: 'light',
  isMenuOpen: false,
  repoStatus: 'loading',   // 'loading' | 'success' | 'error'
  repoError: '',
  repos: [],
  searchQuery: '',
};
const setState = (changes) => { Object.assign(state, changes); /* 연결된 render 실행 */ };
```
흩어진 변수로 처리하면 생기는 문제는 다음과 같습니다.
1. **값만 바꾸고 화면 갱신을 잊기 쉽습니다.** `searchQuery = '...'`만 하고 `render()`를 안 부르면 화면과 데이터가 어긋납니다. `setState`를 거치면 **값 변경과 렌더링이 항상 같이** 일어납니다.
2. **현재 상태를 한눈에 볼 수 없습니다.** 객체 하나에 모아 두면 콘솔에서 `state`만 찍어도 "지금 화면이 왜 이렇게 보이는지"를 바로 알 수 있습니다.
3. **불가능한 조합이 생깁니다.** `isLoading`, `isError`를 따로 두면 둘 다 `true`인 상태가 생길 수 있습니다. `repoStatus` 하나로 관리하면 항상 셋 중 하나입니다.
4. **화면이 상태의 결과가 됩니다.** `renderProjects()`는 `state`만 보고 그리므로, 같은 상태면 언제나 같은 화면이 나옵니다.

이것이 React의 `useState` / `setState` → 리렌더링 구조와 같은 원리입니다.

### 모바일 퍼스트로 작성한 이유
- 기본 CSS를 **모바일 기준**으로 쓰고, `@media (min-width: 768px)`와 `(min-width: 1024px)`에서 **기능을 더해 가는** 방식입니다([style.css:694](../css/style.css#L694), [style.css:777](../css/style.css#L777)).
- 작은 화면은 제약이 가장 많아서, 여기서 **꼭 필요한 콘텐츠부터** 정하면 구조가 단순해집니다. 큰 화면은 여유 공간에 열을 늘리기만 하면 됩니다.
- 모바일 기기는 기본 스타일만 읽고 데스크톱용 규칙은 적용하지 않습니다. 반대로 데스크톱 퍼스트로 짜면 모바일에서 덮어쓰는 규칙(`display: none` 등)이 많아집니다.
- 실제로 웹 트래픽의 절반 이상이 모바일입니다.
