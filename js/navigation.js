(function () {
  "use strict";

  var keys = Object.create(null);

  window.addEventListener("keydown", function (event) {
    keys[event.code] = true;
  });

  window.addEventListener("keyup", function (event) {
    keys[event.code] = false;
  });

  window.addEventListener("blur", function () {
    keys = Object.create(null);
  });

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function hitsBox(x, z, radius, obstacle) {
    var nearestX = clamp(x, obstacle.minX, obstacle.maxX);
    var nearestZ = clamp(z, obstacle.minZ, obstacle.maxZ);
    var dx = x - nearestX;
    var dz = z - nearestZ;
    return dx * dx + dz * dz < radius * radius;
  }

  function hitsCircle(x, z, radius, obstacle) {
    var dx = x - obstacle.x;
    var dz = z - obstacle.z;
    var minDistance = radius + obstacle.radius;
    return dx * dx + dz * dz < minDistance * minDistance;
  }

  function occupancyResult(config, x, z, radius) {
    if (!config) return { allowed: true, reason: "" };

    if (
      x - radius < config.bounds.minX ||
      x + radius > config.bounds.maxX ||
      z - radius < config.bounds.minZ ||
      z + radius > config.bounds.maxZ
    ) {
      return { allowed: false, reason: "Limite físico do ambiente." };
    }

    for (var i = 0; i < config.boxes.length; i++) {
      if (hitsBox(x, z, radius, config.boxes[i])) {
        return {
          allowed: false,
          reason: config.boxes[i].reason || "Obstáculo físico à frente.",
        };
      }
    }

    for (var j = 0; j < config.circles.length; j++) {
      if (hitsCircle(x, z, radius, config.circles[j])) {
        return {
          allowed: false,
          reason: config.circles[j].reason || "Obstáculo físico à frente.",
        };
      }
    }

    return { allowed: true, reason: "" };
  }

  function canOccupy(config, x, z, radius) {
    return occupancyResult(config, x, z, radius).allowed;
  }

  // Superfície pura usada pelos testes de colisão, sem mover a cena.
  window.navigationCanOccupy = canOccupy;
  window.navigationOccupancyResult = occupancyResult;

  var overlayTimer = 0;
  var lastBlockedReason = "";
  var lastBlockedNoticeAt = 0;

  function showBlockedMovement(reason) {
    var overlay = document.getElementById("violation-overlay");
    if (!overlay || !reason) return;
    var now = Date.now();
    if (reason === lastBlockedReason && now - lastBlockedNoticeAt < 250) return;
    lastBlockedNoticeAt = now;
    window.clearTimeout(overlayTimer);

    if (reason !== lastBlockedReason) {
      lastBlockedReason = reason;
      overlay.replaceChildren();

      var title = document.createElement("div");
      title.className = "vtitle";
      title.textContent = "Movimento bloqueado";
      var message = document.createElement("div");
      message.textContent = reason;
      overlay.appendChild(title);
      overlay.appendChild(message);
    }
    overlay.classList.add("show");

    overlayTimer = window.setTimeout(function () {
      overlay.classList.remove("show");
    }, 1800);
  }

  function gamepadAxes() {
    if (!navigator.getGamepads) return { x: 0, y: 0 };
    var pads = navigator.getGamepads();
    for (var i = 0; i < pads.length; i++) {
      var pad = pads[i];
      if (!pad || !pad.connected || pad.axes.length < 2) continue;
      var x = Math.abs(pad.axes[0]) > 0.15 ? pad.axes[0] : 0;
      var y = Math.abs(pad.axes[1]) > 0.15 ? pad.axes[1] : 0;
      if (x || y) return { x: x, y: y };
    }
    return { x: 0, y: 0 };
  }

  AFRAME.registerComponent("accessible-movement", {
    schema: {
      speed: { default: 2.3 },
      radius: { default: 0.28 },
    },

    init: function () {
      this.camera = this.el.querySelector("[camera]");
      this.direction = new THREE.Vector3();
      this.forward = new THREE.Vector3();
      this.right = new THREE.Vector3();
    },

    tick: function (time, deltaMs) {
      if (!this.camera || !deltaMs || typeof getNavigationConfig !== "function") return;

      var horizontal = (keys.KeyD || keys.ArrowRight ? 1 : 0) -
        (keys.KeyA || keys.ArrowLeft ? 1 : 0);
      var vertical = (keys.KeyW || keys.ArrowUp ? 1 : 0) -
        (keys.KeyS || keys.ArrowDown ? 1 : 0);
      var pad = gamepadAxes();
      horizontal += pad.x;
      vertical -= pad.y;

      if (!horizontal && !vertical) return;

      var opticalCamera = this.camera.getObject3D("camera");
      if (!opticalCamera) return;
      opticalCamera.getWorldDirection(this.forward);
      this.forward.y = 0;
      if (this.forward.lengthSq() < 0.0001) this.forward.set(0, 0, -1);
      this.forward.normalize();
      this.right.set(-this.forward.z, 0, this.forward.x);

      this.direction
        .copy(this.forward)
        .multiplyScalar(vertical)
        .addScaledVector(this.right, horizontal);

      if (this.direction.lengthSq() > 1) this.direction.normalize();

      var config = getNavigationConfig();
      var position = this.el.object3D.position;
      var distance = this.data.speed * Math.min(deltaMs / 1000, 0.05);
      var nextX = position.x + this.direction.x * distance;
      var nextZ = position.z + this.direction.z * distance;

      var moveX = occupancyResult(config, nextX, position.z, this.data.radius);
      var moveZ = occupancyResult(config, position.x, nextZ, this.data.radius);
      if (moveX.allowed) position.x = nextX;
      if (moveZ.allowed) position.z = nextZ;
      if (!moveX.allowed) showBlockedMovement(moveX.reason);
      else if (!moveZ.allowed) showBlockedMovement(moveZ.reason);

      var targetY = config.floorHeight(position.x, position.z);
      position.y += (targetY - position.y) * Math.min(1, deltaMs / 90);
    },
  });
})();
