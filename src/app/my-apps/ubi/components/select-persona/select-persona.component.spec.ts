import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectPersonaComponent } from './select-persona.component';

describe('SelectPersonaComponent', () => {
  let component: SelectPersonaComponent;
  let fixture: ComponentFixture<SelectPersonaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectPersonaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SelectPersonaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
