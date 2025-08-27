import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewTileComponent } from './view-tile.component';

describe('ViewTileComponent', () => {
  let component: ViewTileComponent;
  let fixture: ComponentFixture<ViewTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewTileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ViewTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
