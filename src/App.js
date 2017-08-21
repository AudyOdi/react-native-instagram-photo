// @flow
import React from 'react';
import PropTypes from 'prop-types';
import {StyleSheet, View, ScrollView, Animated} from 'react-native';

import Photo from './Photo';
import SelectedPhoto from './SelectedPhoto';

import type {Measurement} from './Measurement-type';

let photos = [
  {
    name: 'Audy Tanudjaja',
    avatar: {
      uri:
        'https://cdn-images-1.medium.com/fit/c/240/240/1*GoIqFr7G3SXXf62i6hdrog.jpeg',
    },
    photo: {
      uri:
        'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F27714985%2F33790035043%2F1%2Foriginal.jpg?w=1000&rect=295%2C0%2C3214%2C1607&s=fb087ad58b8596660f243dc4523acbca',
    },
  },
  {
    name: 'Simon Sturmer',
    avatar: {
      uri: `https://cdn-images-1.medium.com/fit/c/200/200/0*fGMlNbNmb01G7gpv.jpeg`,
    },
    photo: {
      uri:
        'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F32179220%2F214666330784%2F1%2Foriginal.jpg?w=1000&rect=357%2C293%2C2326%2C1163&s=6ccee5095fbfd4a7b9aead2c2d355e3d',
    },
  },
  {
    name: 'Katelyn Friedson',
    avatar: {
      uri: 'https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg',
    },
    photo: {
      uri:
        'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F33376779%2F119397753453%2F1%2Foriginal.jpg?w=1000&rect=0%2C57%2C7220%2C3610&s=c439fda7b39fc1d98a23f5cf1b4dfd8e',
    },
  },
  {
    name: 'Adham Dannaway',
    avatar: {
      uri:
        'https://s3.amazonaws.com/uifaces/faces/twitter/adhamdannaway/128.jpg',
    },
    photo: {
      uri:
        'https://mm.creativelive.com/fit/https%3A%2F%2Fagc.creativelive.com%2Fagc%2Fcourses%2F5222-1.jpg/1200',
    },
  },
  {
    name: 'Brynn',
    avatar: {
      uri: 'https://s3.amazonaws.com/uifaces/faces/twitter/brynn/128.jpg',
    },
    photo: {
      uri:
        'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F31079558%2F50958620730%2F1%2Foriginal.jpg?w=1000&rect=148%2C418%2C2360%2C1180&s=2f48e3d424143273cb5f98a7342bd1ee',
    },
  },
];

type SelectedPhotoType = {photoURI: string; measurement: Measurement};

type State = {
  selectedPhoto?: SelectedPhotoType;
  isDragging: boolean;
};

export default class App extends React.Component {
  state: State;
  _scrollValue: Animated.Value;
  _scaleValue: Animated.Value;
  _gesturePosition: Animated.ValueXY;

  constructor() {
    super(...arguments);

    this._scrollValue = new Animated.Value(0);
    this._scaleValue = new Animated.Value(1);
    this._gesturePosition = new Animated.ValueXY();
    this.state = {
      isDragging: false,
    };
  }

  static childContextTypes = {
    gesturePosition: PropTypes.object,
    scrollValue: PropTypes.object,
    scaleValue: PropTypes.object,
  };

  getChildContext() {
    return {
      gesturePosition: this._gesturePosition,
      scaleValue: this._scaleValue,
      scrollValue: this._scrollValue,
    };
  }

  render() {
    let {isDragging, selectedPhoto} = this.state;
    let onScroll = Animated.event([
      {nativeEvent: {contentOffset: {y: this._scrollValue}}},
    ]);

    return (
      <View style={styles.container}>
        <ScrollView
          scrollEventThrottle={16}
          onScroll={onScroll}
          scrollEnabled={!isDragging}
        >
          {photos.map((photo, key) => {
            return (
              <Photo
                data={photo}
                key={key}
                isDragging={isDragging}
                onGestureStart={(selectedPhoto: SelectedPhotoType) => {
                  this.setState({
                    selectedPhoto,
                    isDragging: true,
                  });
                }}
                onGestureRelease={() => this.setState({isDragging: false})}
              />
            );
          })}
        </ScrollView>
        {isDragging
          ? <SelectedPhoto
            key={selectedPhoto ? selectedPhoto.photoURI : ''}
            selectedPhoto={selectedPhoto}
          />
          : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
  },
});
