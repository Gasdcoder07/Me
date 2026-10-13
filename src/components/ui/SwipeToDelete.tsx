import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Icon } from '@/components/icons/Icon';
import { colors, radii } from '@/constants/theme';

const ACTION_WIDTH = 88;

type SwipeToDeleteProps = {
  children: ReactNode;
  accessibilityLabel: string;
  onDelete: () => void;
};

// Swiping the card to the left reveals a red delete button. The swipe never removes the row by itself:
// tapping the button closes the row and hands over to onDelete, which asks for confirmation.
export function SwipeToDelete({ children, accessibilityLabel, onDelete }: SwipeToDeleteProps) {
  const renderRightActions = (
    _progress: SharedValue<number>,
    translation: SharedValue<number>,
    methods: SwipeableMethods,
  ) => (
    <DeleteAction
      translation={translation}
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        methods.close();
        onDelete();
      }}
    />
  );

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={ACTION_WIDTH / 2}
      overshootRight={false}
      renderRightActions={renderRightActions}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

type DeleteActionProps = {
  translation: SharedValue<number>;
  accessibilityLabel: string;
  onPress: () => void;
};

// Starts off the right edge and lands flush with it once the row is fully swiped open.
function DeleteAction({ translation, accessibilityLabel, onPress }: DeleteActionProps) {
  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translation.value + ACTION_WIDTH }],
  }));

  return (
    <Animated.View style={[{ width: ACTION_WIDTH, alignSelf: 'stretch' }, slideStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={{
          marginLeft: 2,
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          borderRadius: radii.block,
          backgroundColor: colors.canvas,
        }}
      >
        <Icon name="trash" size={22} color={colors.ink} />
        <Text className="font-medium text-xs text-focus-text" style={{ color: colors.inkFaint }}>Borrar</Text>
      </Pressable>
    </Animated.View>
  );
}
