import { TestBed } from '@angular/core/testing';

import { RouteSubscriptionService } from './route-subscription.service';

describe('RouteSubscriptionService', () => {
  let service: RouteSubscriptionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RouteSubscriptionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
