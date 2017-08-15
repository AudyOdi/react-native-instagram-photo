// @flow

import React, {Component} from 'react';
import {Animated} from 'react-native';

import type {Measurement} from './Measurement-type';

type Props = {
  selectedPhotoMeasurement: ?Measurement;
  scaleValue: Animated.Value;
  isDragging: boolean;
  gesturePosition: Animated.ValueXY;
};

export default class SelectedPhoto extends Component {
  props: Props;

  render() {
    let {
      selectedPhotoMeasurement,
      gesturePosition,
      scaleValue,
      isDragging,
    } = this.props;

    if (selectedPhotoMeasurement == null || !isDragging) {
      return null;
    }

    let animatedStyle = {
      transform: gesturePosition.getTranslateTransform(),
    };
    animatedStyle.transform.push({
      scale: scaleValue,
    });

    let style = [
      {
        position: 'absolute',
        zIndex: 100,
        width: selectedPhotoMeasurement.w,
        height: selectedPhotoMeasurement.h,
        backgroundColor: 'blue',
      },
      animatedStyle,
    ];

    return <Animated.View style={style} />;
  }
}
