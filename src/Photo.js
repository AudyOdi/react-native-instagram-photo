// @flow

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import autobind from 'class-autobind';
import FlexImage from 'react-native-flex-image';
import ReactNative, {
  View,
  UIManager,
  Animated,
  PanResponder,
  Easing,
} from 'react-native';
import {ListItem} from 'react-native-elements';

import getDistance from './helpers/getDistance';

import type {Measurement} from './Measurement-type';
import type {Touch} from './Touch-type';

const RESTORE_ANIMATION_DURATION = 200;
const SCALE_MULTIPLIER = 1.2;

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
  scrollValue: Animated.Value;
};

type State = {
  isDragging: boolean;
};

export default class PhotoComponent extends Component {
  props: Props;
  state: State;
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
    scrollValue: PropTypes.object,
    scaleValue: PropTypes.object,
  };

  constructor() {
    super(...arguments);
    autobind(this);

    this._generatePanHandlers();
    this._initialTouches = [];
    this.state = {
      isDragging: false,
    };

    this._opacity = new Animated.Value(1);
  }

  render() {
    let {data} = this.props;

    return (
      <View ref={(parent) => (this._parent = parent)}>
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
    });
  }

  async _startGesture(event: Event, gestureState: GestureState) {
    console.log('Gesture Start', gestureState.stateID);
    // Sometimes gesture start happens two or more times rapidly.
    if (this._gestureInProgress) {
      return;
    }
    this._gestureInProgress = gestureState.stateID;
    let {data, onGestureStart} = this.props;
    let {gesturePosition} = this.context;
    let {touches} = event.nativeEvent;

    // if (touches.length !== 2) {
    //   return;
    // }
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
      y: selectedPhotoMeasurement.y - this._getScrollValue(),
    });

    Animated.timing(this._opacity, {
      toValue: 0,
      duration: 100,
    }).start();
  }

  _onGestureMove(event: Event, gestureState: GestureState) {
    let {touches} = event.nativeEvent;
    console.log('Gesture Move', touches.length);
    if (!this._gestureInProgress) {
      return;
    }
    if (touches.length < 2) {
      // Trigger a realease
      this._onGestureRelease(event, gestureState);
      return;
    }
    // if (this._initialTouches.length !== touches.length) {
    //   this._initialTouches = touches;
    // }
    // if (!isDragging) {
    //   this._startGesture(event);
    // }

    // for moving photo around
    let {gesturePosition, scaleValue} = this.context;
    let {dx, dy} = gestureState;
    gesturePosition.x.setValue(dx);
    gesturePosition.y.setValue(dy);

    // for scaling photo
    let currentDistance = getDistance(touches);
    let initialDistance = getDistance(this._initialTouches);
    let newScale = currentDistance / initialDistance * SCALE_MULTIPLIER;
    scaleValue.setValue(newScale);
  }

  _onGestureRelease(event, gestureState: GestureState) {
    console.log('Gesture Release', gestureState.stateID);
    if (this._gestureInProgress !== gestureState.stateID) {
      return;
    }
    this._gestureInProgress = null;
    this._initialTouches = [];
    let {onGestureRelease} = this.props;
    let {gesturePosition, scaleValue} = this.context;

    // set to initial position and scale
    Animated.parallel([
      Animated.timing(gesturePosition.x, {
        toValue: 0,
        duration: RESTORE_ANIMATION_DURATION,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(gesturePosition.y, {
        toValue: 0,
        duration: RESTORE_ANIMATION_DURATION,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: RESTORE_ANIMATION_DURATION,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start(() => {
      gesturePosition.setOffset({
        x: 0,
        y:
          (this._selectedPhotoMeasurement &&
            this._selectedPhotoMeasurement.y) ||
          0 - this._getScrollValue(),
      });
      this._opacity.setValue(1);
      // Animated.timing(this._opacity, {
      //   toValue: 1,
      //   duration: 100,
      // }).start();
      // this.setState({isDragging: false});
      // hacky solution to prevent lagging when unmounting the selected photo
      setTimeout(() => {
        onGestureRelease();
      }, 1);
    });
  }

  _getScrollValue() {
    return this.context.scrollValue.__getValue();
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

function measureNode(node) {
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
