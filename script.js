// ---------- Calculator logic ----------
const resultEl = document.getElementById("result");
const historyEl = document.getElementById("history");

let current = "0";     // number being typed
let previous = null;   // stored left operand
let operator = null;   // pending operator
let justEvaluated = false;

const MAX_DIGITS = 12;

function format(str) {
  if (str === "Error") return str;
  const [int, dec] = str.split(".");
  const sign = int.startsWith("-") ? "-" : "";
  const digits = int.replace("-", "");
  const grouped = Number(digits).toLocaleString("en-US");
  return sign + grouped + (dec !== undefined ? "." + dec : "");
}

function render() {
  resultEl.textContent = format(current);
  historyEl.textContent = operator && previous !== null ? `${format(previous)} ${operator}` : "";
  document.querySelectorAll(".op").forEach(b =>
    b.classList.toggle("active", b.dataset.op === operator && justEvaluated === false && current === "0" && previous !== null && false));
}

function compute(a, b, op) {
  a = parseFloat(a); b = parseFloat(b);
  let r;
  switch (op) {
    case "+": r = a + b; break;
    case "−": r = a - b; break;
    case "×": r = a * b; break;
    case "÷": if (b === 0) return "Error"; r = a / b; break;
    default: return String(b);
  }
  return String(parseFloat(r.toPrecision(12)));
}

function inputNumber(n) {
  if (current === "Error" || justEvaluated) { current = "0"; justEvaluated = false; }
  if (current.replace(/[-.]/g, "").length >= MAX_DIGITS) return;
  current = current === "0" ? n : current + n;
}

function inputDot() {
  if (current === "Error" || justEvaluated) { current = "0"; justEvaluated = false; }
  if (!current.includes(".")) current += ".";
}

function chooseOperator(op) {
  if (current === "Error") return;
  if (operator && previous !== null && !justEvaluated && current !== "") {
    previous = compute(previous, current, operator);
    if (previous === "Error") { current = "Error"; previous = null; operator = null; return; }
  } else {
    previous = current;
  }
  operator = op;
  current = "0";
  justEvaluated = false;
  pendingOperand = true;
}
let pendingOperand = false;

function equals() {
  if (operator === null || previous === null) return;
  const res = compute(previous, current, operator);
  historyEl.textContent = `${format(previous)} ${operator} ${format(current)} =`;
  current = res;
  previous = null;
  operator = null;
  justEvaluated = true;
}

function clearAll() { current = "0"; previous = null; operator = null; justEvaluated = false; }
function toggleSign() { if (current !== "0" && current !== "Error") current = current.startsWith("-") ? current.slice(1) : "-" + current; }
function percent() { if (current !== "Error") current = String(parseFloat((parseFloat(current) / 100).toPrecision(12))); }

document.querySelector(".keys").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  const keepHistory = b.dataset.action === "equals";
  if (b.dataset.num !== undefined) inputNumber(b.dataset.num);
  else if (b.dataset.op) chooseOperator(b.dataset.op);
  else {
    switch (b.dataset.action) {
      case "dot": inputDot(); break;
      case "equals": equals(); break;
      case "clear": clearAll(); break;
      case "sign": toggleSign(); break;
      case "percent": percent(); break;
    }
  }
  const savedHistory = historyEl.textContent;
  render();
  if (keepHistory && savedHistory) historyEl.textContent = savedHistory;
});

// Keyboard support
document.addEventListener("keydown", e => {
  const map = { "*": "×", "/": "÷", "-": "−", "+": "+" };
  if (/^[0-9]$/.test(e.key)) document.querySelector(`[data-num="${e.key}"]`).click();
  else if (map[e.key]) { e.preventDefault(); document.querySelector(`[data-op="${map[e.key]}"]`).click(); }
  else if (e.key === "." ) document.querySelector('[data-action="dot"]').click();
  else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); document.querySelector('[data-action="equals"]').click(); }
  else if (e.key === "Escape") document.querySelector('[data-action="clear"]').click();
  else if (e.key === "%") document.querySelector('[data-action="percent"]').click();
  else if (e.key === "Backspace") {
    if (!justEvaluated && current !== "Error") { current = current.length > 1 && current !== "-0" ? current.slice(0, -1) : "0"; if (current === "-") current = "0"; render(); }
  }
});

render();

// ---------- App installation (PWA) ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(err => console.error("SW failed:", err));
  });
}

let deferredPrompt = null;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

window.addEventListener("appinstalled", () => { installBtn.hidden = true; });
