const $ = (id) => document.getElementById(id);

const state = {
  videoId: "",
  videoTitle: "",
  transcriptLoaded: false
};

function setStatus(text) {
  $("statusPill").textContent = text;
}

function toast(message, error = false) {
  const el = $("toast");
  el.textContent = message;
  el.style.borderColor = error ? "rgba(217,109,109,.45)" : "rgba(216,181,106,.25)";
  el.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => el.classList.remove("show"), 2800);
}

function extractYouTubeId(value) {
  try {
    const url = new URL(value.trim());
    if (url.hostname === "youtu.be") return url.pathname.replace("/", "").split("/")[0];
    if (url.hostname.includes("youtube.com")) {
      if (url.searchParams.get("v")) return url.searchParams.get("v");
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "shorts" || parts[0] === "embed") return parts[1] || "";
    }
  } catch (_) {}
  return "";
}

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
    : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function escapeSpeakerLabel(text) {
  return text.replace(/[\[\]]/g, "").trim();
}

function buildDiscordText() {
  const raw = $("transcript").value.trim();
  if (!raw) return "";

  const interviewer = escapeSpeakerLabel($("interviewerName").value.trim()) || "INTERROGADOR";
  const interviewee = escapeSpeakerLabel($("intervieweeName").value.trim()) || "INTERROGADO";

  // Mantém a transcrição praticamente igual para não alterar o conteúdo.
  // Só adiciona um cabeçalho simples para facilitar a colagem no Discord.
  return `# Interrogatório\n\n**Interrogador:** ${interviewer}\n**Interrogado:** ${interviewee}\n\n${raw}`;
}

function updatePreview() {
  const text = buildDiscordText();
  $("discordPreview").textContent = text || "Ainda não há transcrição.";

  const value = $("transcript").value;
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  $("stats").textContent = `${words} palavras · ${value.length} caracteres`;
}

function cleanFormatting() {
  const el = $("transcript");
  const cleaned = el.value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\[\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*\]/g, "$1")
    .trim();
  el.value = cleaned;
  updatePreview();
  toast("Formatação limpa.");
}

function setExample() {
  $("transcript").value = `[00:02:14] Interrogador: Onde estava por volta das onze da noite?\n[00:02:21] Interrogado: Estava em casa.\n\n[00:03:08] Interrogador: Estava sozinho?\n[00:03:15] Interrogado: Sim.\n\n[00:06:40] Interrogador: Conhecia o João?\n[00:06:48] Interrogado: Não. Só o vi uma vez.\n\n[00:12:17] Interrogador: Então nunca falou com ele naquela noite?\n[00:12:25] Interrogado: Não, não falei.`;
  $("interviewerName").value = "Agente Martins";
  $("intervieweeName").value = "João Silva";
  updatePreview();
  toast("Exemplo carregado.");
}

async function processVideo() {
  const url = $("youtubeUrl").value.trim();
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    toast("Coloca um link válido do YouTube.", true);
    return;
  }

  state.videoId = videoId;
  $("videoOpen").href = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  setStatus("A PROCESSAR");
  $("processBtn").disabled = true;
  $("processBtn").textContent = "A obter...";

  try {
    const apiBase = (window.APP_CONFIG?.API_BASE_URL || "").replace(/\/$/, "");
    if (!apiBase) throw new Error("Backend não configurado");

    const response = await fetch(`${apiBase}/api/transcript?video_id=${encodeURIComponent(videoId)}&languages=pt,pt-PT,en`, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Não foi possível obter a transcrição.");

    state.videoTitle = data.title || `YouTube · ${videoId}`;
    $("videoTitle").textContent = state.videoTitle;
    $("sourceMeta").hidden = false;

    $("transcript").value = data.lines.map(line => `[${formatTime(line.start)}] ${line.text}`).join("\n");
    state.transcriptLoaded = true;
    updatePreview();
    setStatus("TRANSCRIÇÃO OBTIDA");
    toast(`Transcrição obtida: ${data.lines.length} blocos.`);
  } catch (error) {
    console.error(error);
    setStatus("SEM TRANSCRIÇÃO");
    toast(`${error.message} Podes colar a transcrição manualmente.`, true);
  } finally {
    $("processBtn").disabled = false;
    $("processBtn").textContent = "Processar";
  }
}

async function copyToClipboard() {
  const text = buildDiscordText();
  if (!text) {
    toast("Não há transcrição para copiar.", true);
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    toast("Copiado para o clipboard.");
  } catch (_) {
    const helper = document.createElement("textarea");
    helper.value = text;
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
    toast("Copiado para o clipboard.");
  }
}

function saveLocal() {
  localStorage.setItem("interrogar-transcript", $("transcript").value);
  localStorage.setItem("interrogar-interviewer", $("interviewerName").value);
  localStorage.setItem("interrogar-interviewee", $("intervieweeName").value);
}

function restoreLocal() {
  const transcript = localStorage.getItem("interrogar-transcript");
  const interviewer = localStorage.getItem("interrogar-interviewer");
  const interviewee = localStorage.getItem("interrogar-interviewee");
  if (transcript !== null) $("transcript").value = transcript;
  if (interviewer !== null) $("interviewerName").value = interviewer;
  if (interviewee !== null) $("intervieweeName").value = interviewee;
  updatePreview();
}

$("processBtn").addEventListener("click", processVideo);
$("cleanBtn").addEventListener("click", cleanFormatting);
$("exampleBtn").addEventListener("click", setExample);
$("copyBtn").addEventListener("click", copyToClipboard);

["transcript", "interviewerName", "intervieweeName"].forEach(id => {
  $(id).addEventListener("input", () => {
    updatePreview();
    saveLocal();
  });
});

$("youtubeUrl").addEventListener("keydown", (e) => {
  if (e.key === "Enter") processVideo();
});

restoreLocal();
setStatus("PRONTO");
