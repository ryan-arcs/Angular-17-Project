import { Injectable, OnDestroy } from '@angular/core';
import { fromEvent, Subscription, merge } from 'rxjs';
import { environment } from 'src/environments/environment';

let inactivityTimeout: ReturnType<typeof setTimeout>;
const userInactivityLogoutTime =
  Number(environment.userInactivityLogoutTime) || 60;
const timeoutDuration = 1000 * 60 * userInactivityLogoutTime;

@Injectable({
  providedIn: 'root',
})
export class InactivityService implements OnDestroy {
  private channel: BroadcastChannel = new BroadcastChannel('xapps-broadcast-channel');

  // User activities to be monitored
  private activityEvents$ = merge(
    fromEvent(window, 'mousemove'),
    fromEvent(window, 'click'),
    fromEvent(window, 'keydown'),
    fromEvent(window, 'scroll'),
    fromEvent(window, 'touchstart'),
  );
  private subscriptions: Subscription = new Subscription();

  constructor() {}
  
  // Start the logout timer and watch user activity
  initiate() {
    this.resetTimer();
    this.monitorUserActivity();
  }

  // Clear the current settimeOut and set a new one
  resetTimer() {
    if (inactivityTimeout) {
      clearTimeout(inactivityTimeout);
    }

    inactivityTimeout = setTimeout(() => {
      const message = {
        logout: true,
      };
      this.channel.postMessage(JSON.stringify(message));
    }, timeoutDuration);
  }

  // Continuously monitors the user's activity
  private monitorUserActivity() {
    const activityWatcher = this.activityEvents$.subscribe(() => {
      // If user is active then message is broadcast to all tabs and resets the timer
      const message = {
        resetInactivityTimer: true,
      };
      this.channel.postMessage(JSON.stringify(message));
      this.resetTimer();
    });
    this.subscriptions.add(activityWatcher);
  }

  clearInactivityTimeout(){
    if (inactivityTimeout) {
      clearTimeout(inactivityTimeout);
    }
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions
    this.subscriptions.unsubscribe();
  }
}
