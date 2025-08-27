import { TestBed } from '@angular/core/testing';

import { PermittedApplicationService } from './permitted-appolication.service';

describe('PermittedApplicationService', () => {
  let service: PermittedApplicationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PermittedApplicationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
