const state = {
  shareStats: null,
  initialized: false,
};

function $(id) {
  return document.getElementById(id);
}

function setStatus(message, isError = false) {
  const el = $("nostr-status");
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("nostr-panel__status--error", Boolean(isError));
}

function updatePlayerDisplay() {
  const playerEl = $("nostr-player");
  if (!playerEl) return;
  const npub = window.NostrSigners?.getDisplayNpub
    ? window.NostrSigners.getDisplayNpub()
    : null;
  if (npub) {
    playerEl.textContent = npub;
  } else {
    playerEl.textContent = "No player available";
  }
}

function hideSharePanel() {
  const shareEl = $("nostr-share");
  const shareBtn = $("nostr-share-btn");
  const shareStatus = $("nostr-share-status");
  if (shareEl) {
    shareEl.hidden = true;
  }
  if (shareBtn) {
    shareBtn.disabled = true;
  }
  if (shareStatus) {
    shareStatus.textContent = "";
    shareStatus.style.color = "";
  }
  const statsEl = $("nostr-share-stats");
  if (statsEl) {
    statsEl.textContent = "Finish a run to share your stats.";
  }
  state.shareStats = null;
}

function showSharePanel(stats) {
  const shareEl = $("nostr-share");
  const shareBtn = $("nostr-share-btn");
  const statsEl = $("nostr-share-stats");
  if (!shareEl || !shareBtn || !statsEl) return;

  const summary = [
    `Distance: ${Math.floor(stats.distance || 0)} m`,
    `Time: ${formatTime(stats.time || 0)}`,
    `Sats: ${stats.sats ?? 0}`,
  ];
  statsEl.textContent = summary.join(" \u2022 ");
  shareEl.hidden = false;
  shareBtn.disabled = false;
  state.shareStats = stats;
}

function formatTime(totalSeconds) {
  const secs = Math.max(0, Math.round(totalSeconds || 0));
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  if (mins > 0) {
    return `${mins}m ${rem}s`;
  }
  return `${rem}s`;
}

async function handleLinkClick(btn) {
  if (!window.NostrSession?.loginWithNip07) {
    setStatus("NIP-07 extension not detected", true);
    return;
  }
  btn.disabled = true;
  setStatus("Requesting NIP-07 permission...");
  try {
    await window.NostrSession.loginWithNip07();
    setStatus("Linked to NIP-07 signer");
  } catch (err) {
    setStatus(err?.message || "Unable to link", true);
  } finally {
    btn.disabled = false;
  }
}

async function handleSessionClick(btn) {
  if (!window.NostrSession?.unlinkNip07) {
    setStatus("Session storage unavailable", true);
    return;
  }
  btn.disabled = true;
  setStatus("Switching to local session...");
  try {
    await window.NostrSession.unlinkNip07();
    setStatus("Using in-browser session key");
  } catch (err) {
    setStatus(err?.message || "Unable to switch", true);
  } finally {
    btn.disabled = false;
  }
}

async function handleShareClick(btn) {
  if (!state.shareStats) return;
  if (!window.NostrPost?.publishScore) {
    setStatus("Nostr sharing unavailable", true);
    return;
  }
  const shareStatus = $("nostr-share-status");
  btn.disabled = true;
  if (shareStatus) {
    shareStatus.textContent = "Publishing to relays...";
    shareStatus.style.color = "";
  }
  try {
    const payload = {
      score: Math.floor(state.shareStats.distance || 0),
      stats: {
        distance: state.shareStats.distance,
        sats: state.shareStats.sats,
        timeSeconds: state.shareStats.time,
      },
      baseUrl: window.location.origin,
    };
    const result = await window.NostrPost.publishScore(payload);
    const okCount = result.relayResults?.filter((r) => r.status === "ok").length || 0;
    const total = result.relayResults?.length || 0;
    if (shareStatus) {
      shareStatus.textContent = `Shared via ${result.signerMode} to ${okCount}/${total} relays.`;
      shareStatus.style.color = "";
    }
  } catch (err) {
    if (shareStatus) {
      shareStatus.textContent = err?.message || "Failed to share";
      shareStatus.style.color = "#ff8a8a";
    }
  } finally {
    btn.disabled = false;
  }
}

function registerEventListeners({ linkBtn, sessionBtn, shareBtn }) {
  if (linkBtn) {
    linkBtn.addEventListener("click", () => handleLinkClick(linkBtn));
  }
  if (sessionBtn) {
    sessionBtn.addEventListener("click", () => handleSessionClick(sessionBtn));
  }
  if (shareBtn) {
    shareBtn.addEventListener("click", () => handleShareClick(shareBtn));
  }

  window.addEventListener("player-ready", () => {
    updatePlayerDisplay();
  });

  window.addEventListener("skisats-run-started", () => {
    hideSharePanel();
  });

  window.addEventListener("skisats-run-ended", (evt) => {
    if (!evt?.detail) return;
    showSharePanel(evt.detail);
  });
}

function setup() {
  if (state.initialized) return;
  const linkBtn = $("nostr-link-btn");
  const sessionBtn = $("nostr-session-btn");
  const shareBtn = $("nostr-share-btn");

  if (!linkBtn || !sessionBtn || !shareBtn) {
    return;
  }

  registerEventListeners({ linkBtn, sessionBtn, shareBtn });
  hideSharePanel();
  updatePlayerDisplay();
  state.initialized = true;

  if (window.NostrSession?.getPlayer) {
    const player = window.NostrSession.getPlayer();
    if (!player) {
      setStatus("Preparing local signer...");
    }
  } else {
    setStatus("Nostr helpers failed to load", true);
  }
}

export function initNostrUI() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, { once: true });
  } else {
    setup();
  }
}
