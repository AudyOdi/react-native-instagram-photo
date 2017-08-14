// @flow

import React, {Component} from 'react';
import autobind from 'class-autobind';
import {View, Animated, PanResponder, Easing} from 'react-native';

import getDistance from './helpers/getDistance';
import getScale from './helpers/getScale';
// import getCenterCoordinate from './helpers/getCenterCoordinate';

export type Touch = {
  pageX: number;
  pageY: number;
  x: number;
  y: number;
};

type Event = {
  nativeEvent: {
    touches: Array<Touch>;
  };
};

type Props = {
  selectedPhotoMeasurement: {x: number; y: number; w: number; h: number};
  scrollValue: {y: number};
};

type State = {
  isDragging: boolean;
};

export default class SelectedPhoto extends Component {
  props: Props;
  state: State;
  gesturePosition: Animated.ValueXY;
  gestureHandler: Object;
  scaleValue: Animated.Value;
  _value: Object;
  _previousDistance: number;
  _previousCenter: ?Object;
  _initialTouch: Array<Touch>;

  constructor() {
    super(...arguments);
    autobind(this);
    this.state = {
      isDragging: false,
    };
    let {selectedPhotoMeasurement, scrollValue} = this.props;

    this._previousDistance = 0;
    this.gesturePosition = new Animated.ValueXY();
    this.scaleValue = new Animated.Value(1);
    this.gesturePosition.addListener((value) => (this._value = value));
    this._generatePanHandlers(selectedPhotoMeasurement, scrollValue);
  }

  componentWillReceiveProps(newProps: Props) {
    let oldProps = this.props;
    if (
      newProps.selectedPhotoMeasurement.y !==
        oldProps.selectedPhotoMeasurement.y ||
      newProps.scrollValue.y !== oldProps.scrollValue.y
    ) {
      this._generatePanHandlers(
        newProps.selectedPhotoMeasurement,
        newProps.scrollValue
      );
    }
  }
  render() {
    let {isDragging} = this.state;
    let {selectedPhotoMeasurement, scrollValue} = this.props;

    let animatedStyle = {
      transform: this.gesturePosition.getTranslateTransform(),
    };
    animatedStyle.transform.push({
      scale: this.scaleValue,
    });

    let initialStyle = {
      transform: [{translateY: selectedPhotoMeasurement.y - scrollValue.y}],
    };

    let style = [
      {
        position: 'absolute',
        zIndex: 100,
        width: selectedPhotoMeasurement.w,
        height: selectedPhotoMeasurement.h,
        backgroundColor: 'blue',
      },
      isDragging ? animatedStyle : initialStyle,
    ];

    return <Animated.View style={style} {...this.gestureHandler.panHandlers} />;
  }

  _generatePanHandlers(selectedPhotoMeasurement, scrollValue) {
    this.gestureHandler = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onPanResponderGrant: (evt, gestureState) => {
        this.gesturePosition.setOffset({
          x: 0,
          y: selectedPhotoMeasurement.y - scrollValue.y,
        });
        this.gesturePosition.setValue({
          x: 0,
          y: 0,
        }); // to clear animation
        this.setState({isDragging: true});
        this._initialTouch = evt.nativeEvent.touches;
      },
      onPanResponderMove: this._onGestureMove,
      onPanResponderRelease: () => {
        Animated.parallel([
          Animated.timing(this.gesturePosition.x, {
            toValue: 0,
            duration: 300,
            easing: Easing.ease,
          }),
          Animated.timing(this.gesturePosition.y, {
            toValue: 0,
            duration: 300,
            easing: Easing.ease,
          }),
          Animated.timing(this.scaleValue, {
            toValue: 1,
            duration: 300,
            easing: Easing.ease,
          }),
        ]).start(() => {
          this.gesturePosition.setOffset({
            x: 0,
            y: selectedPhotoMeasurement.y - scrollValue.y,
          });
          this.setState({isDragging: false});
          this._previousDistance = 0;
          this._previousCenter = null;
          this._initialTouch = [];
        });
      },
    });
  }

  _onGestureMove(event: Event, gestureState: {dx: number; dy: number}) {
    // let {nativeEvent: {contentOffset}}
    // Animated.event([
    //   null,
    //   {dx: this.gesturePosition.x, dy: this.gesturePosition.y},
    // ]),
    // let {selectedPhotoMeasurement} = this.props;
    let {dx, dy} = gestureState;
    let {touches} = event.nativeEvent;
    this.gesturePosition.x.setValue(dx);
    this.gesturePosition.y.setValue(dy);

    if (touches.length === 2) {
      if (this._initialTouch.length !== touches.length) {
        this._initialTouch = touches;
      }
      const currentDistance = getDistance(touches);
      const initialDistance = getDistance(this._initialTouch);
      const increasedDistance = currentDistance - initialDistance;
      let diffDistance = this._previousDistance - increasedDistance;
      // const newScale = getScale(
      //   currentDistance,
      //   this._previousDistance,
      //   selectedPhotoMeasurement.w,
      //   this.scaleValue.__getValue()
      // );
      const newScale = getScale(this.scaleValue.__getValue(), diffDistance);
      this._previousDistance = increasedDistance;
      this.scaleValue.setValue(newScale);
      // zoom to the center of the touches
      // let imageWidth = selectedPhotoMeasurement.w;
      // let imageHeight = selectedPhotoMeasurement.h;
      // const currentCenter = getCenterCoordinate(touches);
      // const newWidth = newScale * imageWidth;
      // const newHeight = newScale * imageHeight;
      // const currentX =
      //   this.gesturePosition.x.__getValue() > 0 || newWidth < imageWidth
      //     ? 0
      //     : this.gesturePosition.x.__getValue();
      // const currentY =
      //   this.gesturePosition.y.__getValue() > 0 || newHeight < imageHeight
      //     ? 0
      //     : this.gesturePosition.y.__getValue();
      // const x =
      //   currentCenter.x -
      //   ((this._previousCenter && this._previousCenter.x) || currentCenter.x) +
      //   currentX;
      // const y =
      //   currentCenter.y -
      //   ((this._previousCenter && this._previousCenter.y) || currentCenter.y) +
      //   currentY;
      // this._previousCenter = currentCenter;
      // this.gesturePosition.setOffset({
      //   x,
      //   y,
      // });
    }
  }
}
