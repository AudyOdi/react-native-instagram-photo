// @flow
import React from 'react';
import {StyleSheet, View, ScrollView, Animated} from 'react-native';

import Photo from './Photo';
import SelectedPhoto from './SelectedPhoto';

let photos = ['1', '2', '3', '4', '5'];

type State = {
  selectedPhotoMeasurement?: Object;
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
    let {selectedPhotoMeasurement} = this.state;
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
                onPress={(measurement: Object) => {
                  this.setState({selectedPhotoMeasurement: measurement});
                }}
              />
            );
          })}
        </ScrollView>
        {selectedPhotoMeasurement
          ? <SelectedPhoto
            selectedPhotoMeasurement={selectedPhotoMeasurement}
            scrollValue={{y: this.scrollValue.__getValue()}}
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
