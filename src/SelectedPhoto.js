// @flow

import React, {Component} from 'react';
import {View, Animated, PanResponder} from 'react-native';

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
  _value: Object;

  constructor() {
    super(...arguments);
    this.state = {
      isDragging: false,
    };
    let {selectedPhotoMeasurement, scrollValue} = this.props;

    this.gesturePosition = new Animated.ValueXY();
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
      },
      onPanResponderMove: Animated.event([
        null,
        {dx: this.gesturePosition.x, dy: this.gesturePosition.y},
      ]),
      onPanResponderRelease: () => {
        this.setState({isDragging: false});
      },
    });
  }
}
