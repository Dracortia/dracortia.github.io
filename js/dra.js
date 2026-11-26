/* ==========================================================================
   Dracortia — site behaviour
   Vanilla JS. No dependencies.

   1.  Utilities
   2.  Header, scroll progress, section spy
   3.  Mobile navigation
   4.  Reveal, scramble, counters
   5.  Pointer: cursor, spotlight, magnetic, tilt, core
   6.  Hero field (wireframe terrain)
   7.  Testimonials
   8.  Modals
   9.  Audio deck (YouTube, audio only)
   10. Interface sound
   11. Clocks + year
   12. Boot
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     1. Utilities
     ------------------------------------------------------------------------ */
  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var isFile = location.protocol === "file:";

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function pad(n) { return n < 10 ? "0" + n : String(n); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function on(target, type, fn, opts) { if (target) target.addEventListener(type, fn, opts); }
  function focusables(el) {
    return $$('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])', el)
      .filter(function (n) { return n.getClientRects().length > 0; });
  }
  function syncLock() {
    var locked = $(".modal.is-open") || $(".nav.is-open");
    body.classList.toggle("is-locked", !!locked);
  }

  /* ------------------------------------------------------------------------
     2. Header, scroll progress, section spy
     ------------------------------------------------------------------------ */
  var header = $("#header");
  var progressBar = $("#scrollProgress");
  var nav = $("#nav");
  var navToggle = $("#navToggle");
  var railLinks = $$("#rail a");
  var navLinks = $$(".nav a");
  var sections = ["top", "work", "studio", "voices", "contact"].map(function (id) {
    return { id: id, el: doc.getElementById(id) };
  }).filter(function (s) { return s.el; });

  var lastY = -1;
  var ticking = false;

  function paintScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (y === lastY) { ticking = false; return; }
    lastY = y;

    if (header) header.classList.toggle("is-stuck", y > 22);

    if (progressBar) {
      var h = root.scrollHeight - window.innerHeight;
      progressBar.style.transform = "scaleX(" + (h > 0 ? clamp(y / h, 0, 1) : 0) + ")";
    }

    var active = "top";
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].el.getBoundingClientRect().top <= window.innerHeight * 0.42) active = sections[i].id;
    }
    navLinks.forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + active);
    });
    railLinks.forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("data-rail") === active);
    });

    ticking = false;
  }

  on(window, "scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(paintScroll); }
  }, { passive: true });
  on(window, "resize", function () {
    lastY = -1;
    paintScroll();
  }, { passive: true });

  /* ------------------------------------------------------------------------
     3. Mobile navigation
     ------------------------------------------------------------------------ */
  var navLastFocus = null;

  function setNav(open) {
    if (!nav || !navToggle) return;
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    syncLock();
    if (open) {
      navLastFocus = doc.activeElement;
      nav.focus({ preventScroll: true });
    } else if (navLastFocus && navLastFocus.focus) {
      navLastFocus.focus({ preventScroll: true });
      navLastFocus = null;
    }
  }

  on(navToggle, "click", function () {
    setNav(!nav.classList.contains("is-open"));
  });
  on(nav, "click", function (e) {
    if (e.target.closest("a")) setNav(false);
  });

  /* ------------------------------------------------------------------------
     4. Reveal, scramble, counters
     ------------------------------------------------------------------------ */
  var reveals = $$(".reveal");
  if (reveals.length) {
    reveals.forEach(function (el) {
      var sibs = el.parentElement ? Array.prototype.slice.call(el.parentElement.children) : [];
      var idx = sibs.filter(function (s) { return s.classList && s.classList.contains("reveal"); }).indexOf(el);
      el.style.setProperty("--i", Math.max(0, Math.min(idx, 5)));
    });

    if ("IntersectionObserver" in window) {
      var ro = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          obs.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
      reveals.forEach(function (el) { ro.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add("is-in"); });
    }
  }

  var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%/+*—";
  function scramble(el) {
    if (reduced || el.dataset.done) return;
    el.dataset.done = "1";
    var final = el.textContent;
    el.setAttribute("aria-label", final);
    var frame = 0;
    var total = Math.max(12, Math.round(final.length * 0.9));
    var timer = setInterval(function () {
      var out = "";
      for (var i = 0; i < final.length; i++) {
        var ch = final[i];
        if (ch === " ") { out += " "; continue; }
        if (i < frame) { out += ch; continue; }
        out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      frame++;
      if (frame > total) {
        clearInterval(timer);
        el.textContent = final;
      }
    }, 22);
  }

  var scrambles = $$("[data-scramble]");
  if (scrambles.length) {
    if ("IntersectionObserver" in window) {
      var so = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          scramble(entry.target);
          so.unobserve(entry.target);
        });
      }, { threshold: 0.45 });
      scrambles.forEach(function (el) { so.observe(el); });
    } else {
      scrambles.forEach(scramble);
    }
  }

  var counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var counted = false;
    var co = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting || counted) return;
      counted = true;
      co.disconnect();
      counters.forEach(function (el) {
        var target = parseInt(el.getAttribute("data-count"), 10) || 0;
        if (reduced) { el.textContent = pad(target); return; }
        var start = performance.now();
        var dur = 1400;
        (function step(now) {
          var t = clamp((now - start) / dur, 0, 1);
          var eased = 1 - Math.pow(1 - t, 3);
          el.textContent = pad(Math.round(target * eased));
          if (t < 1) requestAnimationFrame(step);
        })(start);
      });
    }, { threshold: 0.5 });
    co.observe(counters[0].closest(".hero-stats") || counters[0]);
  }

  /* ------------------------------------------------------------------------
     4b. Waveform decorations (cards + voices)
     ------------------------------------------------------------------------ */
  (function buildWaves() {
    var seed = 20261126;
    function rnd() {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    }

    $$(".card-wave").forEach(function (el, idx) {
      var frag = doc.createDocumentFragment();
      var n = 28;
      for (var i = 0; i < n; i++) {
        var env = 0.3 + 0.7 * Math.abs(Math.sin(i * 0.62 + idx * 1.7));
        var bar = doc.createElement("i");
        bar.style.setProperty("--h", Math.round(14 + env * 82) + "%");
        bar.style.setProperty("--d", String(Math.round(rnd() * 600)));
        frag.appendChild(bar);
      }
      el.appendChild(frag);
    });

    var dw = $("#deckWave");
    if (dw) {
      dw.innerHTML = "";
      var dfrag = doc.createDocumentFragment();
      for (var k = 0; k < 48; k++) {
        var envD = 0.22 + 0.78 * Math.abs(Math.sin(k * 0.41 + 0.7) * Math.sin(k * 0.12));
        var barD = doc.createElement("i");
        barD.style.setProperty("--h", Math.round(10 + envD * 88) + "%");
        barD.style.setProperty("--d", String(Math.round(rnd() * 900)));
        barD.style.setProperty("--dur", (0.55 + rnd() * 1.25).toFixed(2) + "s");
        dfrag.appendChild(barD);
      }
      dw.appendChild(dfrag);
    }

    var vw = $(".voice-wave");
    if (vw) {
      var vfrag = doc.createDocumentFragment();
      var n2 = 110;
      for (var j = 0; j < n2; j++) {
        var x = j / n2;
        var env2 = Math.sin(x * Math.PI) * 0.8 + 0.2;
        var h2 = Math.round((0.16 + 0.84 * Math.abs(Math.sin(j * 0.31) * Math.sin(j * 0.07 + 1.2))) * env2 * 100);
        var b2 = doc.createElement("i");
        b2.style.setProperty("--h", Math.max(8, h2) + "%");
        b2.style.setProperty("--d", String(Math.round(rnd() * 1600)));
        vfrag.appendChild(b2);
      }
      vw.appendChild(vfrag);
    }
  })();

  /* ------------------------------------------------------------------------
     5. Pointer: cursor, spotlight, magnetic, tilt, core
     ------------------------------------------------------------------------ */
  var ptr = {
    x: window.innerWidth / 2,
    y: window.innerHeight * 0.36,
    nx: 0,
    ny: 0,
    active: false
  };
  var smooth = { x: ptr.x, y: ptr.y };
  var rootStyle = body.style;
  var ptrDirty = true;
  var audioLevel = 0;

  on(window, "pointermove", function (e) {
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    ptr.nx = (e.clientX / window.innerWidth - 0.5) * 2;
    ptr.ny = (e.clientY / window.innerHeight - 0.5) * 2;
    ptr.active = true;
    ptrDirty = true;
  }, { passive: true });

  function paintPointerVars() {
    rootStyle.setProperty("--mx", ptr.x.toFixed(1) + "px");
    rootStyle.setProperty("--my", ptr.y.toFixed(1) + "px");
    rootStyle.setProperty("--nx", ptr.nx.toFixed(3));
    rootStyle.setProperty("--ny", ptr.ny.toFixed(3));
  }

  /* custom cursor */
  var cursor = $("#cursor");
  var cursorLabel = $("#cursorLabel");
  var cursorOn = !!(cursor && fine && !reduced);
  var dotEl = cursor ? $(".cursor-dot", cursor) : null;
  var ringEl = cursor ? $(".cursor-ring", cursor) : null;

  if (cursorOn) {
    body.classList.add("has-cursor");
    smooth.x = ptr.x;
    smooth.y = ptr.y;

    on(doc, "pointermove", function () {
      cursor.classList.add("is-on");
    }, { passive: true });

    on(doc, "pointerover", function (e) {
      var hit = e.target.closest("a, button, [role='button'], input, textarea, .tab");
      cursor.classList.toggle("is-hover", !!hit);
      var label = hit ? hit.getAttribute("data-cursor") : "";
      if (cursorLabel) cursorLabel.textContent = label || "";
      cursor.classList.toggle("has-label", !!label);
    });

    on(doc, "pointerleave", function () { cursor.classList.remove("is-on"); });
    on(window, "blur", function () { cursor.classList.remove("is-on"); });
  }

  /* magnetic buttons */
  if (fine && !reduced) {
    $$(".magnetic").forEach(function (btn) {
      on(btn, "pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.18;
        var y = (e.clientY - r.top - r.height / 2) * 0.26;
        btn.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
      });
      on(btn, "pointerleave", function () {
        btn.style.transform = "";
      });
    });
  }

  /* 3D tilt on work cards */
  if (fine && !reduced) {
    $$(".tilt").forEach(function (card) {
      on(card, "pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--ry", (x * 7).toFixed(2) + "deg");
        card.style.setProperty("--rx", (-y * 5).toFixed(2) + "deg");
        card.classList.add("is-tilting");
      });
      on(card, "pointerleave", function () {
        card.classList.remove("is-tilting");
        card.style.setProperty("--ry", "0deg");
        card.style.setProperty("--rx", "0deg");
      });
    });
  }

  /* core follows pointer */
  var core = $("#core");
  if (core && fine && !reduced) {
    on(doc, "pointermove", function () {
      core.style.setProperty("--crx", (ptr.nx * 5).toFixed(2) + "deg");
      core.style.setProperty("--cry", (ptr.ny * -4).toFixed(2) + "deg");
    }, { passive: true });
  }

  /* ------------------------------------------------------------------------
     6. Hero field — wireframe terrain + particles
     ------------------------------------------------------------------------ */
  var field = (function () {
    var cv = $("#field");
    if (!cv || !cv.getContext) return null;

    var ctx = cv.getContext("2d");
    var w = 0, h = 0, dpr = 1;
    var rows = 26, cols = 48;
    var grid = [];
    var particles = [];
    var horizonGrad = null;
    var visible = true;
    var hidden = false;
    var t = 0;
    var last = 0;
    var acc = 0;

    function buildParticles() {
      particles = [];
      var n = window.innerWidth < 760 ? 26 : 54;
      for (var i = 0; i < n; i++) {
        particles.push({
          x: Math.random(),
          y: Math.random(),
          s: 0.6 + Math.random() * 1.4,
          sp: 0.004 + Math.random() * 0.012,
          ph: Math.random() * Math.PI * 2,
          a: 0.15 + Math.random() * 0.45
        });
      }
    }

    function size() {
      w = cv.clientWidth;
      h = cv.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.5 : 2);
      cv.width = Math.max(1, Math.floor(w * dpr));
      cv.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      rows = w < 760 ? 18 : 26;
      cols = w < 760 ? 28 : 48;

      grid = [];
      for (var r = 0; r < rows; r++) grid.push(new Array(cols));

      horizonGrad = ctx.createLinearGradient(0, 0, w, 0);
      horizonGrad.addColorStop(0, "rgba(242,204,120,0)");
      horizonGrad.addColorStop(0.5, "rgba(242,204,120,0.4)");
      horizonGrad.addColorStop(1, "rgba(242,204,120,0)");

      buildParticles();
      draw(0);
    }

    function wave(x, z, time) {
      return (
        Math.sin(x * 2.2 + time * 0.9) * 0.50 +
        Math.sin(x * 3.9 - z * 0.55 + time * 0.58) * 0.28 +
        Math.sin(z * 1.15 + x * 1.35 + time * 0.42) * 0.18
      );
    }

    function draw(now) {
      if (!w || !h) return;
      var time = t;
      ctx.clearRect(0, 0, w, h);

      var horizon = h * 0.47 + ptr.ny * 14;
      var cx = w * 0.52 + ptr.nx * 44;
      var scrollPhase = (window.scrollY || 0) * 0.00035;

      /* floating data motes */
      for (var p = 0; p < particles.length; p++) {
        var pt = particles[p];
        var px = pt.x * w + ptr.nx * 18 * (0.4 + pt.s);
        var py = ((pt.y - time * pt.sp) % 1 + 1) % 1;
        py = horizon * 0.96 * py;
        var tw = 0.55 + 0.45 * Math.sin(time * 1.4 + pt.ph);
        ctx.fillStyle = "rgba(255,232,186," + (pt.a * tw).toFixed(3) + ")";
        ctx.fillRect(px, py, pt.s, pt.s);
      }

      /* terrain vertices */
      var span = 1.04;
      for (var r = 0; r < rows; r++) {
        var z = 1.15 + r * 1.42;
        var persp = 1 / z;
        var rowY = horizon + h * 0.64 * persp;
        var amp = h * 0.10 * persp * (1 + audioLevel * 1.1);
        for (var c = 0; c < cols; c++) {
          var xn = (c / (cols - 1)) * 2 - 1;
          var sx = cx + xn * w * span * persp;
          var wv = wave(xn * 1.5, z, time + scrollPhase);
          var sy = rowY - wv * amp;

          if (ptr.active) {
            var dx = sx - ptr.x;
            var dy = sy - ptr.y;
            var d2 = dx * dx + dy * dy;
            sy -= Math.exp(-d2 / (2 * 150 * 150)) * 26;
          }
          grid[r][c] = [sx, sy];
        }
      }

      /* converging verticals */
      ctx.lineWidth = 1;
      for (var c2 = 0; c2 < cols; c2 += 4) {
        ctx.beginPath();
        ctx.moveTo(grid[0][c2][0], grid[0][c2][1]);
        for (var r2 = 1; r2 < rows; r2++) ctx.lineTo(grid[r2][c2][0], grid[r2][c2][1]);
        ctx.strokeStyle = "rgba(242,204,120,0.11)";
        ctx.stroke();
      }

      /* receding rows, far to near */
      for (var r3 = rows - 1; r3 >= 0; r3--) {
        var depth = 1 - r3 / rows;
        var alpha = 0.07 + Math.pow(depth, 1.55) * 0.72;
        var width = 0.7 + depth * 1.2;
        ctx.beginPath();
        ctx.moveTo(grid[r3][0][0], grid[r3][0][1]);
        for (var c3 = 1; c3 < cols; c3++) ctx.lineTo(grid[r3][c3][0], grid[r3][c3][1]);
        if (r3 === 0) {
          ctx.strokeStyle = "rgba(255,238,198," + Math.min(1, alpha + 0.2).toFixed(3) + ")";
          ctx.lineWidth = 1.8;
        } else {
          ctx.strokeStyle = "rgba(242,204,120," + alpha.toFixed(3) + ")";
          ctx.lineWidth = width;
        }
        ctx.stroke();
      }

      /* horizon light */
      if (horizonGrad) {
        ctx.fillStyle = horizonGrad;
        ctx.fillRect(0, horizon, w, 1);
      }
      var glow = ctx.createLinearGradient(0, horizon - h * 0.12, 0, horizon + h * 0.07);
      glow.addColorStop(0, "rgba(242,204,120,0)");
      glow.addColorStop(0.62, "rgba(242,204,120,0.075)");
      glow.addColorStop(1, "rgba(242,204,120,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, horizon - h * 0.12, w, h * 0.19);

      /* pointer scan */
      if (ptr.active) {
        var scan = ctx.createLinearGradient(0, horizon, 0, h);
        scan.addColorStop(0, "rgba(242,204,120,0.16)");
        scan.addColorStop(1, "rgba(242,204,120,0)");
        ctx.strokeStyle = scan;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ptr.x, horizon);
        ctx.lineTo(ptr.x, h);
        ctx.stroke();
      }
    }

    function tick(now) {
      if (hidden || !visible) return;
      var dt = now - (last || now);
      last = now;
      acc += dt;
      if (acc < 33) return;
      acc = 0;
      t += Math.min(dt, 80) / 1000;
      draw(now);
    }

    on(window, "resize", function () {
      clearTimeout(size._t);
      size._t = setTimeout(size, 160);
    }, { passive: true });
    on(document, "visibilitychange", function () { hidden = doc.hidden; });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(cv);
    }

    size();

    return { tick: tick, size: size };
  })();

  /* ------------------------------------------------------------------------
     6b. Audio engine — generative signal, lab voices, analyser
     ------------------------------------------------------------------------ */
  var AudioEngine = (function () {
    var ctx = null, master = null, analyser = null;
    var freqData = null, timeData = null;
    var signalBus = null, labBus = null, labFilter = null, labEcho = null, reverbSend = null, delaySend = null;
    var noiseBuffer = null;
    var running = false, timer = null, nextTime = 0, step = 0;
    var chordIndex = 0, activeChord = null, signalStartedAt = 0;
    var volume = 0.65;
    var levelSmooth = 0;
    var bpm = 72;
    var labFilterHz = 3200;
    var labEchoAmt = 0.35;

    var chords = [
      { root: 73.42, notes: [146.83, 174.61, 220.00, 261.63, 329.63] },
      { root: 58.27, notes: [116.54, 146.83, 174.61, 220.00, 261.63] },
      { root: 87.31, notes: [87.31, 110.00, 130.81, 164.81, 196.00] },
      { root: 65.41, notes: [130.81, 164.81, 196.00, 246.94, 293.66] }
    ];
    var arpPattern = [0, 2, 4, 2, 1, 3, 4, 3, 2, 4, 1, 3, 0, 2, 3, 1];

    function gainValue() { return Math.pow(volume, 1.35) * 0.82; }

    function makeImpulse(seconds, decay) {
      var rate = ctx.sampleRate;
      var len = Math.floor(rate * seconds);
      var buf = ctx.createBuffer(2, len, rate);
      for (var ch = 0; ch < 2; ch++) {
        var d = buf.getChannelData(ch);
        for (var i = 0; i < len; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
        }
      }
      return buf;
    }

    function ensure() {
      if (ctx) {
        if (ctx.state === "suspended") ctx.resume();
        return ctx;
      }
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (err) { return null; }

      master = ctx.createGain();
      master.gain.value = gainValue();

      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.knee.value = 22;
      comp.ratio.value = 3;
      comp.attack.value = 0.006;
      comp.release.value = 0.25;

      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.82;

      master.connect(comp);
      comp.connect(analyser);
      analyser.connect(ctx.destination);

      freqData = new Uint8Array(analyser.frequencyBinCount);
      timeData = new Uint8Array(analyser.fftSize);

      var reverb = ctx.createConvolver();
      reverb.buffer = makeImpulse(3.2, 2.4);
      var revReturn = ctx.createGain();
      revReturn.gain.value = 0.42;
      reverb.connect(revReturn);
      revReturn.connect(master);
      reverbSend = ctx.createGain();
      reverbSend.gain.value = 1;
      reverbSend.connect(reverb);

      var delay = ctx.createDelay(2);
      delay.delayTime.value = 0.42;
      var fb = ctx.createGain();
      fb.gain.value = 0.32;
      var delayReturn = ctx.createGain();
      delayReturn.gain.value = 0.28;
      delay.connect(fb);
      fb.connect(delay);
      delay.connect(delayReturn);
      delayReturn.connect(master);
      delaySend = ctx.createGain();
      delaySend.gain.value = 1;
      delaySend.connect(delay);

      signalBus = ctx.createGain();
      signalBus.gain.value = 0.0001;
      signalBus.connect(master);
      signalBus.connect(reverbSend);
      signalBus.connect(delaySend);

      labBus = ctx.createGain();
      labBus.gain.value = 0.55;

      labFilter = ctx.createBiquadFilter();
      labFilter.type = "lowpass";
      labFilter.frequency.value = labFilterHz;
      labFilter.Q.value = 0.8;

      labEcho = ctx.createGain();
      labEcho.gain.value = labEchoAmt;

      labBus.connect(labFilter);
      labFilter.connect(master);
      labFilter.connect(reverbSend);
      labFilter.connect(labEcho);
      labEcho.connect(delaySend);

      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      var nd = noiseBuffer.getChannelData(0);
      for (var n = 0; n < nd.length; n++) nd[n] = Math.random() * 2 - 1;

      activeChord = chords[0];
      return ctx;
    }

    function env(g, t, attack, hold, release, peak) {
      g.cancelScheduledValues(t);
      g.setValueAtTime(0.0001, t);
      g.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
      g.setValueAtTime(Math.max(0.0002, peak), t + attack + Math.max(0.01, hold));
      g.exponentialRampToValueAtTime(0.0001, t + attack + Math.max(0.01, hold) + release);
    }

    function tone(bus, freq, t, dur, type, peak, opts) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t);
      if (opts && opts.slide) o.frequency.exponentialRampToValueAtTime(opts.slide, t + dur);
      if (opts && opts.detune) o.detune.setValueAtTime(opts.detune, t);
      var attack = opts && opts.attack != null ? opts.attack : 0.02;
      var release = opts && opts.release != null ? opts.release : 0.3;
      env(g.gain, t, attack, dur - attack - release, release, peak || 0.1);

      if (opts && opts.filter) {
        var f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.setValueAtTime(opts.filter, t);
        f.Q.value = opts.q || 0.7;
        o.connect(f);
        f.connect(g);
      } else {
        o.connect(g);
      }
      g.connect(bus);
      o.start(t);
      o.stop(t + dur + 0.06);
    }

    function pad(freq, t, dur) {
      tone(signalBus, freq, t, dur, "sine", 0.055, { attack: 2.6, release: 3.4, detune: -7, filter: 1250 });
      tone(signalBus, freq * 1.003, t, dur, "triangle", 0.028, { attack: 3.2, release: 3.8, detune: 9, filter: 900 });
    }

    function bass(freq, t, dur) {
      tone(signalBus, freq, t, dur, "sine", 0.10, { attack: 1.2, release: 2.4 });
      tone(signalBus, freq, t, dur, "triangle", 0.032, { attack: 1.5, release: 2.6, filter: 280 });
    }

    function pluck(freq, t) {
      tone(signalBus, freq, t, 0.9, "triangle", 0.042, { attack: 0.008, release: 0.8, filter: 2600, q: 2 });
    }

    function kick(t) {
      tone(signalBus, 110, t, 0.55, "sine", 0.11, { attack: 0.005, release: 0.5, slide: 42 });
    }

    function tick(t) {
      var src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      var f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 4200;
      f.Q.value = 8;
      var g = ctx.createGain();
      src.connect(f);
      f.connect(g);
      g.connect(signalBus);
      g.connect(delaySend);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.016, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      src.start(t);
      src.stop(t + 0.12);
    }

    function air(t, dur) {
      var src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;
      var f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.setValueAtTime(420, t);
      f.frequency.linearRampToValueAtTime(1900, t + dur);
      f.Q.value = 0.6;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.018, t + dur * 0.3);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(reverbSend);
      src.start(t);
      src.stop(t + dur + 0.05);
    }

    function scheduleStep(t) {
      var s = step % 32;
      if (s === 0) {
        activeChord = chords[chordIndex];
        chordIndex = (chordIndex + 1) % chords.length;
        var dur = (60 / bpm) * 8;
        for (var i = 0; i < activeChord.notes.length; i++) pad(activeChord.notes[i], t, dur);
        bass(activeChord.root, t, dur);
        air(t, dur);
      }
      if (s % 2 === 0) {
        var idx = arpPattern[(step / 2) % arpPattern.length];
        var note = activeChord.notes[idx % activeChord.notes.length];
        pluck(note * (s % 8 === 0 ? 2 : 1) * (s % 4 === 0 ? 2 : 1), t);
      }
      if (s % 8 === 0) kick(t);
      if (s % 8 === 4) tick(t);
    }

    function schedule() {
      if (!running || !ctx) return;
      var ahead = ctx.currentTime + 0.3;
      while (nextTime < ahead) {
        scheduleStep(nextTime);
        nextTime += (60 / bpm) / 4;
        step++;
      }
    }

    function startSignal() {
      var c = ensure();
      if (!c) return false;
      if (running) return true;
      running = true;
      step = 0;
      chordIndex = 0;
      activeChord = chords[0];
      nextTime = c.currentTime + 0.15;
      signalStartedAt = performance.now();
      signalBus.gain.cancelScheduledValues(c.currentTime);
      signalBus.gain.setValueAtTime(Math.max(0.0001, signalBus.gain.value), c.currentTime);
      signalBus.gain.exponentialRampToValueAtTime(1, c.currentTime + 1.4);
      timer = window.setInterval(schedule, 90);
      schedule();
      return true;
    }

    function stopSignal() {
      if (!ctx || !running) {
        running = false;
        if (timer) { window.clearInterval(timer); timer = null; }
        return;
      }
      running = false;
      if (timer) { window.clearInterval(timer); timer = null; }
      var t = ctx.currentTime;
      signalBus.gain.cancelScheduledValues(t);
      signalBus.gain.setValueAtTime(signalBus.gain.value, t);
      signalBus.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      signalStartedAt = 0;
    }

    function note(freq, opts) {
      var c = ensure();
      if (!c) return;
      var t = c.currentTime + 0.01;
      var dur = (opts && opts.dur) || 1.3;
      tone(labBus, freq, t, dur, "triangle", 0.085, { attack: 0.008, release: dur - 0.1, filter: 3400 });
      tone(labBus, freq * 2, t, dur * 0.6, "sine", 0.026, { attack: 0.006, release: dur * 0.5 });
    }

    function setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      if (ctx && master) {
        var t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(Math.max(0.0001, gainValue()), t + 0.15);
      }
    }

    function setLabFilter(hz) {
      labFilterHz = Math.max(100, Math.min(12000, hz));
      if (ctx && labFilter) labFilter.frequency.setTargetAtTime(labFilterHz, ctx.currentTime, 0.06);
    }

    function setLabEcho(v) {
      labEchoAmt = Math.max(0, Math.min(1, v));
      if (ctx && labEcho) labEcho.gain.setTargetAtTime(labEchoAmt, ctx.currentTime, 0.06);
    }

    function getWave(n) {
      var out = [];
      if (!ctx || !analyser) return out;
      analyser.getByteTimeDomainData(timeData);
      var step = Math.max(1, Math.floor(timeData.length / n));
      for (var i = 0; i < n; i++) out.push((timeData[i * step] - 128) / 128);
      return out;
    }

    function getLevel() {
      if (!ctx || !analyser) { levelSmooth += (0 - levelSmooth) * 0.18; return levelSmooth; }
      analyser.getByteTimeDomainData(timeData);
      var sum = 0;
      for (var i = 0; i < timeData.length; i += 2) {
        var v = (timeData[i] - 128) / 128;
        sum += v * v;
      }
      var rms = Math.sqrt(sum / (timeData.length / 2));
      var target = Math.min(1, rms * 4.8);
      levelSmooth += (target - levelSmooth) * 0.18;
      return levelSmooth;
    }

    function getBands(n) {
      var out = [];
      if (!ctx || !analyser) return out;
      analyser.getByteFrequencyData(freqData);
      var bins = freqData.length;
      var nyquist = ctx.sampleRate / 2;
      var minF = 40, maxF = 12000;
      for (var i = 0; i < n; i++) {
        var f0 = minF * Math.pow(maxF / minF, i / n);
        var f1 = minF * Math.pow(maxF / minF, (i + 1) / n);
        var b0 = Math.max(0, Math.floor(f0 / nyquist * bins));
        var b1 = Math.min(bins - 1, Math.max(b0 + 1, Math.floor(f1 / nyquist * bins)));
        var sum = 0;
        for (var j = b0; j <= b1; j++) sum += freqData[j];
        out.push(sum / (b1 - b0 + 1) / 255);
      }
      return out;
    }

    function getElapsed() {
      return signalStartedAt ? (performance.now() - signalStartedAt) / 1000 : 0;
    }

    return {
      ensure: ensure,
      startSignal: startSignal,
      stopSignal: stopSignal,
      isRunning: function () { return running; },
      note: note,
      setVolume: setVolume,
      setLabFilter: setLabFilter,
      setLabEcho: setLabEcho,
      getLevel: getLevel,
      getBands: getBands,
      getWave: getWave,
      getElapsed: getElapsed
    };
  })();

  /* ------------------------------------------------------------------------
     6c. Core spectrum — a live ring around the signal core
     ------------------------------------------------------------------------ */
  var coreSpectrum = (function () {
    var cv = $("#coreSpectrum");
    if (!cv || !cv.getContext) return null;
    var ctx = cv.getContext("2d");
    var w = 0, h = 0, dpr = 1;
    var geo = null;

    function size() {
      w = cv.clientWidth;
      h = cv.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.floor(w * dpr));
      cv.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      geo = { cx: w / 2, cy: h / 2, base: Math.min(w, h) * 0.305, max: Math.min(w, h) * 0.085 };
    }

    function draw(now) {
      if (!w || !h) return;
      var t = now / 1000;
      var bands = audioLevel > 0.02 ? AudioEngine.getBands(72) : [];
      var live = body.classList.contains("is-audio");
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";

      for (var i = 0; i < 72; i++) {
        var v = bands.length ? bands[i] : (0.16 + 0.2 * Math.abs(Math.sin(t * 1.1 + i * 0.33)));
        if (live && !bands.length) v = Math.max(v, 0.28);
        var len = geo.max * (0.08 + Math.pow(v, 0.75) * (live ? 1.25 : 0.7));
        var ang = -Math.PI / 2 + (i / 72) * Math.PI * 2;
        var cos = Math.cos(ang), sin = Math.sin(ang);
        ctx.beginPath();
        ctx.moveTo(geo.cx + cos * geo.base, geo.cy + sin * geo.base);
        ctx.lineTo(geo.cx + cos * (geo.base + len), geo.cy + sin * (geo.base + len));
        ctx.strokeStyle = "rgba(242,204,120," + (0.14 + Math.min(0.7, v * 0.9)).toFixed(3) + ")";
        ctx.lineWidth = i % 6 === 0 ? 1.8 : 1.1;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(geo.cx, geo.cy, geo.base, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(242,204,120,0.13)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    on(window, "resize", function () {
      clearTimeout(size._t);
      size._t = setTimeout(size, 160);
    }, { passive: true });
    size();
    return { draw: draw, size: size };
  })();

  /* ------------------------------------------------------------------------
     6d. Signal lab scope
     ------------------------------------------------------------------------ */
  var labScope = (function () {
    var cv = $("#labScope");
    if (!cv || !cv.getContext) return null;
    var ctx = cv.getContext("2d");
    var levelEl = $("#labLevel");
    var w = 0, h = 0, dpr = 1;
    var visible = false;
    var lastText = 0;

    function size() {
      w = cv.clientWidth;
      h = cv.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.floor(w * dpr));
      cv.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(now) {
      if (!visible || !w || !h) return;
      var t = now / 1000;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(255,255,255,0.055)";
      ctx.lineWidth = 1;
      for (var i = 1; i < 5; i++) {
        var gy = (h / 5) * i;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }
      for (var j = 1; j < 9; j++) {
        var gx = (w / 9) * j;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }

      var wave = AudioEngine.getWave(180);
      var active = false;
      if (wave.length) {
        for (var k = 0; k < wave.length; k++) {
          if (Math.abs(wave[k]) > 0.012) { active = true; break; }
        }
      }

      ctx.beginPath();
      for (var p = 0; p < 180; p++) {
        var v;
        if (active && p < wave.length) {
          v = wave[p];
        } else {
          v = Math.sin(p * 0.16 + t * 1.2) * 0.04 + Math.sin(p * 0.53 - t * 0.7) * 0.015;
        }
        var px = (p / 179) * w;
        var py = h / 2 + v * h * 0.44;
        if (p === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      var grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "rgba(242,204,120,0.2)");
      grad.addColorStop(0.5, "rgba(255,230,180,0.95)");
      grad.addColorStop(1, "rgba(242,204,120,0.2)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = "rgba(242,204,120,0.6)";
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (levelEl && now - lastText > 180) {
        lastText = now;
        var db = audioLevel > 0.002 ? 20 * Math.log10(audioLevel) : -60;
        levelEl.textContent = (db <= -59 ? "−∞" : db.toFixed(1)) + " dB";
      }
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) draw(performance.now());
      }, { threshold: 0 }).observe(cv);
    } else {
      visible = true;
    }

    on(window, "resize", function () {
      clearTimeout(size._t);
      size._t = setTimeout(size, 160);
    }, { passive: true });

    size();
    return { draw: draw, size: size };
  })();

  /* master loop */
  if (!reduced) {
    (function loop(now) {
      requestAnimationFrame(loop);

      if (ptrDirty) {
        paintPointerVars();
        ptrDirty = false;
      }

      if (cursorOn) {
        var dx = ptr.x - smooth.x;
        var dy = ptr.y - smooth.y;
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
          smooth.x += dx * 0.16;
          smooth.y += dy * 0.16;
          if (ringEl) ringEl.style.transform = "translate3d(" + smooth.x.toFixed(1) + "px," + smooth.y.toFixed(1) + "px,0)";
          if (cursorLabel) {
            cursorLabel.style.transform = "translate3d(" + (smooth.x - ptr.x) + "px," + (smooth.y - ptr.y) + "px,0)";
          }
        }
        if (dotEl) dotEl.style.transform = "translate3d(" + ptr.x + "px," + ptr.y + "px,0)";
      }

      audioLevel = AudioEngine.getLevel();
      if (coreSpectrum) coreSpectrum.draw(now);
      if (labScope) labScope.draw(now);
      if (field) field.tick(now);
    })(performance.now());
  } else {
    if (field) field.size();
    if (coreSpectrum) coreSpectrum.draw(0);
    if (labScope) labScope.draw(0);
  }

  /* ------------------------------------------------------------------------
     7. Testimonials
     ------------------------------------------------------------------------ */
  var slider = $("#slider");
  if (slider) {
    var slides = $$(".slide", slider);
    var dots = $$(".slider-index button", slider);
    var slideNow = $("#slideNow");
    var slideBar = $("#slideProgress");
    var slideIndex = 0;
    var paused = false;

    function showSlide(n) {
      slideIndex = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle("is-active", i === slideIndex); });
      dots.forEach(function (d, i) {
        d.setAttribute("aria-current", i === slideIndex ? "true" : "false");
      });
      if (slideNow) slideNow.textContent = pad(slideIndex + 1);
      if (slideBar && !reduced) {
        slideBar.classList.remove("is-running");
        void slideBar.offsetWidth;
        slideBar.classList.add("is-running");
      }
    }

    dots.forEach(function (dot) {
      on(dot, "click", function () { showSlide(parseInt(dot.getAttribute("data-slide"), 10) || 0); });
    });
    on($("#prev"), "click", function () { showSlide(slideIndex - 1); });
    on($("#next"), "click", function () { showSlide(slideIndex + 1); });

    on(slider, "keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); showSlide(slideIndex - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); showSlide(slideIndex + 1); }
    });

    on(slider, "pointerenter", function () { paused = true; slider.classList.add("is-paused"); });
    on(slider, "pointerleave", function () {
      paused = false;
      slider.classList.remove("is-paused");
    });
    on(slider, "focusin", function () { paused = true; slider.classList.add("is-paused"); });
    on(slider, "focusout", function (e) {
      if (!slider.contains(e.relatedTarget)) {
        paused = false;
        slider.classList.remove("is-paused");
      }
    });
    if (slideBar) {
      on(slideBar, "animationend", function () {
        if (!paused && !reduced) showSlide(slideIndex + 1);
      });
    }

    /* swipe */
    var swipeX = null;
    on(slider, "pointerdown", function (e) {
      if (e.pointerType === "mouse") return;
      swipeX = e.clientX;
    }, { passive: true });
    on(slider, "pointerup", function (e) {
      if (swipeX === null) return;
      var dx = e.clientX - swipeX;
      swipeX = null;
      if (Math.abs(dx) > 48) showSlide(slideIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });

    showSlide(0);
  }

  /* ------------------------------------------------------------------------
     8. Modals
     ------------------------------------------------------------------------ */
  var activeModal = null;
  var modalLastFocus = null;
  var modalCloseTimer = null;

  function embedUrl(id) {
    return "https://www.youtube.com/embed/" + id + "?rel=0&modestbranding=1&playsinline=1";
  }

  function videoIdFrom(frame) {
    var m = (frame.getAttribute("data-src") || "").match(/embed\/([^?]+)/);
    return m ? m[1] : "";
  }

  function buildFallback(container, frame, title) {
    var id = videoIdFrom(frame);
    var cover = container.querySelector(".frame-cover");
    if (cover) cover.remove();
    var a = container.querySelector(".player-fallback");
    if (!a) {
      a = doc.createElement("a");
      a.className = "player-fallback";
      a.target = "_blank";
      a.rel = "noopener";
      a.innerHTML = '<img alt=""><span class="pf-play" aria-hidden="true"></span><span class="pf-note">Watch on YouTube</span>';
      frame.parentNode.insertBefore(a, frame);
    }
    a.href = "https://www.youtube.com/watch?v=" + id;
    var img = a.querySelector("img");
    if (img) {
      img.src = "https://i.ytimg.com/vi/" + id + "/maxresdefault.jpg";
      img.alt = title || "";
      img.onerror = function () { img.src = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg"; };
    }
    frame.style.display = "none";
  }

  function addCover(frame) {
    var parent = frame.parentNode;
    if (!parent) return;
    var cover = parent.querySelector(".frame-cover");
    if (!cover) {
      cover = doc.createElement("span");
      cover.className = "frame-cover";
      cover.setAttribute("aria-hidden", "true");
      parent.insertBefore(cover, frame);
    }
    var id = videoIdFrom(frame);
    cover.style.backgroundImage = id ? 'url("https://i.ytimg.com/vi/' + id + '/hqdefault.jpg")' : "none";
    parent.classList.remove("is-loaded");
    window.clearTimeout(cover._timer);
    cover._timer = window.setTimeout(function () { parent.classList.add("is-loaded"); }, 6000);
    frame.addEventListener("load", function () {
      window.clearTimeout(cover._timer);
      parent.classList.add("is-loaded");
    }, { once: true });
  }

  function loadFrames(modal) {
    $$("iframe[data-src]", modal).forEach(function (frame) {
      if (isFile) {
        buildFallback(frame.parentNode, frame, modal.querySelector(".modal-title") ? modal.querySelector(".modal-title").textContent : "");
        return;
      }
      frame.style.display = "";
      var fb = frame.parentNode.querySelector(".player-fallback");
      if (fb) fb.remove();
      addCover(frame);
      if (!frame.getAttribute("src")) frame.setAttribute("src", frame.getAttribute("data-src"));
    });
  }

  function unloadFrames(modal) {
    $$("iframe[data-src]", modal).forEach(function (frame) {
      var fresh = frame.cloneNode(false);
      fresh.removeAttribute("src");
      if (frame.parentNode) frame.parentNode.replaceChild(fresh, frame);
    });
  }

  function resetTabs(modal) {
    var tabs = $$(".tab", modal);
    if (!tabs.length) return;
    tabs.forEach(function (t, i) { t.classList.toggle("is-active", i === 0); t.setAttribute("aria-selected", i === 0 ? "true" : "false"); });
    var panel = doc.getElementById("dla-player");
    if (panel && tabs[0]) panel.setAttribute("aria-labelledby", tabs[0].id);
    var frame = $("iframe[data-src]", modal);
    if (frame) frame.setAttribute("data-src", embedUrl(tabs[0].getAttribute("data-video")));
  }

  function openModal(modal) {
    if (!modal || activeModal) return;
    if (nav && nav.classList.contains("is-open")) setNav(false);
    activeModal = modal;
    modalLastFocus = doc.activeElement;
    modal.hidden = false;
    /* force a style flush so the opening transition always plays, even when
       the tab is backgrounded and requestAnimationFrame is throttled */
    void modal.offsetWidth;
    modal.classList.add("is-open");
    syncLock();
    resetTabs(modal);
    loadFrames(modal);
    var close = $(".modal-close", modal);
    if (close) close.focus({ preventScroll: true });
  }

  function closeModal() {
    if (!activeModal) return;
    var modal = activeModal;
    activeModal = null;
    modal.classList.remove("is-open");
    unloadFrames(modal);
    window.clearTimeout(modalCloseTimer);
    modalCloseTimer = window.setTimeout(function () {
      modal.hidden = true;
      syncLock();
      if (!activeModal && modalLastFocus && modalLastFocus.focus) modalLastFocus.focus({ preventScroll: true });
      modalLastFocus = null;
    }, 320);
  }

  doc.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-modal]");
    if (opener) {
      e.preventDefault();
      openModal(doc.getElementById(opener.getAttribute("data-modal")));
      return;
    }
    if (e.target.closest("[data-close]")) {
      e.preventDefault();
      closeModal();
    }
  });

  doc.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      var card = e.target.closest && e.target.closest("[data-modal]");
      if (card && e.target === card) {
        e.preventDefault();
        openModal(doc.getElementById(card.getAttribute("data-modal")));
      }
    }
  });

  /* DLA tabs */
  var dla = doc.getElementById("m-dla");
  if (dla) {
    $$(".tab", dla).forEach(function (tab) {
      on(tab, "click", function () {
        $$(".tab", dla).forEach(function (t) { t.classList.toggle("is-active", t === tab); t.setAttribute("aria-selected", t === tab ? "true" : "false"); });
        var frame = $("iframe[data-src]", dla);
        if (!frame) return;
        var src = embedUrl(tab.getAttribute("data-video"));
        frame.setAttribute("data-src", src);
        var panel = doc.getElementById("dla-player");
        if (panel) panel.setAttribute("aria-labelledby", tab.id);
        if (isFile) {
          buildFallback(frame.parentNode, frame, tab.textContent);
        } else {
          addCover(frame);
          frame.setAttribute("src", src);
        }
      });
    });
    on(dla, "click", function () { /* keep tab state while open */ });
  }

  /* ------------------------------------------------------------------------
     9. Audio deck
     ------------------------------------------------------------------------ */
  var deck = (function () {
    var wrap = $("#deck");
    if (!wrap) return null;

    var face = $("#deckFace");
    var panel = $("#deckPanel");
    var playBtn = $("#deckPlay");
    var prevBtn = $("#deckPrev");
    var nextBtn = $("#deckNext");
    var closeBtn = $("#deckClose");
    var muteBtn = $("#deckMute");
    var volEl = $("#deckVol");
    var titleEl = $("#deckTitle");
    var subEl = $("#deckSub");
    var indexEl = $("#deckIndex");
    var timeEl = $("#deckTime");
    var fillEl = $("#deckFill");
    var stateEl = $("#deckState");
    var ytLink = $("#deckYT");
    var mount = $("#deckMount");

    var localDefs = window.DRC_LOCAL_TRACKS || [];
    var localTracks = [];
    localDefs.forEach(function (t) {
      if (t && t.file) {
        localTracks.push({
          src: t.file,
          title: t.title || "Local track",
          sub: t.sub || "Local audio",
          local: true
        });
      }
    });

    var tracks = localTracks.concat([
      { id: "0ExXmmjxRBg", title: "Soul Spires: Initium", sub: "Reveal · Square Table Games" },
      { id: "03TC8wSO9PU", title: "Rogue Slime", sub: "Original cue · Quest Seeker Games" },
      { id: "ux2sh79JPpc", title: "In-game suite", sub: "Archive 03 · original score" },
      { signal: true, title: "Live Signal", sub: "Generative · composed in the browser" }
    ]);
    var signalIndex = tracks.length - 1;

    var index = 0;
    var yt = null;
    var apiReady = false;
    var wantsPlay = false;
    var isPlaying = false;
    var mode = null; /* "yt" | "signal" | "local" */
    var audioEl = null;
    var ticker = null;
    var watchdog = null;

    var VOL_KEY = "drc-vol";
    var volume = 65;
    var lastVolume = 65;
    try {
      var savedVol = parseInt(window.localStorage.getItem(VOL_KEY), 10);
      if (!isNaN(savedVol)) {
        volume = clamp(savedVol, 0, 100);
        lastVolume = volume || 65;
      }
    } catch (err) {}
    AudioEngine.setVolume(volume / 100);

    function fmt(sec) {
      sec = Math.max(0, Math.floor(sec || 0));
      return Math.floor(sec / 60) + ":" + pad(sec % 60);
    }

    function setState(text) {
      if (stateEl) stateEl.textContent = text;
    }

    function paintTrack() {
      var tr = tracks[index];
      var isSignal = !!tr.signal;
      var isLocal = !!tr.local;
      wrap.classList.toggle("is-signal", isSignal);
      wrap.classList.toggle("is-local", isLocal);
      if (titleEl) titleEl.textContent = tr.title;
      if (subEl) subEl.textContent = tr.sub;
      if (indexEl) indexEl.textContent = isSignal ? "LIVE" : pad(index + 1) + " / " + pad(tracks.length - 1);
      if (timeEl) timeEl.textContent = "0:00";
      if (fillEl) fillEl.style.width = isSignal ? "100%" : "0%";
      if (ytLink) {
        if (isSignal || isLocal) {
          ytLink.hidden = true;
        } else {
          ytLink.hidden = false;
          ytLink.href = "https://www.youtube.com/watch?v=" + tr.id;
        }
      }
    }

    function setPlaying(on, label) {
      isPlaying = on;
      wrap.classList.toggle("is-playing", on);
      body.classList.toggle("is-audio", on);
      if (face) face.setAttribute("aria-label", on ? (mode === "signal" ? "Pause live signal" : "Pause audition reel") : "Open audition reel");
      if (playBtn) playBtn.setAttribute("aria-label", on ? "Pause" : "Play");
      setState(on ? (label || "PLAYING") : "PAUSED");
      if (on) {
        if (!ticker) ticker = window.setInterval(update, 500);
      } else {
        window.clearInterval(ticker);
        ticker = null;
      }
    }

    function update() {
      if (mode === "signal") {
        var elapsed = AudioEngine.getElapsed();
        if (timeEl) timeEl.textContent = fmt(elapsed);
        if (fillEl) fillEl.style.width = "100%";
        return;
      }
      if (mode === "local" && audioEl) {
        var lt = audioEl.currentTime || 0;
        var ld = audioEl.duration || 0;
        if (timeEl) timeEl.textContent = fmt(lt);
        if (fillEl) fillEl.style.width = ld > 0 ? ((lt / ld) * 100).toFixed(2) + "%" : "0%";
        return;
      }
      if (!yt || !yt.getCurrentTime) return;
      var time = yt.getCurrentTime() || 0;
      var dur = yt.getDuration() || 0;
      if (timeEl) timeEl.textContent = fmt(time);
      if (fillEl) fillEl.style.width = dur > 0 ? ((time / dur) * 100).toFixed(2) + "%" : "0%";
    }

    function open() {
      wrap.classList.add("is-open");
      if (face) face.setAttribute("aria-expanded", "true");
      if (panel) {
        panel.inert = false;
        panel.removeAttribute("aria-hidden");
      }
    }

    function close() {
      wrap.classList.remove("is-open");
      if (face) face.setAttribute("aria-expanded", "false");
      if (panel) {
        panel.inert = true;
        panel.setAttribute("aria-hidden", "true");
      }
      if (face && wrap.contains(doc.activeElement)) face.focus({ preventScroll: true });
    }

    function pauseYouTube() {
      if (yt) {
        wantsPlay = false;
        try { yt.pauseVideo(); } catch (err) {}
      }
    }

    function startSignal(reason) {
      if (mode === "yt") pauseYouTube();
      var ok = AudioEngine.startSignal();
      if (!ok) { setState("AUDIO BLOCKED"); return; }
      mode = "signal";
      index = signalIndex;
      paintTrack();
      open();
      setPlaying(true, reason || "LIVE SIGNAL");
    }

    function stopSignal() {
      AudioEngine.stopSignal();
      mode = null;
      setPlaying(false);
      setState("STANDBY");
    }

    function ensureAudioEl() {
      if (audioEl) return audioEl;
      audioEl = new Audio();
      audioEl.preload = "metadata";
      audioEl.addEventListener("ended", function () {
        if (mode === "local") go(1);
      });
      audioEl.addEventListener("play", function () {
        if (mode === "local") setPlaying(true, "PLAYING");
      });
      audioEl.addEventListener("pause", function () {
        if (mode === "local" && !audioEl.ended) setPlaying(false);
      });
      audioEl.addEventListener("error", function () {
        if (mode === "local") startSignal("LOCAL FILE UNAVAILABLE · LIVE SIGNAL");
      });
      return audioEl;
    }

    function playLocal() {
      var tr = tracks[index];
      if (!tr || !tr.local) return;
      var a = ensureAudioEl();
      if (a.getAttribute("src") !== tr.src) {
        a.setAttribute("src", tr.src);
        a.load();
      }
      mode = "local";
      wantsPlay = true;
      applyVolume();
      var p = a.play();
      if (p && p.catch) {
        p.catch(function () { startSignal("LOCAL FILE UNAVAILABLE · LIVE SIGNAL"); });
      }
      open();
    }

    function watch() {
      if (isFile) return;
      window.clearTimeout(watchdog);
      watchdog = window.setTimeout(function () {
        if (!wantsPlay) return;
        var st = yt && yt.getPlayerState ? yt.getPlayerState() : -1;
        var tm = yt && yt.getCurrentTime ? yt.getCurrentTime() : 0;
        if (st === 1 || tm > 0.6) return;
        /* archive stream is blocked here — fall forward into the live signal
           instead of dumping the visitor into a new tab */
        startSignal("LIVE SIGNAL · ARCHIVE UNAVAILABLE");
      }, 6000);
    }

    function applyVolume() {
      AudioEngine.setVolume(volume / 100);
      if (audioEl) audioEl.volume = volume / 100;
      if (yt && yt.setVolume) { try { yt.setVolume(volume); } catch (err) {} }
    }

    function paintVolume() {
      if (volEl) {
        volEl.value = String(volume);
        volEl.style.background = "linear-gradient(to right, var(--accent) 0%, var(--accent) " + volume + "%, rgba(255,255,255,0.14) " + volume + "%, rgba(255,255,255,0.14) 100%)";
      }
      wrap.classList.toggle("is-muted", volume === 0);
      if (muteBtn) muteBtn.setAttribute("aria-label", volume === 0 ? "Unmute" : "Mute");
    }

    function loadApi(cb) {
      if (apiReady) return cb();
      if (window.YT && window.YT.Player) { apiReady = true; return cb(); }
      var queue = window.__drcYTQueue || (window.__drcYTQueue = []);
      queue.push(cb);
      if (doc.getElementById("yt-iframe-api")) return;

      var s = doc.createElement("script");
      s.id = "yt-iframe-api";
      s.src = "https://www.youtube.com/iframe_api";
      s.onerror = function () { startSignal("LIVE SIGNAL · YOUTUBE BLOCKED"); };
      doc.head.appendChild(s);

      window.onYouTubeIframeAPIReady = function () {
        apiReady = true;
        var q = window.__drcYTQueue || [];
        window.__drcYTQueue = [];
        q.forEach(function (fn) { fn(); });
      };
    }

    function createPlayer() {
      loadApi(function () {
        if (yt || !mount) return;
        if (tracks[index].signal) return;
        var origin = location.protocol.indexOf("http") === 0 ? location.protocol + "//" + location.host : "";
        yt = new window.YT.Player(mount, {
          width: 320,
          height: 180,
          videoId: tracks[index].id,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            origin: origin
          },
          events: {
            onReady: function (e) {
              applyVolume();
              if (wantsPlay) { e.target.playVideo(); watch(); }
            },
            onStateChange: function (e) {
              if (e.data === 1 || e.data === 2 || e.data === 0) window.clearTimeout(watchdog);
              if (e.data === 1) {
                mode = "yt";
                wantsPlay = true;
                setPlaying(true, "PLAYING");
              } else if (e.data === 2) {
                setPlaying(false);
              } else if (e.data === 3) {
                setState("BUFFERING");
              } else if (e.data === 0) {
                go(1);
              }
            },
            onError: function () {
              startSignal("LIVE SIGNAL · STREAM ERROR");
            }
          }
        });
      });
    }

    function toggle() {
      AudioEngine.ensure(); /* unlock the local audio graph on the user's click */
      if (tracks[index].local) {
        if (mode === "local" && isPlaying) { audioEl.pause(); return; }
        if (mode === "yt") pauseYouTube();
        if (mode === "signal" && isPlaying) {
          AudioEngine.stopSignal();
          mode = null;
          setPlaying(false);
        }
        playLocal();
        return;
      }
      if (tracks[index].signal) {
        if (mode === "signal" && isPlaying) stopSignal();
        else startSignal();
        return;
      }
      if (mode === "signal" && isPlaying) {
        stopSignal();
        return;
      }
      if (isFile) {
        startSignal("LIVE SIGNAL · OFFLINE");
        return;
      }
      if (!yt) {
        wantsPlay = true;
        setState("LOADING");
        open();
        createPlayer();
        watch();
        return;
      }
      var st = yt.getPlayerState ? yt.getPlayerState() : -1;
      if (st === 1) { wantsPlay = false; yt.pauseVideo(); }
      else { wantsPlay = true; yt.playVideo(); watch(); open(); }
    }

    function go(step) {
      var wasPlaying = isPlaying;
      if (mode === "local" && audioEl) audioEl.pause();
      if (mode === "yt" && isPlaying) pauseYouTube();
      if (mode === "signal" && isPlaying) {
        AudioEngine.stopSignal();
        mode = null;
        setPlaying(false);
      }
      index = (index + step + tracks.length) % tracks.length;
      paintTrack();
      if (tracks[index].signal) {
        startSignal();
        return;
      }
      if (tracks[index].local) {
        if (wasPlaying) playLocal();
        return;
      }
      if (isFile) {
        setPlaying(false);
        setState("ARCHIVE NEEDS A SERVER");
        return;
      }
      if (!yt) {
        wantsPlay = wasPlaying;
        createPlayer();
        return;
      }
      try {
        if (wasPlaying) yt.loadVideoById(tracks[index].id);
        else yt.cueVideoById(tracks[index].id);
      } catch (err) {}
      mode = "yt";
      wantsPlay = wasPlaying;
      if (wasPlaying) setState("LOADING");
    }

    /* wiring */
    on(face, "click", function () {
      if (!wrap.classList.contains("is-open")) open();
      toggle();
    });
    on(playBtn, "click", toggle);
    on(prevBtn, "click", function () { go(-1); });
    on(nextBtn, "click", function () { go(1); });
    on(closeBtn, "click", close);

    on(wrap, "pointerenter", function () { if (fine) open(); });
    on(wrap, "pointerleave", function () {
      if (!fine) return;
      if (wrap.contains(doc.activeElement)) return;
      close();
    });
    on(wrap, "focusout", function (e) {
      if (!wrap.contains(e.relatedTarget)) close();
    });

    on(volEl, "input", function () {
      volume = parseInt(volEl.value, 10) || 0;
      if (volume > 0) lastVolume = volume;
      applyVolume();
      paintVolume();
      try { window.localStorage.setItem(VOL_KEY, String(volume)); } catch (err) {}
    });
    on(muteBtn, "click", function () {
      if (volume > 0) { lastVolume = volume; volume = 0; }
      else { volume = lastVolume || 65; }
      applyVolume();
      paintVolume();
      try { window.localStorage.setItem(VOL_KEY, String(volume)); } catch (err) {}
    });

    /* hero + hero console hooks */
    on($("#audition"), "click", function () {
      open();
      if (!isPlaying) toggle();
    });

    paintTrack();
    paintVolume();
    setState("READY");

    return {
      open: open,
      close: close,
      toggle: toggle,
      pause: function () {
        if (mode === "local" && audioEl) audioEl.pause();
        else if (mode === "signal") stopSignal();
        else if (yt && isPlaying) { wantsPlay = false; yt.pauseVideo(); }
      },
      isPlaying: function () { return isPlaying; }
    };
  })();

  /* ------------------------------------------------------------------------
     9b. Signal lab — pads, sequencer, filter / echo
     ------------------------------------------------------------------------ */
  var lab = (function () {
    var padsEl = $("#labPads");
    if (!padsEl) return null;

    var freqs = [
      146.83, 164.81, 196.00, 220.00,
      261.63, 293.66, 329.63, 392.00,
      440.00, 523.25, 587.33, 659.25,
      783.99, 880.00, 1046.50, 1174.66
    ];
    var names = ["D3", "E3", "G3", "A3", "C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5", "G5", "A5", "C6", "D6"];
    var pattern = [0, 4, 7, 11, 14, 11, 7, 4, 2, 5, 9, 12, 15, 12, 9, 5];
    var pads = [];
    var timer = null;
    var step = 0;

    var runBtn = $("#labRun");
    var tempo = $("#labTempo");
    var filter = $("#labFilter");
    var echo = $("#labEcho");
    var tempoV = $("#labTempoV");
    var filterV = $("#labFilterV");
    var echoV = $("#labEchoV");

    function hit(btn) {
      if (!btn) return;
      btn.classList.add("is-hit");
      window.setTimeout(function () { btn.classList.remove("is-hit"); }, 170);
    }

    freqs.forEach(function (f, i) {
      var b = doc.createElement("button");
      b.type = "button";
      b.className = "lab-pad";
      b.setAttribute("aria-label", "Play " + names[i]);
      b.innerHTML = '<span class="pad-idx">' + pad(i + 1) + '</span><span class="pad-note">' + names[i] + '</span><i aria-hidden="true"></i>';
      on(b, "click", function () {
        AudioEngine.ensure();
        AudioEngine.note(f, { dur: 1.3 });
        hit(b);
      });
      padsEl.appendChild(b);
      pads.push(b);
    });

    function stepMs() { return 60000 / (parseInt(tempo.value, 10) || 96) / 2; }

    function paintRange(el) {
      if (!el) return;
      var min = parseFloat(el.min) || 0;
      var max = parseFloat(el.max) || 100;
      var p = ((parseFloat(el.value) - min) / (max - min)) * 100;
      el.style.background = "linear-gradient(to right, var(--accent) 0%, var(--accent) " + p.toFixed(1) + "%, rgba(255,255,255,0.14) " + p.toFixed(1) + "%, rgba(255,255,255,0.14) 100%)";
    }

    function tick() {
      var i = pattern[step % pattern.length];
      hit(pads[i]);
      AudioEngine.note(freqs[i], { dur: 0.9 });
      step++;
    }

    function start() {
      if (!AudioEngine.ensure()) return;
      runBtn.setAttribute("aria-pressed", "true");
      var label = runBtn.querySelector("span");
      if (label) label.textContent = "Stop sequence";
      step = 0;
      tick();
      timer = window.setInterval(tick, stepMs());
    }

    function stop() {
      if (timer) { window.clearInterval(timer); timer = null; }
      runBtn.setAttribute("aria-pressed", "false");
      var label = runBtn.querySelector("span");
      if (label) label.textContent = "Run sequence";
    }

    on(runBtn, "click", function () { if (timer) stop(); else start(); });
    on(tempo, "input", function () {
      tempoV.textContent = tempo.value;
      paintRange(tempo);
      if (timer) {
        window.clearInterval(timer);
        timer = window.setInterval(tick, stepMs());
      }
    });
    on(filter, "input", function () {
      var hz = parseInt(filter.value, 10) || 3200;
      filterV.textContent = (hz / 1000).toFixed(1) + "k";
      paintRange(filter);
      AudioEngine.setLabFilter(hz);
    });
    on(echo, "input", function () {
      var v = parseInt(echo.value, 10) || 0;
      echoV.textContent = String(v);
      paintRange(echo);
      AudioEngine.setLabEcho(v / 100);
    });

    tempoV.textContent = tempo.value;
    filterV.textContent = (parseInt(filter.value, 10) / 1000).toFixed(1) + "k";
    echoV.textContent = echo.value;
    paintRange(tempo);
    paintRange(filter);
    paintRange(echo);
    AudioEngine.setLabFilter(parseInt(filter.value, 10));
    AudioEngine.setLabEcho(parseInt(echo.value, 10) / 100);

    return { stop: stop };
  })();

  /* ------------------------------------------------------------------------
     10. Interface sound
     ------------------------------------------------------------------------ */
  var sfx = (function () {
    var btn = $("#sfxToggle");
    var KEY = "drc-sfx";
    var On = false;
    var ctx = null;
    var armed = false;
    var lastHover = 0;
    var lastTarget = null;

    try { On = window.localStorage.getItem(KEY) === "1"; } catch (err) {}

    function paint() {
      if (!btn) return;
      btn.setAttribute("aria-pressed", On ? "true" : "false");
      btn.setAttribute("aria-label", On ? "Turn interface sound off" : "Turn interface sound on");
    }

    function ensure() {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        try { ctx = new AC(); } catch (err) { return null; }
      }
      if (ctx.state === "suspended") { ctx.resume(); }
      return ctx;
    }

    function blip(freq, dur, type, gain, slide) {
      if (!On) return;
      if (!ctx && !armed) return; /* never build an audio graph before a gesture */
      var c = ensure();
      if (!c) return;
      var osc = c.createOscillator();
      var g = c.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, c.currentTime);
      if (slide) osc.frequency.exponentialRampToValueAtTime(slide, c.currentTime + dur);
      g.gain.setValueAtTime(0, c.currentTime);
      g.gain.linearRampToValueAtTime(gain || 0.02, c.currentTime + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      osc.connect(g);
      g.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + dur + 0.02);
    }

    function hover() {
      if (!On) return;
      var now = performance.now();
      if (now - lastHover < 70) return;
      lastHover = now;
      blip(1500 + Math.random() * 260, 0.035, "sine", 0.013);
    }

    function click() { blip(560, 0.07, "triangle", 0.022, 840); }
    function confirm() { blip(720, 0.09, "sine", 0.03, 1080); setTimeout(function () { blip(1080, 0.12, "sine", 0.022); }, 90); }

    if (btn) {
      on(btn, "click", function () {
        On = !On;
        paint();
        try { window.localStorage.setItem(KEY, On ? "1" : "0"); } catch (err) {}
        if (On) { ensure(); confirm(); }
      });
      paint();
    }

    doc.addEventListener("pointerover", function (e) {
      if (!On) return;
      var hit = e.target.closest("a, button, [role='button'], .service, .card");
      if (!hit || hit === lastTarget) return;
      lastTarget = hit;
      hover();
    });

    doc.addEventListener("click", function (e) {
      if (!On) return;
      if (e.target.closest("#sfxToggle")) return;
      if (e.target.closest("a, button, [role='button']")) click();
    });

    function arm() {
      if (armed) return;
      armed = true;
      if (On) ensure();
    }
    doc.addEventListener("pointerdown", arm, { capture: true });
    doc.addEventListener("keydown", arm, { capture: true });

    return { enabled: function () { return On; } };
  })();

  /* ------------------------------------------------------------------------
     11. Clocks + year
     ------------------------------------------------------------------------ */
  var clockFmt = null;
  try {
    clockFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Berlin" });
  } catch (err) {}

  function paintClocks() {
    if (!clockFmt) return;
    var time = clockFmt.format(new Date());
    $$("[data-clock]").forEach(function (el) { el.textContent = time; });
  }
  paintClocks();
  window.setInterval(paintClocks, 30000);

  $$("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ------------------------------------------------------------------------
     12. Global keys + boot
     ------------------------------------------------------------------------ */
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (activeModal) { closeModal(); return; }
      if (nav && nav.classList.contains("is-open")) { setNav(false); return; }
      if (deck && $("#deck").classList.contains("is-open")) deck.close();
    }

    if (e.key === "Tab") {
      if (activeModal) {
        var f = focusables(activeModal);
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      } else if (nav && nav.classList.contains("is-open")) {
        var nf = focusables(nav);
        if (!nf.length) return;
        var nfirst = nf[0], nlast = nf[nf.length - 1];
        if (doc.activeElement === nav) {
          e.preventDefault();
          (e.shiftKey ? nlast : nfirst).focus();
        } else if (e.shiftKey && doc.activeElement === nfirst) {
          e.preventDefault(); nlast.focus();
        } else if (!e.shiftKey && doc.activeElement === nlast) {
          e.preventDefault(); nfirst.focus();
        }
      }
    }
  });

  /* ------------------------------------------------------------------------
     12b. Boot sequence
     ------------------------------------------------------------------------ */
  (function boot() {
    var el = $("#boot");
    if (!el) return;
    if (root.classList.contains("booted") || reduced) { el.remove(); return; }
    var line = $("#bootLine");
    var msgs = ["MOUNTING ARCHIVE", "LINKING AUDIO CORE", "CALIBRATING FIELD", "SIGNAL LOCKED"];
    var i = 0;
    var done = false;
    var iv = window.setInterval(function () {
      i = (i + 1) % msgs.length;
      if (line) line.textContent = msgs[i];
    }, 520);

    function dismiss() {
      if (done) return;
      done = true;
      window.clearInterval(iv);
      try { window.sessionStorage.setItem("drc-booted", "1"); } catch (err) {}
      document.removeEventListener("keydown", onKey);
      if (el && el.parentNode) {
        el.style.pointerEvents = "none";
        el.style.transition = "opacity .4s var(--ease)";
        el.style.opacity = "0";
        window.setTimeout(function () { if (el.parentNode) el.remove(); }, 450);
      }
    }
    function onKey() { dismiss(); }

    el.addEventListener("click", dismiss);
    document.addEventListener("keydown", onKey);
    window.setTimeout(dismiss, 2600);
  })();

  paintScroll();
})();
