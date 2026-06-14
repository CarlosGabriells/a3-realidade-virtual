// ---- Estado da aplicação ----
var currentRoomIdx = 0;
var currentValues  = {};
var projectValues  = {};
var appStarted     = false;
var baselineValues = {};

var ROOM_VIEWS = [
  { position: "-5 0 0", rotation: "0 -90 0" },
  { position: "-1 0 0", rotation: "0 -90 0" },
  { position: "0 0 -0.15", rotation: "0 0 0" },
];

function createDefaultState(room) {
  var state = {};
  room.parameters.forEach(function(parameter) {
    state[parameter.id] = parameter.defaultValue;
  });
  return state;
}

// ---- Inicializa ou recupera os parâmetros do ambiente atual ----
function loadRoom(idx) {
  if (!ROOMS[idx]) return;
  currentRoomIdx = idx;
  var room = ROOMS[idx];
  if (!projectValues[room.id]) projectValues[room.id] = createDefaultState(room);
  currentValues = projectValues[room.id];
  renderParameters();
  rebuildScene();
  updateScore();
  updateDecisionSummary();
  highlightRoomBtn(idx);
  resetView();
}

// ---- Editor paramétrico ----
function renderParameters() {
  var container = document.getElementById("parameters-container");
  if (!container) return;
  while (container.firstChild) container.removeChild(container.firstChild);

  var room = ROOMS[currentRoomIdx];
  room.parameters.forEach(function(parameter) {
    var value = currentValues[parameter.id];

    var row = document.createElement("div");
    row.className = "parameter-row";

    var label = document.createElement("label");
    label.className = "parameter-label";
    label.setAttribute("for", "param-" + parameter.id);
    label.textContent = parameter.label;

    var control = document.createElement("div");
    control.className = "parameter-control";

    if (parameter.type === "boolean") {
      var button = document.createElement("button");
      button.className = "tog" + (value ? " on" : " bad");
      button.id = "param-" + parameter.id;
      button.type = "button";
      button.setAttribute("role", "switch");
      button.setAttribute("aria-label", parameter.label);
      button.setAttribute("aria-checked", value ? "true" : "false");
      button.onclick = function() {
        updateParameter(parameter.id, !currentValues[parameter.id]);
      };
      control.appendChild(button);
    } else {
      var input = document.createElement("input");
      input.id = "param-" + parameter.id;
      input.className = "parameter-input";
      input.type = "number";
      input.min = parameter.min;
      input.max = parameter.max;
      input.step = parameter.step;
      input.value = Number(value.toFixed(3));
      input.addEventListener("change", function() {
        updateParameter(parameter.id, Number(input.value));
      });
      input.addEventListener("keydown", function(event) {
        if (event.key === "Enter") input.blur();
      });
      control.appendChild(input);

      var unit = document.createElement("span");
      unit.className = "parameter-unit";
      unit.textContent = parameter.unit || "";
      control.appendChild(unit);
    }

    row.appendChild(label);
    row.appendChild(control);
    container.appendChild(row);
  });
}

function updateParameter(parameterId, value) {
  var room = ROOMS[currentRoomIdx];
  var parameter = room.parameters.find(function(item) { return item.id === parameterId; });
  if (!parameter) return;

  if (parameter.type === "number") {
    value = Math.max(parameter.min, Math.min(parameter.max, Number(value)));
    if (!Number.isFinite(value)) value = parameter.defaultValue;
  }

  currentValues[parameterId] = value;
  projectValues[room.id] = currentValues;
  renderParameters();
  rebuildScene();
  updateScore();
  updateDecisionSummary();
}

// ---- Reconstrói cena com estado atual ----
function rebuildScene() {
  var room = ROOMS[currentRoomIdx];
  if (typeof room.build === "function") room.build(currentValues);
}

