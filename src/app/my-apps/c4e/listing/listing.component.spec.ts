import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResourceRequestsComponent } from '../../cdp/resource-requests/resource-requests.component';

describe('RolesComponent', () => {
  let component: ResourceRequestsComponent;
  let fixture: ComponentFixture<ResourceRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceRequestsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
