// @flow

import {UIManager} from 'react-native';

export default function measureNode(node: ?number) {
  return new Promise((resolve, reject) => {
    UIManager.measureLayoutRelativeToParent(
      node,
      (e) => reject(e),
      (x, y, w, h) => {
        resolve({x, y, w, h});
      }
    );
  });
}
