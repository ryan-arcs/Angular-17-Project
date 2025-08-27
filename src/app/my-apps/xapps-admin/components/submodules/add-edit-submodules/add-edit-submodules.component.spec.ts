import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditSubmodulesComponent } from './add-edit-submodules.component';

describe('AddEditSubmodulesComponent', () => {
  let component: AddEditSubmodulesComponent;
  let fixture: ComponentFixture<AddEditSubmodulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditSubmodulesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditSubmodulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
