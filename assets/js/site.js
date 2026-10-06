/* swary.in — old-link redirect, mobile menu, latest installer link, footer year. */
(function () {
  "use strict";

  // The hotel app's sections used to live on the home page. Send links
  // like swary.in/#pricing to the same section on the app's own page.
  var MOVED = ["#features", "#screens", "#download", "#pricing", "#faq"];
  if (
    (location.pathname === "/" || location.pathname === "/index.html") &&
    MOVED.indexOf(location.hash) !== -1
  ) {
    location.replace("/products/hotel-management/" + location.hash);
    return;
  }

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

  // Remember the answer for an hour so repeat visits skip the GitHub request.
  var CACHE_KEY = "swary-latest-release";
  var CACHE_MS = 60 * 60 * 1000;
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
    var cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (cached && Date.now() - cached.savedAt < CACHE_MS) return apply(cached);
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
        savedAt: Date.now(),
      };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(release));
      } catch (error) {
        /* not cached */
      }
      apply(release);
    })
    .catch(function () {
      /* keep the releases page link */
    });
})();
