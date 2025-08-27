import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditAsherComponent } from './add-edit-asher.component';

describe('AddEditAsherComponent', () => {
  let component: AddEditAsherComponent;
  let fixture: ComponentFixture<AddEditAsherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditAsherComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditAsherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
