import { TestBed } from '@angular/core/testing';

import { IappGlobalDataService } from './iapp-global-data.service';

describe('IappGlobalDataService', () => {
  let service: IappGlobalDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IappGlobalDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
