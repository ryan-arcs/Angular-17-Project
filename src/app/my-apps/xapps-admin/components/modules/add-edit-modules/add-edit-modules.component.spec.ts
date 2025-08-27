import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditModulesComponent } from './add-edit-modules.component';

describe('AddEditModulesComponent', () => {
  let component: AddEditModulesComponent;
  let fixture: ComponentFixture<AddEditModulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditModulesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditModulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
