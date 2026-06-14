const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

function createNavigationContext() {
  const registeredComponents = {};
  const context = {
    console,
    navigator: {},
    window: {
      addEventListener() {},
      clearTimeout() {},
      setTimeout() {},
    },
    document: {
      getElementById() {
        return null;
      },
    },
    AFRAME: {
      registerComponent(name, definition) {
        registeredComponents[name] = definition;
      },
    },
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
  vm.runInContext(fs.readFileSync("js/navigation.js", "utf8"), context, {
    filename: "js/navigation.js",
  });
  vm.runInContext(`
    currentRoomIdx = 0;
    currentValues = {};
    ROOMS[0].parameters.forEach(function (parameter) {
      currentValues[parameter.id] = parameter.defaultValue;
    });
  `, context);

  return context;
}

function navigationState(context) {
  return vm.runInContext(`
    ({
      config: getNavigationConfig(),
      values: currentValues,
      rampStart: 4.5 - currentValues.rampLength
    })
  `, context);
}

test("blocks a wheelchair from entering a nonconforming ramp", () => {
  const context = createNavigationContext();
  const state = navigationState(context);
  const result = context.window.navigationOccupancyResult(
    state.config,
    state.rampStart,
    0,
    0.28
  );

  assert.equal(result.allowed, false);
  assert.match(result.reason, /Rota bloqueada/);
});

test("corrected ramp is continuous and blocks rails and platform steps", () => {
  const context = createNavigationContext();
  vm.runInContext("applyRecommendedValues(ROOMS[0], currentValues);", context);
  const state = navigationState(context);
  const check = context.window.navigationOccupancyResult;
  const halfWidth = state.values.rampWidth / 2;

  assert.equal(check(state.config, state.rampStart + 0.50, 0, 0.28).allowed, true);
  assert.equal(check(state.config, 4.52, 0, 0.28).allowed, true);
  assert.equal(
    check(state.config, state.rampStart + 1, halfWidth + 0.09, 0.28).allowed,
    false
  );
  assert.equal(check(state.config, 4.52, 1.30, 0.28).allowed, false);
  assert.equal(state.config.floorHeight(state.rampStart, 0), 0);
  assert.equal(state.config.floorHeight(4.5, 0), state.values.rampRise);
  assert.equal(state.config.floorHeight(4.52, 0), state.values.rampRise);
});

test("corridor equipment remains within the technical strip at 0.10 m", () => {
  const context = createNavigationContext();
  vm.runInContext(`
    currentRoomIdx = 1;
    currentValues = {};
    ROOMS[1].parameters.forEach(function (parameter) {
      currentValues[parameter.id] = parameter.defaultValue;
    });
    applyRecommendedValues(ROOMS[1], currentValues);
  `, context);

  const result = vm.runInContext(`
    ({
      depth: currentValues.obstacleDepth,
      measurements: getRoomMeasurements(ROOMS[1], currentValues),
      config: getNavigationConfig()
    })
  `, context);

  assert.equal(result.depth, 0.10);
  assert.equal(result.measurements.find((item) => item.id === "obstacleDepth").ok, true);
  assert.equal(result.config.boxes.length, 0);
  assert.equal(
    context.window.navigationCanOccupy(
      result.config,
      3,
      0,
      0.28
    ),
    true
  );
});

test("corridor equipment gets physical colliders above 0.10 m", () => {
  const context = createNavigationContext();
  vm.runInContext(`
    currentRoomIdx = 1;
    currentValues = {};
    ROOMS[1].parameters.forEach(function (parameter) {
      currentValues[parameter.id] = parameter.defaultValue;
    });
  `, context);

  const result = vm.runInContext("getNavigationConfig()", context);
  assert.equal(result.boxes.length, 2);
  assert.match(result.boxes[0].reason, /extintor/);
  assert.match(result.boxes[1].reason, /Quadro/);
});
