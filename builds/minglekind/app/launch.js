(() => {
  "use strict";
  const current = new URL(location.href);
  const standalone = navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
  const view = document.currentScript?.dataset.minglekindView;
  if (!standalone && view && current.searchParams.get(view) === "1") return;

  const app = new URL("https://minglekind-staging.v2rh9fzn46.workers.dev/");
  for (const [key, value] of current.searchParams) {
    if (/^utm_(source|medium|campaign|content|term)$/.test(key)) app.searchParams.set(key, value);
  }
  location.replace(app.href);
})();
