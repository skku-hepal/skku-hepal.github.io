(function () {
  "use strict";
  const cfg = window.SITE_CONFIG || {};

  // Registration button
  const reg = document.getElementById("register-link");
  if (reg) {
    if (cfg.registrationUrl) reg.href = cfg.registrationUrl;
    else { reg.textContent = "Registration opens soon"; reg.classList.add("disabled"); reg.removeAttribute("target"); reg.addEventListener("click", e => e.preventDefault()); }
  }

  // Mobile nav
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", e => { if (e.target.tagName === "A") links.classList.remove("open"); });
  }
})();
