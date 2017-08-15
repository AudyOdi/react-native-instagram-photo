// @flow

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Animated} from 'react-native';

import type {Measurement} from './Measurement-type';

type Props = {
  selectedPhotoMeasurement: ?Measurement;
  isDragging: boolean;
};

type Context = {
  gesturePosition: Animated.ValueXY;
  scaleValue: Animated.Value;
};

export default class SelectedPhoto extends Component {
  props: Props;
  context: Context;

  static contextTypes = {
    gesturePosition: PropTypes.object,
    scrollValue: PropTypes.object,
    scaleValue: PropTypes.object,
  };

  render() {
    let {selectedPhotoMeasurement, isDragging} = this.props;

    let {gesturePosition, scaleValue} = this.context;

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
