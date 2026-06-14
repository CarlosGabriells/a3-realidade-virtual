(function () {
  "use strict";
  var B = SceneBuilder;

  function rampWedge(parent, startX, length, width, rise, color) {
    var halfLength = length / 2;
    var halfWidth = width / 2;
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array([
      -halfLength, 0, -halfWidth, halfLength, 0, -halfWidth, halfLength, rise, -halfWidth,
      -halfLength, 0, halfWidth, halfLength, 0, halfWidth, halfLength, rise, halfWidth,
    ]), 3));
    geometry.setIndex([0, 1, 2, 3, 5, 4, 0, 3, 4, 0, 4, 1, 1, 4, 5, 1, 5, 2, 2, 5, 3, 2, 3, 0]);
    geometry.computeVertexNormals();
    var mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: color, roughness: 0.88 })
    );
    mesh.position.set(startX + halfLength, 0, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    var entity = B.primitive(parent, "a-entity", {});
    entity.setObject3D("mesh", mesh);
  }

  function facade(parent, rise, doorWidth) {
    var sideDepth = (8 - doorWidth) / 2;
    B.box(parent, "7.55 1.35 " + (-4 + sideDepth / 2), 0.24, 2.7, sideDepth, "#d8dee0");
    B.box(parent, "7.55 1.35 " + (4 - sideDepth / 2), 0.24, 2.7, sideDepth, "#d8dee0");
    B.box(parent, "7.55 2.47 0", 0.22, 0.46, doorWidth, COLORS.wall);
    B.doorFrame(parent, 7.42, 0, doorWidth, 2.18, 90, "#394750");
    B.box(parent, "7.40 1.08 " + (doorWidth / 2), 0.055, 2.12, doorWidth, "#76513b", {
      rotation: "0 -58 0",
      roughness: 0.58,
    });
    B.sphere(parent, "7.05 1.05 " + (doorWidth * 0.73), 0.035, "#d7bd72", {
      metalness: 0.75,
      roughness: 0.18,
    });
    B.box(parent, "8.35 1.35 -3.75", 1.6, 2.7, 0.5, "#b9cbd8");
    B.box(parent, "8.35 1.35 3.75", 1.6, 2.7, 0.5, "#b9cbd8");
    B.box(parent, "8.15 2.78 0", 1.75, 0.18, 8.4, "#465963");
    [-2.4, 2.4].forEach(function (z) {
      B.box(parent, "7.40 1.45 " + z, 0.035, 1.50, 2.20, COLORS.glass, {
        opacity: 0.32,
        metalness: 0.28,
        roughness: 0.12,
      });
      B.box(parent, "7.37 1.45 " + z, 0.05, 1.58, 0.045, "#40515c");
      B.box(parent, "7.37 1.45 " + (z - 1.10), 0.05, 1.58, 0.045, "#40515c");
      B.box(parent, "7.37 1.45 " + (z + 1.10), 0.05, 1.58, 0.045, "#40515c");
      B.box(parent, "7.37 0.68 " + z, 0.05, 0.045, 2.24, "#40515c");
      B.box(parent, "7.37 2.22 " + z, 0.05, 0.045, 2.24, "#40515c");
    });
    // O topo do patamar coincide exatamente com o último vértice da rampa.
    B.box(parent, "6.02 " + (rise - 0.08) + " 0", 3.05, 0.16, 6.4, COLORS.concreteDark);
    B.box(parent, "6.55 3.08 0", 2.7, 0.12, 4.7, "#536873");
    [-2.15, 2.15].forEach(function (z) {
      B.cylinder(parent, "5.35 1.53 " + z, 0.065, 3.06, "#52636d", {
        metalness: 0.42,
        roughness: 0.30,
      });
      B.postFoot(parent, 5.35, rise + 0.02, z, "#36434b");
    });
  }

  function handrails(parent, startX, length, width, rise) {
    var endX = startX + length;
    var railOptions = { metalness: 0.68, roughness: 0.25 };
    [-width / 2 - 0.09, width / 2 + 0.09].forEach(function (z) {
      [NBR.CORRIMAO_BAIXO, NBR.CORRIMAO_ALTO].forEach(function (height) {
        B.beam(parent, [startX - 0.30, height, z], [endX + 0.30, height + rise, z],
          0.026, COLORS.metal, railOptions);
      });
      [startX, startX + length / 2, endX].forEach(function (x) {
        var rampY = ((x - startX) / length) * rise;
        B.beam(parent, [x, rampY + 0.08, z], [x, rampY + NBR.CORRIMAO_ALTO, z],
          0.028, COLORS.metal, railOptions);
        B.postFoot(parent, x, rampY + 0.015, z);
      });
      B.beam(parent, [startX, 0.40, z], [endX, rise + 0.40, z], 0.018, COLORS.darkMetal, railOptions);
      B.beam(parent, [startX - 0.30, NBR.CORRIMAO_BAIXO, z],
        [startX - 0.30, NBR.CORRIMAO_ALTO, z], 0.026, COLORS.metal, railOptions);
      B.beam(parent, [endX + 0.30, rise + NBR.CORRIMAO_BAIXO, z],
        [endX + 0.30, rise + NBR.CORRIMAO_ALTO, z], 0.026, COLORS.metal, railOptions);
    });
  }

  window.buildEntrada = function (values) {
    var root = B.clearRoom();
    if (!root) return;
    var rise = values.rampRise;
    var length = values.rampLength;
    var width = values.rampWidth;
    var startX = 4.5 - length;
    var rampOk = rise / length <= NBR.RAMPA_MAX_INCL && width >= 1.20;

    B.plane(root, "0 0 0", "-90 0 0", 22, 12, "#4e704f");
    B.box(root, "-5 0.04 0", 4, 0.08, 7.2, "#c4c9cc");
    B.tileFloor(root, -5, 0, 4, 7.2, "#c8ced1");
    facade(root, rise, values.doorWidth);
    rampWedge(root, startX, length, width, rise, rampOk ? COLORS.concrete : "#a85f5a");
    B.box(root, (startX + length / 2) + " 0.012 " + (-width / 2 + 0.045),
      length, 0.025, 0.09, rampOk ? COLORS.good : COLORS.bad, { cast: false });
    B.box(root, (startX + length / 2) + " 0.012 " + (width / 2 - 0.045),
      length, 0.025, 0.09, rampOk ? COLORS.good : COLORS.bad, { cast: false });

    for (var x = startX + 1; x < 4.5; x += 1) {
      var y = ((x - startX) / length) * rise + 0.035;
      B.beam(root, [x, y, -width / 2], [x, y, width / 2], 0.008, "#68767e");
    }
    if (values.handrails) handrails(root, startX, length, width, rise);
    if (values.threshold > 0.005) {
      B.box(root, "7.15 " + (rise + values.threshold / 2) + " 0", 0.24,
        values.threshold, values.doorWidth, COLORS.bad);
    }

    for (var drainZ = -2.4; drainZ <= 2.4; drainZ += 0.16) {
      B.box(root, "-2.95 0.095 " + drainZ, 0.30, 0.018, 0.055, "#30393e", {
        metalness: 0.55,
        cast: false,
      });
    }
    [-3.8, 3.8].forEach(function (z) {
      B.cylinder(root, "-0.8 0.42 " + z, 0.34, 0.78, "#5d6d3f", {
        segments: 18,
        roughness: 0.95,
      });
      B.cylinder(root, "-0.8 0.86 " + z, 0.47, 0.54, "#477049", {
        segments: 18,
        roughness: 0.95,
      });
    });
  };
})();
