import { Pressable, StyleSheet, Text } from 'react-native';

interface ExitButtonProps {
  onPress: () => void;
}

export function ExitButton({ onPress }: ExitButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Exit to home"
      hitSlop={12}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.icon}>✕</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(17, 36, 22, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  icon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginTop: -1,
  },
});
