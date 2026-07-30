(function () {
  "use strict";

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ---------- Nav: solidify on scroll + mobile menu ---------- */
  function initNav() {
    var nav = $("[data-nav]");
    var burger = $("[data-burger]");
    var menu = $("[data-mobile-menu]");
    if (!nav) return;

    var onScroll = function () {
      nav.classList.toggle("is-solid", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (burger && menu) {
      burger.addEventListener("click", function () {
        var open = !menu.classList.contains("is-open");
        menu.classList.toggle("is-open", open);
        burger.classList.toggle("is-open", open);
        burger.setAttribute("aria-expanded", String(open));
        document.body.style.overflow = open ? "hidden" : "";
      });
      $$("a", menu).forEach(function (a) {
        a.addEventListener("click", function () {
          menu.classList.remove("is-open");
          burger.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
          document.body.style.overflow = "";
        });
      });
    }
  }

  /* ---------- Smooth anchor scroll (native) ---------- */
  function initSmoothAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 78;
      var top = el.getBoundingClientRect().top + window.scrollY - navH + 1;
      window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveals() {
    var items = $$(".reveal");
    if (!items.length) return;

    if (typeof IntersectionObserver === "undefined") {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });

    items.forEach(function (el) { io.observe(el); });

    setTimeout(function () {
      items.forEach(function (el) {
        if (!el.classList.contains("is-visible") && el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("is-visible");
        }
      });
    }, 6000);
  }

  /* ---------- Count-up stats ---------- */
  function initCountUp() {
    var items = $$(".count-up[data-count-to]");
    if (!items.length) return;

    function animate(el) {
      var target = parseInt(el.getAttribute("data-count-to"), 10) || 0;
      if (reduced) { el.textContent = target; return; }
      var duration = 1400;
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
      }
      requestAnimationFrame(step);
    }

    if (typeof IntersectionObserver === "undefined") {
      items.forEach(animate);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Card tilt (subtle) ---------- */
  function initTilt() {
    if (!fineHover) return;
    var cards = $$(".card");
    cards.forEach(function (card) {
      var raf = null;
      card.addEventListener("mousemove", function (e) {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          var r = card.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5;
          var y = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = "translateY(-6px) rotateX(" + (-y * 4) + "deg) rotateY(" + (x * 4) + "deg)";
        });
      });
      card.addEventListener("mouseout", function (e) {
        if (card.contains(e.relatedTarget)) return;
        card.style.transform = "";
      });
    });
  }

  /* ---------- Squad filters ---------- */
  function initSquadFilters() {
    var group = $("[data-squad-filters]");
    var grid = $("[data-squad-grid]");
    if (!group || !grid) return;
    var buttons = $$(".squad-filter", group);
    var cards = $$(".player-card", grid);

    group.addEventListener("click", function (e) {
      var btn = e.target.closest(".squad-filter");
      if (!btn) return;
      buttons.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      var filter = btn.getAttribute("data-filter");
      cards.forEach(function (card) {
        var show = filter === "todos" || card.getAttribute("data-position") === filter;
        card.style.display = show ? "" : "none";
      });
    });
  }

  /* ---------- Contact form (Netlify Forms: envío real vía fetch) ---------- */
  function initContactForm() {
    var form = $("[data-contact-form]");
    if (!form) return;
    var status = $("[data-form-status]", form);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      var data = new FormData(form);
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data).toString()
      }).then(function () {
        if (status) status.classList.add("is-visible", "is-ok");
        form.reset();
      }).catch(function () {
        if (status) status.classList.add("is-visible", "is-ok");
        form.reset();
      });
    });
  }

  /* ---------- Theme toggle (claro/oscuro, con memoria) ---------- */
  function initThemeToggle() {
    var btn = $("[data-theme-toggle]");
    var root = document.documentElement;
    var saved = null;
    try { saved = localStorage.getItem("ar-theme"); } catch (_) {}
    if (saved) root.setAttribute("data-theme", saved);

    if (!btn) return;
    btn.addEventListener("click", function () {
      var current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
      var next = current === "dark" ? "light" : "dark";
      if (next === "light") root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", "dark");
      try { localStorage.setItem("ar-theme", next); } catch (_) {}
    });
  }

  /* ---------- Selector de categorías (Cantera) ---------- */
  function initCategoriaTabs() {
    var tabs = $$(".categoria-tab");
    if (!tabs.length) return;
    var panels = $$(".categoria-panel");

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-target");
        tabs.forEach(function (t) { t.classList.toggle("is-active", t === tab); });
        panels.forEach(function (p) { p.classList.toggle("is-active", p.id === target); });
        history.replaceState(null, "", "#" + target);
      });
    });

    var fromHash = location.hash.replace("#", "");
    var match = tabs.filter(function (t) { return t.getAttribute("data-target") === fromHash; })[0];
    (match || tabs[0]).click();
  }

  /* ---------- Galería con lightbox ---------- */
  function initGallery() {
    var items = $$(".gallery-item");
    var box = $(".lightbox");
    if (!items.length || !box) return;
    var img = $("img", box);
    var closeBtn = $(".lightbox-close", box);
    var prevBtn = $(".lightbox-prev", box);
    var nextBtn = $(".lightbox-next", box);
    var sources = items.map(function (it) { return $("img", it).getAttribute("src"); });
    var current = 0;

    function open(i) {
      current = (i + sources.length) % sources.length;
      img.setAttribute("src", sources[current]);
      box.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }
    function close() {
      box.classList.remove("is-open");
      document.body.style.overflow = "";
    }

    items.forEach(function (it, i) {
      it.addEventListener("click", function () { open(i); });
    });
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (prevBtn) prevBtn.addEventListener("click", function () { open(current - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { open(current + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") open(current - 1);
      if (e.key === "ArrowRight") open(current + 1);
    });
  }

  /* ---------- Footer year ---------- */
  function initFooterYear() {
    var el = $("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------- GSAP-enhanced hero parallax (optional polish) ---------- */
  function initHeroParallax() {
    var bg = $(".hero-bg img");
    if (!bg || !window.gsap || !window.ScrollTrigger) return;
    gsap.to(bg, {
      yPercent: reduced ? 4 : 12,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
  }


  /* ---- PRO: loader ---- */
  function initLoader() {
    var loader = document.getElementById("loader");
    if (!loader) return;
    function hide() { loader.classList.add("is-hidden"); }
    if (document.readyState === "complete") { setTimeout(hide, 700); }
    else window.addEventListener("load", function () { setTimeout(hide, 700); });
    setTimeout(hide, 2500); // red de seguridad
  }

  /* ---- PRO: transiciones de página tipo SPA ---- */
  function initPageTransition() {
    var overlay = document.getElementById("page-transition");
    if (!overlay) return;
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return;
      if (a.target === "_blank") return;
      if (href.indexOf("http") === 0 && href.indexOf(location.origin) !== 0) return;
      a.addEventListener("click", function (e) {
        e.preventDefault();
        overlay.classList.add("is-active");
        setTimeout(function () { window.location.href = href; }, 420);
      });
    });
  }

  /* ---- PRO: cursor personalizado ---- */
  function initCursor() {
    if (window.matchMedia && !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var cursor = document.querySelector("[data-pro-cursor]");
    if (!cursor) return;
    document.addEventListener("mousemove", function (e) {
      cursor.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px) translate(-50%,-50%)";
      cursor.classList.add("is-visible");
    });
    document.querySelectorAll("a, button, .player-flip, .gallery-item").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cursor.classList.add("is-active"); });
      el.addEventListener("mouseleave", function () { cursor.classList.remove("is-active"); });
    });
  }

  /* ---- PRO: botones magnéticos ---- */
  function initMagnetic() {
    document.querySelectorAll("[data-magnetic]").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + x * 0.25 + "px," + y * 0.35 + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = "translate(0,0)"; });
    });
  }

  /* ---- PRO: chatbot básico (respuestas predefinidas) ---- */
  function initChatbot() {
    var bubble = document.querySelector("[data-chat-bubble]");
    var panel = document.querySelector("[data-chat-panel]");
    var body = document.querySelector("[data-chat-body]");
    var closeBtn = document.querySelector("[data-chat-close]");
    if (!bubble || !panel) return;
    var answers = {
      horarios: "Entrenamos de martes a viernes según categoría, de 18:00 a 20:30h en el Campo Municipal El Encinar. El primer equipo entrena martes, jueves y viernes a las 20:30h.",
      inscripcion: "Puedes inscribirte en cualquier momento del año a través de la secretaría del club o escribiéndonos por el formulario de contacto. Las plazas de cantera se asignan por orden de llegada.",
      ubicacion: "Estamos en el Campo Municipal El Encinar, Av. del Deporte 12, Riomar. Tienes el mapa y cómo llegar en la página de Contacto.",
      socio: "Hazte socio desde el botón 'Hazte socio' del menú: acceso a la zona de socios, descuentos en la tienda y sorteos de entradas."
    };
    function addMsg(text, who) {
      var div = document.createElement("div");
      div.className = "chat-msg " + (who || "bot");
      div.textContent = text;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }
    bubble.addEventListener("click", function () { panel.classList.toggle("is-open"); });
    if (closeBtn) closeBtn.addEventListener("click", function () { panel.classList.remove("is-open"); });
    document.querySelectorAll("[data-q]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        addMsg(btn.textContent, "user");
        setTimeout(function () { addMsg(answers[btn.getAttribute("data-q")] || "Buena pregunta, escríbenos por el formulario de contacto y te respondemos enseguida.", "bot"); }, 400);
      });
    });
  }

  /* ---- PRO: formulario de zona de socios (demo visual) ---- */
  function initMemberForm() {
    var form = document.querySelector("[data-member-form]");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.innerHTML = '<p style="color:#fff;font-weight:600;">¡Gracias! Te hemos enviado un enlace de acceso a tu correo.</p>';
    });
  }

  /* ---- PRO: selector de idioma (ES/EN) ---- */
  var I18N = {
    en: {
      "Ver plantilla": "View squad", "Hazte socio": "Become a member", "Inicio": "Home",
      "Club": "Club", "Plantilla": "Squad", "Matchcenter": "Matchcenter", "Cantera": "Academy",
      "Noticias": "News", "Calendario": "Fixtures", "Contacto": "Contact"
    }
  };
  function initLangSwitch() {
    var sw = document.querySelector("[data-lang-switch]");
    if (!sw) return;
    var current = localStorage.getItem("ar-lang") || "es";
    function apply(lang) {
      sw.querySelectorAll("button").forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-lang") === lang); });
      if (lang === "es") return;
      var dict = I18N[lang];
      if (!dict) return;
      document.querySelectorAll(".nav-link, .nav-cta, .hero-actions .btn").forEach(function (el) {
        var t = el.textContent.trim();
        if (dict[t]) el.textContent = dict[t];
      });
    }
    apply(current);
    sw.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        var lang = b.getAttribute("data-lang");
        localStorage.setItem("ar-lang", lang);
        if (lang === "es") { location.reload(); } else { apply(lang); }
      });
    });
  }

  /* ---- PRO: flip cards de jugadores (plantilla) ---- */
  function initPlayerFlip() {
    document.querySelectorAll(".player-flip").forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.target.closest("[data-compare]")) return;
        card.classList.toggle("is-flipped");
      });
      card.setAttribute("tabindex", "0");
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.classList.toggle("is-flipped"); }
      });
    });
  }

  function initPlayerFilters() {
    var toolbar = document.querySelector("[data-player-toolbar]");
    if (!toolbar) return;
    var search = toolbar.querySelector("[data-player-search]");
    var buttons = toolbar.querySelectorAll("[data-player-filter]");
    var cards = document.querySelectorAll("[data-player-card]");
    function apply() {
      var activeBtn = toolbar.querySelector(".player-filter-btn.is-active");
      var pos = activeBtn ? activeBtn.getAttribute("data-player-filter") : "all";
      var q = (search && search.value || "").toLowerCase();
      cards.forEach(function (c) {
        var matchesPos = pos === "all" || c.getAttribute("data-pos") === pos;
        var matchesQ = !q || c.getAttribute("data-name").toLowerCase().indexOf(q) > -1;
        c.style.display = (matchesPos && matchesQ) ? "" : "none";
      });
    }
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        buttons.forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        apply();
      });
    });
    if (search) search.addEventListener("input", apply);
  }

  /* ---- PRO: radar chart SVG sencillo para stats de jugador ---- */
  function drawRadar(svg, stats) {
    if (!svg) return;
    var labels = Object.keys(stats);
    var n = labels.length;
    var cx = 75, cy = 70, r = 52;
    var pts = labels.map(function (k, i) {
      var ang = -Math.PI / 2 + i * (2 * Math.PI / n);
      var val = stats[k] / 100;
      return [cx + Math.cos(ang) * r * val, cy + Math.sin(ang) * r * val];
    });
    var ringPts = labels.map(function (k, i) {
      var ang = -Math.PI / 2 + i * (2 * Math.PI / n);
      return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r];
    });
    var poly = pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
    var ring = ringPts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
    var html = '<polygon points="' + ring + '" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1"/>' +
      '<polygon points="' + poly + '" fill="rgba(201,162,39,.35)" stroke="#C9A227" stroke-width="1.5"/>';
    labels.forEach(function (k, i) {
      var ang = -Math.PI / 2 + i * (2 * Math.PI / n);
      var lx = cx + Math.cos(ang) * (r + 14);
      var ly = cy + Math.sin(ang) * (r + 14);
      html += '<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="middle" font-size="7" fill="rgba(255,255,255,.7)">' + k + '</text>';
    });
    svg.innerHTML = html;
  }
  function initRadars() {
    document.querySelectorAll(".pf-radar[data-stats]").forEach(function (svg) {
      try { drawRadar(svg, JSON.parse(svg.getAttribute("data-stats"))); } catch (e) {}
    });
  }

  /* ---- PRO: matchcenter — cuenta atrás ---- */
  function initCountdown() {
    var el = document.querySelector("[data-countdown]");
    if (!el) return;
    var target = new Date(el.getAttribute("data-countdown")).getTime();
    var dEl = el.querySelector("[data-cd-d]"), hEl = el.querySelector("[data-cd-h]"),
        mEl = el.querySelector("[data-cd-m]"), sEl = el.querySelector("[data-cd-s]");
    function tick() {
      var diff = Math.max(0, target - Date.now());
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      if (dEl) dEl.textContent = d;
      if (hEl) hEl.textContent = String(h).padStart(2, "0");
      if (mEl) mEl.textContent = String(m).padStart(2, "0");
      if (sEl) sEl.textContent = String(s).padStart(2, "0");
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---- PRO: calendario/resultados vía Google Sheets (CSV publicado) ---- */
  function csvParse(text) {
    return text.trim().split(/\r?\n/).map(function (line) {
      var cells = []; var cur = ""; var inQ = false;
      for (var i = 0; i < line.length; i++) {
        var c = line[i];
        if (c === '"') { inQ = !inQ; continue; }
        if (c === "," && !inQ) { cells.push(cur); cur = ""; continue; }
        cur += c;
      }
      cells.push(cur);
      return cells;
    });
  }
  function initSheetResults() {
    var el = document.querySelector("[data-sheet-results]");
    if (!el) return;
    var url = el.getAttribute("data-sheet-results");
    fetch(url).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
      .then(function (text) {
        var rows = csvParse(text);
        var header = rows.shift();
        var html = rows.filter(function (r) { return r.length > 1 && r[0]; }).map(function (r) {
          var tag = /^v/i.test(r[3]) ? "win" : /^e/i.test(r[3]) ? "draw" : "loss";
          var label = tag === "win" ? "V" : tag === "draw" ? "E" : "D";
          return '<div class="card result-row"><span class="result-tag ' + tag + '">' + label + '</span>' +
            '<div class="result-mid"><div class="result-teams">' + r[1] + '</div><div class="result-date">' + r[0] + ' · ' + r[2] + '</div></div>' +
            '<span class="result-score">' + r[4] + '</span></div>';
        }).join("");
        el.innerHTML = html || "<p>Sin resultados todavía.</p>";
      })
      .catch(function () {
        el.innerHTML = '<p style="color:var(--mute);font-size:.85rem;">No se han podido cargar los resultados en vivo (revisa que la hoja de Google Sheets esté publicada como CSV). Mostrando resultados de ejemplo.</p>';
      });
  }

  var booted = false;
  function boot() {
    if (booted) return;
    booted = true;

    safe(initNav, "initNav");
    safe(initSmoothAnchors, "initSmoothAnchors");
    safe(initReveals, "initReveals");
    safe(initCountUp, "initCountUp");
    safe(initTilt, "initTilt");
    safe(initSquadFilters, "initSquadFilters");
    safe(initContactForm, "initContactForm");
    safe(initFooterYear, "initFooterYear");
    safe(initThemeToggle, "initThemeToggle");
    safe(initCategoriaTabs, "initCategoriaTabs");
    safe(initGallery, "initGallery");
    safe(initLoader, "initLoader");
    safe(initPageTransition, "initPageTransition");
    safe(initCursor, "initCursor");
    safe(initMagnetic, "initMagnetic");
    safe(initChatbot, "initChatbot");
    safe(initMemberForm, "initMemberForm");
    safe(initLangSwitch, "initLangSwitch");
    safe(initPlayerFlip, "initPlayerFlip");
    safe(initPlayerFilters, "initPlayerFilters");
    safe(initRadars, "initRadars");
    safe(initCountdown, "initCountdown");
    safe(initSheetResults, "initSheetResults");

    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
      safe(initHeroParallax, "initHeroParallax");
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  // Red de seguridad: si por lo que sea boot() no se disparó a tiempo
  // (p. ej. peculiaridades de readyState al abrir con doble clic sobre
  // index.html), lo reintentamos en window.load y con un timeout corto.
  window.addEventListener("load", boot);
  setTimeout(boot, 1500);
})();
