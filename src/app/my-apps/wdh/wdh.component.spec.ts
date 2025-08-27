import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WdhComponent } from './wdh.component';

describe('WdhComponent', () => {
  let component: WdhComponent;
  let fixture: ComponentFixture<WdhComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WdhComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WdhComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
