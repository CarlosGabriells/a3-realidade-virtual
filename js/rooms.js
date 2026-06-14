/*
 * Catálogo de ambientes e regras da pré-auditoria.
 * A modelagem visual fica isolada em js/environments.
 */
var ROOMS = [
  {
    id: "entrada",
    label: "Entrada / Rampa",
    parameters: [
      { id: "rampRise", label: "Desnível", unit: "m", type: "number", min: 0.10, max: 0.80, step: 0.01, defaultValue: 0.50 },
      { id: "rampLength", label: "Comprimento da rampa", unit: "m", type: "number", min: 1, max: 12, step: 0.10, defaultValue: 4.50 },
      { id: "rampWidth", label: "Largura da rampa", unit: "m", type: "number", min: 0.80, max: 2.40, step: 0.05, defaultValue: 1 },
      { id: "doorWidth", label: "Vão livre da porta", unit: "m", type: "number", min: 0.50, max: 1.40, step: 0.05, defaultValue: 0.65 },
      { id: "threshold", label: "Ressalto na entrada", unit: "m", type: "number", min: 0, max: 0.15, step: 0.01, defaultValue: 0 },
      { id: "handrails", label: "Corrimãos bilaterais duplos", type: "boolean", defaultValue: false },
    ],
    build: buildEntrada,
  },
  {
    id: "corredor",
    label: "Corredor",
    parameters: [
      { id: "width", label: "Largura livre", unit: "m", type: "number", min: 0.70, max: 2.50, step: 0.05, defaultValue: 0.90 },
      { id: "obstacleDepth", label: "Saliência de obstáculo", unit: "m", type: "number", min: 0, max: 0.45, step: 0.01, defaultValue: 0.25 },
      { id: "tactile", label: "Sinalização tátil", type: "boolean", defaultValue: false },
    ],
    build: buildCorredor,
  },
  {
    id: "banheiro",
    label: "Banheiro",
    parameters: [
      { id: "roomWidth", label: "Largura do banheiro", unit: "m", type: "number", min: 1.50, max: 4.50, step: 0.05, defaultValue: 2.20 },
      { id: "roomDepth", label: "Profundidade do banheiro", unit: "m", type: "number", min: 1.70, max: 4.50, step: 0.05, defaultValue: 2.30 },
      { id: "turnDiameter", label: "Diâmetro livre de giro", unit: "m", type: "number", min: 0.80, max: 2.20, step: 0.05, defaultValue: 1.10 },
      { id: "doorWidth", label: "Vão livre da porta", unit: "m", type: "number", min: 0.50, max: 1.20, step: 0.05, defaultValue: 0.70 },
      { id: "sinkHeight", label: "Altura do lavatório", unit: "m", type: "number", min: 0.65, max: 1.10, step: 0.01, defaultValue: 0.95 },
      { id: "grabBars", label: "Barras de apoio", type: "boolean", defaultValue: false },
      { id: "pedestal", label: "Lavatório com coluna", type: "boolean", defaultValue: true },
    ],
    build: buildBanheiro,
  },
];

var MODEL_RULES = Object.freeze({
  CORRIDOR_MAX_PROJECTION: 0.10,
  BATHROOM_LAYOUT_WIDTH: 2.60,
  BATHROOM_LAYOUT_DEPTH: 2.50,
  SINK_MIN_HEIGHT: 0.80,
  SINK_MAX_HEIGHT: 0.85,
  SINK_RECOMMENDED_HEIGHT: 0.83,
});

function formatMeters(value) {
  return value.toFixed(2).replace(".", ",") + " m";
}

function measurement(id, name, actual, required, ok, recommendation) {
  return {
    id: id,
    name: name,
    actual: actual,
    required: required,
    ok: ok,
    recommendation: recommendation,
  };
}

