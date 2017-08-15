// @flow

import type {Touch} from '../Touch-type';

export default function getCenterCoordinate(touches: Array<Touch>) {
  const a = touches[0];
  const b = touches[1];
  return {
    x: (a.pageX + b.pageX) / 2,
    y: (a.pageY + b.pageY) / 2,
  };
}
