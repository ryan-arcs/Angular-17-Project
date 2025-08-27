import { ComponentFixture, TestBed } from '@angular/core/testing';

import { C4eComponent } from './c4e.component';

describe('C4eComponent', () => {
  let component: C4eComponent;
  let fixture: ComponentFixture<C4eComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [C4eComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(C4eComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
