(() => {
  const STORAGE_KEY = "frameflux-pulp-chat";
  const RECORD_MS = 30000;

  const logEl = document.querySelector("#pulp-log");
  const formEl = document.querySelector("#pulp-form");
  const inputEl = document.querySelector("#pulp-input");
  const sendEl = document.querySelector("#pulp-send");
  const micEl = document.querySelector("#pulp-mic");
  const micStatus = document.querySelector("#pulp-mic-status");
  const foxEl = document.querySelector("#wait-companion");

  if (!logEl || !formEl || !inputEl) {
    return;
  }

  const state = {
    messages: [],
    busy: false,
    abort: null,
    recorder: null,
    chunks: [],
    recordTimer: 0,
    stream: null,
    playing: null,
    hooks: {
      speak: () => {},
      stopSpeech: () => {},
      nextLine: () => "",
      getContext: () => ({}),
    },
  };

  function uid() {
    return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }

  function persist() {
    try {
      const slim = state.messages
        .filter((row) => row.role === "pulp" || row.role === "you")
        .slice(-24)
        .map((row) => ({
          id: row.id,
          role: row.role,
          text: row.text,
          voice: !!row.voice,
        }));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch (err) {
      /* private mode */
    }
  }

  function restore() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const rows = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(rows)) {
        return false;
      }
      const kept = rows.filter(
        (row) =>
          row &&
          (row.role === "pulp" || row.role === "you") &&
          typeof row.text === "string" &&
          row.text.trim()
      );
      if (!kept.length) {
        return false;
      }
      state.messages = kept.map((row) => ({
        id: row.id || uid(),
        role: row.role,
        text: row.text.trim(),
        voice: !!row.voice,
        url: "",
      }));
      state.messages.forEach((row) => drawMessage(row, { scroll: false }));
      scrollLog();
      return true;
    } catch (err) {
      return false;
    }
  }

  function historyPayload() {
    return state.messages
      .filter((row) => row.text)
      .slice(-12)
      .map((row) => ({
        role: row.role === "you" ? "user" : "assistant",
        content: row.text,
      }));
  }

  function scrollLog() {
    logEl.scrollTop = logEl.scrollHeight;
  }

  function stopVoicePlayback() {
    if (state.playing) {
      state.playing.pause();
      state.playing = null;
    }
    logEl.querySelectorAll(".pulp-play.is-playing").forEach((btn) => {
      btn.classList.remove("is-playing");
      btn.setAttribute("aria-label", "Play voice note");
    });
  }

  function drawMessage(row, { scroll = true } = {}) {
    const wrap = document.createElement("div");
    wrap.className = `pulp-msg pulp-msg-${row.role}${row.voice ? " is-voice" : ""}`;
    wrap.dataset.id = row.id;
    const who = document.createElement("span");
    who.className = "pulp-who";
    who.textContent = row.role === "you" ? "You" : "Pulp";
    const body = document.createElement("div");
    body.className = "pulp-bubble";
    if (row.voice && row.url) {
      const play = document.createElement("button");
      play.type = "button";
      play.className = "pulp-play";
      play.setAttribute("aria-label", "Play voice note");
      play.textContent = "Play";
      play.addEventListener("click", () => toggleVoice(row, play));
      body.append(play);
    } else if (row.voice) {
      const mark = document.createElement("span");
      mark.className = "pulp-voice-mark";
      mark.textContent = "Voice";
      body.append(mark);
    }
    const text = document.createElement("p");
    text.className = "pulp-text";
    text.textContent = row.text || (row.voice ? "Voice note" : "");
    body.append(text);
    wrap.append(who, body);
    logEl.append(wrap);
    if (scroll) {
      scrollLog();
    }
    return wrap;
  }

  function setBubbleText(id, next) {
    const node = logEl.querySelector(`[data-id="${id}"] .pulp-text`);
    if (node) {
      node.textContent = next;
    }
    const row = state.messages.find((item) => item.id === id);
    if (row) {
      row.text = next;
    }
  }

  function toggleVoice(row, btn) {
    if (!row.url) {
      return;
    }
    if (state.playing && !state.playing.paused) {
      const same = state.playing.src === row.url;
      stopVoicePlayback();
      if (same) {
        return;
      }
    }
    state.hooks.stopSpeech();
    const audio = new Audio(row.url);
    state.playing = audio;
    btn.classList.add("is-playing");
    btn.setAttribute("aria-label", "Stop voice note");
    audio.addEventListener("ended", () => {
      if (state.playing === audio) {
        stopVoicePlayback();
      }
    });
    audio.play().catch(() => stopVoicePlayback());
  }

  function setTyping(on) {
    const existing = logEl.querySelector(".pulp-msg.is-typing");
    if (!on) {
      existing?.remove();
      return;
    }
    if (existing) {
      return;
    }
    const wrap = document.createElement("div");
    wrap.className = "pulp-msg pulp-msg-pulp is-typing";
    wrap.setAttribute("aria-label", "Pulp is thinking");
    wrap.innerHTML = `<span class="pulp-who">Pulp</span><div class="pulp-bubble"><span class="pulp-dots" aria-hidden="true"><i></i><i></i><i></i></span></div>`;
    logEl.append(wrap);
    scrollLog();
  }

  function setBusy(on) {
    state.busy = on;
    formEl.setAttribute("aria-busy", on ? "true" : "false");
    sendEl.disabled = on;
    inputEl.disabled = on;
    if (micEl && !micEl.hidden) {
      micEl.disabled = on && !state.recorder;
    }
  }

  function appendPulp(text, { speak = true } = {}) {
    const line = String(text || "").trim();
    if (!line) {
      return;
    }
    const row = { id: uid(), role: "pulp", text: line, voice: false, url: "" };
    state.messages.push(row);
    drawMessage(row);
    persist();
    if (speak) {
      state.hooks.speak(line);
    }
  }

  function appendYou({ text, voice, url }) {
    const row = {
      id: uid(),
      role: "you",
      text: String(text || "").trim() || (voice ? "Voice note" : ""),
      voice: !!voice,
      url: url || "",
    };
    state.messages.push(row);
    drawMessage(row);
    persist();
    return row;
  }

  async function askPulp({ text, audio, userId }) {
    if (state.abort) {
      state.abort.abort();
    }
    const controller = new AbortController();
    state.abort = controller;
    setBusy(true);
    setTyping(true);
    const ctx = state.hooks.getContext() || {};
    try {
      let response;
      if (audio) {
        const body = new FormData();
        body.append("audio", audio.blob, audio.name);
        body.append("history", JSON.stringify(historyPayload().slice(0, -1)));
        body.append("title", ctx.title || "");
        body.append("genre", ctx.genre || "");
        body.append("pitch", ctx.pitch || "");
        body.append("waiting", ctx.waiting ? "1" : "0");
        body.append("still", ctx.still ? "1" : "0");
        if (text) {
          body.append("message", text);
        }
        response = await fetch("api/pulp.php", { method: "POST", body, signal: controller.signal });
      } else {
        response = await fetch("api/pulp.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            message: text,
            history: historyPayload().slice(0, -1),
            title: ctx.title || "",
            genre: ctx.genre || "",
            pitch: ctx.pitch || "",
            waiting: !!ctx.waiting,
            still: !!ctx.still,
          }),
        });
      }
      const data = await response.json().catch(() => ({}));
      const transcript = typeof data.transcript === "string" ? data.transcript.trim() : "";
      if (transcript && userId) {
        setBubbleText(userId, transcript);
        persist();
      }
      const reply =
        (typeof data.reply === "string" && data.reply.trim()) ||
        "The safe light flickered. Say that again?";
      setTyping(false);
      appendPulp(reply, { speak: true });
    } catch (err) {
      if (err?.name === "AbortError") {
        return;
      }
      setTyping(false);
      appendPulp("The darkroom ate that. Type it, or tap the mic again.", { speak: true });
    } finally {
      if (state.abort === controller) {
        state.abort = null;
        setTyping(false);
        setBusy(false);
      }
    }
  }

  async function sendText() {
    const text = inputEl.value.trim();
    if (!text || state.busy) {
      return;
    }
    stopRecording({ send: false });
    inputEl.value = "";
    appendYou({ text, voice: false });
    await askPulp({ text });
  }

  function recorderMime() {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
    return types.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || "";
  }

  function fileNameFor(mime) {
    if (mime.includes("mp4")) {
      return "pulp-voice.m4a";
    }
    return "pulp-voice.webm";
  }

  function setRecordingUi(on) {
    if (micEl) {
      micEl.classList.toggle("is-recording", on);
      micEl.setAttribute("aria-pressed", on ? "true" : "false");
      micEl.setAttribute("aria-label", on ? "Stop and send voice note" : "Record a voice note");
    }
    foxEl?.classList.toggle("is-recording", on);
    if (micStatus) {
      micStatus.hidden = !on;
    }
  }

  function releaseStream() {
    if (state.stream) {
      state.stream.getTracks().forEach((track) => track.stop());
      state.stream = null;
    }
  }

  function stopRecording({ send }) {
    if (state.recordTimer) {
      window.clearTimeout(state.recordTimer);
      state.recordTimer = 0;
    }
    const recorder = state.recorder;
    if (!recorder) {
      setRecordingUi(false);
      return;
    }
    state.recorder = null;
    if (recorder.state !== "inactive") {
      recorder.addEventListener(
        "stop",
        () => {
          const mime = recorder.mimeType || "audio/webm";
          const blob = new Blob(state.chunks, { type: mime });
          state.chunks = [];
          releaseStream();
          setRecordingUi(false);
          if (send && blob.size > 64) {
            void sendVoice(blob, mime);
          }
        },
        { once: true }
      );
      recorder.stop();
      return;
    }
    state.chunks = [];
    releaseStream();
    setRecordingUi(false);
  }

  async function sendVoice(blob, mime) {
    const url = URL.createObjectURL(blob);
    const row = appendYou({ text: "Voice note", voice: true, url });
    await askPulp({
      audio: { blob, name: fileNameFor(mime) },
      userId: row.id,
    });
  }

  async function startRecording() {
    if (state.busy || state.recorder || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.stream = stream;
      const mime = recorderMime();
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      state.chunks = [];
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size) {
          state.chunks.push(event.data);
        }
      });
      state.recorder = recorder;
      recorder.start();
      setRecordingUi(true);
      state.recordTimer = window.setTimeout(() => stopRecording({ send: true }), RECORD_MS);
    } catch (err) {
      releaseStream();
      setRecordingUi(false);
      appendPulp("I cannot hear you yet. Allow the microphone, or type to me.", { speak: true });
    }
  }

  function toggleMic() {
    if (state.recorder) {
      stopRecording({ send: true });
      return;
    }
    void startRecording();
  }

  function greet() {
    const prompt =
      window.FrameFluxCompanion?.prompt || "Hi, my name is Pulp. Talk to me!";
    appendPulp(prompt, { speak: true });
  }

  function sayCanned() {
    if (state.busy || state.recorder) {
      return;
    }
    const line = state.hooks.nextLine() || window.FrameFluxCompanion?.prompt || "";
    appendPulp(line, { speak: true });
  }

  formEl.addEventListener("submit", (event) => {
    event.preventDefault();
    void sendText();
  });
  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendText();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.recorder) {
      stopRecording({ send: false });
    }
  });
  if (micEl) {
    const canRecord = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
    if (!canRecord) {
      micEl.hidden = true;
    } else {
      micEl.addEventListener("click", toggleMic);
    }
  }

  window.FrameFluxPulp = {
    init(hooks) {
      state.hooks = { ...state.hooks, ...hooks };
      const restored = restore();
      if (!restored) {
        greet();
      }
    },
    sayCanned,
    appendPulp,
  };
})();
