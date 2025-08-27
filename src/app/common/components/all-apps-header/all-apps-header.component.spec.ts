import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllAppsHeaderComponent } from './all-apps-header.component';

describe('AllAppsHeaderComponent', () => {
  let component: AllAppsHeaderComponent;
  let fixture: ComponentFixture<AllAppsHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllAppsHeaderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllAppsHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
