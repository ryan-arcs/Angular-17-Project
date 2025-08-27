import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditRolesComponent } from './add-edit-roles.component';

describe('AddEditRolesComponent', () => {
  let component: AddEditRolesComponent;
  let fixture: ComponentFixture<AddEditRolesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditRolesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditRolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
