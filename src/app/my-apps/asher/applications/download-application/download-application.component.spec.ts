import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadApplicationComponent } from './download-application.component';

describe('AddAsorComponent', () => {
  let component: DownloadApplicationComponent;
  let fixture: ComponentFixture<DownloadApplicationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadApplicationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
