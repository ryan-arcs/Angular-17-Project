import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditVendorsComponent } from './add-edit-vendors.component';

describe('AddAsorComponent', () => {
  let component: AddEditVendorsComponent;
  let fixture: ComponentFixture<AddEditVendorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditVendorsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditVendorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
