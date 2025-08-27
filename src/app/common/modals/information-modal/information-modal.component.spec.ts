import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformationModalComponent } from './information-modal.component';

describe('ConfirmationModalComponent', () => {
  let component: InformationModalComponent;
  let fixture: ComponentFixture<InformationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformationModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InformationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
