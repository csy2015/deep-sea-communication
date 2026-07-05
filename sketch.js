let video, prevFrame;

let scene = "waiting";
let sceneStart = 0;

let motionAmount = 0;
let smoothMotion = 0;

let lights = [];
let numLights = 8;
let rotationAngle = 0;
let baseRadius = 120;

// ---------- TEXTS ----------

let openingTexts = [
  "No sunlight reaches this depth.",
  "In this oxygen depleted environment, clusters of bioluminescent organs drift.",
  "These belong to the distal ends of a deep-sea cephalopod’s arms.",
  "Through bioluminescence, they recognize one another, communicate, and confuse predators.",
  "Attempt to establish communication with this boneless deep-sea cephalopod.",
  "Extend your hand."
];

let detectedTexts = [
  "Vampyroteuthis infernalis has detected your presence.",
  "Extend your hand and move slowly. Indicate that you are not suspended particulate matter.",
  "Vampyroteuthis infernalis is responding to your movement.",
  "It appears to be assessing whether you belong to its species."
];

let logs = [
  "[Unidentified organism detected]",
  "[Measuring distance]",
  "[No bioluminescent response]",
  "[Signal pending............]",
  "[Analyzing response]",
  "[No bioluminescent response]",
  "[No return signal]",
  "[Species identity unverified]",
  "[...........]"
];

// ---------- TIMING ----------

let openingTextDuration = 5200;
let detectedTextDuration = 5200;
let interactiveDuration = 70000;
let fadeoutDuration = 9000;
let endingDuration = 18000;

// ---------- SETUP ----------

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  frameRate(30);

  video = createCapture(VIDEO);
  video.size(160, 120);
  video.hide();

  prevFrame = createImage(160, 120);

  for (let i = 0; i < numLights; i++) {
    lights.push({
      angleOffset: (TWO_PI / numLights) * i,
      pulseOffset: random(TWO_PI),
      size: random(24, 42)
    });
  }

  changeScene("waiting");
}

function draw() {
  let t = millis() - sceneStart;

  backgroundFade(28);
  detectMotion();

  if (scene === "waiting") {
    drawWaitingScreen();

    if (motionAmount > 2) {
      changeScene("opening");
    }
  }

  else if (scene === "opening") {
    drawTextSequence(openingTexts, t, openingTextDuration, 1200);

    if (t > openingTexts.length * openingTextDuration + 800) {
      changeScene("blackout");
    }
  }

  else if (scene === "blackout") {
    if (t > 1800) {
      changeScene("flash");
    }
  }

  else if (scene === "flash") {
    drawFlashLights(t);

    if (t > 5500) {
      changeScene("detected");
    }
  }

  else if (scene === "detected") {
    drawTextSequence(detectedTexts, t, detectedTextDuration, 1200);

    if (t > detectedTexts.length * detectedTextDuration + 800) {
      changeScene("interactive");
    }
  }

  else if (scene === "interactive") {
    smoothMotion = lerp(smoothMotion, motionAmount, 0.25);

    drawBioluminescentSystem(true);
    drawOneLogAtATime(t);

    if (t > interactiveDuration) {
      changeScene("fadeout");
    }
  }

  else if (scene === "fadeout") {
    smoothMotion = lerp(smoothMotion, 0, 0.05);

    drawBioluminescentSystem(false);

    let blackAlpha = map(t, 0, fadeoutDuration, 0, 255);
    blackAlpha = constrain(blackAlpha, 0, 255);

    noStroke();
    fill(0, blackAlpha);
    rect(0, 0, width, height);

    if (t > fadeoutDuration) {
      changeScene("ending");
    }
  }

  else if (scene === "ending") {
    drawEndingText(t);

    if (t > endingDuration) {
      changeScene("waiting");
    }
  }
}

// ---------- SCENE CONTROL ----------

function changeScene(nextScene) {
  scene = nextScene;
  sceneStart = millis();
  background(0);

  if (nextScene === "waiting") {
    smoothMotion = 0;
    motionAmount = 0;
  }
}

