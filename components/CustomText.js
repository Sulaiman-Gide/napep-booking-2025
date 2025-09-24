import React from 'react';
import { Text, StyleSheet } from 'react-native';

const CustomText = ({ style, children, ...props }) => {
  return (
    <Text style={[styles.text, style]} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'nunitoSansRegular',
    fontSize: 14,
    color: '#081225',
    lineHeight: 19.1,
    fontWeight: 400,
  },
});

export default CustomText;
