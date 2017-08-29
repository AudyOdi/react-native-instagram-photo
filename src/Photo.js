// @flow
/* global requestAnimationFrame */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import autobind from 'class-autobind';
import ReactNative, {View, Animated, PanResponder, Easing} from 'react-native';
import {ListItem} from 'react-native-elements';
import FlexImage from 'react-native-flex-image';

import getDistance from './helpers/getDistance';
import getScale from './helpers/getScale';
import measureNode from './helpers/measureNode';

import type {Measurement} from './Measurement-type';
import type {Touch} from './Touch-type';

const RESTORE_ANIMATION_DURATION = 200;

type Event = {
  nativeEvent: {
    touches: Array<Touch>;
  };
};

type GestureState = {
  stateID: string;
  dx: number;
  dy: number;
};

type Photo = {
  name: string;
  avatar: {
    uri: string;
  };
  photo: {uri: string};
};

type Props = {
  data: Photo;
  isDragging: boolean;
  onGestureStart: ({photoURI: string; measurement: Measurement}) => void;
  onGestureRelease: () => void;
};

type Context = {
  gesturePosition: Animated.ValueXY;
  scaleValue: Animated.Value;
  getScrollValue: () => number;
};

export default class PhotoComponent extends Component {
  props: Props;
  context: Context;
  _parent: ?Object;
  _photoComponent: ?Object;
  _gestureHandler: Object;
  _initialTouches: Array<Object>;
  _selectedPhotoMeasurement: Measurement;
  _gestureInProgress: ?string;

  _opacity: Animated.Value;

  static contextTypes = {
    gesturePosition: PropTypes.object,
    scaleValue: PropTypes.object,
    getScrollValue: PropTypes.func,
  };

  constructor() {
    super(...arguments);
    autobind(this);

    this._generatePanHandlers();
    this._initialTouches = [];
    this._opacity = new Animated.Value(1);
  }

  render() {
    let {data} = this.props;

    return (
      <View ref={(parentNode) => (this._parent = parentNode)}>
        <View>
          <ListItem
            roundAvatar
            avatar={{uri: data.avatar.uri}}
            title={`${data.name}`}
            subtitle="example of subtitle"
            rightIcon={{name: 'more-vert'}}
          />
        </View>
        <Animated.View
          ref={(node) => (this._photoComponent = node)}
          {...this._gestureHandler.panHandlers}
          style={{opacity: this._opacity}}
        >
          <FlexImage source={{uri: data.photo.uri}} />
        </Animated.View>
      </View>
    );
  }

  _generatePanHandlers() {
    this._gestureHandler = PanResponder.create({
      onStartShouldSetResponderCapture: () => true,
      onStartShouldSetPanResponderCapture: (event: Event) => {
        return event.nativeEvent.touches.length === 2;
      },
      onMoveShouldSetResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: (event: Event) => {
        return event.nativeEvent.touches.length === 2;
      },
      onPanResponderGrant: this._startGesture,
      onPanResponderMove: this._onGestureMove,
      onPanResponderRelease: this._onGestureRelease,
      onPanResponderTerminationRequest: () => {
        return this._gestureInProgress == null;
      },
      onPanResponderTerminate: (event, gestureState) => {
        return this._onGestureRelease(event, gestureState);
      },
    });
  }

  async _startGesture(event: Event, gestureState: GestureState) {
    // Sometimes gesture start happens two or more times rapidly.
    if (this._gestureInProgress) {
      return;
    }

    this._gestureInProgress = gestureState.stateID;
    let {data, onGestureStart} = this.props;
    let {gesturePosition, getScrollValue} = this.context;
    let {touches} = event.nativeEvent;

    this._initialTouches = touches;

    let selectedPhotoMeasurement = await this._measureSelectedPhoto();
    this._selectedPhotoMeasurement = selectedPhotoMeasurement;
    onGestureStart({
      photoURI: data.photo.uri,
      measurement: selectedPhotoMeasurement,
    });

    gesturePosition.setValue({
      x: 0,
      y: 0,
    });

    gesturePosition.setOffset({
      x: 0,
      y: selectedPhotoMeasurement.y - getScrollValue(),
    });

    Animated.timing(this._opacity, {
      toValue: 0,
      duration: 200,
    }).start();
  }

  _onGestureMove(event: Event, gestureState: GestureState) {
    let {touches} = event.nativeEvent;
    if (!this._gestureInProgress) {
      return;
    }
    if (touches.length < 2) {
      // Trigger a realease
      this._onGestureRelease(event, gestureState);
      return;
    }

    // for moving photo around
    let {gesturePosition, scaleValue} = this.context;
    let {dx, dy} = gestureState;
    gesturePosition.x.setValue(dx);
    gesturePosition.y.setValue(dy);

    // for scaling photo
    let currentDistance = getDistance(touches);
    let initialDistance = getDistance(this._initialTouches);
    let newScale = getScale(currentDistance, initialDistance);
    scaleValue.setValue(newScale);
  }

  _onGestureRelease(event, gestureState: GestureState) {
    if (this._gestureInProgress !== gestureState.stateID) {
      return;
    }

    this._gestureInProgress = null;
    this._initialTouches = [];
    let {onGestureRelease} = this.props;
    let {gesturePosition, scaleValue, getScrollValue} = this.context;

    // set to initial position and scale
    Animated.parallel([
      Animated.timing(gesturePosition.x, {
        toValue: 0,
        duration: RESTORE_ANIMATION_DURATION,
        easing: Easing.ease,
        // useNativeDriver: true,
      }),
      Animated.timing(gesturePosition.y, {
        toValue: 0,
        duration: RESTORE_ANIMATION_DURATION,
        easing: Easing.ease,
        // useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: RESTORE_ANIMATION_DURATION,
        easing: Easing.ease,
        // useNativeDriver: true,
      }),
    ]).start(() => {
      gesturePosition.setOffset({
        x: 0,
        y:
          (this._selectedPhotoMeasurement &&
            this._selectedPhotoMeasurement.y) ||
          0 - getScrollValue(),
      });

      this._opacity.setValue(1);

      requestAnimationFrame(() => {
        onGestureRelease();
      });
    });
  }

  async _measureSelectedPhoto() {
    let parent = ReactNative.findNodeHandle(this._parent);
    let photoComponent = ReactNative.findNodeHandle(this._photoComponent);

    let [parentMeasurement, photoMeasurement] = await Promise.all([
      measureNode(parent),
      measureNode(photoComponent),
    ]);

    return {
      x: photoMeasurement.x,
      y: parentMeasurement.y + photoMeasurement.y,
      w: photoMeasurement.w,
      h: photoMeasurement.h,
    };
  }
}
