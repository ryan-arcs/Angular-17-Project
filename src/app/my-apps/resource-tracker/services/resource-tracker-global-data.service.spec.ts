import { TestBed } from '@angular/core/testing';

import { ResourceTrackerGlobalDataService } from './resource-tracker-global-data.service';

describe('ResourceTrackerGlobalDataService', () => {
  let service: ResourceTrackerGlobalDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResourceTrackerGlobalDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
