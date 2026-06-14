const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

function createRulesContext() {
  const context = {
    buildEntrada() {},
    buildCorredor() {},
    buildBanheiro() {},
    NBR: {
      CORREDOR_MIN: 1.20,
      PORTA_MIN: 0.80,
      RAMPA_MAX_INCL: 0.0833,
      CORRIMAO_BAIXO: 0.70,
      CORRIMAO_ALTO: 0.92,
      GIRO_CADEIRANTE: 1.50,
      BANHEIRO_MIN_L: 1.50,
      BANHEIRO_MIN_P: 1.70,
    },
  };

  vm.createContext(context);
  vm.runInContext(fs.readFileSync("js/rooms.js", "utf8"), context, {
    filename: "js/rooms.js",
  });
  return context;
}

function evaluateScores(context, corrected) {
  return vm.runInContext(`
    ROOMS.map(function (room) {
      var values = {};
      room.parameters.forEach(function (parameter) {
        values[parameter.id] = parameter.defaultValue;
      });
      ${corrected ? "applyRecommendedValues(room, values);" : ""}
      var measurements = getRoomMeasurements(room, values);
      return {
        id: room.id,
        passed: measurements.filter(function (item) { return item.ok; }).length,
        total: measurements.length,
        values: values
      };
    })
  `, context);
}

test("initial scenarios expose the intended engineering problems", () => {
  const scores = evaluateScores(createRulesContext(), false);
  const summary = scores.map(({ id, passed, total }) => ({ id, passed, total }));
  assert.deepEqual(
    JSON.parse(JSON.stringify(summary)),
    [
      { id: "entrada", passed: 1, total: 5 },
      { id: "corredor", passed: 0, total: 3 },
      { id: "banheiro", passed: 1, total: 6 },
    ]
  );
});

test("recommended values satisfy all 14 implemented criteria", () => {
  const scores = evaluateScores(createRulesContext(), true);
  assert.equal(scores.reduce((sum, room) => sum + room.passed, 0), 14);
  assert.equal(scores.reduce((sum, room) => sum + room.total, 0), 14);
});

test("corrections keep corridor equipment visible at 0.10 m", () => {
  const scores = evaluateScores(createRulesContext(), true);
  const corridor = scores.find((room) => room.id === "corredor");
  assert.equal(corridor.values.obstacleDepth, 0.10);
});

test("bathroom correction uses the documented functional layout", () => {
  const scores = evaluateScores(createRulesContext(), true);
  const bathroom = scores.find((room) => room.id === "banheiro");
  assert.equal(bathroom.values.roomWidth, 2.60);
  assert.equal(bathroom.values.roomDepth, 2.50);
  assert.equal(bathroom.values.grabBars, true);
  assert.equal(bathroom.values.pedestal, false);
});
