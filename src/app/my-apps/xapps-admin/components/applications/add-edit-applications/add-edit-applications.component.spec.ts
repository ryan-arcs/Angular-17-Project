import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditApplicationsComponent } from './add-edit-applications.component';

describe('AddEditApplicationsComponent', () => {
  let component: AddEditApplicationsComponent;
  let fixture: ComponentFixture<AddEditApplicationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditApplicationsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditApplicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
