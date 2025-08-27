import { TestBed } from '@angular/core/testing';

import { XAppsAdminGlobalDataService } from './xapps-admin-global-data.service';

describe('XAppsAdminGlobalDataService', () => {
  let service: XAppsAdminGlobalDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(XAppsAdminGlobalDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
