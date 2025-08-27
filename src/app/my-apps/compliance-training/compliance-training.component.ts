import {
  Component,
  OnInit,
} from '@angular/core';
import {
  ReactiveFormsModule,
} from '@angular/forms';
import { NgbRatingModule } from '@ng-bootstrap/ng-bootstrap';
import { UIService } from 'src/app/common/services/ui.service';
import { NgxStarsComponent, NgxStarsModule } from 'ngx-stars';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-compliance-training',
  standalone: true,
  imports: [NgbRatingModule, ReactiveFormsModule, NgxStarsModule],
  providers: [NgxStarsComponent],
  templateUrl: './compliance-training.component.html',
  styleUrl: './compliance-training.component.scss',
})
export class ComplianceTrainingComponent implements OnInit {
  contentUrl!: SafeResourceUrl;
  tempContentUrl = '';
  signedURL!: SafeResourceUrl;
  complianceTrainingApiUrl = 'compliance-training-api';
  
  constructor(
    private sanitizer: DomSanitizer,
    private uiService: UIService,
    private http: HttpClient,
  ) {
  }

  async ngOnInit(): Promise<void> {
    const response = (await lastValueFrom(
      this.http.get(`${this.complianceTrainingApiUrl}/compliance-training`),
    )) as any;

    this.tempContentUrl = response.cloudfrontHostURL + '/contents/compliancetrainings/story.html';
        
    this.signedURL = this.sanitizer.bypassSecurityTrustResourceUrl(response.signedURL);
    this.uiService.setLoader(false);
  }
  
  onIframeLoad() {
    this.contentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.tempContentUrl);
  }
}