// ---------- CAMERA MOTION ----------

function detectMotion() {
  video.loadPixels();
  prevFrame.loadPixels();

  if (video.pixels.length === 0 || prevFrame.pixels.length === 0) {
    prevFrame.copy(
      video,
      0, 0, video.width, video.height,
      0, 0, prevFrame.width, prevFrame.height
    );
    return;
  }

  let totalDiff = 0;
  let count = 0;
  let stepSize = 2;

  for (let y = 0; y < video.height; y += stepSize) {
    for (let x = 0; x < video.width; x += stepSize) {
      let i = (x + y * video.width) * 4;

      let r = video.pixels[i];
      let g = video.pixels[i + 1];
      let b = video.pixels[i + 2];

      let pr = prevFrame.pixels[i];
      let pg = prevFrame.pixels[i + 1];
      let pb = prevFrame.pixels[i + 2];

      let current = (r + g + b) / 3;
      let previous = (pr + pg + pb) / 3;

      totalDiff += abs(current - previous);
      count++;
    }
  }

  motionAmount = totalDiff / count;
  motionAmount = max(0, motionAmount - 1);
  motionAmount = constrain(motionAmount, 0, 80);

  prevFrame.copy(
    video,
    0, 0, video.width, video.height,
    0, 0, prevFrame.width, prevFrame.height
  );
}

// ---------- BACKGROUND ----------

function backgroundFade(amount) {
  noStroke();
  fill(0, amount);
  rect(0, 0, width, height);
}

// ---------- WAITING SCREEN ----------

function drawWaitingScreen() {
  textAlign(CENTER, CENTER);

  fill(180, 230, 255, 230);
  textSize(16);
  text("DEEP SEA COMMUNICATION STUDY", width / 2, height * 0.34);

  textSize(24);
  textStyle(ITALIC);
  text("Specimen: Vampyroteuthis infernalis", width / 2, height * 0.43);
  textStyle(NORMAL);

  fill(130, 190, 220, 170);
  textSize(13);
  text("Please stand in front of the camera", width / 2, height * 0.70);
}

// ---------- TEXT SEQUENCES ----------

function drawTextSequence(arr, t, durationPerText, fadeTime) {
  let index = floor(t / durationPerText);

  if (index < 0 || index >= arr.length) return;

  let localT = t - index * durationPerText;
  let alpha = fadeInOut(localT, durationPerText, fadeTime);

  fill(210, 245, 255, alpha);
  textAlign(CENTER, CENTER);
  textSize(24);
  textStyle(NORMAL);
  text(arr[index], width * 0.15, height / 2, width * 0.70);
}

// ---------- FLASH LIGHTS ----------

function drawFlashLights(t) {
  let centerX = width / 2;
  let centerY = height / 2;

  blendMode(ADD);

  for (let i = 0; i < 8; i++) {
    let seed = i * 137.31;
    let delay = i * 180;
    let localT = t - delay;

    if (localT > 0 && localT < 2600) {
      let alpha = fadeInOut(localT, 2600, 900);

      let angle = noise(seed) * TWO_PI * 2;
      let distance = 70 + noise(seed + 20) * 190;

      let driftX = sin(localT * 0.0015 + seed) * 20;
      let driftY = cos(localT * 0.0012 + seed) * 20;

      let x = centerX + cos(angle) * distance + driftX;
      let y = centerY + sin(angle) * distance + driftY;

      let size = 12 + noise(seed + 50) * 20;
      let brightness = alpha * 0.22;

      drawGlow(x, y, size, brightness);
    }
  }

  blendMode(BLEND);
}

// ---------- INTERACTIVE LIGHT SYSTEM ----------

