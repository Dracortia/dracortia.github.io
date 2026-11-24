/* ==========================================================================
   Dracortia — site behaviour
   Vanilla JS: nav, scroll spy, reveal, scramble headings, counters,
   testimonial slider, project modals, custom cursor, magnetic buttons,
   hero spectrum.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;

  /* ----------------------------------------------------------------------
     Header
     ---------------------------------------------------------------------- */
  var header = document.getElementById("header");
  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");
  var stuck = false;

  function onScroll() {
    var should = window.scrollY > 24;
    if (should !== stuck) {
      stuck = should;
      header.classList.toggle("is-stuck", stuck);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function setNav(open) {
    if (!nav || !navToggle) return;
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("is-locked", open);
  }
  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      setNav(!nav.classList.contains("is-open"));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setNav(false);
    });
  }

  /* ----------------------------------------------------------------------
     Scroll spy
     ---------------------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(nav ? nav.querySelectorAll("a[href^='#']") : []);
  var targets = navLinks.map(function (a) {
    var el = document.getElementById(a.getAttribute("href").slice(1));
    return el ? { link: a, el: el } : null;
  }).filter(Boolean);

  if ("IntersectionObserver" in window && targets.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (l) { l.classList.remove("is-active"); });
        for (var i = 0; i < targets.length; i++) {
          if (targets[i].el === entry.target) targets[i].link.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    targets.forEach(function (t) { spy.observe(t.el); });
  }

  /* ----------------------------------------------------------------------
     Scramble headings
     ---------------------------------------------------------------------- */
  var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%/+*—";
  var scrambles = Array.prototype.slice.call(document.querySelectorAll("[data-scramble]"));

  function scramble(el) {
    if (reduced || el.dataset.done) return;
    el.dataset.done = "1";
    var final = el.textContent;
    var frame = 0;
    var total = Math.max(10, Math.round(final.length * 0.75));
    var timer = setInterval(function () {
      var out = "";
      var revealed = frame;
      for (var i = 0; i < final.length; i++) {
        var ch = final[i];
        if (ch === " ") { out += " "; continue; }
        if (i < revealed) { out += ch; continue; }
        out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      frame++;
      if (frame > total) { clearInterval(timer); el.textContent = final; }
    }, 22);
  }

  /* ----------------------------------------------------------------------
     Reveal on scroll
     ---------------------------------------------------------------------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if ("IntersectionObserver" in window && reveals.length) {
    reveals.forEach(function (el) {
      var sibs = el.parentElement ? Array.prototype.slice.call(el.parentElement.children) : [];
      var idx = sibs.filter(function (s) { return s.classList.contains("reveal"); }).indexOf(el);
      el.style.setProperty("--i", Math.max(0, Math.min(idx, 5)));
    });

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });

    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  if (scrambles.length) {
    if ("IntersectionObserver" in window) {
      var so = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          scramble(entry.target);
          so.unobserve(entry.target);
        });
      }, { threshold: 0.6 });
      scrambles.forEach(function (el) { so.observe(el); });
    } else {
      scrambles.forEach(scramble);
    }
  }

  /* ----------------------------------------------------------------------
     Counters
     ---------------------------------------------------------------------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    if (reduced) { el.textContent = String(target); return; }
    var start = performance.now(), dur = 1300;
    function step(now) {
      var t = Math.min((now - start) / dur, 1);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length && "IntersectionObserver" in window) {
    var counted = false;
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || counted) return;
        counted = true;
        counters.forEach(countUp);
        co.disconnect();
      });
    }, { threshold: 0.6 });
    co.observe(counters[0].closest(".hero-foot") || counters[0]);
  }

  /* ----------------------------------------------------------------------
     Testimonial slider
     ---------------------------------------------------------------------- */
  var slider = document.getElementById("slider");
  if (slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll(".slide"));
    var nowEl = document.getElementById("slideNow");
    var index = 0;
    var auto;

    function show(n) {
      index = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle("is-active", i === index); });
      if (nowEl) nowEl.textContent = String(index + 1).padStart(2, "0");
    }
    function play() {
      if (reduced) return;
      clearInterval(auto);
      auto = setInterval(function () { show(index + 1); }, 8000);
    }
    var prev = document.getElementById("prev");
    var next = document.getElementById("next");
    if (prev) prev.addEventListener("click", function () { show(index - 1); play(); });
    if (next) next.addEventListener("click", function () { show(index + 1); play(); });
    show(0); play();
  }

  /* ----------------------------------------------------------------------
     Project modals
     ---------------------------------------------------------------------- */
  var activeModal = null;
  var lastFocus = null;
  /* YouTube refuses to embed when the page sends no referrer, which is exactly
     what happens when index.html is opened straight from disk. */
  var embedsBlocked = location.protocol === "file:";

  function buildFallback(modal, iframe) {
    if (modal.querySelector(".player-fallback")) return;
    var m = (iframe.getAttribute("data-src") || "").match(/embed\/([^?]+)/);
    var id = m ? m[1] : "";
    var a = document.createElement("a");
    a.className = "player-fallback";
    a.href = "https://www.youtube.com/watch?v=" + id;
    a.target = "_blank";
    a.rel = "noopener";
    a.innerHTML =
      '<img src="https://i.ytimg.com/vi/' + id + '/maxresdefault.jpg" alt="">' +
      '<span class="pf-play" aria-hidden="true"></span>' +
      '<span class="pf-note">Watch on YouTube</span>';
    iframe.parentNode.insertBefore(a, iframe);
    iframe.style.display = "none";
  }

  function openModal(modal) {
    if (!modal || activeModal) return;
    lastFocus = document.activeElement;
    activeModal = modal;
    modal.hidden = false;
    Array.prototype.forEach.call(modal.querySelectorAll("iframe[data-src]"), function (f) {
      if (embedsBlocked) { buildFallback(modal, f); return; }
      if (!f.getAttribute("src")) f.setAttribute("src", f.getAttribute("data-src"));
    });
    document.body.classList.add("is-locked");
    var c = modal.querySelector(".modal-close");
    if (c) c.focus({ preventScroll: true });
  }

  function closeModal() {
    if (!activeModal) return;
    var modal = activeModal;
    activeModal = null;
    /* rebuild the iframe so playback stops and the player resets */
    Array.prototype.forEach.call(modal.querySelectorAll("iframe[data-src]"), function (f) {
      var fresh = f.cloneNode(false);
      fresh.removeAttribute("src");
      if (f.parentNode) f.parentNode.replaceChild(fresh, f);
    });
    modal.hidden = true;
    document.body.classList.remove("is-locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    lastFocus = null;
  }

  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-modal]");
    if (opener) {
      e.preventDefault();
      openModal(document.getElementById(opener.getAttribute("data-modal")));
      return;
    }
    if (e.target.closest("[data-close]")) {
      e.preventDefault();
      closeModal();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (activeModal) closeModal();
      else if (nav && nav.classList.contains("is-open")) setNav(false);
    }
  });

  /* ----------------------------------------------------------------------
     Custom cursor + magnetic buttons
     ---------------------------------------------------------------------- */
  var cursor = document.getElementById("cursor");
  if (cursor && fine && !reduced) {
    document.body.classList.add("has-cursor");
    var dot = cursor.querySelector(".cursor-dot");
    var ring = cursor.querySelector(".cursor-ring");
    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;

    document.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
      cursor.classList.add("is-on");
      dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
      var hover = e.target.closest("a, button, .card, .service");
      cursor.classList.toggle("is-hover", !!hover);
    }, { passive: true });

    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();

    document.addEventListener("pointerleave", function () {
      cursor.classList.remove("is-on");
    });
  }

  if (fine && !reduced) {
    Array.prototype.forEach.call(document.querySelectorAll(".magnetic"), function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22;
        var y = (e.clientY - r.top - r.height / 2) * 0.32;
        btn.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", function () {
        btn.style.transform = "";
      });
    });
  }

  /* ----------------------------------------------------------------------
     Hero: wireframe terrain (sound on a 3D grid)
     ---------------------------------------------------------------------- */
  var heroCanvas = document.getElementById("heroCanvas");
  if (heroCanvas && heroCanvas.getContext) {
    var hctx = heroCanvas.getContext("2d");
    var hw = 0, hh = 0, hdpr = Math.min(window.devicePixelRatio || 1, 2);
    var hVisible = true, ht = 0, px = 0, py = 0;
    var ROWS = 30, COLS = 46;

    function sizeHero() {
      hw = heroCanvas.clientWidth;
      hh = heroCanvas.clientHeight;
      heroCanvas.width = Math.floor(hw * hdpr);
      heroCanvas.height = Math.floor(hh * hdpr);
      hctx.setTransform(hdpr, 0, 0, hdpr, 0, 0);
    }
    sizeHero();
    window.addEventListener("resize", sizeHero, { passive: true });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { hVisible = e[0].isIntersecting; }, { threshold: 0 }).observe(heroCanvas);
    }
    if (fine) {
      document.addEventListener("pointermove", function (e) {
        px = (e.clientX / window.innerWidth - 0.5) * 2;
        py = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
    }

    function waveAt(x, z, time) {
      return (
        Math.sin(x * 3.4 + time * 1.1) * 0.50 +
        Math.sin(x * 1.7 - z * 0.55 + time * 0.72) * 0.32 +
        Math.sin(z * 1.30 + time * 0.48) * 0.18
      );
    }

    function drawHero() {
      requestAnimationFrame(drawHero);
      if (!hVisible) return;
      if (!reduced) ht += 0.009;

      hctx.clearRect(0, 0, hw, hh);

      var horizon = hh * 0.46 + py * 16;
      var cx = hw * 0.52 + px * 34;

      /* receding mesh rows */
      for (var r = ROWS - 1; r >= 0; r--) {
        var z = 2.2 + r * 1.55;
        var persp = 1 / z;
        var rowY = horizon + hh * 0.5 * persp * 2.4;
        var alpha = Math.max(0.03, 1.15 - z / (ROWS * 1.5));

        hctx.beginPath();
        for (var c = 0; c < COLS; c++) {
          var t01 = c / (COLS - 1);
          var x = t01 * 2 - 1;
          var wv = waveAt(x * 2.4, z, ht);
          var sx = cx + x * hw * 1.5 * persp;
          var sy = rowY - wv * hh * 0.27 * persp * 1.6;
          if (c === 0) hctx.moveTo(sx, sy);
          else hctx.lineTo(sx, sy);
        }
        hctx.lineWidth = r === 0 ? 2.2 : (r < 6 ? 1.35 : 1);
        hctx.strokeStyle = r === 0
          ? "rgba(255,232,186," + Math.min(1, alpha + 0.5).toFixed(3) + ")"
          : "rgba(242,204,120," + Math.min(0.9, alpha * 0.95).toFixed(3) + ")";
        hctx.stroke();
      }

      /* converging grid lines */
      var pNear = 1 / 2.2;
      var yNear = horizon + hh * 0.5 * pNear * 2.4;
      for (var v = 0; v < COLS; v += 4) {
        var xv = (v / (COLS - 1)) * 2 - 1;
        var wv2 = waveAt(xv * 2.4, 2.2, ht);
        hctx.beginPath();
        hctx.moveTo(cx + xv * hw * 1.5 * pNear, yNear - wv2 * hh * 0.22 * pNear * 1.6);
        hctx.lineTo(cx + xv * hw * 0.05, horizon + 3);
        hctx.lineWidth = 1;
        hctx.strokeStyle = "rgba(242,204,120,0.13)";
        hctx.stroke();
      }

      /* horizon rule */
      var g = hctx.createLinearGradient(hw * 0.12, 0, hw * 0.88, 0);
      g.addColorStop(0, "rgba(242,204,120,0)");
      g.addColorStop(0.5, "rgba(242,204,120,0.35)");
      g.addColorStop(1, "rgba(242,204,120,0)");
      hctx.fillStyle = g;
      hctx.fillRect(hw * 0.12, horizon, hw * 0.76, 1);
    }
    drawHero();
  }

  /* ----------------------------------------------------------------------
     Hero spectrum
     ---------------------------------------------------------------------- */
  var canvas = document.getElementById("spectrum");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = 0, height = 0, running = true;
    var BARS = 72;

    function size() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener("resize", size, { passive: true });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        running = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(canvas);
    }

    var t = 0;
    function draw() {
      requestAnimationFrame(draw);
      if (!running) return;
      t += 0.016;
      ctx.clearRect(0, 0, width, height);

      var gap = width / BARS;
      var barW = Math.max(1.2, gap * 0.34);

      for (var i = 0; i < BARS; i++) {
        var p = i / BARS;
        var env = Math.sin(p * Math.PI); // taper at the edges
        var h =
          (0.30 + 0.24 * Math.sin(t * 1.7 + i * 0.55) +
                  0.18 * Math.sin(t * 0.9 - i * 0.31) +
                  0.12 * Math.sin(t * 3.1 + i * 1.7)) *
          env;
        h = Math.max(0.04, Math.min(1, h));

        var bh = h * height * (reduced ? 0.5 : 1);
        var x = i * gap + (gap - barW) / 2;
        var grad = ctx.createLinearGradient(0, height, 0, height - bh);
        grad.addColorStop(0, "rgba(242,204,120,0.05)");
        grad.addColorStop(0.55, "rgba(242,204,120,0.5)");
        grad.addColorStop(1, "rgba(255,230,180,0.95)");
        ctx.fillStyle = grad;
        ctx.fillRect(x, height - bh, barW, bh);
      }
    }
    draw();
  }

  /* ----------------------------------------------------------------------
     Footer year
     ---------------------------------------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-year]"), function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
