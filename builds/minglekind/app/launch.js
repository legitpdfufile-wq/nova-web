(() => {
  "use strict";
  if (navigator.standalone === true || matchMedia("(display-mode: standalone)").matches) {
    const entrance = document.getElementById("enter");
    if (entrance) location.replace(entrance.href);
  }
})();
