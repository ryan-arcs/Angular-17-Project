import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  private defaultStorageKey = 'appConfig';

  constructor() { }

  getLocalStorage(): any {
    const config = localStorage.getItem(this.defaultStorageKey);
    return config ? JSON.parse(config) : {};
  }

  setLocalStorage(config: any): void {
    localStorage.setItem(this.defaultStorageKey, JSON.stringify(config));
  }

  updateLocalStorage(partialConfig: any): void {
    const currentConfig = this.getLocalStorage();
    const updatedConfig = { ...currentConfig, ...partialConfig };
    this.setLocalStorage(updatedConfig);
  }

  clearConfig(): void {
    localStorage.removeItem(this.defaultStorageKey);
  }
}
