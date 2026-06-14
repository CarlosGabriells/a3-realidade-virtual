(function () {
  "use strict";
  var B = SceneBuilder;

  function toilet(parent, x, z) {
    var group = B.primitive(parent, "a-entity", {
      position: x + " 0 " + z,
      rotation: "0 180 0",
    });
    B.box(group, "0 0.52 0.27", 0.48, 0.58, 0.17, "#eef3f4", { roughness: 0.24 });
    B.box(group, "0 0.82 0.27", 0.52, 0.055, 0.21, "#f8fafb", { roughness: 0.20 });
    B.sphere(group, "0 0.42 -0.06", 0.35, "#f4f7f8", {
      scale: "0.82 0.50 1.22",
      roughness: 0.22,
    });
    B.torus(group, "0 0.59 -0.09", 0.235, 0.032, "#fbfcfc", { rotation: "90 0 0" });
    B.cylinder(group, "0 0.19 0.08", 0.17, 0.30, "#e4eaec", { roughness: 0.26 });
    B.sphere(group, "0.17 0.62 0.17", 0.025, "#c8d0d4", { metalness: 0.65, roughness: 0.2 });
  }

  function sink(parent, x, z, height, suspended) {
    var group = B.primitive(parent, "a-entity", { position: x + " 0 " + z });
    B.box(group, "0 " + height + " 0", 0.68, 0.10, 0.46, "#f3f6f7", { roughness: 0.22 });
    B.sphere(group, "0 " + (height + 0.035) + " -0.02", 0.25, "#dce7e9", {
      scale: "1 0.18 0.68",
      roughness: 0.18,
    });
    B.beam(group, [0, height + 0.16, 0.20], [0, height + 0.29, 0.20], 0.022, COLORS.metal);
    B.beam(group, [0, height + 0.29, 0.20], [0, height + 0.29, 0.02], 0.022, COLORS.metal);
    if (!suspended) {
      B.cylinder(group, "0 " + (height / 2) + " 0.08", 0.13, height, "#dce3e5", {
        roughness: 0.24,
      });
    } else {
      B.box(group, "0 " + (height - 0.12) + " 0.19", 0.34, 0.12, 0.08, "#cdd6d9");
      B.cylinder(group, "0 " + (height - 0.25) + " 0.19", 0.035, 0.26, "#8f9da4", {
        metalness: 0.55,
        roughness: 0.26,
      });
    }
  }

  function supportBars(parent, toiletX, toiletZ, wallX, backZ) {
    var options = { metalness: 0.72, roughness: 0.22 };
    var barHeight = 0.75;
    // Barras horizontais conectadas em L nas paredes lateral e de fundo.
    B.beam(parent, [wallX, barHeight, backZ], [wallX, barHeight, toiletZ + 0.48],
      0.032, COLORS.metal, options);
    B.beam(parent, [wallX, barHeight, backZ], [toiletX + 0.48, barHeight, backZ],
      0.032, COLORS.metal, options);
    B.beam(parent, [wallX, barHeight, toiletZ + 0.48], [wallX, 1.12, toiletZ + 0.48],
      0.028, COLORS.metal, options);
    B.beam(parent, [toiletX + 0.48, barHeight, backZ],
      [toiletX + 0.48, 1.12, backZ], 0.028, COLORS.metal, options);
    // Fixadores curtos tornam visível que as barras estão ancoradas nas paredes.
    [toiletZ - 0.32, toiletZ + 0.38].forEach(function (z) {
      B.beam(parent, [wallX, barHeight, z], [wallX + 0.08, barHeight, z],
        0.018, COLORS.darkMetal, options);
    });
    [toiletX - 0.25, toiletX + 0.35].forEach(function (x) {
      B.beam(parent, [x, barHeight, backZ], [x, barHeight, backZ + 0.08],
        0.018, COLORS.darkMetal, options);
    });
  }

  function turningArea(parent, x, z, radius, color) {
    B.cylinder(parent, x + " 0.018 " + z, radius, 0.018, color, {
      opacity: 0.25,
      cast: false,
      receive: false,
    });
    B.torus(parent, x + " 0.035 " + z, radius, 0.018, color, { rotation: "90 0 0" });
    B.beam(parent, [x - radius, 0.045, z], [x + radius, 0.045, z], 0.012, color);
    B.beam(parent, [x, 0.045, z - radius], [x, 0.045, z + radius], 0.012, color);
  }

  window.buildBanheiro = function (values) {
    var root = B.clearRoom();
    if (!root) return;
    var width = values.roomWidth;
    var depth = values.roomDepth;
    var half = width / 2;
    var doorWidth = Math.min(values.doorWidth, width - 0.30);
    var front = Math.max(0.12, (width - doorWidth) / 2);

    B.plane(root, "0 -0.012 0.65", "-90 0 0", width + 0.70, 1.30, "#b9c2c7");
    B.tileFloor(root, 0, -depth / 2, width, depth, "#d9e1e4");
    B.box(root, "0 1.35 " + (-depth), width, 2.70, 0.16, "#dbe6e8");
    B.box(root, (-half) + " 1.35 " + (-depth / 2), 0.16, 2.70, depth, "#e3eaec");
    B.box(root, half + " 1.35 " + (-depth / 2), 0.16, 2.70, depth, "#e3eaec");
    B.wallGrid(root, "x", -depth + 0.085, -half, half, 1.80, 0.30, "#b9c7cb");
    B.wallGrid(root, "z", -half + 0.085, -depth, 0, 1.80, 0.30, "#bdc9cd");
    B.wallGrid(root, "z", half - 0.085, -depth, 0, 1.80, 0.30, "#bdc9cd");
    B.box(root, (-half + front / 2) + " 1.35 0", front, 2.70, 0.16, COLORS.wall);
    B.box(root, (half - front / 2) + " 1.35 0", front, 2.70, 0.16, COLORS.wall);
    B.box(root, "0 2.47 0", doorWidth, 0.46, 0.16, COLORS.wall);
    B.doorFrame(root, 0, -0.085, doorWidth, 2.18, 0, "#4a5961");
    B.ceilingLight(root, 0, -depth / 2, Math.min(1.2, width * 0.55));

    var door = B.primitive(root, "a-entity", {
      position: (doorWidth / 2) + " 0 0.07",
      rotation: "0 150 0",
    });
    B.box(door, (-doorWidth / 2) + " 1.06 0", doorWidth, 2.12, 0.055, "#76513b", {
      roughness: 0.58,
    });
    B.sphere(door, (-doorWidth + 0.12) + " 1.03 -0.045", 0.035, "#d7bd72", {
      metalness: 0.74,
      roughness: 0.18,
    });

    var toiletX = -half + 0.48;
    var toiletZ = -depth + 0.62;
    toilet(root, toiletX, toiletZ);
    if (values.grabBars) supportBars(root, toiletX, toiletZ, -half + 0.10, -depth + 0.10);

    var turnRadius = values.turnDiameter / 2;
    var turnX = Math.min(0.10, half - turnRadius - 0.10);
    var turnZ = -Math.min(depth / 2, depth - turnRadius - 0.10);
    turningArea(root, turnX, turnZ, turnRadius,
      values.turnDiameter >= NBR.GIRO_CADEIRANTE ? "#2386c8" : COLORS.bad);

    var sinkX = half - 0.38;
    sink(root, sinkX, -0.48, values.sinkHeight, !values.pedestal);
    B.box(root, sinkX + " 1.55 -0.088", 0.68, 0.84, 0.025, "#667780", {
      metalness: 0.46,
      roughness: 0.22,
    });
    B.plane(root, sinkX + " 1.55 -0.105", "0 180 0", 0.61, 0.77, "#9ccbd9", {
      metalness: 0.35,
      roughness: 0.12,
    });
    B.box(root, "0 2.64 " + (-depth / 2), width - 0.18, 0.10, depth - 0.18, "#f2f5f6", {
      roughness: 0.84,
      cast: false,
    });
  };
})();
