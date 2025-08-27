import { TestBed } from '@angular/core/testing';

import { AsherGlobalDataService } from './asher-global-data.service';

describe('AsherGlobalDataService', () => {
  let service: AsherGlobalDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AsherGlobalDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
