// screen-aware.base.ts
import { Component, HostListener } from '@angular/core';
import { signal, computed } from '@angular/core';

@Component({ template: '' })
export abstract class ScreenAware {
  protected screenWidth = signal(window.innerWidth);
  isMobileScreen = computed(() => this.screenWidth() < 768);

  constructor() {
    setTimeout(() => {
      this.setTableColumns();
    }, 200);
  }

  protected abstract setTableColumns(): void;

  @HostListener('window:resize')
  onResize() {
    this.screenWidth.set(window.innerWidth);
    this.setTableColumns();
  }
}
