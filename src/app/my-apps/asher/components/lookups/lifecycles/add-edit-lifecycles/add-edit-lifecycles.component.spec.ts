import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditLifeCyclesComponent } from './add-edit-lifecycles.component';

describe('AddAsorComponent', () => {
  let component: AddEditLifeCyclesComponent;
  let fixture: ComponentFixture<AddEditLifeCyclesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditLifeCyclesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditLifeCyclesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
