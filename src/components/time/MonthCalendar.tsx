import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { DarkPanel } from '@/components/ui/DarkPanel';
import { colors } from '@/constants/theme';
import type { Reminder } from '@/types/reminders';
import {
  addMonths,
  dayKey,
  getMonthWeeks,
  isSameDay,
  monthTitle,
  startOfDay,
  WEEKDAY_LABELS_ES,
} from '@/utils/dates';

// Chips shown per day before collapsing the rest into "+N", as in the reference grid.
const MAX_CHIPS_PER_DAY = 2;
const CELL_MIN_HEIGHT = 92;
// Compact cells hold only the day number: no chips, so they can be short enough for a form.
const COMPACT_CELL_MIN_HEIGHT = 44;

type MonthHeaderProps = {
  // Any date inside the month being shown.
  month: Date;
  onChangeMonth: (month: Date) => void;
  // Tighter spacing for forms.
  compact?: boolean;
};

type MonthGridProps = {
  month: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  // Reminders of the month, grouped by dayKey. Each day shows up to two as chips.
  remindersByDay?: Map<string, Reminder[]>;
  // The reminder closest in time. Drawn as a solid black chip.
  nextReminderId?: string | null;
  // Current time in ms. Reminders before it are drawn muted. Without it, none is muted.
  now?: number;
  // Earlier days stay visible but cannot be picked.
  minDate?: Date;
  // Shorter rows, and the selected day is a solid black circle instead of a ring.
  compact?: boolean;
};

type MonthCalendarProps = MonthHeaderProps & MonthGridProps;

