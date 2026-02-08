(() => {
  "use strict";

  const BADGE_ID = "lc-like-dislike-badge-v5";
  const DEBUG = true;

  const log = (...args) => DEBUG && console.log("[LC dislikes]", ...args);

  function formatCount(n) {
    if (typeof n !== "number" || !Number.isFinite(n)) return "—";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
  }

  function getSlug() {
    const parts = location.pathname.split("/").filter(Boolean); // ["problems", "<slug>", ...]
    if (parts[0] !== "problems") return null;
    return parts[1] || null;
  }

  function readNextData() {
    const el = document.getElementById("__NEXT_DATA__");
    if (!el?.textContent) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      log("Failed to parse __NEXT_DATA__", e);
      return null;
    }
  }

  // Your uploaded JSON structure:
  // props.pageProps.dehydratedState.queries[*]
  //   queryKey[0] === "questionDetail"
  //   queryKey[1].titleSlug
  //   state.data.question.likes/dislikes
  function extractLikesDislikes(nextData) {
    const slug = getSlug();
    const queries = nextData?.props?.pageProps?.dehydratedState?.queries;
    if (!Array.isArray(queries)) return null;

    // Prefer questionDetail query
    const candidates = queries
      .map((q) => {
        const key0 = q?.queryKey?.[0];
        const titleSlug = q?.queryKey?.[1]?.titleSlug ?? null;
        const likes = q?.state?.data?.question?.likes;
        const dislikes = q?.state?.data?.question?.dislikes;
        return { key0, titleSlug, likes, dislikes };
      })
      .filter((x) => typeof x.likes === "number" && typeof x.dislikes === "number");

    if (candidates.length === 0) return null;

    // Best: questionDetail + matching slug
    const exact = candidates.find((c) => c.key0 === "questionDetail" && c.titleSlug === slug);
    if (exact) return exact;

    // Next: any questionDetail
    const qd = candidates.find((c) => c.key0 === "questionDetail");
    if (qd) return qd;

    // Fallback: first numeric pair
    return candidates[0];
  }

  // Dynamic layout: pick the best anchor that links to the current problem slug
  function findTitleAnchor() {
    const slug = getSlug();
    if (!slug) return null;

    const anchors = [...document.querySelectorAll(`a[href^="/problems/${slug}"]`)].filter(
      (a) => (a.textContent || "").trim().length > 0
    );

    if (anchors.length === 0) return null;

    let best = null;
    let bestScore = -Infinity;

    for (const a of anchors) {
      const rect = a.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      const fontSize = parseFloat(getComputedStyle(a).fontSize) || 0;
      const top = Math.max(0, rect.top);
      const score = fontSize * 10 - Math.min(top, 2000) / 10;

      if (score > bestScore) {
        bestScore = score;
        best = a;
      }
    }

    return best;
  }

  function ensureBadge(afterEl) {
    if (!afterEl) return null;

    let badge = document.getElementById(BADGE_ID);
    if (badge) return badge;

    badge = document.createElement("span");
    badge.id = BADGE_ID;

    badge.style.marginLeft = "10px";
    badge.style.padding = "2px 8px";
    badge.style.borderRadius = "999px";
    badge.style.fontSize = "12px";
    badge.style.lineHeight = "18px";
    badge.style.border = "1px solid rgba(128,128,128,0.35)";
    badge.style.display = "inline-flex";
    badge.style.alignItems = "center";
    badge.style.background = "rgba(128,128,128,0.12)";
    badge.style.color = "inherit";
    badge.style.userSelect = "none";
    badge.style.whiteSpace = "nowrap";

    // Insert right after the title anchor
    afterEl.parentElement?.insertBefore(badge, afterEl.nextSibling);
    return badge;
  }

  function setBadgeText(badge, likes, dislikes, note) {
    if (!badge) return;

    // Single text node (no child spans) = fewer ways for rerenders/extensions to mess with it
    const likeText = formatCount(likes);
    const dislikeText = formatCount(dislikes);

    let ratio = "";
    if (typeof likes === "number" && typeof dislikes === "number" && likes + dislikes > 0) {
      ratio = ` · ${Math.round((likes / (likes + dislikes)) * 100)}% 👍`;
    }

    badge.textContent = `👍 ${likeText}  👎 ${dislikeText}${ratio}`;
    badge.title = note || "";
  }

  function run() {
    if (!location.pathname.startsWith("/problems/")) return;

    const titleEl = findTitleAnchor() || document.querySelector("h1, h2");
    if (!titleEl) return;

    const badge = ensureBadge(titleEl);
    if (!badge) return;

    const nextData = readNextData();
    if (!nextData) {
      setBadgeText(badge, null, null, "Could not parse __NEXT_DATA__");
      return;
    }

    const extracted = extractLikesDislikes(nextData);
    if (!extracted) {
      setBadgeText(badge, null, null, "No likes/dislikes found in dehydratedState.queries");
      log("No likes/dislikes found; slug=", getSlug());
      return;
    }

    setBadgeText(
      badge,
      extracted.likes,
      extracted.dislikes,
      `Source: __NEXT_DATA__.props.pageProps.dehydratedState (titleSlug=${extracted.titleSlug || "?"})`
    );

    log("Rendered", extracted);
  }

  // SPA / dynamic rerender support (debounced)
  let lastUrl = location.href;

  function scheduleRun() {
    clearTimeout(scheduleRun._t);
    scheduleRun._t = setTimeout(run, 200);
  }

  const mo = new MutationObserver(() => {
    if (location.href !== lastUrl) lastUrl = location.href;
    scheduleRun();
  });

  mo.observe(document.documentElement, { childList: true, subtree: true });

  scheduleRun();
})();
