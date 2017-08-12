// @flow

import React, {Component} from 'react';
import ReactNative, {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  UIManager,
} from 'react-native';

import {Avatar, ListItem} from 'react-native-elements';

let {width} = Dimensions.get('window');

type Props = {
  photo: string;
  style?: Object;
  onPress?: (position: Object) => void;
};

export default class Photo extends Component {
  props: Props;
  _parent: ?Object;
  _photoComponent: ?Object;

  render() {
    let {photo, style, onPress} = this.props;
    let onPressHandler = async() => {
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
      UIManager.measureLayoutRelativeToParent(
        photoComponent,
        e => console.log(e), // eslint-disable-line
        (x, y, w, h) => {
          onPress &&
            onPress({
              x,
              y: parentMeasurement.y + y,
              w,
              h,
            });
        }
      );
    };
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
        <View ref={(photoComponent) => (this._photoComponent = photoComponent)}>
          <TouchableOpacity onPress={onPressHandler}>
            <View
              style={[
                {
                  width: width,
                  height: 300,
                  backgroundColor: 'red',
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
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}