// ---- Score de conformidade (DOM seguro) ----
function updateScore() {
  var room   = ROOMS[currentRoomIdx];
  var measurements = getRoomMeasurements(room, currentValues);
  var total  = measurements.length;
  var passed = 0;

  var scoreBox = document.getElementById("score-content");
  if (!scoreBox) return;
  while (scoreBox.firstChild) scoreBox.removeChild(scoreBox.firstChild);

  measurements.forEach(function(measurement) {
    passed += measurement.ok ? 1 : 0;

    var item = document.createElement("div");
    item.className = "measurement-row";

    var head = document.createElement("div");
    head.className = "measurement-head";

    var name = document.createElement("span");
    name.className = "measurement-name";
    name.textContent = measurement.name;

    var status = document.createElement("span");
    status.className = "measurement-status " + (measurement.ok ? "ok" : "bad");
    status.textContent = measurement.ok ? "ATENDE" : "NÃO ATENDE";

    head.appendChild(name);
    head.appendChild(status);

    var values = document.createElement("div");
    values.className = "measurement-values";

    var modeled = document.createElement("span");
    modeled.textContent = "Modelado";
    var modeledValue = document.createElement("strong");
    modeledValue.textContent = measurement.actual;
    modeled.appendChild(modeledValue);

    var criterion = document.createElement("span");
    criterion.textContent = "Critério";
    var criterionValue = document.createElement("strong");
    criterionValue.textContent = measurement.required;
    criterion.appendChild(criterionValue);

    values.appendChild(modeled);
    values.appendChild(criterion);
    item.appendChild(head);
    item.appendChild(values);

    if (!measurement.ok && measurement.recommendation) {
      var recommendation = document.createElement("p");
      recommendation.className = "measurement-recommendation";
      recommendation.textContent = measurement.recommendation;
      item.appendChild(recommendation);
    }
    scoreBox.appendChild(item);
  });

  var pct   = Math.round((passed / total) * 100);
  var grade = pct === 100 ? "CONFORME" : pct >= 50 ? "PARCIAL" : "NÃO CONFORME";
  var gcls  = pct === 100 ? "ok"       : pct >= 50 ? "warn"    : "bad";

  var total_div = document.createElement("div");
  total_div.className = "score-total";

  var span = document.createElement("span");
  span.className = "sv " + gcls;
  span.textContent = pct + "% — " + grade;

  total_div.appendChild(span);
  scoreBox.appendChild(total_div);
}

function summaryMetric(label, value) {
  var metric = document.createElement("span");
  metric.textContent = label + " ";
  var strong = document.createElement("strong");
  strong.textContent = value;
  metric.appendChild(strong);
  return metric;
}

function updateDecisionSummary() {
  var container = document.getElementById("decision-summary");
  if (!container) return;
  var room = ROOMS[currentRoomIdx];
  var baseline = baselineValues[room.id] || createDefaultState(room);
  var before = getRoomMeasurements(room, baseline);
  var after = getRoomMeasurements(room, currentValues);
  var beforePassed = before.filter(function(item) { return item.ok; }).length;
  var afterPassed = after.filter(function(item) { return item.ok; }).length;
  var beforePct = Math.round(beforePassed / before.length * 100);
  var afterPct = Math.round(afterPassed / after.length * 100);
  var remaining = after.length - afterPassed;
  var improvement = afterPassed - beforePassed;

  while (container.firstChild) container.removeChild(container.firstChild);

  var heading = document.createElement("div");
  heading.className = "decision-heading";
  var headingLabel = document.createElement("span");
  headingLabel.textContent = "Resultado da revisão";
  var headingValue = document.createElement("strong");
  headingValue.textContent = afterPassed + "/" + after.length + " critérios";
  heading.appendChild(headingLabel);
  heading.appendChild(headingValue);

  var track = document.createElement("div");
  track.className = "decision-track";
  var bar = document.createElement("span");
  bar.style.width = afterPct + "%";
  bar.className = afterPct === 100 ? "complete" : afterPct >= 50 ? "partial" : "critical";
  track.appendChild(bar);

  var comparison = document.createElement("div");
  comparison.className = "decision-comparison";
  comparison.appendChild(summaryMetric("Cenário inicial", beforePct + "%"));
  comparison.appendChild(summaryMetric("Projeto atual", afterPct + "%"));

  var impact = document.createElement("p");
  impact.className = "decision-impact";
  if (remaining === 0 && improvement > 0) {
    impact.textContent = improvement + " incompatibilidade(s) eliminada(s) antes da execução.";
  } else if (remaining === 0) {
    impact.textContent = "O cenário informado atende aos critérios selecionados.";
  } else if (improvement > 0) {
    impact.textContent = improvement + " correção(ões) incorporada(s); " + remaining + " pendência(s) permanecem.";
  } else {
    impact.textContent = remaining + " incompatibilidade(s) com potencial de retrabalho identificada(s).";
  }

  container.appendChild(heading);
  container.appendChild(track);
  container.appendChild(comparison);
  container.appendChild(impact);
}

