/** Constant 20px/s movement, including the seamless wrap boundary. */
export function marqueeOffset(offset: number, elapsed: number, cycle: number) {
  return cycle > 0 ? (offset + Math.max(0, elapsed) * 20) % cycle : 0;
}
export function motionPaused(
  user: boolean,
  visible: boolean,
  hidden: boolean,
  reduced: boolean,
) {
  return user || !visible || hidden || reduced;
}
