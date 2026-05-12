// ════════════════════════════════════════════════════════════════
//  Main glue: content from config, scroll reveals, cursor,
//  ambient audio (synthesized so no external files needed),
//  card spotlight, and the finale confetti burst.
// ════════════════════════════════════════════════════════════════

// Always start at the top on (re)load, even after navigation back.
// Anchor links like #letter, #song still work because we only force
// the top when there's no hash in the URL.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (!window.location.hash) {
  window.scrollTo(0, 0);
  window.addEventListener("load", () => window.scrollTo(0, 0), { once: true });
}

(() => {
  const cfg = window.SITE_CONFIG || {};

  // ── 1. Inject config values into [data-config="key"] elements ──
  document.querySelectorAll("[data-config]").forEach((el) => {
    const key = el.getAttribute("data-config");
    if (cfg[key] != null && typeof cfg[key] === "string") el.textContent = cfg[key];
  });

  // ── 2. Build the letter body ──────────────────────────────────
  const letterBody = document.getElementById("letter-body");
  if (letterBody && Array.isArray(cfg.letter)) {
    letterBody.innerHTML = cfg.letter
      .map((line) => `<p>${line ? escapeHTML(line) : "&nbsp;"}</p>`)
      .join("");
  }

  // ── 3. Today's date stamp on letter ───────────────────────────
  const dateEl = document.getElementById("letter-date");
  if (dateEl) {
    const d = new Date();
    dateEl.textContent = d.toLocaleDateString(undefined, {
      year: "numeric", month: "long", day: "numeric"
    });
  }

  // ── 4. Build reasons grid ─────────────────────────────────────
  const grid = document.getElementById("reasons-grid");
  if (grid && Array.isArray(cfg.reasons)) {
    grid.innerHTML = cfg.reasons.map((r, i) => `
      <article class="reason" style="transition-delay:${i * 80}ms">
        <span class="reason__index">No. ${String(i + 1).padStart(2, "0")}</span>
        <span class="reason__icon">${escapeHTML(r.icon || "♥")}</span>
        <h3 class="reason__title">${escapeHTML(r.title)}</h3>
        <p class="reason__text">${escapeHTML(r.text)}</p>
      </article>
    `).join("");
  }

  // ── 5. Build timeline ─────────────────────────────────────────
  const timeline = document.getElementById("timeline");
  if (timeline && Array.isArray(cfg.milestones)) {
    timeline.innerHTML = cfg.milestones.map((m, i) => `
      <li class="milestone" style="transition-delay:${i * 90}ms">
        <span class="milestone__dot"></span>
        <p class="milestone__when">${escapeHTML(m.when)}</p>
        <h3 class="milestone__title">${escapeHTML(m.title)}</h3>
        <p class="milestone__text">${escapeHTML(m.text)}</p>
      </li>
    `).join("");
  }

  // ── 6. Preloader fade ─────────────────────────────────────────
  //  Drops as soon as the DOM is ready (NOT window.load), with a hard
  //  backstop so a slow CDN can never trap us on "Loading…".
  let preloaderHidden = false;
  function hidePreloader() {
    if (preloaderHidden) return;
    preloaderHidden = true;
    const pre = document.getElementById("preloader");
    if (pre) pre.classList.add("is-done");
    document.querySelectorAll("[data-delay]").forEach((el) => {
      const d = parseInt(el.getAttribute("data-delay") || "0", 10);
      setTimeout(() => el.classList.add("is-in"), d);
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(hidePreloader, 400));
  } else {
    setTimeout(hidePreloader, 400);
  }
  // Hard backstop — preloader is GONE in at most 2 seconds no matter what.
  setTimeout(hidePreloader, 2000);

  // ── 7. Reveal on scroll ───────────────────────────────────────
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        if (e.target.classList.contains("letter__body")) {
          // also kick the signature draw-in
          const sign = e.target.parentElement.querySelector(".letter__sign");
          if (sign) sign.classList.add("is-in");
        }
      }
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -60px 0px" });

  document.querySelectorAll(
    ".reveal, .reason, .milestone, .letter__body, .section-head, .dna__content > *"
  ).forEach((el) => io.observe(el));

  // ── 8. Custom cursor ──────────────────────────────────────────
  const cursor    = document.getElementById("cursor");
  const cursorDot = document.getElementById("cursor-dot");
  if (cursor && cursorDot && window.matchMedia("(min-width: 721px)").matches) {
    let cx = 0, cy = 0, tx = 0, ty = 0;
    window.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY;
      cursorDot.style.transform = `translate(${tx}px, ${ty}px) translate(-50%,-50%)`;
    });
    function follow() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(follow);
    }
    follow();
    const hoverables = "a, button, .reason, .milestone, .nav__song, .finale__button";
    document.querySelectorAll(hoverables).forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });
  }

  // ── 9. Reason card spotlight (mouse-tracking glow) ────────────
  document.addEventListener("mousemove", (e) => {
    document.querySelectorAll(".reason").forEach((card) => {
      const r = card.getBoundingClientRect();
      if (
        e.clientX >= r.left && e.clientX <= r.right &&
        e.clientY >= r.top  && e.clientY <= r.bottom
      ) {
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      }
    });
  });

  // ── 10. Smooth-scroll for nav links ───────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // ── 11. Our Song — local HTML5 audio + custom player ──────────
  const song = cfg.song || {};
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el && val) el.textContent = val;
  };
  setText("song-title", song.title);
  setText("song-artist", song.artist);
  setText("song-lyric", song.lyric ? `\u201C${song.lyric}\u201D` : "");
  setText("song-note", song.note);

  const audio    = document.getElementById("song-audio");
  const playBtn  = document.getElementById("song-play-btn");
  const labelEl  = playBtn ? playBtn.querySelector(".song__play-label") : null;
  const bar      = document.getElementById("song-progress");
  const barFill  = document.getElementById("song-progress-fill");
  const barThumb = document.getElementById("song-progress-thumb");
  const tCurrent = document.getElementById("song-time-current");
  const tTotal   = document.getElementById("song-time-total");

  if (audio && song.file) {
    audio.src  = song.file;
    audio.loop = !!song.loop;

    const setLabel = (txt) => { if (labelEl) labelEl.textContent = txt; };
    const setPlayingUI = (on) => {
      if (playBtn) playBtn.classList.toggle("is-playing", on);
      if (bar)     bar.classList.toggle("is-playing", on);
      setLabel(on ? "pause our song" : "play our song");
    };

    function fmt(s) {
      if (!isFinite(s) || s < 0) return "--:--";
      const m = Math.floor(s / 60);
      const r = Math.floor(s % 60).toString().padStart(2, "0");
      return `${m}:${r}`;
    }

    function updateProgress() {
      if (!audio.duration || !isFinite(audio.duration)) return;
      const pct = (audio.currentTime / audio.duration) * 100;
      if (barFill)  barFill.style.width = pct + "%";
      if (barThumb) barThumb.style.left  = pct + "%";
      if (tCurrent) tCurrent.textContent = fmt(audio.currentTime);
    }

    audio.addEventListener("loadedmetadata", () => {
      if (tTotal) tTotal.textContent = fmt(audio.duration);
    });
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("play",  () => setPlayingUI(true));
    audio.addEventListener("pause", () => setPlayingUI(false));
    audio.addEventListener("ended", () => setPlayingUI(false));
    audio.addEventListener("error", (e) => {
      console.warn("[song] audio failed to load:", audio.src, e);
      setLabel("audio file missing");
      if (playBtn) playBtn.disabled = true;
    });

    if (playBtn) {
      playBtn.addEventListener("click", () => {
        if (audio.paused) {
          const p = audio.play();
          if (p && p.catch) p.catch((err) => {
            console.warn("[song] play blocked:", err);
            setLabel("tap again to play");
          });
        } else {
          audio.pause();
        }
      });
    }

    if (bar) {
      function seekFromEvent(evt) {
        const rect = bar.getBoundingClientRect();
        const x = (evt.touches ? evt.touches[0].clientX : evt.clientX) - rect.left;
        const ratio = Math.max(0, Math.min(1, x / rect.width));
        if (audio.duration && isFinite(audio.duration)) {
          audio.currentTime = ratio * audio.duration;
          updateProgress();
        }
      }
      bar.addEventListener("click", seekFromEvent);
      bar.addEventListener("keydown", (e) => {
        if (!audio.duration) return;
        if (e.key === "ArrowRight") audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
        if (e.key === "ArrowLeft")  audio.currentTime = Math.max(0,              audio.currentTime - 5);
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); playBtn && playBtn.click(); }
      });
    }
  } else if (audio) {
    setLabel && setLabel("no song file");
    if (playBtn) playBtn.disabled = true;
  }

  // ── 12. Confetti / heart burst on finale ──────────────────────
  const btn  = document.getElementById("celebrate-btn");
  const cvs  = document.getElementById("confetti-canvas");
  if (btn && cvs) {
    const ctx = cvs.getContext("2d");
    let parts = [];
    function fit() {
      cvs.width = cvs.clientWidth * devicePixelRatio;
      cvs.height = cvs.clientHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    window.addEventListener("resize", fit); fit();

    const colors = ["#e8a4c9", "#c4677d", "#f3d27a", "#fde7ee", "#dc143c"];

    function burst() {
      const rect = cvs.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      for (let i = 0; i < 180; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 4 + Math.random() * 9;
        parts.push({
          x: cx, y: cy,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 2,
          life: 0,
          maxLife: 80 + Math.random() * 60,
          size: 4 + Math.random() * 6,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - .5) * .3,
          color: colors[(Math.random() * colors.length) | 0],
          shape: Math.random() < 0.45 ? "heart" : "rect"
        });
      }
    }

    function drawHeart(x, y, s, rot, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(s / 10, s / 10);
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.bezierCurveTo(0, -6, -6, -6, -6, -2);
      ctx.bezierCurveTo(-6,  2,  0,  4,  0,  8);
      ctx.bezierCurveTo(0,   4,  6,  2,  6, -2);
      ctx.bezierCurveTo(6,  -6,  0, -6,  0, -3);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    }

    function loop() {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      parts = parts.filter((p) => p.life < p.maxLife);
      parts.forEach((p) => {
        p.vy += 0.14;
        p.vx *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life++;
        const alpha = 1 - p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        if (p.shape === "heart") {
          drawHeart(p.x, p.y, p.size * 1.2, p.rot, p.color);
        } else {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.6);
          ctx.restore();
        }
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(loop);
    }
    loop();

    btn.addEventListener("click", () => {
      burst();
      btn.animate(
        [
          { transform: "translateY(-3px) scale(1)" },
          { transform: "translateY(-3px) scale(.94)" },
          { transform: "translateY(-3px) scale(1.04)" },
          { transform: "translateY(-3px) scale(1)" }
        ],
        { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" }
      );
    });
  }

  // ── 13. Helpers ───────────────────────────────────────────────
  function escapeHTML(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