function getRoomMeasurements(room, values) {
  if (room.id === "entrada") {
    var inclination = (values.rampRise / values.rampLength) * 100;
    var requiredLength = Math.ceil((values.rampRise / NBR.RAMPA_MAX_INCL) * 100) / 100;
    return [
      measurement("rampSlope", "Inclinação da rampa",
        inclination.toFixed(2).replace(".", ",") + "%", "≤ 8,33%",
        inclination <= 8.34,
        "Aumentar o comprimento para " + formatMeters(requiredLength) + " ou reduzir o desnível."),
      measurement("rampWidth", "Largura livre da rampa", formatMeters(values.rampWidth), "≥ 1,20 m",
        values.rampWidth >= 1.20, "Ampliar a largura livre para pelo menos 1,20 m."),
      measurement("doorWidth", "Vão livre da porta", formatMeters(values.doorWidth), "≥ 0,80 m",
        values.doorWidth >= NBR.PORTA_MIN, "Especificar porta com vão livre mínimo de 0,80 m."),
      measurement("threshold", "Ressalto na rota", formatMeters(values.threshold), "≤ 0,005 m",
        values.threshold <= 0.005, "Eliminar o ressalto e nivelar a soleira."),
      measurement("handrails", "Corrimãos",
        values.handrails ? "Bilateral · 0,70/0,92 m" : "Ausentes", "Bilateral · duas alturas",
        values.handrails, "Instalar corrimãos bilaterais conectados, com duas alturas e prolongamentos."),
    ];
  }

  if (room.id === "corredor") {
    return [
      measurement("width", "Largura livre", formatMeters(values.width), "≥ 1,20 m",
        values.width >= NBR.CORREDOR_MIN, "Aumentar a faixa de circulação para no mínimo 1,20 m."),
      measurement("obstacleDepth", "Saliência na circulação", formatMeters(values.obstacleDepth), "≤ 0,10 m",
        values.obstacleDepth <= MODEL_RULES.CORRIDOR_MAX_PROJECTION,
        "Embutir ou realocar o equipamento para limitar a saliência a 0,10 m."),
      measurement("tactile", "Sinalização tátil", values.tactile ? "Faixa de 0,30 m" : "Ausente",
        "Tátil + contraste", values.tactile,
        "Adicionar sinalização tátil direcional com contraste visual."),
    ];
  }

  return [
    measurement("roomSize", "Dimensões internas",
      formatMeters(values.roomWidth) + " × " + formatMeters(values.roomDepth), "≥ 1,50 × 1,70 m",
      values.roomWidth >= NBR.BANHEIRO_MIN_L && values.roomDepth >= NBR.BANHEIRO_MIN_P,
      "Ampliar o ambiente para pelo menos 1,50 × 1,70 m."),
    measurement("turnDiameter", "Diâmetro de giro", "Ø " + formatMeters(values.turnDiameter), "Ø ≥ 1,50 m",
      values.turnDiameter >= NBR.GIRO_CADEIRANTE,
      "Liberar um círculo de giro com diâmetro mínimo de 1,50 m."),
    measurement("functionalLayout", "Arranjo funcional simulado",
      formatMeters(values.roomWidth) + " × " + formatMeters(values.roomDepth), "≥ 2,60 × 2,50 m nesta planta",
      values.roomWidth >= MODEL_RULES.BATHROOM_LAYOUT_WIDTH &&
        values.roomDepth >= MODEL_RULES.BATHROOM_LAYOUT_DEPTH,
      "Ampliar para 2,60 × 2,50 m ou reposicionar as peças para não invadir a manobra."),
    measurement("doorWidth", "Vão livre da porta", formatMeters(values.doorWidth), "≥ 0,80 m",
      values.doorWidth >= NBR.PORTA_MIN, "Aumentar o vão livre da porta para pelo menos 0,80 m."),
    measurement("sink", "Lavatório",
      formatMeters(values.sinkHeight) + " · " + (values.pedestal ? "com coluna" : "suspenso"),
      "0,80–0,85 m · livre",
      values.sinkHeight >= MODEL_RULES.SINK_MIN_HEIGHT &&
        values.sinkHeight <= MODEL_RULES.SINK_MAX_HEIGHT &&
        !values.pedestal,
      "Usar lavatório suspenso entre 0,80 m e 0,85 m."),
    measurement("grabBars", "Barras de apoio",
      values.grabBars ? "Horizontais · lateral e fundo" : "Ausentes", "Obrigatórias",
      values.grabBars, "Instalar barras horizontais conectadas nas paredes lateral e de fundo."),
  ];
}

function applyRecommendedValues(room, values) {
  if (room.id === "entrada") {
    values.rampLength = Math.max(
      values.rampLength,
      Math.ceil((values.rampRise / NBR.RAMPA_MAX_INCL) * 100) / 100
    );
    values.rampWidth = Math.max(values.rampWidth, 1.20);
    values.doorWidth = Math.max(values.doorWidth, NBR.PORTA_MIN);
    values.threshold = 0;
    values.handrails = true;
    return;
  }
  if (room.id === "corredor") {
    values.width = Math.max(values.width, NBR.CORREDOR_MIN);
    values.obstacleDepth = Math.min(values.obstacleDepth, MODEL_RULES.CORRIDOR_MAX_PROJECTION);
    values.tactile = true;
    return;
  }
  values.roomWidth = Math.max(values.roomWidth, MODEL_RULES.BATHROOM_LAYOUT_WIDTH);
  values.roomDepth = Math.max(values.roomDepth, MODEL_RULES.BATHROOM_LAYOUT_DEPTH);
  values.turnDiameter = Math.max(values.turnDiameter, NBR.GIRO_CADEIRANTE);
  values.doorWidth = Math.max(values.doorWidth, NBR.PORTA_MIN);
  values.sinkHeight = MODEL_RULES.SINK_RECOMMENDED_HEIGHT;
  values.grabBars = true;
  values.pedestal = false;
}

