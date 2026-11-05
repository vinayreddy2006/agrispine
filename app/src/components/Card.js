import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../constants/colors';

const Card = ({
  children,
  onPress,
  style,
  accentColor,
  activeOpacity = 0.75,
  ...rest
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      activeOpacity={activeOpacity}
      onPress={onPress}
      style={[
        styles.card,
        accentColor && { borderLeftWidth: 4, borderLeftColor: accentColor },
        style,
      ]}
      {...rest}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
});

export default Card;
