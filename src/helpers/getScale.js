// @flow

export default function getScale(currentScale: number, diffDistance: number) {
  return currentScale - diffDistance / 200;
}
