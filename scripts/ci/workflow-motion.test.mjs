import assert from "node:assert/strict";
import {
  marqueeOffset,
  motionPaused,
} from "../../apps/www/src/scripts/workflow-motion.ts";
assert.equal(marqueeOffset(539, 0.1, 540), 1, "strip wraps seamlessly");
assert.equal(marqueeOffset(0, 1, 540), 20, "constant 20px per second");
assert.equal(marqueeOffset(50, 0, 540), 50, "paused position stays unchanged");
assert.equal(marqueeOffset(0, 1, 0), 0, "empty strips do not produce NaN");
const active = [false, true, false, false];
assert.equal(motionPaused(...active), false);
for (let i = 0; i < active.length; i++) {
  const paused = [...active];
  paused[i] = !paused[i];
  assert.equal(
    motionPaused(...paused),
    true,
    `pause cause ${i} wins independently`,
  );
}
console.log(
  "workflow marquee: speed, wrap, and explicit/environmental pause passed",
);
