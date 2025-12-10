// Publish Ski Sats scoreboard notes with metadata to well-known relays.
(function () {
  const DEFAULT_RELAYS = [
    "wss://relay.damus.io",
    "wss://nos.lol",
    "wss://relay.snort.social",
  ];
  const TAGGED_NPUB = null; // Optional: add a community npub to mention
  const PROMO_LINE = "Race the slopes in Ski Sats: endless skiing, sats collecting, and yeti dodging.";
  const SERIES = "skisats";
  const GAME = "SkiSats";
  const LAUNCH_DATE = "120124"; // Matches Advent series cadence
  let cachedTagPubkey = null;

  const formatSeconds = (secondsFloat) => {
    if (typeof secondsFloat !== "number" || Number.isNaN(secondsFloat)) return null;
    const seconds = Math.max(0, Math.round(secondsFloat));
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  function buildContent({ distance, sats, timeSeconds, baseUrl }) {
    const safeDistance = Math.max(0, Math.round(distance || 0));
    const lines = [`Just skied ${safeDistance}m in Ski Sats!`];
    if (typeof sats === "number") {
      lines.push(`Sats collected: ${Math.max(0, Math.round(sats))}`);
    }
    const timeText = formatSeconds(timeSeconds);
    if (timeText) {
      lines.push(`Survived for ${timeText}`);
    }
    lines.push("", `Play at ${baseUrl}`);
    lines.push("", PROMO_LINE);
    if (TAGGED_NPUB) {
      lines.push(`nostr:${TAGGED_NPUB}`);
    }
    return lines.join("\n");
  }

  async function publishScore({
    score,
    baseUrl,
    relays = DEFAULT_RELAYS,
    stats = {},
  }) {
    if (!window.NostrSigners) throw new Error("Signer module unavailable");
    const signer = await window.NostrSigners.getActiveSigner();
    const { SimplePool, nip19 } = await import(
      "https://esm.sh/nostr-tools@2?bundle"
    );
    const pool = new SimplePool();

    const safeBase =
      baseUrl ||
      (typeof window !== "undefined" ? window.location.origin : "https://skisats.com");

    if (TAGGED_NPUB && !cachedTagPubkey) {
      try {
        const decoded = nip19.decode(TAGGED_NPUB);
        cachedTagPubkey =
          typeof decoded?.data === "string"
            ? decoded.data
            : decoded?.data?.pubkey || null;
      } catch (err) {
        console.warn("Failed to decode tagged npub", err);
      }
    }

    const distance = score || stats.distance;
    const sats =
      typeof stats.sats === "number"
        ? stats.sats
        : typeof stats.bitcoinsCollected === "number"
        ? stats.bitcoinsCollected
        : null;
    const timeSeconds = stats.timeSeconds ?? stats.time ?? null;

    const content = buildContent({ distance, sats, timeSeconds, baseUrl: safeBase });

    const tags = [
      ["series", SERIES],
      ["game", GAME],
      ["launchdate", LAUNCH_DATE],
      ["distance", String(Math.max(0, Math.round(distance || 0)))],
    ];

    if (typeof sats === "number") {
      tags.push(["sats", String(Math.max(0, Math.round(sats)))]);
    }
    if (typeof timeSeconds === "number") {
      tags.push(["time_s", String(Math.max(0, Math.round(timeSeconds)))]);
    }

    if (stats?.maxSpeed) {
      tags.push(["max_speed", String(Math.round(stats.maxSpeed))]);
    }

    const player = window.NostrSession?.getPlayer
      ? window.NostrSession.getPlayer()
      : null;
    if (player?.linked_pubkey) {
      tags.push(["p", player.linked_pubkey, player.linked_npub || ""]);
    }
    if (cachedTagPubkey) {
      tags.push(["p", cachedTagPubkey, TAGGED_NPUB]);
    }

    const unsigned = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content,
    };

    const signed = await signer.signEvent(unsigned);

    const publishForRelay = async (relay) => {
      try {
        await pool.publish([relay], signed);
        return { relay, status: "ok" };
      } catch (err) {
        return {
          relay,
          status: "failed",
          reason: err?.message || String(err),
        };
      }
    };

    const relayResults = await Promise.all(relays.map(publishForRelay));

    try {
      pool.close(relays);
    } catch (_) {}

    return {
      event: signed,
      relayResults,
      signerMode: signer.mode,
    };
  }

  window.NostrPost = {
    publishScore,
    DEFAULT_RELAYS,
    formatScoreContent: (details) =>
      buildContent({
        distance: details?.score || details?.distance,
        sats: details?.sats,
        timeSeconds: details?.timeSeconds,
        baseUrl:
          details?.baseUrl ||
          (typeof window !== "undefined" ? window.location.origin : "https://skisats.com"),
      }),
  };
})();
