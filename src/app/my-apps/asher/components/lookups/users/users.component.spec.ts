import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsorComponent } from './asher.component';

describe('AsorComponent', () => {
  let component: AsorComponent;
  let fixture: ComponentFixture<AsorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AsorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