function drawBioluminescentSystem(interactiveMode) {
  let centerX = width / 2;
  let centerY = height / 2;

  let motionNorm = map(smoothMotion, 0, 120, 0, 1);
  motionNorm = constrain(motionNorm, 0, 1);

  let rotationSpeed = interactiveMode
    ? map(motionNorm, 0, 1, 0.001, 0.07)
    : 0.0008;

  rotationAngle += rotationSpeed;

  let radius = baseRadius + motionNorm * 190;
  let breathing = sin(frameCount * 0.025) * 18;
  let idleFlicker = 0.25 + noise(frameCount * 0.035) * 0.45;

  blendMode(ADD);

  for (let i = 0; i < lights.length; i++) {
    let l = lights[i];

    let angle = rotationAngle + l.angleOffset;
    let wobble = sin(frameCount * 0.03 + l.pulseOffset) * 22;

    let x = centerX + cos(angle) * (radius + wobble + breathing);
    let y = centerY + sin(angle) * (radius + wobble + breathing);

    let pulse = sin(frameCount * 0.08 + l.pulseOffset) * 10;

    let brightness = 12 + idleFlicker * 25 + motionNorm * 190;
    let size = l.size * 0.65 + pulse + motionNorm * 60;

    drawGlow(x, y, size, brightness);

    if (interactiveMode && motionNorm > 0.28) {
      stroke(30, 150, 220, 8 + motionNorm * 45);
      strokeWeight(0.6 + motionNorm * 1.8);
      line(centerX, centerY, x, y);
      noStroke();
    }
  }

  blendMode(BLEND);
}

// ---------- ONE LOG ONLY ----------

function drawOneLogAtATime(t) {
  let durationPerLog = interactiveDuration / logs.length;
  let logIndex = floor(t / durationPerLog);

  if (logIndex < 0 || logIndex >= logs.length) return;

  let localT = t - logIndex * durationPerLog;
  let alpha = fadeInOut(localT, durationPerLog, 900);

  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  textSize(16);

  fill(150, 220, 240, alpha);
  text(logs[logIndex], width / 2, height - 80);
}

// ---------- GLOW DRAWING ----------

function drawGlow(x, y, size, brightness) {
  noStroke();

  fill(10, 50, 120, brightness * 0.12);
  ellipse(x, y, size * 4.5);

  fill(20, 130, 210, brightness * 0.35);
  ellipse(x, y, size * 2.1);

  fill(180, 245, 255, brightness);
  ellipse(x, y, size * 0.45);
}

// ---------- ENDING ----------

function drawEndingText(t) {
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);

  let a1 = t > 1000 ? fadeIn(t - 1000, 2000) : 0;
  let a2 = t > 5000 ? fadeIn(t - 5000, 2000) : 0;
  let a3 = t > 9500 ? fadeIn(t - 9500, 2500) : 0;

  fill(200, 235, 245, a1);
  textSize(20);
  text("Dialogue terminated.", width / 2, height * 0.40);

  fill(170, 215, 230, a2);
  textSize(18);
  text("Return to surface.", width / 2, height * 0.50);

  fill(210, 245, 255, a3);
  textSize(22);
  text("Inferna remains beyond perception.", width / 2, height * 0.62);
}

// ---------- FADE HELPERS ----------

function fadeInOut(t, total, fadeTime) {
  let a = 255;

  if (t < fadeTime) {
    a = map(t, 0, fadeTime, 0, 255);
  }

  if (t > total - fadeTime) {
    a = map(t, total - fadeTime, total, 255, 0);
  }

  return constrain(a, 0, 255);
}

function fadeIn(t, fadeTime) {
  return constrain(map(t, 0, fadeTime, 0, 255), 0, 255);
}

// ---------- KEYS ----------

function keyPressed() {
  if (key === "f" || key === "F") fullscreen(!fullscreen());
  if (key === "c" || key === "C") background(0);

  if (key === "1") changeScene("waiting");
  if (key === "2") changeScene("opening");
  if (key === "3") changeScene("flash");
  if (key === "4") changeScene("detected");
  if (key === "5") changeScene("interactive");
  if (key === "6") changeScene("ending");
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(0);
}