// Month header: prev/next outline buttons, the month title and the weekday row.
// Default has no background of its own, so it sits on the dark panel. Compact is ink on the canvas.
export function MonthHeader({ month, onChangeMonth, compact = false }: MonthHeaderProps) {
  const ink = compact ? colors.ink : colors.focusText;

  return (
    <View className={compact ? 'gap-4 px-6 pb-3 pt-2' : 'gap-5 px-5 pb-5 pt-3'}>
      <View className="flex-row items-center justify-between">
        <NavButton
          label="Mes anterior"
          direction="prev"
          color={ink}
          onPress={() => onChangeMonth(addMonths(month, -1))}
        />
        <Text className="font-title text-xl" style={{ color: ink }}>
          {monthTitle(month)}
        </Text>
        <NavButton
          label="Mes siguiente"
          direction="next"
          color={ink}
          onPress={() => onChangeMonth(addMonths(month, 1))}
        />
      </View>

      <View className="flex-row">
        {WEEKDAY_LABELS_ES.map((label) => (
          <View key={label} className="flex-1 items-center">
            <Text
              className="font-medium text-xs"
              style={compact ? { color: colors.inkMuted } : { color: colors.focusText, opacity: 0.55 }}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Grid of week rows on the canvas, separated by hairlines. Each day shows its number and reminder chips.
export function MonthGrid({
  month,
  selectedDate,
  onSelectDate,
  remindersByDay,
  nextReminderId = null,
  now,
  minDate,
  compact = false,
}: MonthGridProps) {
  const today = startOfDay(new Date());
  const weeks = useMemo(() => getMonthWeeks(month), [month]);

  return (
    <View className="bg-canvas">
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} className="flex-row">
          {week.map((date, dayIndex) => {
            const dayReminders = date ? remindersByDay?.get(dayKey(date)) ?? [] : [];

            return (
              <DayCell
                key={dayIndex}
                date={date}
                dayIndex={dayIndex}
                hasTopBorder={weekIndex > 0}
                isToday={date !== null && isSameDay(date, today)}
                isSelected={date !== null && selectedDate !== null && isSameDay(date, selectedDate)}
                isDisabled={date !== null && minDate !== undefined && date < minDate}
                reminders={dayReminders}
                nextReminderId={nextReminderId}
                now={now}
                compact={compact}
                onSelect={onSelectDate}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

// Compact: header and grid flat on the canvas, edge to edge. Default: header and grid in one rounded dark block.
export function MonthCalendar(props: MonthCalendarProps) {
  const grid = (
    <MonthGrid
      month={props.month}
      selectedDate={props.selectedDate}
      onSelectDate={props.onSelectDate}
      remindersByDay={props.remindersByDay}
      nextReminderId={props.nextReminderId}
      now={props.now}
      minDate={props.minDate}
      compact={props.compact}
    />
  );

  if (props.compact) {
    return (
      <View>
        <MonthHeader month={props.month} onChangeMonth={props.onChangeMonth} compact />
        {grid}
      </View>
    );
  }

  return (
    <View style={{ borderRadius: 32, overflow: 'hidden' }}>
      <DarkPanel>
        <MonthHeader month={props.month} onChangeMonth={props.onChangeMonth} />
      </DarkPanel>
      {grid}
    </View>
  );
}

type NavButtonProps = {
  label: string;
  direction: 'prev' | 'next';
  color: string;
  onPress: () => void;
};

// Thin outline circle. The chevron points down in the icon set, so it is rotated.
function NavButton({ label, direction, color, onPress }: NavButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      className="h-10 w-10 items-center justify-center rounded-full"
      style={{ borderWidth: StyleSheet.hairlineWidth, borderColor: color }}
    >
      <View style={{ transform: [{ rotate: direction === 'prev' ? '90deg' : '-90deg' }] }}>
        <Icon name="chevron" size={18} color={color} />
      </View>
    </Pressable>
  );
}

type DayCellProps = {
  date: Date | null;
  dayIndex: number;
  hasTopBorder: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  reminders: Reminder[];
  nextReminderId: string | null;
  now?: number;
  compact: boolean;
  onSelect: (date: Date) => void;
};

// Memoized: the screen re-renders every minute for the clock, and most cells did not change.
const DayCell = memo(function DayCell({
  date,
  dayIndex,
  hasTopBorder,
  isToday,
  isSelected,
  isDisabled,
  reminders,
  nextReminderId,
  now,
  compact,
  onSelect,
}: DayCellProps) {
  const cellStyle = {
    flex: 1,
    minHeight: compact ? COMPACT_CELL_MIN_HEIGHT : CELL_MIN_HEIGHT,
    paddingTop: compact ? 2 : 6,
    paddingHorizontal: 2,
    gap: 3,
    borderTopWidth: hasTopBorder ? StyleSheet.hairlineWidth : 0,
    borderColor: colors.inkFaint,
  };

  if (!date) return <View style={cellStyle} />;

  const isWeekend = dayIndex === 0 || dayIndex === 6;
  // Default: today is the solid black dot, the selection a ring. Compact: the selection is the solid dot, today a ring.
  const isFilled = compact ? isSelected : isToday;
  const isRinged = compact ? isToday && !isSelected : isSelected && !isToday;
  const numberColor = isDisabled
    ? colors.inkFaint
    : isFilled
      ? colors.focusText
      : isWeekend
        ? colors.inkMuted
        : colors.ink;

  const shown = reminders.slice(0, MAX_CHIPS_PER_DAY);
  const hiddenCount = reminders.length - shown.length;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${date.getDate()}`}
      accessibilityState={{ selected: isSelected, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={() => onSelect(date)}
      style={cellStyle}
    >
      <View
        className="h-7 w-7 items-center justify-center self-center rounded-full"
        style={{
          backgroundColor: isFilled ? colors.focus : 'transparent',
          borderWidth: isRinged ? 1.5 : 0,
          borderColor: colors.ink,
        }}
      >
        <Text className="font-medium text-sm" style={{ color: numberColor }}>
          {date.getDate()}
        </Text>
      </View>

      {shown.map((reminder) => (
        <ReminderChip
          key={reminder.id}
          title={reminder.title}
          isNext={reminder.id === nextReminderId}
          hasPassed={now !== undefined && reminder.remindAt < now}
        />
      ))}

      {hiddenCount > 0 && (
        <Text className="text-center font-medium" style={{ fontSize: 10, lineHeight: 13, color: colors.inkMuted }}>
          +{hiddenCount}
        </Text>
      )}
    </Pressable>
  );
});

type ReminderChipProps = {
  title: string;
  isNext: boolean;
  hasPassed: boolean;
};

// Truncated title on a soft fill. The next reminder is solid black; passed ones are outlined and muted.
function ReminderChip({ title, isNext, hasPassed }: ReminderChipProps) {
  const surface = isNext
    ? { backgroundColor: colors.focus }
    : hasPassed
      ? { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.inkFaint }
      : { backgroundColor: colors.chip };

  const textColor = isNext ? colors.focusText : hasPassed ? colors.inkMuted : colors.ink;

  return (
    <View className="rounded-md px-1 py-0.5" style={surface}>
      <Text numberOfLines={1} className="font-medium" style={{ fontSize: 10, lineHeight: 13, color: textColor }}>
        {title}
      </Text>
    </View>
  );
}
