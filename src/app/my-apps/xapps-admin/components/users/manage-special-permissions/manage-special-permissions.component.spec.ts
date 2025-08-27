import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageSpecialPermissionsComponent } from './manage-special-permissions.component';

describe('ManageSpecialPermissionsComponent', () => {
  let component: ManageSpecialPermissionsComponent;
  let fixture: ComponentFixture<ManageSpecialPermissionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageSpecialPermissionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageSpecialPermissionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
