import { Injectable, TemplateRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HeaderService {

  private dropdownContentSource = new BehaviorSubject<TemplateRef<any> | null>(
    null,
  );
  dropdownContent$ = this.dropdownContentSource.asObservable();

  constructor() {}

  updateDropdownContent(content: TemplateRef<any> | null) {
    this.dropdownContentSource.next(content);
  }
}
