(function () {
  "use strict";
  var B = SceneBuilder;

  function mountingProfile(half, depth) {
    var faceThickness = 0.01;
    if (depth <= 0) {
      return {
        bodyDepth: 0.04,
        bodyCenter: half + 0.02,
        faceCenter: half + faceThickness / 2,
      };
    }
    var bodyDepth = Math.max(0.01, depth - faceThickness);
    return {
      bodyDepth: bodyDepth,
      bodyCenter: half - bodyDepth / 2,
      faceCenter: half - depth + faceThickness / 2,
    };
  }

  function fireCabinet(parent, x, half, depth, compliant) {
    var group = B.primitive(parent, "a-entity", {
      "data-corridor-obstacle": "extintor",
    });
    var profile = mountingProfile(half, depth);
    var frameColor = compliant ? "#596970" : COLORS.bad;

    B.box(group, x + " 1.02 " + profile.bodyCenter, 0.42, 0.76, profile.bodyDepth, frameColor, {
      metalness: 0.18,
      roughness: 0.48,
    });
    B.box(group, x + " 1.02 " + profile.faceCenter, 0.34, 0.66, 0.01, "#d9e6e8", {
      opacity: 0.42,
      metalness: 0.12,
      roughness: 0.18,
      cast: false,
    });
    B.box(group, x + " 0.98 " + (profile.faceCenter + 0.006), 0.17, 0.38, 0.004, "#c93434", {
      roughness: 0.52,
      cast: false,
    });
    B.box(group, x + " 1.25 " + (profile.faceCenter + 0.006), 0.22, 0.06, 0.004, "#f4f6f7", {
      cast: false,
    });
  }

  function serviceCabinet(parent, x, half, depth, compliant) {
    var group = B.primitive(parent, "a-entity", {
      "data-corridor-obstacle": "quadro",
    });
    var profile = mountingProfile(half, depth);
    var cabinetColor = compliant ? "#62747d" : COLORS.bad;

    B.box(group, x + " 1.58 " + profile.bodyCenter, 0.78, 0.44, profile.bodyDepth, cabinetColor, {
      metalness: 0.28,
      roughness: 0.42,
    });
    B.box(group, x + " 1.58 " + profile.faceCenter, 0.62, 0.30, 0.01, "#eef2f3", {
      cast: false,
    });
    B.box(group, (x + 0.25) + " 1.58 " + (profile.faceCenter + 0.006), 0.025, 0.12, 0.004,
      compliant ? COLORS.good : COLORS.warning, { cast: false });
  }

  function corridorDoor(parent, x, z, side) {
    var inward = side < 0 ? 1 : -1;
    B.box(parent, x + " 1.06 " + z, 0.92, 2.10, 0.045, "#74523e", {
      roughness: 0.62,
    });
    B.doorFrame(parent, x, z + inward * 0.012, 0.92, 2.14, 0, "#46545d");
    B.sphere(parent, (x + 0.32) + " 1.04 " + (z + inward * 0.045), 0.035, "#d4bd78", {
      metalness: 0.74,
      roughness: 0.18,
    });
    B.box(parent, x + " 1.72 " + (z + inward * 0.04), 0.28, 0.08, 0.02, "#ced8dc", {
      metalness: 0.15,
      cast: false,
    });
  }

  window.buildCorredor = function (values) {
    var root = B.clearRoom();
    if (!root) return;
    var half = values.width / 2;
    var compliant = values.obstacleDepth <= 0.10;

    B.tileFloor(root, 5, 0, 14, values.width, "#d7dde0");
    [-half - 0.08, half + 0.08].forEach(function (z) {
      B.box(root, "5 1.35 " + z, 14, 2.70, 0.16, COLORS.wall);
      B.box(root, "5 0.11 " + (z + (z < 0 ? 0.10 : -0.10)), 14, 0.22, 0.05, "#6e7d86");
    });
    B.box(root, "5 2.72 0", 14.1, 0.12, values.width + 0.30, "#d1d9de");
    [-0.5, 2.3, 5.1, 7.9, 10.7].forEach(function (x) {
      B.ceilingLight(root, x, 0, Math.min(1.1, values.width * 0.75));
    });
    [0.2, 4.3, 8.4].forEach(function (x) {
      corridorDoor(root, x, -half + 0.01, -1);
    });
    if (values.tactile) {
      B.plane(root, "5 0.018 0", "-90 0 0", 14, 0.30, COLORS.tactile);
    }
    fireCabinet(root, 3, half, values.obstacleDepth, compliant);
    serviceCabinet(root, 6.1, half, values.obstacleDepth, compliant);
    B.box(root, "3 1.58 " + (half - 0.025), 0.42, 0.18, 0.025, "#f2f4f5", { cast: false });
    B.box(root, "3 1.58 " + (half - 0.045), 0.34, 0.055, 0.012, "#d84d4d", { cast: false });
    B.box(root, "5 0.012 0", 13.6, 0.012, Math.max(0.08, values.width - 0.20),
      values.width >= NBR.CORREDOR_MIN && compliant ? "#75b99a" : "#bd7772", {
        opacity: 0.09,
        cast: false,
        receive: false,
      });
    B.beam(root, [5, 0.25, -half], [5, 0.25, half], 0.018,
      values.width >= NBR.CORREDOR_MIN ? COLORS.good : COLORS.bad);
  };
})();
