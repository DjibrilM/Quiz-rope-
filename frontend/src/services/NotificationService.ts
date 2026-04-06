import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { ChildProfile } from '../stores/gameStore';
import type { ChildPerformance } from '@shared/types/analytics.types';
import { apiService } from './api';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  /**
   * Request permissions for push notifications
   */
  static async registerForPushNotificationsAsync() {
    if (Platform.OS === 'web') return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#9B59B6',
      });
    }

    return finalStatus;
  }

  /**
   * Schedule 5+ routine notifications for the child
   */
  static async scheduleRoutineNotifications(
    childProfile: any,
    performance?: ChildPerformance,
    streak: number = 0
  ) {
    // Clear all existing notifications to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    const name = childProfile?.displayName || 'Friend';
    const weakestSubject = performance?.weakestSubject || 'Math';
    const favoriteSubject = performance?.bestSubject || 'Science';

    // 1. Morning Boost (8:00 AM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Good morning, ${name}! ☀️`,
        body: `Ready to sharpen your brain? Let's tackle some ${favoriteSubject} today! ⚡️`,
        data: { screen: '/home' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 8,
        minute: 0,
      },
    });

    // 2. After-school Check-in (4:00 PM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `How was school? 🏫`,
        body: `Time for a quick ${weakestSubject} quiz to keep those skills sharp! 🧠`,
        data: { screen: '/home' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 16,
        minute: 0,
      },
    });

    // 3. Struggle Subject Reminder (8:00 PM) - The User's specific request
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Boost your skills! 💪`,
        body: `Let's work on ${weakestSubject} today! You've got this, ${name}!`,
        data: { screen: '/home' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
      },
    });

    // 4. Weekend Challenge (Saturday 10:00 AM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Weekend Challenge Component! 🏆`,
        body: `Can you beat your high score in ${favoriteSubject}? Let's find out!`,
        data: { screen: '/leaderboard' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 7, // Saturday
        hour: 10,
        minute: 0,
      },
    });

    // 5. Streak Reminder (7:00 PM)
    if (streak > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${streak} Day Streak! 🔥`,
          body: `Don't let it break – take a quick quiz now to keep your streak alive!`,
          data: { screen: '/home' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 19,
          minute: 0,
        },
      });
    } else {
       // Alternate: Start a streak!
       await Notifications.scheduleNotificationAsync({
        content: {
          title: `Start a streak! 🚀`,
          body: `Play your first game today and start your learning journey!`,
          data: { screen: '/home' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 19,
          minute: 0,
        },
      });
    }

    // 6. Sunday Review (Sunday 6:00 PM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Weekly Review 📊`,
        body: `Let's see how much you learned this week! Check your progress.`,
        data: { screen: '/profile' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour: 18,
        minute: 0,
      },
    });

    // 7. Inactivity Personal Boost (48 hours from now)
    const childId = childProfile.id || childProfile._id;
    if (childId) {
      this.scheduleInactivityNotification(childId).catch(() => {});
    }
  }

  /**
   * Fetch a personalized message from the backend and schedule it for 48h from now.
   * This triggers if the kid hasn't opened the app in two days.
   */
  static async scheduleInactivityNotification(childId: string) {
    try {
      const { message } = await apiService.getInactivityMessage(childId);
      
      // We use a unique identifier (or just allow the default)
      // scheduleRoutineNotifications already cancels all, so we just add this one.
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `We've missed you! ✨`,
          body: message,
          data: { screen: '/home' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 48 * 60 * 60, // 48 hours
        },
      });
      // console.log('Scheduled inactivity notification:', message);
    } catch (error) {
       // console.warn('Failed to schedule inactivity notification:', error);
    }
  }

  /**
   * Send an immediate welcome notification on sign-in
   */
  static async sendSignInNotification(name?: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Brain Tug-of-War time, ${name || 'Challenger'}! 🧠💥`,
        body: "Get ready to flex those mental muscles! Let's see who wins the ultimate learning battle today! 🏆🚀",
        data: { screen: '/home' },
      },
      trigger: null, // Send immediately
    });
  }

  /**
   * Cancel all notifications
   */
  static async cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}
