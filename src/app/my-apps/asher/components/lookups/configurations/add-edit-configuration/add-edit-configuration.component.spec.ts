import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditConfigurationComponent } from './add-edit-configuration.component';

describe('AddEditConfigurationComponent', () => {
  let component: AddEditConfigurationComponent;
  let fixture: ComponentFixture<AddEditConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditConfigurationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddEditConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
