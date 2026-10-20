/* RML Growth Partners, v2. Minimal vanilla JS, no dependencies. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js"); // normally already set by the inline head script
  var EMAIL = "ryanlein@rmlgrowth.com";
  var reduceMQ = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

  /* Header: blur and shadow once the page scrolls */
  var header = document.querySelector(".site-header");
  if (header) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; header.classList.toggle("is-scrolled", window.scrollY > 8); });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Mobile menu */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); toggle.focus(); } });
  }

  /* Reveal on scroll (skipped for reduced motion) */
  var reveals = document.querySelectorAll(".reveal");
  if (!reduceMQ.matches && "IntersectionObserver" in window) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); rio.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    reveals.forEach(function (el) { rio.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* Background loop videos
     * HTML default source is the 720p encode; wide or high density screens switch to 1080p.
     * Playback starts only when the video is on screen (IntersectionObserver).
     * Two stacked <video> elements alternate, with a 0.4s crossfade at each loop point.
       Clips marked data-native-loop (seamless ping pong edits) use one element and a plain loop.
     * prefers-reduced-motion: nothing plays, the poster still stays visible. */
  var FADE = 0.4;
  var loops = [];

  function pickSource(video) {
    var hd = video.getAttribute("data-src-hd");
    var source = video.querySelector("source");
    var sd = source ? source.getAttribute("src") : video.getAttribute("src");
    var conn = navigator.connection || {};
    var w = Math.max(window.innerWidth || 0, doc.clientWidth || 0);
    var dpr = window.devicePixelRatio || 1;
    var wantHd = hd && !conn.saveData && w >= 1024 && w * dpr >= 1600;
    if (video.closest(".card-media, .serve-feature")) wantHd = hd && !conn.saveData && w >= 1024 && dpr >= 2; // small card slot
    return wantHd ? hd : sd;
  }

  function LoopVideo(wrap) {
    this.wrap = wrap;
    this.a = wrap.querySelector("video");
    this.btn = wrap.querySelector(".video-toggle");
    this.ready = false;
    this.visible = false;
    this.userPaused = false;
    this.fading = false;
    this.raf = 0;
    this.native = wrap.hasAttribute("data-native-loop");
  }
  LoopVideo.prototype.setup = function () {
    if (this.ready) return;
    this.ready = true;
    var self = this;
    var a = this.a;
    var src = pickSource(a);
    a.muted = true;
    this.wrap.setAttribute("data-source", src.split("/").pop());
    if (this.native) {
      // Seamless clip (ping pong edit with matching ends): plain native loop, one element, no crossfade.
      while (a.firstChild) a.removeChild(a.firstChild);
      a.loop = true;
      a.preload = "auto";
      a.src = src;
      this.cur = a;
      this.loaded = true;
      this.bindToggle();
      return;
    }
    a.removeAttribute("loop"); // looping is handled by the crossfade below
    var b = a.cloneNode(false);
    while (b.firstChild) b.removeChild(b.firstChild);
    b.removeAttribute("poster");
    b.muted = true;
    b.playsInline = true;
    b.style.opacity = "0";
    a.style.opacity = "1";
    a.style.zIndex = "1";
    b.style.zIndex = "0";
    a.parentNode.insertBefore(b, a.nextSibling);
    this.b = b;
    this.cur = a;
    this.next = b;
    // Download the clip once and share it between both elements (blob URL),
    // so the second element never triggers a second network download.
    var attach = function (url) {
      while (a.firstChild) a.removeChild(a.firstChild);
      a.src = url;
      b.src = url;
      a.preload = b.preload = "auto";
      self.loaded = true;
      if (self.wantPlay) self.play();
    };
    if (window.fetch && window.URL && URL.createObjectURL) {
      fetch(src).then(function (r) {
        if (!r.ok) throw new Error("video fetch failed");
        return r.blob();
      }).then(function (blob) { attach(URL.createObjectURL(blob)); })
        .catch(function () { attach(src); });
    } else {
      attach(src);
    }
    this.bindToggle();
  };
  LoopVideo.prototype.bindToggle = function () {
    var self = this;
    if (!this.btn) return;
    this.btn.hidden = false;
    this.btn.addEventListener("click", function () {
      self.userPaused = !self.userPaused;
      self.btn.classList.toggle("is-paused", self.userPaused);
      self.btn.setAttribute("aria-label", self.userPaused ? "Play video" : "Pause video");
      if (self.userPaused) self.pause(); else self.play();
    });
  };
  LoopVideo.prototype.play = function () {
    if (reduceMQ.matches || this.userPaused || !this.visible) return;
    this.setup();
    this.wantPlay = true;
    if (!this.loaded) return; // play() runs again once the clip has downloaded
    var p = this.cur.play();
    if (p && p.catch) p.catch(function () {});
    if (!this.native) this.tick();
  };
  LoopVideo.prototype.pause = function () {
    this.wantPlay = false;
    if (!this.ready) return;
    this.a.pause();
    if (this.b) this.b.pause();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  };
  LoopVideo.prototype.tick = function () {
    var self = this;
    cancelAnimationFrame(this.raf);
    var step = function () {
      var cur = self.cur, d = cur.duration;
      if (!self.fading && d && isFinite(d) && cur.currentTime + FADE >= d) self.crossfade();
      self.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  };
  LoopVideo.prototype.crossfade = function () {
    var self = this, cur = this.cur, next = this.next;
    this.fading = true;
    next.currentTime = 0;
    next.style.transition = "none";
    next.style.opacity = "0";
    next.style.zIndex = "2";
    cur.style.zIndex = "1";
    var p = next.play();
    if (p && p.catch) p.catch(function () {});
    // start the fade on the next frame so the starting opacity is committed without a forced layout
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        next.style.transition = "opacity " + FADE + "s linear";
        next.style.opacity = "1";
      });
    });
    setTimeout(function () {
      cur.pause();
      cur.style.transition = "none";
      cur.style.opacity = "0";
      try { cur.currentTime = 0; } catch (e) {}
      self.cur = next;
      self.next = cur;
      self.fading = false;
      self.wrap.setAttribute("data-loops", String((+self.wrap.getAttribute("data-loops") || 0) + 1));
    }, FADE * 1000 + 30);
  };

  var wraps = document.querySelectorAll("[data-loop-video]");
  wraps.forEach(function (w) { loops.push(new LoopVideo(w)); });
  if (loops.length && "IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var lv = en.target.__loop;
        lv.visible = en.isIntersecting;
        if (en.isIntersecting) lv.play(); else lv.pause();
      });
    }, { rootMargin: "120px 0px", threshold: 0.01 });
    loops.forEach(function (lv) { lv.wrap.__loop = lv; vio.observe(lv.wrap); });
  }
  var onMotionChange = function () {
    loops.forEach(function (lv) { if (reduceMQ.matches) lv.pause(); else lv.play(); });
    if (reduceMQ.matches) reveals.forEach(function (el) { el.classList.add("is-in"); });
  };
  if (reduceMQ.addEventListener) reduceMQ.addEventListener("change", onMotionChange);
  else if (reduceMQ.addListener) reduceMQ.addListener(onMotionChange);
  document.addEventListener("visibilitychange", function () {
    loops.forEach(function (lv) { if (document.hidden) lv.pause(); else lv.play(); });
  });

  /* Forms (FormSubmit AJAX) */
  var MSG = {
    required: "This field is required.",
    email: "Please enter a valid email address.",
    phone: "Please enter a valid phone number.",
    url: "Please enter a valid website, such as example.com.",
    sending: "Sending...",
    failed: "Your message did not go through. Please try again in a moment, or email us at "
  };

  /* Spam checks. Conservative on purpose so real leads are never lost. */
  var LOADED = Date.now();
  var MIN_FILL_MS = 3000;
  var TEMP_DOMAINS = ["notlettersmail.com", "mailinator.com", "yopmail.com", "guerrillamail.com", "guerrillamail.info",
    "guerrillamail.net", "sharklasers.com", "grr.la", "10minutemail.com", "temp-mail.org", "tempmail.com",
    "throwawaymail.com", "trashmail.com", "getnada.com", "dispostable.com", "maildrop.cc", "fakeinbox.com", "mailnesia.com"];
  function tempEmail(v) {
    var d = (v.split("@")[1] || "").toLowerCase();
    return TEMP_DOMAINS.some(function (t) { return d === t || d.slice(-(t.length + 1)) === "." + t; });
  }
  function hasLetter(v) { return /[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0590-\u06FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/.test(v); }
  function gibberishName(v) {
    return v.split(/[\s.,'\u2019]+/).some(function (w) {
      var latin = w.replace(/[^A-Za-z]/g, "");
      if (latin.length >= 5 && !/[aeiouy]/i.test(latin)) return true;      /* five or more letters, no vowel */
      if (/[bcdfghjklmnpqrstvwxz]{6,}/i.test(latin)) return true;          /* six consonants in a row */
      return (w.match(/[a-z][A-Z]/g) || []).length >= 3;                   /* random case, like hGtYkLmP */
    });
  }

  document.querySelectorAll("form[data-ajax-form]").forEach(function (form) {
    /* The endpoint only exists once this script runs, so a plain POST of the page skips FormSubmit. */
    var endpoint = "https://formsubmit.co/ajax/" + form.getAttribute("data-to") + "@" + form.getAttribute("data-host");
    var token = String(LOADED) + Math.random().toString(36).slice(2);
    form.setAttribute("data-token", token);
    var status = form.querySelector(".form-status");
    var submitBtn = form.querySelector('button[type="submit"]');
    var success = document.getElementById(form.getAttribute("data-success"));

    function setError(f, msg) {
      var wrap = f.closest(".field");
      if (!wrap) return;
      wrap.classList.add("has-error");
      f.setAttribute("aria-invalid", "true");
      var err = wrap.querySelector(".field-error");
      if (err) err.textContent = msg;
    }
    function clearError(f) {
      var wrap = f.closest(".field");
      if (!wrap) return;
      wrap.classList.remove("has-error");
      f.removeAttribute("aria-invalid");
      var err = wrap.querySelector(".field-error");
      if (err) err.textContent = "";
    }
    function validate() {
      var first = null;
      form.querySelectorAll("input, select, textarea").forEach(function (f) {
        if (f.type === "hidden" || f.type === "checkbox" || f.closest(".hp")) return;
        clearError(f);
        var v = (f.value || "").trim();
        var msg = "";
        if (f.required && !v) msg = MSG.required;
        else if (v && f.type === "email" && (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || tempEmail(v))) msg = MSG.email;
        else if (v && f.type === "tel" && v.replace(/\D/g, "").length < 7) msg = MSG.phone;
        else if (v && f.type === "url" && !/^(https?:\/\/)?([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(\/\S*)?$/i.test(v)) msg = MSG.url;
        if (msg) { setError(f, msg); first = first || f; }
      });
      return first;
    }

    form.addEventListener("input", function (e) {
      if (e.target.closest && e.target.closest(".field.has-error")) clearError(e.target);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.textContent = "";
      var bad = validate();
      if (bad) { bad.focus(); return; }

      /* Honeypot filled: act as if it worked and send nothing. */
      var honey = form.querySelector('input[name="_honey"]');
      if (honey && honey.value) { showSuccess(); return; }
      /* Too fast, missing token, or a name with no letters or keyboard mash: send nothing and show the existing failure text. */
      var full = form.querySelector('input[name="Full name"]');
      var biz = form.querySelector('input[name="Business name"]');
      var suspicious = Date.now() - LOADED < MIN_FILL_MS ||
        form.getAttribute("data-token") !== token ||
        (full && (!hasLetter(full.value) || gibberishName(full.value))) ||
        (biz && biz.value.trim() && !hasLetter(biz.value));
      if (suspicious) { showFailed(); return; }

      var data = new FormData(form);
      var key = "Services you are interested in";
      var picks = data.getAll(key);
      if (picks.length > 1) { data.delete(key); data.append(key, picks.join(", ")); }

      var label = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = MSG.sending;

      fetch(endpoint, { method: "POST", headers: { Accept: "application/json" }, body: data })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (j) {
            var ok = res.ok && j.success !== false && j.success !== "false";
            if (!ok) throw new Error("send failed");
          });
        })
        .then(showSuccess)
        .catch(showFailed)
        .then(function () { submitBtn.disabled = false; submitBtn.textContent = label; });
    });

    function showFailed() {
      status.textContent = MSG.failed;
      var a = document.createElement("a");
      a.href = "mailto:" + EMAIL;
      a.textContent = EMAIL;
      status.appendChild(a);
      status.appendChild(document.createTextNode("."));
    }

    function showSuccess() {
      form.hidden = true;
      if (success) {
        success.hidden = false;
        var h = success.querySelector("h2");
        if (h) h.focus();
      }
    }
  });
})();
