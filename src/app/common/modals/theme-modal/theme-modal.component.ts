import { Component, inject, OnInit } from '@angular/core';
import { ThemeServiceService } from '@app/common/services/theme-service.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgClass } from '@angular/common';
import { ThemeMode,FontSize,FontClassMap } from '@app/common/interfaces/global.interface';
import { UIService } from '@app/common/services/ui.service';
@Component({
  selector: 'app-theme-modal',
  standalone: true,
  imports: [NgClass],
  templateUrl: './theme-modal.component.html',
  styleUrl: './theme-modal.component.scss'
})
export class ThemeModalComponent implements OnInit {
  themePopup = inject(NgbActiveModal);
  mode: ThemeMode = 'nds-light';
  color:string = 'blue';
  font: FontSize = 'font-medium';

  fontClassMap: FontClassMap = {
    'A+': 'font-large',
    'A': 'font-medium',
    'A-': 'font-small'
  };

  constructor(private themeService: ThemeServiceService, private uiService: UIService) {}

  ngOnInit(): void {
    // const storedTheme = localStorage.getItem('app-theme') || '';
    // const storedFont = localStorage.getItem('font-size') || '';

    // this.mode = storedTheme.includes('dark') ? 'nds-dark' : 'nds-light';
    // this.color = storedTheme?.split('-').pop() ?? this.color;
    // if (storedFont.includes('large')) {
    //   this.font = 'font-large';
    // } else if (storedFont.includes('medium')) {
    //   this.font = 'font-medium';
    // } else {
    //   this.font = 'font-small';
    // }
  }

  setThemeColor(color: string): void {
    this.color = color;
    this.applyTheme();
  }

  setThemeMode(mode: ThemeMode): void {
    this.mode = mode;
    this.applyTheme();
  }

  setThemeFont(font: FontSize): void {
    this.font = font;
    this.applyTheme();
  }

  private applyTheme(): void {
    // this.themeService.setTheme(this.mode, this.color, this.font);
    // const activeTheme = this.mode?.includes('dark') ? 'dark' : 'light';
    // this.uiService.setTheme({activeTheme})

  }
}
