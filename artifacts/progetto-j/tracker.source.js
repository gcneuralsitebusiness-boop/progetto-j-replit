// Source of public/tracker.js. Regenerate the minified asset after edits:
//   node -e "import('esbuild').then(({build})=>build({entryPoints:['artifacts/progetto-j/tracker.source.js'],minify:true,outfile:'artifacts/progetto-j/public/tracker.js',allowOverwrite:true}))" (run from repo root or api-server, where esbuild is installed)
(function () {
  var s = document.currentScript;
  var base = (s && s.getAttribute("data-base")) || "/";
  if (base.charAt(base.length - 1) !== "/") base += "/";
  var api = base + "api/analytics/event";
  var SKEY = "pj_s";
  var SESSION_MIN = 30;

  function rid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  // Anonymous visitor session: sessionStorage (no cookie), 30-min sliding window
  function session() {
    var now = Date.now();
    try {
      var raw = sessionStorage.getItem(SKEY);
      if (raw) {
        var p = raw.split("|");
        if (now - Number(p[1]) < SESSION_MIN * 60000) {
          sessionStorage.setItem(SKEY, p[0] + "|" + now);
          return p[0];
        }
      }
      var id = rid();
      sessionStorage.setItem(SKEY, id + "|" + now);
      return id;
    } catch (e) {
      return rid();
    }
  }

  function rel() {
    var p = location.pathname;
    var b = base.slice(0, -1);
    if (b && p.indexOf(b) === 0) p = p.slice(b.length);
    return p || "/";
  }

  function skip(p) {
    return p.indexOf("/admin") === 0 || p.indexOf("/card") === 0;
  }

  var vid, path, t0, maxScroll, isClosed;

  function ref() {
    var q = new URLSearchParams(location.search).get("ref");
    if (q) return q;
    var r = document.referrer;
    if (!r) return "";
    try {
      var h = new URL(r).hostname;
      return h === location.hostname ? "" : h;
    } catch (e) {
      return r;
    }
  }

  function send(o) {
    var d = JSON.stringify(o);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(api, new Blob([d], { type: "application/json" }));
    } else {
      fetch(api, { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: d }).catch(function () {});
    }
  }

  function onScroll() {
    var d = document.documentElement;
    var h = d.scrollHeight - d.clientHeight;
    var pct = h <= 0 ? 100 : ((window.scrollY || d.scrollTop) / h) * 100;
    var m = pct >= 99 ? 100 : pct >= 75 ? 75 : pct >= 50 ? 50 : pct >= 25 ? 25 : 0;
    if (m > maxScroll) maxScroll = m;
  }

  function open() {
    path = rel();
    if (skip(path)) { vid = null; return; }
    vid = rid();
    t0 = Date.now();
    maxScroll = 0;
    isClosed = false;
    setTimeout(onScroll, 400);
    send({ type: "pageview", path: path, referrer: ref(), sessionId: session(), viewId: vid });
  }

  function close() {
    if (!vid || isClosed) return;
    isClosed = true;
    onScroll();
    send({
      type: "exit", viewId: vid,
      durationSec: Math.round((Date.now() - t0) / 5000) * 5,
      scrollDepth: maxScroll
    });
  }

  function beat() {
    if (!vid || document.visibilityState !== "visible") return;
    isClosed = false;
    session();
    send({ type: "heartbeat", viewId: vid });
  }

  function nav() {
    setTimeout(function () {
      if (rel() !== path) { close(); open(); }
    }, 0);
  }

  var ps = history.pushState;
  history.pushState = function () { ps.apply(this, arguments); nav(); };
  var rs = history.replaceState;
  history.replaceState = function () { rs.apply(this, arguments); nav(); };
  window.addEventListener("popstate", nav);
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") close();
    else beat();
  });
  window.addEventListener("pagehide", close);
  setInterval(beat, 60000);

  open();
})();
