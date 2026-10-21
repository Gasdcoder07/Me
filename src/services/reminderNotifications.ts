import * as Notifications from "expo-notifications";
import type { SQLiteDatabase } from "expo-sqlite";

import { listUpcomingReminders } from "@/data/reminders";
import type { Reminder } from "@/types/reminders";
import { formatTime } from "@/utils/dates";

const DAY_MS = 24 * 60 * 60 * 1000;
// Bundled through the expo-notifications config plugin (see app.json).
const ALARM_SOUND = "alarm.wav";
// iOS keeps at most 64 pending local notifications per app, and each reminder uses two.
export const MAX_REARMED_REMINDERS = 30;

// Notifications also show while the app is open, so a reminder is never silent.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Ids come from the reminder, so cancelling and re-arming never need stored ids.
const dueId = (reminderId: string) => `${reminderId}:due`;
const dayBeforeId = (reminderId: string) => `${reminderId}:pre24`;

// Asks only when the user has not answered yet; iOS will not show the prompt again after that.
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true },
  });
  return requested.granted;
}

export async function cancelReminderNotifications(reminderId: string): Promise<void> {
  await Promise.all([
    Notifications.cancelScheduledNotificationAsync(dueId(reminderId)),
    Notifications.cancelScheduledNotificationAsync(dayBeforeId(reminderId)),
  ]);
}

// Replaces both notifications of a reminder, so arming it twice never duplicates them.
async function armReminder(reminder: Reminder): Promise<void> {
  await cancelReminderNotifications(reminder.id);

  const now = Date.now();
  const time = formatTime(new Date(reminder.remindAt));

  if (reminder.remindAt > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: dueId(reminder.id),
      content: { title: reminder.title, body: "No lo olvides !", sound: ALARM_SOUND },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(reminder.remindAt),
      },
    });
  }

  // Skipped when the reminder was saved less than 24 hours ahead, since that moment has already passed.
  const dayBeforeAt = reminder.remindAt - DAY_MS;
  if (dayBeforeAt > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: dayBeforeId(reminder.id),
      content: {
        title: `Mañana: ${reminder.title}`,
        body: `Tienes un recordatorio a las ${time}.`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(dayBeforeAt),
      },
    });
  }
}

// Called right after a reminder is saved. Returns false when notifications are not allowed.
export async function scheduleReminderNotifications(reminder: Reminder): Promise<boolean> {
  if (!(await ensureNotificationPermission())) return false;

  await armReminder(reminder);
  return true;
}

// Runs once per launch. Re-arms the nearest reminders so their notifications match the database.
// Never asks for permission here; without it, there is nothing to re-arm.
export async function syncReminderNotifications(db: SQLiteDatabase): Promise<void> {
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;

  const upcoming = await listUpcomingReminders(db, Date.now(), MAX_REARMED_REMINDERS);
  for (const reminder of upcoming) {
    await armReminder(reminder);
  }
}