function navigationBox(minX, maxX, minZ, maxZ, reason) {
  return {
    minX: minX,
    maxX: maxX,
    minZ: minZ,
    maxZ: maxZ,
    reason: reason || "Obstáculo físico à frente.",
  };
}

function entranceRouteIsAccessible(values) {
  return values.rampRise / values.rampLength <= NBR.RAMPA_MAX_INCL &&
    values.rampWidth >= 1.20 &&
    values.doorWidth >= NBR.PORTA_MIN &&
    values.threshold <= 0.005 &&
    values.handrails;
}

function getNavigationConfig() {
  var room = ROOMS[currentRoomIdx];
  var values = currentValues;
  var boxes = [];
  var circles = [];
  var bounds;
  var floorHeight = function () { return 0; };

  if (room.id === "entrada") {
    bounds = { minX: -6.8, maxX: 7.15, minZ: -2.85, maxZ: 2.85 };
    var rampStart = 4.5 - values.rampLength;
    var rampHalfWidth = values.rampWidth / 2;
    var railOffset = rampHalfWidth + 0.09;
    var edgeReason = "Limite lateral da rampa: a cadeira não pode atravessar o corrimão.";
    var stepReason = "Desnível sem rota acessível: utilize a rampa após corrigir o projeto.";

    // As laterais da rampa são barreiras físicas, com ou sem corrimãos instalados.
    boxes.push(navigationBox(
      rampStart - 0.32, 4.82,
      railOffset - 0.055, railOffset + 0.055,
      edgeReason
    ));
    boxes.push(navigationBox(
      rampStart - 0.32, 4.82,
      -railOffset - 0.055, -railOffset + 0.055,
      edgeReason
    ));

    // A face elevada do patamar é um degrau fora da faixa ocupada pela rampa.
    boxes.push(navigationBox(
      4.46, 4.62,
      bounds.minZ, -rampHalfWidth,
      stepReason
    ));
    boxes.push(navigationBox(
      4.46, 4.62,
      rampHalfWidth, bounds.maxZ,
      stepReason
    ));

    if (!entranceRouteIsAccessible(values)) {
      boxes.push(navigationBox(
        rampStart - 0.06, rampStart + 0.12,
        -rampHalfWidth, rampHalfWidth,
        "Rota bloqueada para cadeira de rodas: corrija inclinação, largura, porta, soleira e corrimãos."
      ));
    }

    if (values.threshold > 0.005) {
      boxes.push(navigationBox(
        6.98, 7.28,
        -values.doorWidth / 2, values.doorWidth / 2,
        "Soleira acima do limite transitável para cadeira de rodas."
      ));
    }
    floorHeight = function (x, z) {
      if (x >= rampStart && x <= 4.5 && Math.abs(z) <= rampHalfWidth) {
        return ((x - rampStart) / values.rampLength) * values.rampRise;
      }
      return x > 4.5 ? values.rampRise : 0;
    };
  } else if (room.id === "corredor") {
    bounds = {
      minX: -1.75,
      maxX: 11.75,
      minZ: -values.width / 2 + 0.10,
      maxZ: values.width / 2 - 0.10,
    };
    if (values.obstacleDepth > MODEL_RULES.CORRIDOR_MAX_PROJECTION) {
      boxes.push(navigationBox(
        2.77, 3.23,
        values.width / 2 - values.obstacleDepth, values.width / 2,
        "Abrigo do extintor projetado sobre a faixa de circulação."
      ));
      boxes.push(navigationBox(
        5.69, 6.51,
        values.width / 2 - values.obstacleDepth, values.width / 2,
        "Quadro de serviço projetado sobre a faixa de circulação."
      ));
    }
  } else {
    var halfWidth = values.roomWidth / 2;
    bounds = {
      minX: -halfWidth + 0.12,
      maxX: halfWidth - 0.12,
      minZ: -values.roomDepth + 0.12,
      maxZ: 1.40,
    };
    circles.push({ x: -halfWidth + 0.48, z: -values.roomDepth + 0.62, radius: 0.42 });
    boxes.push(navigationBox(
      halfWidth - 0.78, halfWidth - 0.08,
      -0.84, -0.12,
      "Lavatório ocupando a área de circulação."
    ));
  }

  return { bounds: bounds, boxes: boxes, circles: circles, floorHeight: floorHeight };
}
