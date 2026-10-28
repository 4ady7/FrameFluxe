const form = document.querySelector("#film-form");
const generateBtn = document.querySelector("#generate");
const improveBtn = document.querySelector("#improve");
const regenerateBtn = document.querySelector("#regenerate");
const reimagineBtn = document.querySelector("#reimagine");
const downloadBtn = document.querySelector("#download");
const printScale4 = document.querySelector("#print-scale-4");
const printScale8 = document.querySelector("#print-scale-8");
const gptImageBtn = document.querySelector("#gpt-image");
const gptImageState = document.querySelector("#gpt-image-state");
const statusEl = document.querySelector("#status");
const errorEl = document.querySelector("#error");
const meta = document.querySelector("#meta");
const variationsEl = document.querySelector("#variations");
const posterFrame = document.querySelector("#poster-frame");
const exposeRail = document.querySelector("#expose-rail");
const exposeRailFill = document.querySelector("#expose-rail-fill");
const variationSpinners = document.querySelectorAll(".variation-spinner");
const variationWaits = document.querySelectorAll(".variation-wait");
const keyArtOverlay = document.querySelector("#key-art-overlay");
const keyArtLabel = document.querySelector("#key-art-label");
const developTeaser = document.querySelector("#develop-teaser");
const waitRail = document.querySelector("#wait-rail");
const waitCompanionBlock = document.querySelector(".wait-companion-block");
const waitCompanion = document.querySelector("#wait-companion");
const teaserMetaphor = document.querySelector("#teaser-metaphor");
const teaserMaterial = document.querySelector("#teaser-material");
const teaserQuote = document.querySelector("#teaser-quote");
const archiveEl = document.querySelector("#archive");
const archiveList = document.querySelector("#archive-list");
const archiveClear = document.querySelector("#archive-clear");

const ROLES = ["signature", "hybrid", "alternative"];
const SEED_SHIFTS = { signature: 0, hybrid: 101, alternative: 211 };

const mainPoster = window.FrameFluxPoster.createPoster("poster", { pixelDensity: 2 });
const thumbs = {
  signature: window.FrameFluxPoster.createPoster("v-signature", { pixelDensity: 1 }),
  hybrid: window.FrameFluxPoster.createPoster("v-hybrid", { pixelDensity: 1 }),
  alternative: window.FrameFluxPoster.createPoster("v-alternative", { pixelDensity: 1 }),
};

let visualDna = null;
let keyArt = null;
let keyArtSrc = null;
let incomingKeyArt = null;
let composeJob = 0;
let baseSeed = Date.now() % 100000;
let selectedRole = "signature";
let currentArchiveId = "";
let printScale = 4;
let printExporting = false;
const GPT_IMAGE_KEY = "frameflux-gpt-image";
const PRINT_SCALE_KEY = "frameflux-print-scale";
const waitClock = {
  running: false,
  startedAt: 0,
  plateAt: 0,
  expected: null,
  tickId: 0,
  gptImage: "no",
  mode: "generate",
  hintDna: null,
  averages: { enabled: 45, disabled: 10 },
};
const plateDevelop = {
  raf: 0,
  startedAt: 0,
  speed: 1,
  last: null,
};
const companion = {
  lineIndex: -1,
  speaking: false,
  speakGen: 0,
  announced: false,
  holdStage: false,
  greetTimer: 0,
  leaveTimer: 0,
};

function companionScript() {
  return window.FrameFluxCompanion || { prompt: "", lines: [], speech: {}, dnaLines: () => [] };
}

function useGptImage() {
  return gptImageBtn.getAttribute("aria-checked") === "true";
}

function syncGptImageButton() {
  const on = useGptImage();
  gptImageBtn.setAttribute("aria-checked", on ? "true" : "false");
  if (gptImageState) {
    gptImageState.textContent = on ? "On" : "Off";
  }
}

try {
  const stored = localStorage.getItem(GPT_IMAGE_KEY);
  if (stored === "off") {
    gptImageBtn.setAttribute("aria-checked", "false");
  }
} catch (err) {
  /* ignore quota / private mode */
}
syncGptImageButton();

function setStatus(message) {
  statusEl.textContent = message;
  errorEl.hidden = true;
  errorEl.textContent = "";
}

function setError(message) {
  errorEl.hidden = !message;
  errorEl.textContent = message || "";
  if (message) {
    statusEl.textContent = "";
  }
}

function slugify(value) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "poster"
  );
}

function filmPayload() {
  return {
    title: document.querySelector("#title").value.trim(),
    genre: document.querySelector("#genre").value.trim(),
    pitch: document.querySelector("#pitch").value.trim(),
  };
}

function conversationNotes() {
  const notes = window.FrameFluxPulp?.userNotes?.() || [];
  return notes
    .map((line) => String(line || "").trim())
    .filter((line) => line && line !== "Voice note")
    .slice(-8)
    .join("\n")
    .slice(0, 1200);
}

function hideMeta() {
  meta.hidden = true;
}

