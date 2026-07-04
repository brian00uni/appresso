// Writing Studio 설치 감지용 — appresso 웹앱(랜딩)에 확장 설치 신호를 남긴다.
// 확장 ID 없이도 웹페이지가 설치 여부를 감지할 수 있게 한다.
(() => {
  const mark = () => {
    try {
      document.documentElement.setAttribute('data-writing-studio-ext', '1');
      window.dispatchEvent(new CustomEvent('writing-studio-ext-present'));
    } catch (e) {}
  };
  mark();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mark, { once: true });
  }
  setTimeout(mark, 300);
  setTimeout(mark, 1000);
})();
