import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnsToggleModalComponent } from './columns-toggle-modal.component';

describe('ColumnsToggleModalComponent', () => {
  let component: ColumnsToggleModalComponent;
  let fixture: ComponentFixture<ColumnsToggleModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColumnsToggleModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ColumnsToggleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