function showMeta(dna) {
  meta.hidden = false;
  const proc = dna.procedural || {};
  const semantic = dna.semantic || {};
  document.querySelector("#meta-metaphor").textContent =
    semantic.visualMetaphor || dna.visualMetaphor || "—";
  document.querySelector("#meta-material").textContent =
    `${semantic.material || dna.material || "—"} · ${semantic.texture || dna.texture || ""}`.replace(/\s·\s$/, "");
  document.querySelector("#meta-pattern").textContent =
    `${proc.primaryPattern || dna.pattern} / ${proc.secondaryPattern || "–"}`;
  document.querySelector("#meta-layout").textContent =
    `${(dna.composition && dna.composition.mode) || (dna.composition && dna.composition.layout) || dna.layout}` +
    (semantic.grammarFamily ? ` · ${semantic.grammarFamily}` : "") +
    (semantic.artFamily ? ` · ${semantic.artFamily}` : "");
  const sourceLabel = dna.source === "ai" ? "AI DNA" : "local DNA";
  const art = keyArt ? " · cinematic still" : " · local plate";
  document.querySelector("#meta-source").textContent = sourceLabel + art;
}

function printScaleSpec(scale) {
  const table = window.FrameFluxPoster?.PRINT_SCALES || {
    4: { scale: 4, width: 2400, height: 3600, inches: "8×12 in", dpi: 300 },
    8: { scale: 8, width: 4800, height: 7200, inches: "16×24 in", dpi: 300 },
  };
  return table[scale] || table[4];
}

function syncPrintScale() {
  const four = printScale === 4;
  if (printScale4) {
    printScale4.setAttribute("aria-pressed", four ? "true" : "false");
  }
  if (printScale8) {
    printScale8.setAttribute("aria-pressed", four ? "false" : "true");
  }
}

function setPrintScale(scale) {
  printScale = scale === 8 ? 8 : 4;
  syncPrintScale();
  try {
    localStorage.setItem(PRINT_SCALE_KEY, String(printScale));
  } catch (err) {
    /* ignore quota / private mode */
  }
}

try {
  const storedPrint = localStorage.getItem(PRINT_SCALE_KEY);
  if (storedPrint === "8" || storedPrint === "4") {
    printScale = Number(storedPrint);
  }
} catch (err) {
  /* ignore quota / private mode */
}
syncPrintScale();

function enablePosterActions(enabled) {
  improveBtn.disabled = !enabled;
  regenerateBtn.disabled = !enabled;
  reimagineBtn.disabled = !enabled;
  downloadBtn.disabled = !enabled || printExporting;
}

function expectedWaitSeconds(gptOn) {
  const avg = gptOn ? waitClock.averages.enabled : waitClock.averages.disabled;
  if (typeof avg === "number" && avg > 0) {
    return avg;
  }
  return gptOn ? 45 : 10;
}

function waitElapsedSeconds() {
  if (!waitClock.startedAt) {
    return 0;
  }
  return Math.max(0, (performance.now() - waitClock.startedAt) / 1000);
}

function secondsLeftWaiting(elapsed, expected) {
  if (typeof expected !== "number" || expected <= 0) {
    return null;
  }
  return Math.max(0, expected - elapsed);
}

function formatWaitLabel(elapsed, left) {
  const waited = `${elapsed.toFixed(0)}s waited`;
  if (left === null) {
    return waited;
  }
  if (left <= 0) {
    return `${waited}\nfinishing`;
  }
  return `${waited}\n${Math.ceil(left)}s left`;
}

function setVariationSpinners(isBusy) {
  variationSpinners.forEach((spinner) => {
    spinner.hidden = !isBusy;
  });
  variationsEl.setAttribute("aria-busy", isBusy ? "true" : "false");
}

