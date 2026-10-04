/* swary.in — mobile menu, latest installer link, footer year. */
(function () {
  "use strict";

  // Mobile menu.
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("open"));
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("open")) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  // Footer year.
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  // Point the download buttons straight at the latest installer. Without
  // this (or if GitHub can't be reached) they open the releases page.
  var links = document.querySelectorAll("[data-download]");
  if (!links.length || !window.fetch) return;

  var CACHE_KEY = "swary-latest-release";
  var apply = function (release) {
    if (!release || !release.url) return;
    links.forEach(function (link) {
      link.href = release.url;
    });
    document.querySelectorAll("[data-version]").forEach(function (el) {
      el.textContent = "Version " + release.version + (release.size ? " · " + release.size : "") + " · free 15-day trial";
    });
  };

  try {
    var cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
    if (cached) return apply(cached);
  } catch (error) {
    /* storage unavailable: just ask GitHub */
  }

  fetch("https://api.github.com/repos/jarvis-nagesh/hotel-management-releases/releases/latest", {
    headers: { Accept: "application/vnd.github+json" },
  })
    .then(function (response) {
      return response.ok ? response.json() : null;
    })
    .then(function (data) {
      if (!data || !Array.isArray(data.assets)) return;
      var installer = data.assets.find(function (asset) {
        return /\.exe$/i.test(asset.name);
      });
      if (!installer) return;
      var release = {
        url: installer.browser_download_url,
        version: String(data.tag_name || "").replace(/^v/, ""),
        size: installer.size ? Math.round(installer.size / 1048576) + " MB" : "",
      };
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(release));
      } catch (error) {
        /* not cached */
      }
      apply(release);
    })
    .catch(function () {
      /* keep the releases page link */
    });
})();
