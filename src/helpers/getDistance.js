// @flow

import type {Touch} from '../Touch-type';

export function pow2abs(a: number, b: number) {
  return Math.pow(Math.abs(a - b), 2);
}

function getDistance(touches: Array<Touch>) {
  const a = touches[0];
  const b = touches[1];

  return Math.sqrt(pow2abs(a.pageX, b.pageX) + pow2abs(a.pageY, b.pageY));
}

export default getDistance;
