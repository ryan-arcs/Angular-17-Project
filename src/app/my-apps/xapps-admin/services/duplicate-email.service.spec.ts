import { TestBed } from '@angular/core/testing';

import { DuplicateEmailService } from './duplicate-email.service';

describe('DuplicateEmailService', () => {
  let service: DuplicateEmailService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DuplicateEmailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
