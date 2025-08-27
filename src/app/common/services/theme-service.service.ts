import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { FontSize, ThemeMode } from '../interfaces/global.interface';
@Injectable({
  providedIn: 'root'
})
export class ThemeServiceService {

  private renderer: Renderer2;
  private currentThemeClass: string = 'nds-light-blue';
  private currentFontClass: string = 'font-medium';

  constructor(private rendererFactory: RendererFactory2, private localservice: LocalStorageService) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }


  setTheme(
    mode: ThemeMode,
    color: string,
    font: FontSize
  ) {
    const newTheme = `${mode}-${color}`;
    this.updateClass(document.body, this.currentThemeClass, newTheme);
    this.updateClass(document.body, this.currentFontClass, font);
    this.currentFontClass = font;
    this.currentThemeClass = newTheme;
    // localStorage.setItem('app-theme', newTheme);
    // localStorage.setItem('font-size', font);
  }

  private updateClass(element: HTMLElement, oldClass: string, newClass: string) {
    if (oldClass) {
      this.renderer.removeClass(element, oldClass);
    }
    this.renderer.addClass(element, newClass);
  }
}
