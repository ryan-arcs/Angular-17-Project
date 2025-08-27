import { Injectable } from '@angular/core';

export type PanelState = 'COLLAPSED' | 'EXPANDED';

@Injectable({
  providedIn: 'root'
})
export class LeftPanelService {
  constructor() {}

  /**
   * Sets the state of the left panel in local storage.
   * @param type - The state to set, either 'COLLAPSED' or 'EXPANDED'.
   */
  setPanelState(type: PanelState): void {
    localStorage.setItem('leftPanelState', type);
  }

  /**
   * Retrieves the state of the left panel from local storage.
   * @returns The current state of the left panel, either 'COLLAPSED' or 'EXPANDED'.
   */
  getPanelState(): PanelState {
    const state = localStorage.getItem('leftPanelState') as PanelState;
    return state === 'COLLAPSED' || state === 'EXPANDED' ? state : 'EXPANDED';
  }
}
