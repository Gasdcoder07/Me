// remindAt is a Unix timestamp in milliseconds. Days and hours are read in the device's time zone.
export type Reminder = {
  id: string;
  title: string;
  remindAt: number;
};
