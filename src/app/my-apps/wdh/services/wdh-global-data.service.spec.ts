import { TestBed } from '@angular/core/testing';

import { WdhGlobalDataService } from './wdh-global-data.service';

describe('WdhGlobalDataService', () => {
  let service: WdhGlobalDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WdhGlobalDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
