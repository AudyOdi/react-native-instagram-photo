// @flow

export default function getScale(currentScale: number, diffDistance: number) {
  // return (
  //   (currentDistance - previousDistance + containerWidth) /
  //   containerWidth *
  //   previousScale
  // );
  return currentScale - diffDistance / 400;
}
