// Review material: a contact sheet of every face (silent and speaking) drawn
// by face.mjs, and a sheet of the 3D character in a few expressions with and
// without her glasses, rendered through a small stage. Used by the smoke
// harness's `sheet` scenario to write PNGs for the review folder.
import { EXPRESSION_NAMES, faceParams, drawFace, FACE_SIZE } from './face.mjs';
import { buildRosie, poseFor, applyPose } from './rosie-model.mjs';
import { createStage } from './stage.mjs';

const CELL = 150;

export function faceSheet(doc = document) {
  const cols = 6;
  const names = EXPRESSION_NAMES;
  const rows = Math.ceil(names.length / cols);
  const sheet = doc.createElement('canvas');
  sheet.width = cols * CELL * 2;
  sheet.height = rows * (CELL + 24);
  const ctx = sheet.getContext('2d');
  ctx.fillStyle = '#f3ead6';
  ctx.fillRect(0, 0, sheet.width, sheet.height);
  const scratch = doc.createElement('canvas');
  scratch.width = FACE_SIZE;
  scratch.height = FACE_SIZE;
  const sctx = scratch.getContext('2d');
  names.forEach((name, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    [0, 0.9].forEach((mouthOpen, v) => {
      drawFace(sctx, faceParams(name), { look: { x: 0, y: 0 }, blink: 0, mouthOpen });
      const x = (col * 2 + v) * CELL;
      const y = row * (CELL + 24);
      ctx.drawImage(scratch, x + 4, y + 4, CELL - 8, CELL - 8);
    });
    ctx.fillStyle = '#1c1a16';
    ctx.font = '600 15px Bahnschrift, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${name}  ·  silent / speaking`, col * 2 * CELL + CELL, row * (CELL + 24) + CELL + 14);
  });
  return sheet;
}

export function rosieSheet(THREE, doc = document, names = ['neutral', 'joy', 'laughter', 'alertness', 'shock', 'anxiety', 'terror', 'rage', 'disgust', 'grief', 'nerdy', 'sheepish']) {
  const w = 220;
  const h = 260;
  const canvas = doc.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const stage = createStage(THREE, canvas, { width: w, height: h, pixelRatio: 1 });
  if (!stage) return null;
  const faceCanvas = doc.createElement('canvas');
  faceCanvas.width = FACE_SIZE;
  faceCanvas.height = FACE_SIZE;
  const faceTexture = new THREE.CanvasTexture(faceCanvas);
  faceTexture.colorSpace = THREE.SRGBColorSpace;
  const model = buildRosie(THREE, { faceTexture });
  stage.root.add(model.root);
  const cols = 6;
  const rows = Math.ceil((names.length * 2) / cols);
  const sheet = doc.createElement('canvas');
  sheet.width = cols * w;
  sheet.height = rows * (h + 24);
  const ctx = sheet.getContext('2d');
  ctx.fillStyle = '#184a2c';
  ctx.fillRect(0, 0, sheet.width, sheet.height);
  let i = 0;
  for (const name of names) {
    for (const glasses of [false, true]) {
      drawFace(faceCanvas.getContext('2d'), faceParams(name), { look: { x: 0, y: 0 }, blink: 0, mouthOpen: 0 });
      faceTexture.needsUpdate = true;
      applyPose(model.parts, poseFor({ expression: name, t: 0.4, phase: 0, reduced: true, glasses }));
      stage.render();
      const col = i % cols;
      const row = Math.floor(i / cols);
      ctx.drawImage(canvas, col * w, row * (h + 24));
      ctx.fillStyle = '#f3ead6';
      ctx.font = '600 14px Bahnschrift, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${name}${glasses ? ' + glasses' : ''}`, col * w + w / 2, row * (h + 24) + h + 16);
      i += 1;
    }
  }
  stage.dispose();
  return sheet;
}
