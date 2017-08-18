// @flow

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Animated} from 'react-native';

import type {Measurement} from './Measurement-type';

type Props = {
  selectedPhoto: {photoURI: string; measurement: Measurement};
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
    let {selectedPhoto} = this.props;

    let {gesturePosition, scaleValue} = this.context;

    let animatedStyle = {
      transform: gesturePosition.getTranslateTransform(),
    };
    animatedStyle.transform.push({
      scale: scaleValue,
    });

    let style = [
      {
        position: 'absolute',
        zIndex: 10,
        width: selectedPhoto.measurement.w,
        height: selectedPhoto.measurement.h,
      },
      animatedStyle,
    ];

    return (
      <Animated.Image
        style={style}
        source={{
          uri: selectedPhoto.photoURI,
        }}
      />
    );
  }
}
