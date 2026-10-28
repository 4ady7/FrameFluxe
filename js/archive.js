(function (global) {
  const DB_NAME = "frameflux-archive";
  const STORE = "prints";
  const VERSION = 1;
  const LIMIT = 20;

  function newId() {
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      return global.crypto.randomUUID();
    }
    return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function clone(value) {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!global.indexedDB) {
        reject(new Error("IndexedDB unavailable"));
        return;
      }
      const req = global.indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("savedAt", "savedAt");
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function requestDone(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function txDone(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async function listPrints() {
    const db = await openDb();
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).index("savedAt").openCursor(null, "prev");
    const rows = [];
    await new Promise((resolve, reject) => {
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          rows.push(cursor.value);
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => reject(req.error);
    });
    await txDone(tx);
    return rows;
  }

  async function getPrint(id) {
    const db = await openDb();
    const tx = db.transaction(STORE, "readonly");
    const row = await requestDone(tx.objectStore(STORE).get(id));
    await txDone(tx);
    return row || null;
  }

  async function deleteOldest(count) {
    if (count <= 0) {
      return;
    }
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).index("savedAt").openCursor(null, "next");
    let left = count;
    await new Promise((resolve, reject) => {
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor && left > 0) {
          cursor.delete();
          left -= 1;
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => reject(req.error);
    });
    await txDone(tx);
  }

  async function writePrint(entry) {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(entry);
    await txDone(tx);
  }

  async function trimPrints() {
    const rows = await listPrints();
    if (rows.length > LIMIT) {
      await deleteOldest(rows.length - LIMIT);
    }
  }

  async function putPrint(entry) {
    const row = {
      ...entry,
      id: entry.id || newId(),
      savedAt: entry.savedAt || Date.now(),
    };
    try {
      await writePrint(row);
    } catch (err) {
      if (row.still) {
        try {
          row.still = await compressImage(row.still, 480, 0.68);
          await writePrint(row);
        } catch (retryErr) {
          row.still = null;
          await writePrint(row);
        }
      } else {
        throw err;
      }
    }
    await trimPrints();
    return row;
  }

  async function clearPrints() {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    await txDone(tx);
  }

  function compressImage(dataUrl, maxWidth, quality) {
    return new Promise((resolve) => {
      if (!dataUrl) {
        resolve("");
        return;
      }
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / Math.max(1, img.width));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch (err) {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  function captureCanvas(canvas, maxWidth, quality) {
    if (!canvas || !canvas.width) {
      return "";
    }
    const scale = Math.min(1, maxWidth / Math.max(1, canvas.width));
    const off = document.createElement("canvas");
    off.width = Math.max(1, Math.round(canvas.width * scale));
    off.height = Math.max(1, Math.round(canvas.height * scale));
    const ctx = off.getContext("2d");
    if (!ctx) {
      return "";
    }
    ctx.drawImage(canvas, 0, 0, off.width, off.height);
    try {
      return off.toDataURL("image/jpeg", quality);
    } catch (err) {
      return "";
    }
  }

  global.FrameFluxArchive = {
    LIMIT,
    newId,
    clone,
    list: listPrints,
    get: getPrint,
    put: putPrint,
    clear: clearPrints,
    compress: compressImage,
    captureCanvas,
  };
})(window);
