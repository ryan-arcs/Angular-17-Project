import { TestBed } from '@angular/core/testing';

import { TableauGlobalDataService } from './tableau-global-data.service';

describe('TableauGlobalDataService', () => {
  let service: TableauGlobalDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableauGlobalDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
