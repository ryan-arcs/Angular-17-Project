import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditPermissionsComponent } from './add-edit-permissions.component';

describe('AddEditPermissionsComponent', () => {
  let component: AddEditPermissionsComponent;
  let fixture: ComponentFixture<AddEditPermissionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditPermissionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditPermissionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
