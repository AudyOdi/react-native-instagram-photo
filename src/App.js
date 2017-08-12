// @flow
import React from 'react';
import {StyleSheet, View, ScrollView, Animated} from 'react-native';

import Photo from './Photo';

let photos = ['1', '2', '3', '4', '5'];

type State = {
  selectedPhotoPosition?: Object;
};

export default class App extends React.Component {
  state: State;
  scrollValue: Animated.Value;

  constructor() {
    super(...arguments);

    this.scrollValue = new Animated.Value(0);
    this.state = {};
  }

  render() {
    let {selectedPhotoPosition} = this.state;
    let onScroll = Animated.event([
      {nativeEvent: {contentOffset: {y: this.scrollValue}}},
    ]);

    return (
      <View style={styles.container}>
        <ScrollView scrollEventThrottle={16} onScroll={onScroll}>
          {photos.map((photo, key) => {
            return (
              <Photo
                photo={photo}
                key={key}
                onPress={(position: Object) => {
                  this.setState({selectedPhotoPosition: position});
                }}
              />
            );
          })}
        </ScrollView>
        {selectedPhotoPosition
          ? <View
            style={{
              position: 'absolute',
              zIndex: 100,
              width: selectedPhotoPosition.w,
              height: selectedPhotoPosition.h,
              backgroundColor: 'blue',
              transform: [
                {
                  translateY:
                      selectedPhotoPosition.y - this.scrollValue.__getValue(),
                },
              ],
            }}
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