function applyCorrections() {
  var room = ROOMS[currentRoomIdx];
  applyRecommendedValues(room, currentValues);
  projectValues[room.id] = currentValues;
  renderParameters();
  rebuildScene();
  updateScore();
  updateDecisionSummary();
  switchTab("score");
}

function buildReportText() {
  var projectBeforePassed = 0;
  var projectAfterPassed = 0;
  var projectTotal = 0;
  var lines = [
    "DIAGNÓSTICO DE PRÉ-AUDITORIA DE ACESSIBILIDADE",
    "Escala do modelo: 1 unidade = 1 metro",
    "",
  ];

  ROOMS.forEach(function(room) {
    var values = projectValues[room.id] || createDefaultState(room);
    var baseline = baselineValues[room.id] || createDefaultState(room);
    var measurements = getRoomMeasurements(room, values);
    var baselineMeasurements = getRoomMeasurements(room, baseline);
    var passed = measurements.filter(function(item) { return item.ok; }).length;
    var baselinePassed = baselineMeasurements.filter(function(item) { return item.ok; }).length;
    projectBeforePassed += baselinePassed;
    projectAfterPassed += passed;
    projectTotal += measurements.length;

    lines.push("AMBIENTE: " + room.label.toUpperCase());
    lines.push("Cenário inicial: " + baselinePassed + "/" + baselineMeasurements.length + " critérios atendidos");
    lines.push("Projeto revisado: " + passed + "/" + measurements.length + " critérios atendidos");
    lines.push("Incompatibilidades eliminadas: " + Math.max(0, passed - baselinePassed));
    lines.push("");

    measurements.forEach(function(item, index) {
      lines.push((index + 1) + ". " + item.name);
      lines.push("   Modelado: " + item.actual);
      lines.push("   Critério: " + item.required);
      lines.push("   Status: " + (item.ok ? "ATENDE" : "NÃO ATENDE"));
      if (!item.ok) lines.push("   Correção: " + item.recommendation);
      lines.push("");
    });
  });

  lines.splice(3, 0,
    "RESUMO DA DECISÃO",
    "Cenário inicial: " + projectBeforePassed + "/" + projectTotal + " critérios atendidos",
    "Projeto revisado: " + projectAfterPassed + "/" + projectTotal + " critérios atendidos",
    "Incompatibilidades eliminadas: " + Math.max(0, projectAfterPassed - projectBeforePassed),
    ""
  );
  lines.push("Documento educacional. Não substitui projeto executivo ou laudo profissional.");
  return lines.join("\n");
}