function humanizeDna(value) {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clipLine(value, max = 72) {
  const text = String(value || "").trim();
  if (!text || text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

function dnaCopy(dna) {
  const semantic = dna?.semantic || {};
  const concept = dna?.concept || {};
  return {
    metaphor: humanizeDna(semantic.visualMetaphor || dna?.visualMetaphor || ""),
    material: humanizeDna(semantic.material || dna?.material || ""),
    quote: String(concept.quote || dna?.quote || "").trim(),
  };
}

function pipelineStage() {
  if (!posterFrame.classList.contains("is-developing")) {
    return "interpreting";
  }
  const sincePlate = waitClock.plateAt
    ? (performance.now() - waitClock.plateAt) / 1000
    : 0;
  const marks = window.FrameFluxPoster?.LIVING_PLATE || { geometry: 7, atmosphere: 16 };
  if (sincePlate < marks.geometry) {
    return "setting";
  }
  if (sincePlate < marks.atmosphere) {
    return "exposing";
  }
  return "grading";
}

function stageLabel(stage, dna) {
  const { metaphor, material, quote } = dnaCopy(dna);
  const quoted = clipLine(quote, 64);
  if (stage === "interpreting") {
    return metaphor ? `Interpreting the film · ${metaphor}` : "Interpreting the film…";
  }
  if (stage === "setting") {
    return material ? `Setting type · ${material} on the plate` : "Setting type";
  }
  if (stage === "exposing") {
    return quoted ? `Exposing the still · ${quoted}` : "Exposing the still";
  }
  if (stage === "grading") {
    return metaphor ? `Grading · ${metaphor} into the light` : "Grading";
  }
  return "Interpreting the film";
}

function updatePipelineCopy() {
  const developing = posterFrame.classList.contains("is-developing");
  const dna = developing ? visualDna : waitClock.hintDna;
  const label = stageLabel(pipelineStage(), dna);
  keyArtLabel.textContent = label;
  const elapsed = waitElapsedSeconds();
  const left = secondsLeftWaiting(elapsed, waitClock.expected);
  const waitText = formatWaitLabel(elapsed, left);
  variationWaits.forEach((el) => {
    el.textContent = waitText;
  });
  if (exposeRailFill && waitClock.expected) {
    const pct = Math.max(0.06, Math.min(0.94, elapsed / waitClock.expected));
    exposeRailFill.style.width = `${pct * 100}%`;
  }
  if (exposeRail && posterFrame.classList.contains("is-developing")) {
    const plateElapsed = waitClock.plateAt
      ? (performance.now() - waitClock.plateAt) / 1000
      : 0;
    const hideRailAt = window.FrameFluxPoster?.LIVING_PLATE?.shadeOut ?? 35;
    exposeRail.hidden = plateElapsed >= hideRailAt;
  }
}

function showDevelopTeaser(dna) {
  const { metaphor, material, quote } = dnaCopy(dna);
  teaserMetaphor.textContent = metaphor || "—";
  teaserMaterial.textContent = material || "—";
  if (quote) {
    teaserQuote.hidden = false;
    teaserQuote.textContent = `“${quote}”`;
  } else {
    teaserQuote.hidden = true;
    teaserQuote.textContent = "";
  }
  developTeaser.hidden = false;
}

function hideDevelopTeaser() {
  developTeaser.hidden = true;
}

function pickCompanionVoice() {
  if (!window.speechSynthesis) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    return null;
  }
  const prefer = companionScript().speech?.prefer || [];
  const named = prefer
    .map((name) => voices.find((voice) => voice.name.toLowerCase() === String(name).toLowerCase()))
    .find(Boolean);
  if (named) {
    return named;
  }
  const uk = voices.filter((voice) => /en(-|_)GB/i.test(voice.lang) || /uk english/i.test(voice.name));
  return (
    uk.find((voice) => /female|woman|girl/i.test(voice.name)) ||
    uk[0] ||
    voices.find((voice) => /^en/i.test(voice.lang)) ||
    null
  );
}

function stopCompanionSpeech() {
  companion.speakGen += 1;
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  companion.speaking = false;
  if (waitCompanion) {
    waitCompanion.classList.remove("is-speaking");
  }
}

function speakCompanionLine(text, { onDone } = {}) {
  if (!window.speechSynthesis) {
    return;
  }
  stopCompanionSpeech();
  const gen = ++companion.speakGen;
  const utter = new SpeechSynthesisUtterance(text);
  const speech = companionScript().speech || {};
  utter.rate = Number(speech.rate) || 0.9;
  utter.pitch = Number(speech.pitch) || 1;
  utter.lang = speech.lang || "en-GB";
  const voice = pickCompanionVoice();
  if (voice) {
    utter.voice = voice;
    utter.lang = voice.lang || speech.lang || "en-GB";
  }
  const finish = () => {
    if (gen !== companion.speakGen) {
      return;
    }
    companion.speaking = false;
    waitCompanion?.classList.remove("is-speaking");
    if (onDone) {
      onDone();
    }
  };
  utter.onstart = () => {
    if (gen !== companion.speakGen) {
      return;
    }
    companion.speaking = true;
    waitCompanion?.classList.add("is-speaking");
  };
  utter.onend = finish;
  utter.onerror = finish;
  companion.speaking = true;
  waitCompanion?.classList.add("is-speaking");
  window.setTimeout(() => {
    if (gen !== companion.speakGen || !window.speechSynthesis) {
      return;
    }
    window.speechSynthesis.speak(utter);
  }, 40);
}

function nextCompanionLine() {
  const script = companionScript();
  const pool = script.lines || [];
  if (!pool.length) {
    return script.prompt || "";
  }
  companion.lineIndex = (companion.lineIndex + 1) % pool.length;
  return pool[companion.lineIndex];
}

function releaseStageLabel() {
  if (companion.greetTimer) {
    window.clearTimeout(companion.greetTimer);
    companion.greetTimer = 0;
  }
  companion.holdStage = false;
  if (posterFrame.classList.contains("is-busy")) {
    keyArtOverlay.hidden = false;
    updatePipelineCopy();
  }
}

function showWaitCompanion() {
  if (!waitRail) {
    return;
  }
  if (companion.leaveTimer) {
    window.clearTimeout(companion.leaveTimer);
    companion.leaveTimer = 0;
  }
  waitCompanionBlock?.classList.remove("is-leaving");
  waitRail.hidden = false;
}

function hideWaitCompanion({ immediate } = {}) {
  if (companion.greetTimer) {
    window.clearTimeout(companion.greetTimer);
    companion.greetTimer = 0;
  }
  companion.holdStage = false;
  stopCompanionSpeech();
  companion.announced = false;
  const hideNow = () => {
    waitCompanionBlock?.classList.remove("is-leaving");
    if (waitRail) {
      waitRail.hidden = true;
    }
  };
  if (!waitRail || waitRail.hidden) {
    return;
  }
  if (immediate || prefersReducedMotion() || !waitCompanionBlock) {
    if (companion.leaveTimer) {
      window.clearTimeout(companion.leaveTimer);
      companion.leaveTimer = 0;
    }
    hideNow();
    return;
  }
  if (waitCompanionBlock.classList.contains("is-leaving")) {
    return;
  }
  waitCompanionBlock.classList.add("is-leaving");
  companion.leaveTimer = window.setTimeout(() => {
    companion.leaveTimer = 0;
    hideNow();
  }, 900);
}

function playWaitCompanion() {
  if (window.FrameFluxPulp?.sayCanned) {
    window.FrameFluxPulp.sayCanned();
    return;
  }
  releaseStageLabel();
  const line = nextCompanionLine();
  speakCompanionLine(line);
}

function currentDevelop() {
  return plateDevelop.last && plateDevelop.last.living ? plateDevelop.last : null;
}

function stopPlateDevelop() {
  if (mainPoster.stopLiving) {
    mainPoster.stopLiving();
  }
  if (plateDevelop.raf) {
    cancelAnimationFrame(plateDevelop.raf);
  }
  plateDevelop.raf = 0;
  plateDevelop.last = null;
  plateDevelop.living = false;
}

function startPlateDevelop({ speed = 1 } = {}) {
  stopPlateDevelop();
  plateDevelop.speed = speed;
  plateDevelop.startedAt = performance.now();
  plateDevelop.living = true;
  plateDevelop.last = {
    living: true,
    startedAt: plateDevelop.startedAt,
    speed,
  };
  if (visualDna) {
    mainPoster.startLiving(visualDna, seedFor(selectedRole), selectedRole, plateDevelop.last);
  }
}

function recordWait(entry) {
  fetch("api/wait.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  }).catch(() => {});
}

async function loadWaitAverages() {
  try {
    const response = await fetch("api/wait.php");
    const data = await response.json().catch(() => ({}));
    if (typeof data.enabled === "number") {
      waitClock.averages.enabled = data.enabled;
    }
    if (typeof data.disabled === "number") {
      waitClock.averages.disabled = data.disabled;
    }
  } catch (err) {
    /* keep defaults */
  }
}

function startWaitClock(mode) {
  if (waitClock.running) {
    return;
  }
  waitClock.running = true;
  waitClock.startedAt = performance.now();
  waitClock.gptImage = useGptImage() ? "yes" : "no";
  waitClock.mode = mode || "generate";
  waitClock.expected = expectedWaitSeconds(waitClock.gptImage === "yes");
  waitClock.plateAt = 0;
  waitClock.hintDna = mode === "improve" || mode === "reimagine" ? visualDna : null;
  updatePipelineCopy();
  waitClock.tickId = window.setInterval(updatePipelineCopy, 400);
}

function stopWaitClock({ ok, title } = {}) {
  if (!waitClock.running) {
    return 0;
  }
  const elapsed = waitElapsedSeconds();
  window.clearInterval(waitClock.tickId);
  waitClock.tickId = 0;
  waitClock.running = false;
  recordWait({
    waited_seconds: Number(elapsed.toFixed(2)),
    gpt_image: waitClock.gptImage,
    mode: waitClock.mode,
    ok: !!ok,
    title: title || "",
  });
  variationWaits.forEach((el) => {
    el.textContent = "0s waited";
  });
  return elapsed;
}

loadWaitAverages();

function setPosterBusy(isBusy, { mode, ok, title } = {}) {
  if (isBusy) {
    startWaitClock(mode);
    variationsEl.hidden = false;
    setVariationSpinners(true);
    hideMeta();
    keyArtOverlay.hidden = true;
    hideDevelopTeaser();
    showWaitCompanion();
    posterFrame.classList.add("is-busy");
    posterFrame.classList.remove("is-developing");
    if (exposeRail) {
      exposeRail.hidden = true;
    }
    updatePipelineCopy();
  } else {
    stopPlateDevelop();
    setVariationSpinners(false);
    keyArtOverlay.hidden = true;
    hideDevelopTeaser();
    posterFrame.classList.remove("is-busy", "is-developing");
    if (exposeRail) {
      exposeRail.hidden = true;
    }
    stopWaitClock({ ok, title });
  }
}

function setPlateDeveloping(isDeveloping, { teaser = true, speed = 1 } = {}) {
  if (isDeveloping) {
    waitClock.plateAt = performance.now();
    if (!companion.holdStage) {
      keyArtOverlay.hidden = false;
    }
    posterFrame.classList.add("is-developing", "is-busy");
    if (exposeRail) {
      exposeRail.hidden = false;
    }
    if (teaser) {
      showDevelopTeaser(visualDna);
    } else {
      hideDevelopTeaser();
    }
    if (!prefersReducedMotion()) {
      startPlateDevelop({ speed });
    } else if (visualDna) {
      mainPoster.render(visualDna, seedFor(selectedRole), selectedRole, null, null);
    }
  } else {
    stopPlateDevelop();
    keyArtOverlay.hidden = true;
    hideDevelopTeaser();
    posterFrame.classList.remove("is-developing");
    if (exposeRail) {
      exposeRail.hidden = true;
    }
  }
  updatePipelineCopy();
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function discardIncomingArt() {
  incomingKeyArt = null;
  mainPoster.cancelExpose();
}

function commitIncomingArt() {
  mainPoster.cancelExpose();
  if (incomingKeyArt) {
    keyArt = incomingKeyArt;
    incomingKeyArt = null;
  }
}

async function revealKeyArt(image) {
  incomingKeyArt = image;
  keyArtOverlay.hidden = true;
  hideDevelopTeaser();
  posterFrame.classList.remove("is-developing");
  if (exposeRail) {
    exposeRail.hidden = true;
  }
  const duration = prefersReducedMotion() ? 0 : 1400;
  const exposing = mainPoster.exposeKeyArt(image, { duration });
  requestAnimationFrame(() => {
    if (incomingKeyArt !== image || !visualDna) {
      return;
    }
    for (const role of ROLES) {
      thumbs[role].render(visualDna, seedFor(role), role, image);
    }
  });
  const ok = await exposing;
  if (ok || incomingKeyArt === image) {
    keyArt = image;
    incomingKeyArt = null;
  }
  showMeta(visualDna);
}

function seedFor(role) {
  return baseSeed + SEED_SHIFTS[role];
}

function renderAll() {
  if (!visualDna) {
    return;
  }
  for (const role of ROLES) {
    thumbs[role].render(visualDna, seedFor(role), role, keyArt);
  }
  mainPoster.render(visualDna, seedFor(selectedRole), selectedRole, keyArt, currentDevelop());
  variationsEl.hidden = false;
  updateSelectionUi();
  const title = visualDna.concept?.title || visualDna.title || "poster";
  posterFrame.querySelector("#poster").setAttribute("aria-label", `Selected ${selectedRole} poster for ${title}`);
}

function variationLayoutLabels(dna) {
  const mode = humanizeDna(dna?.composition?.mode || dna?.layout || "central-focus") || "central focus";
  const layout = humanizeDna(dna?.composition?.layout || dna?.layout || "");
  const place = humanizeDna(
    window.FrameFluxPoster?.titleFace?.(dna)?.placement ||
      dna?.letterform?.placement ||
      dna?.typography?.placement ||
      dna?.composition?.titlePlacement ||
      ""
  );
  const primary = humanizeDna(dna?.procedural?.primaryPattern || dna?.pattern || "");
  const secondary = humanizeDna(dna?.procedural?.secondaryPattern || "");
  const used = new Set([mode.toLowerCase()]);
  const take = (candidates) => {
    for (const item of candidates) {
      const key = String(item || "").toLowerCase();
      if (item && !used.has(key)) {
        used.add(key);
        return item;
      }
    }
    return "";
  };
  return {
    signature: mode,
    hybrid: keyArt ? "still" : take([layout, place, primary]) || `${mode} mix`,
    alternative: take([place, secondary, layout, primary]) || `${mode} turn`,
  };
}

function updateVariationLabels(dna) {
  const labels = variationLayoutLabels(dna);
  document.querySelectorAll(".variation").forEach((btn) => {
    const label = btn.querySelector(".variation-label");
    const role = btn.dataset.role;
    if (label && labels[role]) {
      label.textContent = labels[role];
    }
  });
}

function updateSelectionUi() {
  document.querySelectorAll(".variation").forEach((btn) => {
    btn.setAttribute("aria-pressed", btn.dataset.role === selectedRole ? "true" : "false");
  });
  if (visualDna) {
    updateVariationLabels(visualDna);
  }
}

function archiveApi() {
  return window.FrameFluxArchive || null;
}

function formatArchiveWhen(ts) {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(ts));
  } catch (err) {
    return "";
  }
}

function captureArchivePreview() {
  const api = archiveApi();
  if (!api) {
    return "";
  }
  const canvas = thumbs[selectedRole]?.canvas?.() || thumbs.signature?.canvas?.() || mainPoster.canvas?.();
  return api.captureCanvas(canvas, 160, 0.74);
}

async function waitPaint() {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

async function snapshotArchive(mode) {
  const api = archiveApi();
  if (!api || !visualDna) {
    return;
  }
  await waitPaint();
  const film = filmPayload();
  let still = "";
  if (keyArtSrc) {
    still = await api.compress(keyArtSrc, 720, 0.82);
  }
  const preview = captureArchivePreview() || still;
  try {
    const row = await api.put({
      id: api.newId(),
      savedAt: Date.now(),
      mode: mode || "generate",
      title: film.title || visualDna.concept?.title || visualDna.title || "Untitled",
      genre: film.genre,
      pitch: film.pitch,
      dna: api.clone(visualDna),
      seed: baseSeed,
      role: selectedRole,
      still: still || null,
      preview,
    });
    currentArchiveId = row.id;
    await drawArchiveList();
  } catch (err) {
    /* private mode / quota */
  }
}

function drawArchiveItem(row) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "archive-print";
  btn.dataset.id = row.id;
  btn.setAttribute("role", "listitem");
  btn.setAttribute("aria-pressed", row.id === currentArchiveId ? "true" : "false");
  const title = row.title || "Untitled";
  const kind = row.still ? "cinematic still" : "local plate";
  const when = formatArchiveWhen(row.savedAt);
  btn.setAttribute("aria-label", `Open archived poster ${title}, ${kind}`);
  const thumb = document.createElement("span");
  thumb.className = "archive-thumb";
  if (row.preview || row.still) {
    const img = document.createElement("img");
    img.alt = "";
    img.src = row.preview || row.still;
    thumb.append(img);
  }
  const name = document.createElement("span");
  name.className = "archive-title";
  name.textContent = title;
  const metaLine = document.createElement("span");
  metaLine.className = "archive-meta";
  metaLine.textContent = when ? `${kind} · ${when}` : kind;
  btn.append(thumb, name, metaLine);
  btn.addEventListener("click", () => {
    void restoreArchive(row.id);
  });
  return btn;
}

async function drawArchiveList() {
  if (!archiveEl || !archiveList) {
    return;
  }
  const api = archiveApi();
  if (!api) {
    archiveEl.hidden = true;
    return;
  }
  let rows = [];
  try {
    rows = await api.list();
  } catch (err) {
    archiveEl.hidden = true;
    return;
  }
  archiveEl.hidden = rows.length === 0;
  archiveList.replaceChildren(...rows.map(drawArchiveItem));
}

function fillFilmForm(entry) {
  if (entry.title != null) {
    document.querySelector("#title").value = entry.title;
  }
  if (entry.genre != null) {
    document.querySelector("#genre").value = entry.genre;
  }
  if (entry.pitch != null) {
    document.querySelector("#pitch").value = entry.pitch;
  }
}

async function restoreArchive(id) {
  const api = archiveApi();
  if (!api) {
    return;
  }
  const entry = await api.get(id);
  if (!entry?.dna) {
    return;
  }
  const wasBusy = posterFrame.classList.contains("is-busy");
  composeJob += 1;
  discardIncomingArt();
  fillFilmForm(entry);
  visualDna = entry.dna;
  baseSeed = Number(entry.seed) || Date.now() % 100000;
  selectedRole = ROLES.includes(entry.role) ? entry.role : "signature";
  keyArtSrc = entry.still || null;
  keyArt = entry.still ? await mainPoster.loadImage(entry.still) : null;
  if (!keyArt) {
    keyArtSrc = null;
  }
  currentArchiveId = entry.id;
  if (wasBusy) {
    setPosterBusy(false, { ok: false, title: entry.title || "" });
  }
  generateBtn.disabled = false;
  enablePosterActions(true);
  renderAll();
  showMeta(visualDna);
  await drawArchiveList();
  const kind = keyArt ? "cinematic still" : "local plate";
  setStatus(`Opened from the archive · ${kind}`);
  setError("");
}

async function clearArchive() {
  const api = archiveApi();
  if (!api) {
    return;
  }
  await api.clear();
  currentArchiveId = "";
  await drawArchiveList();
  setStatus("Archive cleared.");
}

function previousPayload() {
  if (!visualDna) {
    return null;
  }
  return visualDna;
}

async function requestDna({ mode = "generate", previous = null } = {}) {
  const payload = {
    ...filmPayload(),
    conversation: conversationNotes(),
    mode,
    variation: Math.floor(Math.random() * 1_000_000_000),
  };
  if (previous) {
    payload.previous = previous;
  }

  const response = await fetch("api/generate.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Could not create Visual DNA.");
  }
  return data;
}

async function requestImage(dna) {
  if (!useGptImage()) {
    return null;
  }
  const response = await fetch("api/image.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dna, useImage: true, conversation: conversationNotes() }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return null;
  }
  if (!data.image) {
    return null;
  }
  const image = await mainPoster.loadImage(data.image);
  if (!image) {
    return null;
  }
  return { image, src: data.image };
}

async function compose({ mode, previous, interpreting }) {
  setError("");
  let ok = false;
  const job = ++composeJob;
  discardIncomingArt();
  setPosterBusy(true, { mode });
  try {
    const heard = conversationNotes();
    setStatus(heard ? `${interpreting} What you told Pulp is in the brief.` : interpreting);
    visualDna = await requestDna({ mode, previous });
    if (job !== composeJob) {
      return;
    }
    keyArt = null;
    keyArtSrc = null;
    incomingKeyArt = null;
    baseSeed = Math.floor(Math.random() * 1_000_000);
    selectedRole = "signature";
    regenerateBtn.disabled = false;
    downloadBtn.disabled = false;
    for (const role of ROLES) {
      thumbs[role].render(visualDna, seedFor(role), role, null);
    }
    variationsEl.hidden = false;
    updateSelectionUi();
    const title = visualDna.concept?.title || visualDna.title || "poster";
    posterFrame.querySelector("#poster").setAttribute("aria-label", `Selected ${selectedRole} poster for ${title}`);
    const quote = visualDna.concept?.quote || visualDna.quote || "";
    const mood = visualDna.concept?.mood || visualDna.mood || "";
    const verb = mode === "improve" ? "Improved" : mode === "reimagine" ? "Reimagined" : "New design";
    if (useGptImage()) {
      setPlateDeveloping(true, { teaser: true, speed: 1 });
      setStatus("Visual DNA resolved. Synthesizing cinematic key art in background...");
      const still = await requestImage(visualDna);
      if (job !== composeJob) {
        return;
      }
      if (still) {
        keyArtSrc = still.src;
        await revealKeyArt(still.image);
        if (job !== composeJob) {
          return;
        }
      } else {
        stopPlateDevelop();
        renderAll();
        showMeta(visualDna);
      }
    } else {
      renderAll();
      showMeta(visualDna);
    }
    if (job !== composeJob) {
      return;
    }
    setStatus(`${verb}${mood ? ` · ${mood}` : ""}${quote ? ` · “${quote}”` : ""}`);
    ok = true;
    await snapshotArchive(mode);
  } finally {
    if (job === composeJob) {
      const title = visualDna?.concept?.title || visualDna?.title || filmPayload().title;
      setPosterBusy(false, { ok, title });
    }
  }
}

function busy(isBusy, mode) {
  generateBtn.disabled = isBusy;
  if (isBusy) {
    enablePosterActions(false);
    setPosterBusy(true, { mode });
  } else if (visualDna) {
    enablePosterActions(true);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  busy(true, "generate");
  try {
    await document.fonts.ready;
    await compose({
      mode: "generate",
      interpreting: "Interpreting the film…",
    });
  } catch (error) {
    setError(error.message);
  } finally {
    busy(false);
  }
});

improveBtn.addEventListener("click", async () => {
  if (!visualDna) {
    return;
  }
  busy(true, "improve");
  try {
    await compose({
      mode: "improve",
      previous: previousPayload(),
      interpreting: "Sending the current design back for a stronger pass…",
    });
  } catch (error) {
    setError(error.message);
  } finally {
    busy(false);
  }
});

reimagineBtn.addEventListener("click", async () => {
  if (!visualDna) {
    return;
  }
  busy(true, "reimagine");
  try {
    await compose({
      mode: "reimagine",
      previous: previousPayload(),
      interpreting: "Asking for a new interpretation of the same film…",
    });
  } catch (error) {
    setError(error.message);
  } finally {
    busy(false);
  }
});

regenerateBtn.addEventListener("click", () => {
  if (!visualDna) {
    return;
  }
  const waitingForStill = !keyArt && !incomingKeyArt && posterFrame.classList.contains("is-busy");
  if (incomingKeyArt) {
    commitIncomingArt();
  } else {
    mainPoster.cancelExpose();
  }
  stopPlateDevelop();
  baseSeed = Math.floor(Math.random() * 1_000_000);
  if (waitingForStill && useGptImage()) {
    startPlateDevelop({ speed: 1 });
    for (const role of ROLES) {
      thumbs[role].render(visualDna, seedFor(role), role, null);
    }
  } else {
    renderAll();
  }
  setStatus("Same Visual DNA" + (keyArt ? " and cinematic still" : "") + ". New procedural execution.");
  if (!waitingForStill) {
    void snapshotArchive("regenerate");
  }
});

downloadBtn.addEventListener("click", async () => {
  if (!visualDna || printExporting) {
    return;
  }
  if (incomingKeyArt) {
    commitIncomingArt();
  }
  const spec = printScaleSpec(printScale);
  const title = visualDna.concept?.title || visualDna.title || "poster";
  printExporting = true;
  downloadBtn.disabled = true;
  setStatus(`Rendering ${spec.width}×${spec.height} print · ${spec.inches} at ${spec.dpi} dpi…`);
  await new Promise((resolve) => window.setTimeout(resolve, 40));
  try {
    const saved = await mainPoster.exportPrint({
      scale: printScale,
      filename: `frameflux-${slugify(title)}-${selectedRole}`,
    });
    if (!saved) {
      throw new Error("Nothing to print yet.");
    }
    const note = saved.scale < printScale ? " · fell back to 4×" : "";
    setStatus(`Saved ${saved.width}×${saved.height} print · ${saved.inches} at ${saved.dpi} dpi${note}`);
  } catch (err) {
    setError(err.message || "Could not render the print.");
  } finally {
    printExporting = false;
    if (visualDna) {
      enablePosterActions(true);
    }
  }
});

if (printScale4) {
  printScale4.addEventListener("click", () => setPrintScale(4));
}
if (printScale8) {
  printScale8.addEventListener("click", () => setPrintScale(8));
}

gptImageBtn.addEventListener("click", () => {
  const next = !useGptImage();
  gptImageBtn.setAttribute("aria-checked", next ? "true" : "false");
  syncGptImageButton();
  try {
    localStorage.setItem(GPT_IMAGE_KEY, next ? "on" : "off");
  } catch (err) {
    /* ignore quota / private mode */
  }
});

variationsEl.addEventListener("click", (event) => {
  const btn = event.target.closest(".variation");
  if (!btn || !visualDna) {
    return;
  }
  selectedRole = btn.dataset.role;
  if (incomingKeyArt) {
    commitIncomingArt();
    stopPlateDevelop();
    mainPoster.render(visualDna, seedFor(selectedRole), selectedRole, keyArt);
  } else {
    mainPoster.render(
      visualDna,
      seedFor(selectedRole),
      selectedRole,
      keyArt,
      currentDevelop(),
      { cancelExpose: false }
    );
  }
  updateSelectionUi();
  const title = visualDna.concept?.title || visualDna.title || "poster";
  posterFrame.querySelector("#poster").setAttribute("aria-label", `Selected ${selectedRole} poster for ${title}`);
});

if (waitCompanion) {
  waitCompanion.addEventListener("click", () => {
    playWaitCompanion();
  });
}
if (window.FrameFluxPulp) {
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
  }
  window.FrameFluxPulp.init({
    speak: (text) => speakCompanionLine(text),
    stopSpeech: stopCompanionSpeech,
    nextLine: nextCompanionLine,
    getContext: () => {
      const film = filmPayload();
      return {
        title: film.title,
        genre: film.genre,
        pitch: film.pitch,
        waiting: posterFrame.classList.contains("is-busy"),
        still: !!keyArt,
      };
    },
  });
}
if (archiveClear) {
  archiveClear.addEventListener("click", () => {
    void clearArchive();
  });
}
if (window.speechSynthesis) {
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    window.speechSynthesis.getVoices();
  });
}
window.addEventListener("pagehide", () => {
  stopCompanionSpeech();
});

