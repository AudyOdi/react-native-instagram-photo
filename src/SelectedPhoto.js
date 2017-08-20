// @flow

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Animated, StyleSheet} from 'react-native';

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

    let backgroundColor = scaleValue.interpolate({
      inputRange: [1.2, 2.5],
      outputRange: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.6)'],
    });

    return (
      <Animated.View
        style={[
          styles.root,
          {
            backgroundColor,
          },
        ]}
      >
        <Animated.Image
          style={style}
          source={{
            uri: selectedPhoto.photoURI,
          }}
        />
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});
