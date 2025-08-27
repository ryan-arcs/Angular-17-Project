import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceTrainingComponent } from './compliance-training.component';

describe('ComplianceTrainingComponent', () => {
  let component: ComplianceTrainingComponent;
  let fixture: ComponentFixture<ComplianceTrainingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComplianceTrainingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ComplianceTrainingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
