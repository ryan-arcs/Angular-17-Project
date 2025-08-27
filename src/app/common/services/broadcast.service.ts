import { Injectable } from '@angular/core';
import { InactivityService } from './inactivity.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class BroadcastService {
  // Creating a broadcast channel for transmitting user activities among all tabs
  private channel: BroadcastChannel = new BroadcastChannel('xapps-broadcast-channel');

  constructor(
    private inactivityService: InactivityService,
    private authService: AuthService
  ) {
  }

  initiate (){
    // Reading the transmitted message
    this.channel.onmessage = (event) => {
      const message = JSON.parse(event.data);

      // Timer will reset if user performs any activity in any tab
      if (message?.resetInactivityTimer) {
        this.inactivityService.resetTimer();
      }

      if (message?.logout) {
        this.inactivityService.clearInactivityTimeout();
        this.authService.logOut();
      }
    };
  }
}
