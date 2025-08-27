import { Component, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GlobalDataService } from '@app/common/services/global-data.service';
import { UIService } from '@app/common/services/ui.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  showErrors = false;
  @ViewChildren('inputElement') inputElements?: QueryList<any>;
  constructor(
    private fb: FormBuilder,
    private globalDataService: GlobalDataService,
    private uiService: UIService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.uiService.setTheme({activeTheme: 'light'});
  }

  /**
   * Handles form submission, validates the form, and updates user details.
   */
  async onSubmit() {
    this.showErrors = true;
    if (this.loginForm.valid) {

      const userData: any = {
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value
      };

      await this.globalDataService.getLoginUser(userData);
      this.loginForm.reset();
      this.router.navigate(['/my-apps']);
      this.showErrors = false;
    } else {
      const firstControl = this.inputElements
        ?.toArray()
        .find((input) =>
          input?.nativeElement?.classList?.value?.includes('ng-invalid') || input?.element?.classList?.value?.includes('ng-invalid'),
        );
  
      if (firstControl) {
        if (firstControl?.nativeElement) {
          firstControl?.nativeElement?.focus();
        } else {
          firstControl?.open();
        }
      }
    }
  }
}