function companionReviewLines() {
  const script = companionScript();
  return [script.prompt, ...(script.lines || [])].filter(Boolean);
}

function mountCompanionReview() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("pulp") !== "review") {
    return;
  }
  const script = companionScript();
  const panel = document.createElement("section");
  panel.className = "companion-review";
  panel.innerHTML = `
    <h2>Pulp audio review</h2>
    <p>Edit lines in <code>js/companion-lines.js</code>, then refresh this page. Play each line to hear the current voice.</p>
    <div class="companion-review-voice">
      <label>Rate <input id="pulp-rate" type="number" min="0.5" max="1.4" step="0.05" value="${script.speech?.rate ?? 0.9}" /></label>
      <label>Pitch <input id="pulp-pitch" type="number" min="0.6" max="1.6" step="0.02" value="${script.speech?.pitch ?? 1.18}" /></label>
      <p id="pulp-voice-name" class="companion-review-meta"></p>
    </div>
    <ol id="pulp-lines"></ol>
  `;
  document.body.append(panel);
  const list = panel.querySelector("#pulp-lines");
  const rateEl = panel.querySelector("#pulp-rate");
  const pitchEl = panel.querySelector("#pulp-pitch");
  const voiceName = panel.querySelector("#pulp-voice-name");
  const syncVoice = () => {
    if (!script.speech) {
      script.speech = {};
    }
    script.speech.rate = Number(rateEl.value);
    script.speech.pitch = Number(pitchEl.value);
    const voice = pickCompanionVoice();
    voiceName.textContent = voice ? `Voice: ${voice.name} (${voice.lang})` : "Voice: browser default";
  };
  rateEl.addEventListener("change", syncVoice);
  pitchEl.addEventListener("change", syncVoice);
  syncVoice();
  companionReviewLines().forEach((line, index) => {
    const item = document.createElement("li");
    const play = document.createElement("button");
    play.type = "button";
    play.textContent = "Play";
    play.addEventListener("click", () => {
      speakCompanionLine(line);
    });
    const text = document.createElement("span");
    text.textContent = `${index + 1}. ${line}`;
    item.append(play, text);
    list.append(item);
  });
}

mountCompanionReview();
void drawArchiveList();

