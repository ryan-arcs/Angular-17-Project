import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditRecordComponent } from './add-edit-record.component';

describe('AddEditRecordComponent', () => {
  let component: AddEditRecordComponent;
  let fixture: ComponentFixture<AddEditRecordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditRecordComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditRecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
