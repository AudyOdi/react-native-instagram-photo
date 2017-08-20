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
import getScale from './helpers/getScale';

import type {Measurement} from './Measurement-type';
import type {Touch} from './Touch-type';

type Event = {
  nativeEvent: {
    touches: Array<Touch>;
  };
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
  _gestureHandler: ?Object;
  _initialTouch: ?Array<Object>;
  _selectedPhotoMeasurement: ?Measurement;
  _previousDistance: number;

  static contextTypes = {
    gesturePosition: PropTypes.object,
    scrollValue: PropTypes.object,
    scaleValue: PropTypes.object,
  };

  constructor() {
    super(...arguments);
    autobind(this);

    this._generatePanHandlers();
    this._previousDistance = 0;
    this._initialTouch = [];
    this.state = {
      isDragging: false,
    };
  }

  render() {
    let {data} = this.props;
    let {isDragging} = this.state;

    let panHandlers =
      (this._gestureHandler && {...this._gestureHandler.panHandlers}) || {};

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
        <View
          ref={(photoComponent) => (this._photoComponent = photoComponent)}
          {...panHandlers}
          style={{opacity: isDragging ? 0 : 1}}
        >
          <FlexImage source={{uri: data.photo.uri}} />
        </View>
      </View>
    );
  }

  _generatePanHandlers() {
    this._gestureHandler = PanResponder.create({
      onMoveShouldSetResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: (event: Event) => {
        if (event.nativeEvent.touches.length === 2) {
          return true;
        }
        return false;
      },
      onPanResponderGrant: this._startGesture,
      onPanResponderMove: this._onGestureMove,
      onPanResponderRelease: this._onGestureRelease,
    });
  }

  async _startGesture(event: Event) {
    let {data, onGestureStart} = this.props;
    let {gesturePosition, scrollValue} = this.context;
    let {touches} = event.nativeEvent;

    if (touches.length === 2) {
      if (
        this._initialTouch == null ||
        (Array.isArray(this._initialTouch) &&
          this._initialTouch.length !== touches.length)
      ) {
        this._initialTouch = touches;
      }

      // get the item position
      let parent = ReactNative.findNodeHandle(this._parent);
      let parentMeasurement = await new Promise((resolve, reject) => {
        UIManager.measureLayoutRelativeToParent(
          parent,
          (e) => {
            reject(console.log(e)); // eslint-disable-line no-console
          },
          (x, y, w, h) => {
            resolve({x, y, w, h});
          }
        );
      });

      // get the actual photo position in the item
      let photoComponent = ReactNative.findNodeHandle(this._photoComponent);
      this._selectedPhotoMeasurement = await new Promise((resolve, reject) => {
        UIManager.measureLayoutRelativeToParent(
          photoComponent,
          (e) => reject(console.log(e)), // eslint-disable-line no-console
          (x, y, w, h) => {
            resolve({
              x,
              y: parentMeasurement.y + y,
              w,
              h,
            });
          }
        );
      });
      onGestureStart({
        photoURI: data.photo.uri,
        measurement: this._selectedPhotoMeasurement,
      });

      gesturePosition.setValue({
        x: 0,
        y: 0,
      });

      // question: why Flow still think that this._selectedPhotoMeasurement can be null
      gesturePosition.setOffset({
        x: 0,
        y: this._selectedPhotoMeasurement.y - scrollValue.__getValue(),
      });

      if (!this.state.isDragging) {
        this.setState({isDragging: true});
      }
    }
  }

  _onGestureMove(event: Event, gestureState: {dx: number; dy: number}) {
    let {touches} = event.nativeEvent;
    let {isDragging} = this.state;

    if (
      this._initialTouch == null ||
      (Array.isArray(this._initialTouch) &&
        this._initialTouch.length !== touches.length)
    ) {
      this._initialTouch = touches;
    }

    if (touches.length === 2) {
      if (!isDragging) {
        this._startGesture(event);
      }

      // for moving photo around
      let {gesturePosition, scaleValue} = this.context;
      let {dx, dy} = gestureState;
      gesturePosition.x.setValue(dx);
      gesturePosition.y.setValue(dy);

      // for scaling photo
      let currentDistance = getDistance(touches);
      // question: I don't why flow still detect that this._initialTouch can be null
      // even tho I already check it on line 192
      let initialDistance = getDistance(this._initialTouch);
      let increasedDistance = currentDistance - initialDistance;
      let diffDistance = this._previousDistance - increasedDistance;
      let newScale = getScale(scaleValue.__getValue(), diffDistance);
      this._previousDistance = increasedDistance;
      scaleValue.setValue(newScale);
    }
  }

  _onGestureRelease() {
    let {onGestureRelease} = this.props;
    let {gesturePosition, scaleValue, scrollValue} = this.context;

    // set to initial position and scale
    Animated.parallel([
      Animated.timing(gesturePosition.x, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
      }),
      Animated.timing(gesturePosition.y, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 300,
        easing: Easing.ease,
      }),
    ]).start(() => {
      gesturePosition.setOffset({
        x: 0,
        y:
          (this._selectedPhotoMeasurement &&
            this._selectedPhotoMeasurement.y) ||
          0 - scrollValue.__getValue(),
      });
      this._initialTouch = [];
      this._previousDistance = 0;
      this.setState({isDragging: false});
      // hacky solution to prevent lagging when unmounting the selected photo
      setTimeout(() => {
        onGestureRelease();
      }, 300);
    });
  }
}
