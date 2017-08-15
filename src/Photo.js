// @flow

import React, {Component} from 'react';
import autobind from 'class-autobind';
import ReactNative, {
  View,
  Text,
  Dimensions,
  UIManager,
  Animated,
  PanResponder,
  Easing,
} from 'react-native';
import {Avatar, ListItem} from 'react-native-elements';

import getDistance from './helpers/getDistance';
import getScale from './helpers/getScale';

import type {Measurement} from './Measurement-type';
import type {Touch} from './Touch-type';

let {width} = Dimensions.get('window');

type Event = {
  nativeEvent: {
    touches: Array<Touch>;
  };
};

type Props = {
  photo: string;
  gesturePosition: Animated.ValueXY;
  scrollValue: Animated.Value;
  scaleValue: Animated.Value;
  style?: Object;
  onGestureStart: (measurement: Measurement) => void;
  onGestureRelease: () => void;
};

type State = {
  isDragging: boolean;
};

export default class Photo extends Component {
  props: Props;
  state: State;
  _parent: ?Object;
  _photoComponent: ?Object;
  _gestureHandler: Object;
  _initialTouch: Array<Object>;
  _selectedPhotoMeasurement: Measurement;
  _previousDistance: number;

  constructor() {
    super(...arguments);
    autobind(this);
    this._previousDistance = 0;
    this._generatePanHandlers(this.props.scrollValue);
    this.state = {
      isDragging: false,
    };
  }

  render() {
    let {photo, style} = this.props;
    let {isDragging} = this.state;

    return (
      <View ref={(parent) => (this._parent = parent)}>
        <View>
          <ListItem
            roundAvatar
            avatar={<Avatar small rounded title="KF" />}
            title={`Photo ${photo}`}
            subtitle="example of subtitle"
            rightIcon={{name: 'more-vert'}}
          />
        </View>
        <Animated.View
          ref={(photoComponent) => (this._photoComponent = photoComponent)}
          {...this._gestureHandler.panHandlers}
        >
          <View
            style={[
              {
                width: width,
                height: 300,
                backgroundColor: isDragging ? 'transparent' : 'red',
                justifyContent: 'center',
                alignItems: 'center',
              },
              style,
            ]}
          >
            <Text style={{fontSize: 20, color: 'white'}}>
              Photo {photo}
            </Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  _generatePanHandlers(scrollValue) {
    let {gesturePosition, onGestureStart} = this.props;

    this._gestureHandler = PanResponder.create({
      // eslint-disable-next-line no-unused-vars
      onStartShouldSetPanResponder: (evt, gestureState) => true,

      // eslint-disable-next-line no-unused-vars
      onMoveShouldSetPanResponder: (evt, gestureState) => true,

      // eslint-disable-next-line no-unused-vars
      onPanResponderGrant: async(evt, gestureState) => {
        let {touches} = evt.nativeEvent;
        let parent = ReactNative.findNodeHandle(this._parent);
        let parentMeasurement = await new Promise((resolve, reject) => {
          UIManager.measureLayoutRelativeToParent(
            parent,
            (e) => {
              reject(console.log(e)); // eslint-disable-line
            },
            (x, y, w, h) => {
              resolve({x, y, w, h});
            }
          );
        });

        let photoComponent = ReactNative.findNodeHandle(this._photoComponent);

        this._selectedPhotoMeasurement = await new Promise(
          (resolve, reject) => {
            UIManager.measureLayoutRelativeToParent(
              photoComponent,
              e => reject(console.log(e)), // eslint-disable-line
              (x, y, w, h) => {
                resolve({
                  x,
                  y: parentMeasurement.y + y,
                  w,
                  h,
                });
              }
            );
          }
        );

        if (Array.isArray(touches) && touches.length === 2) {
          this._initialTouch = touches;
          onGestureStart(this._selectedPhotoMeasurement);

          gesturePosition.setOffset({
            x: 0,
            y: this._selectedPhotoMeasurement.y - scrollValue.__getValue(),
          });
          gesturePosition.setValue({
            x: 0,
            y: 0,
          }); // to clear animation
          this.setState({isDragging: true});
        }
      },
      onPanResponderMove: this._onGestureMove,
      onPanResponderRelease: () => {
        this._onGestureRelease();
      },
    });
  }

  _onGestureMove(event: Event, gestureState: {dx: number; dy: number}) {
    let {touches} = event.nativeEvent;
    if (touches.length === 2) {
      let {gesturePosition, scaleValue} = this.props;
      let {dx, dy} = gestureState;
      gesturePosition.x.setValue(dx);
      gesturePosition.y.setValue(dy);

      if (this._initialTouch.length !== touches.length) {
        this._initialTouch = touches;
      }
      let currentDistance = getDistance(touches);
      let initialDistance = getDistance(this._initialTouch);
      let increasedDistance = currentDistance - initialDistance;
      let diffDistance = this._previousDistance - increasedDistance;
      let newScale = getScale(scaleValue.__getValue(), diffDistance);
      this._previousDistance = increasedDistance;
      scaleValue.setValue(newScale);
      // zoom to the center of the touches
    }
  }
  _onGestureRelease() {
    let {
      gesturePosition,
      scaleValue,
      scrollValue,
      onGestureRelease,
    } = this.props;
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
        y: this._selectedPhotoMeasurement.y - scrollValue.__getValue(),
      });
      this._initialTouch = [];
      this.setState({isDragging: false});
      onGestureRelease();
      // setTimeout(() => {
      //   onGestureRelease();
      // }, 100);
      this._previousDistance = 0;
    });
  }
}