function exportReport() {
  var blob = new Blob([buildReportText()], { type: "text/plain;charset=utf-8" });
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.href = url;
  link.download = "diagnostico-acessibilidade.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ---- Tabs ----
function switchTab(name) {
  document.querySelectorAll(".panel").forEach(function(p) { p.classList.remove("active"); });
  document.querySelectorAll(".tab").forEach(function(t)   { t.classList.remove("active"); });
  var panel = document.getElementById("panel-" + name);
  if (panel) panel.classList.add("active");
  var tabMap = { ambiente: 0, score: 1, teoria: 2 };
  var tabs = document.querySelectorAll(".tab");
  if (tabs[tabMap[name]]) tabs[tabMap[name]].classList.add("active");
}

// ---- Minimiza/expande o painel sem cobrir a cena ----
function toggleHud() {
  var hud = document.getElementById("hud");
  var button = document.getElementById("hud-toggle");
  if (!hud || !button) return;

  var minimized = hud.classList.toggle("minimized");
  button.textContent = minimized ? "+" : "−";
  button.setAttribute("aria-expanded", minimized ? "false" : "true");
  button.setAttribute("aria-label", minimized ? "Expandir menu" : "Minimizar menu");
}

function initHudResize() {
  var hud = document.getElementById("hud");
  var handle = document.getElementById("hud-resizer");
  if (!hud || !handle) return;

  var storageKey = "accessibility-vr-hud-size";
  var minimumWidth = 300;
  var minimumHeight = 260;
  var start = null;

  function saveSize() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        width: hud.getBoundingClientRect().width,
        height: hud.getBoundingClientRect().height,
      }));
    } catch (error) {
      // Persistência é um aprimoramento, não um requisito para redimensionar.
    }
  }

  function setSize(width, height) {
    hud.style.width = Math.max(minimumWidth, Math.min(window.innerWidth - 24, width)) + "px";
    hud.style.height = Math.max(minimumHeight, Math.min(window.innerHeight - 24, height)) + "px";
  }

  try {
    var saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && Number.isFinite(saved.width) && Number.isFinite(saved.height)) {
      hud.style.width = Math.min(saved.width, window.innerWidth - 24) + "px";
      hud.style.height = Math.min(saved.height, window.innerHeight - 24) + "px";
    }
  } catch (error) {
    // O redimensionamento continua funcional mesmo com armazenamento indisponível.
  }

  handle.addEventListener("pointerdown", function (event) {
    if (hud.classList.contains("minimized")) return;
    start = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      width: hud.getBoundingClientRect().width,
      height: hud.getBoundingClientRect().height,
    };
    handle.setPointerCapture(event.pointerId);
    hud.classList.add("is-resizing");
    event.preventDefault();
  });

  handle.addEventListener("pointermove", function (event) {
    if (!start || event.pointerId !== start.pointerId) return;
    setSize(
      start.width + event.clientX - start.x,
      start.height + event.clientY - start.y
    );
  });

  function finishResize(event) {
    if (!start || event.pointerId !== start.pointerId) return;
    handle.releasePointerCapture(event.pointerId);
    hud.classList.remove("is-resizing");
    start = null;
    saveSize();
  }

  handle.addEventListener("pointerup", finishResize);
  handle.addEventListener("pointercancel", finishResize);
  handle.addEventListener("keydown", function (event) {
    var delta = event.shiftKey ? 50 : 20;
    var rect = hud.getBoundingClientRect();
    var width = rect.width;
    var height = rect.height;

    if (event.key === "ArrowRight") width += delta;
    else if (event.key === "ArrowLeft") width -= delta;
    else if (event.key === "ArrowDown") height += delta;
    else if (event.key === "ArrowUp") height -= delta;
    else return;

    setSize(width, height);
    saveSize();
    event.preventDefault();
  });
}

// ---- Highlight botão de ambiente ----
function highlightRoomBtn(idx) {
  document.querySelectorAll(".rbtn").forEach(function(b, i) {
    b.classList.toggle("active", i === idx);
    b.setAttribute("aria-pressed", i === idx ? "true" : "false");
  });
}

// ---- Retorna a câmera ao ponto inicial do ambiente ----
function resetView() {
  var rig = document.getElementById("rig");
  var camera = document.querySelector("a-camera");
  var view = ROOM_VIEWS[currentRoomIdx];
  if (!rig || !camera || !view) return;

  rig.setAttribute("position", view.position);
  rig.setAttribute("rotation", view.rotation);
  camera.setAttribute("position", "0 1.2 0");
  camera.setAttribute("rotation", "0 0 0");

  var lookControls = camera.components && camera.components["look-controls"];
  if (lookControls) {
    lookControls.pitchObject.rotation.x = 0;
    lookControls.yawObject.rotation.y = 0;
  }
}

// ---- Init ----
document.addEventListener("DOMContentLoaded", function() {
  var sceneEl = document.querySelector("a-scene");
  var status = document.getElementById("app-status");
  initHudResize();

  function startApp() {
    if (appStarted) return;
    appStarted = true;
    ROOMS.forEach(function(room) {
      if (!projectValues[room.id]) projectValues[room.id] = createDefaultState(room);
      if (!baselineValues[room.id]) baselineValues[room.id] = createDefaultState(room);
    });
    loadRoom(0);
    if (status) {
      status.textContent = "Ambiente 3D pronto";
      status.classList.add("ready");
      setTimeout(function() { status.classList.add("hidden"); }, 1800);
    }
  }

  if (typeof AFRAME === "undefined" || !sceneEl) {
    if (status) {
      status.textContent = "Não foi possível iniciar o ambiente 3D.";
      status.classList.add("error");
    }
    return;
  }

  if (sceneEl.hasLoaded) startApp();
  else sceneEl.addEventListener("loaded", startApp, { once: true });
});
