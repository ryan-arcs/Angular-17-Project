import { TestBed } from '@angular/core/testing';

import { C4EGlobalDataService } from './c4e-global-data.service';

describe('C4EGlobalDataService', () => {
  let service: C4EGlobalDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(C4EGlobalDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
