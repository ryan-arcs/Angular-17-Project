import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceTrackerComponent } from './resource-tracker.component';

describe('SSPAadminComponent', () => {
  let component: ResourceTrackerComponent;
  let fixture: ComponentFixture<ResourceTrackerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceTrackerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceTrackerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
