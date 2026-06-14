/*
 * Núcleo compartilhado de modelagem procedural.
 * Todas as dimensões usam metros e as barras são orientadas pelos pontos finais.
 */
var NBR = Object.freeze({
  CORREDOR_MIN: 1.20,
  PORTA_MIN: 0.80,
  RAMPA_MAX_INCL: 0.0833,
  CORRIMAO_BAIXO: 0.70,
  CORRIMAO_ALTO: 0.92,
  GIRO_CADEIRANTE: 1.50,
  BANHEIRO_MIN_L: 1.50,
  BANHEIRO_MIN_P: 1.70,
});

var COLORS = Object.freeze({
  good: "#2e9d63",
  bad: "#d84d4d",
  warning: "#f0aa32",
  concrete: "#aab2b8",
  concreteDark: "#737f87",
  wall: "#e8edf0",
  metal: "#aeb9c1",
  darkMetal: "#37434b",
  wood: "#81563b",
  glass: "#8ad4e8",
  tactile: "#e9b62f",
});

var SceneBuilder = (function () {
  function setAttributes(element, attributes) {
    Object.keys(attributes || {}).forEach(function (name) {
      element.setAttribute(name, attributes[name]);
    });
    return element;
  }

  function primitive(parent, tag, attributes) {
    var element = setAttributes(document.createElement(tag), attributes);
    parent.appendChild(element);
    return element;
  }

  function material(color, options) {
    options = options || {};
    var value = "color:" + color +
      "; roughness:" + (options.roughness === undefined ? 0.78 : options.roughness) +
      "; metalness:" + (options.metalness || 0);
    if (options.opacity !== undefined) {
      value += "; opacity:" + options.opacity + "; transparent:true";
    }
    return value;
  }

  function box(parent, position, width, height, depth, color, options) {
    options = options || {};
    return primitive(parent, "a-box", {
      position: position,
      width: width,
      height: height,
      depth: depth,
      rotation: options.rotation || "0 0 0",
      material: material(color, options),
      shadow: "cast:" + (options.cast !== false) + "; receive:" + (options.receive !== false),
    });
  }

  function cylinder(parent, position, radius, height, color, options) {
    options = options || {};
    return primitive(parent, "a-cylinder", {
      position: position,
      radius: radius,
      height: height,
      rotation: options.rotation || "0 0 0",
      segmentsRadial: options.segments || 24,
      material: material(color, options),
      shadow: "cast:" + (options.cast !== false) + "; receive:" + (options.receive !== false),
    });
  }

  function sphere(parent, position, radius, color, options) {
    options = options || {};
    return primitive(parent, "a-sphere", {
      position: position,
      radius: radius,
      scale: options.scale || "1 1 1",
      material: material(color, options),
      shadow: "cast:" + (options.cast !== false) + "; receive:" + (options.receive !== false),
    });
  }

  function torus(parent, position, radius, tube, color, options) {
    options = options || {};
    return primitive(parent, "a-torus", {
      position: position,
      radius: radius,
      "radius-tubular": tube,
      rotation: options.rotation || "0 0 0",
      material: material(color, options),
      shadow: "cast:true; receive:true",
    });
  }

  function plane(parent, position, rotation, width, height, color, options) {
    options = options || {};
    return primitive(parent, "a-plane", {
      position: position,
      rotation: rotation,
      width: width,
      height: height,
      material: material(color, options),
      shadow: "cast:false; receive:true",
    });
  }

  function beam(parent, startValues, endValues, radius, color, options) {
    var start = new THREE.Vector3(startValues[0], startValues[1], startValues[2]);
    var end = new THREE.Vector3(endValues[0], endValues[1], endValues[2]);
    var direction = new THREE.Vector3().subVectors(end, start);
    var midpoint = new THREE.Vector3().copy(start).add(end).multiplyScalar(0.5);
    var quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    );
    var euler = new THREE.Euler().setFromQuaternion(quaternion, "XYZ");
    var beamOptions = Object.assign({}, options || {}, {
      rotation: [
        THREE.MathUtils.radToDeg(euler.x),
        THREE.MathUtils.radToDeg(euler.y),
        THREE.MathUtils.radToDeg(euler.z),
      ].join(" "),
    });
    return cylinder(
      parent,
      midpoint.x + " " + midpoint.y + " " + midpoint.z,
      radius,
      direction.length(),
      color,
      beamOptions
    );
  }

  function clearRoom() {
    var root = document.getElementById("room-root");
    if (!root) return null;
    root.replaceChildren();
    return root;
  }

  function tileFloor(parent, centerX, centerZ, width, depth, color) {
    plane(parent, centerX + " 0 " + centerZ, "-90 0 0", width, depth, color);
    for (var x = centerX - width / 2; x <= centerX + width / 2 + 0.01; x += 0.5) {
      box(parent, x + " 0.006 " + centerZ, 0.008, 0.008, depth, "#aeb9c2", { cast: false });
    }
    for (var z = centerZ - depth / 2; z <= centerZ + depth / 2 + 0.01; z += 0.5) {
      box(parent, centerX + " 0.006 " + z, width, 0.008, 0.008, "#aeb9c2", { cast: false });
    }
  }

  function ceilingLight(parent, x, z, width) {
    box(parent, x + " 2.66 " + z, width || 1, 0.035, 0.26, "#fff9d6", {
      roughness: 0.25,
      cast: false,
    });
    primitive(parent, "a-entity", {
      position: x + " 2.52 " + z,
      light: "type:point; color:#fff5d6; intensity:0.35; distance:4; decay:2",
    });
  }

  function doorFrame(parent, x, z, width, height, rotationY, color) {
    var group = primitive(parent, "a-entity", {
      position: x + " 0 " + z,
      rotation: "0 " + (rotationY || 0) + " 0",
    });
    var frameColor = color || "#4d5b64";
    box(group, (-width / 2 - 0.045) + " " + (height / 2) + " 0", 0.09, height, 0.12, frameColor);
    box(group, (width / 2 + 0.045) + " " + (height / 2) + " 0", 0.09, height, 0.12, frameColor);
    box(group, "0 " + (height + 0.045) + " 0", width + 0.18, 0.09, 0.12, frameColor);
    return group;
  }

  function wallGrid(parent, axis, fixed, start, end, height, spacing, color) {
    var lineColor = color || "#b8c3c8";
    for (var along = start; along <= end + 0.01; along += spacing) {
      if (axis === "x") {
        box(parent, along + " " + (height / 2) + " " + fixed, 0.008, height, 0.008, lineColor, { cast: false });
      } else {
        box(parent, fixed + " " + (height / 2) + " " + along, 0.008, height, 0.008, lineColor, { cast: false });
      }
    }
    for (var y = spacing; y < height; y += spacing) {
      if (axis === "x") {
        box(parent, ((start + end) / 2) + " " + y + " " + fixed, end - start, 0.008, 0.008, lineColor, { cast: false });
      } else {
        box(parent, fixed + " " + y + " " + ((start + end) / 2), 0.008, 0.008, end - start, lineColor, { cast: false });
      }
    }
  }

  function postFoot(parent, x, y, z, color) {
    cylinder(parent, x + " " + y + " " + z, 0.065, 0.018, color || COLORS.darkMetal, {
      metalness: 0.7,
      roughness: 0.25,
    });
  }

  return {
    primitive: primitive,
    box: box,
    cylinder: cylinder,
    sphere: sphere,
    torus: torus,
    plane: plane,
    beam: beam,
    clearRoom: clearRoom,
    tileFloor: tileFloor,
    ceilingLight: ceilingLight,
    doorFrame: doorFrame,
    wallGrid: wallGrid,
    postFoot: postFoot,
  };
})();
