import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchPortalComponent } from './search-portal.component';

describe('SearchPortalComponent', () => {
  let component: SearchPortalComponent;
  let fixture: ComponentFixture<SearchPortalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchPortalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SearchPortalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
