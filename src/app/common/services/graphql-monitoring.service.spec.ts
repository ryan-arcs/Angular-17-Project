import { TestBed } from '@angular/core/testing';
import { GraphqlMonitoringService } from './graphql-monitoring.service';

describe('GraphqlMonitoringService', () => {
  let service: GraphqlMonitoringService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GraphqlMonitoringService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});