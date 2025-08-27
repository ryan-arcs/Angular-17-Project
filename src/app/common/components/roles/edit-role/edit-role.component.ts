import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { UIService } from 'src/app/common/services/ui.service';
import { XAppsAdminGlobalDataService } from '@app/my-apps/xapps-admin/services';
import { AuthService } from '@app/common/services/auth.service';

@Component({
  selector: 'app-edit-role',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './edit-role.component.html',
  styleUrls: ['./edit-role.component.scss'],
})
export class EditRoleComponent implements OnInit, OnDestroy {
  roleForm: FormGroup;
  roleId: string = '';
  roleName: string = '';
  showErrors = false;
  getRolesDetailsSubscription: Subscription | undefined;
  applications: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private xappsAdminGlobalDataService: XAppsAdminGlobalDataService,
    private uiService: UIService,
    private authService: AuthService
  ) {
    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      application: [null],
      isActive: [false, Validators.required],
    });
  }

  /**
   * Initialize the component by loading role details and application data.
   */
  ngOnInit() {
    this.getRolesDetailsSubscription =
      this.xappsAdminGlobalDataService.roleDetails$.subscribe({
        next: (role) => {
          if (role?.id) {
            const thisApplication = this.route.snapshot.data['application'];
            if(thisApplication && thisApplication !== role?.application){
              this.authService.performInvalidAccessAction(false);
            }
            this.roleName = role?.name || '';
            this.roleId = role?.id || '';
            this.roleForm.patchValue({
              name: role.name,
              application: role.application,
              isActive: role.isActive,
            });
          }
        },
      });

    this.xappsAdminGlobalDataService.applicationResults$.subscribe({
      next: (data) => {
        this.applications = data;
      },
    });
  }

  /**
   * Handle form submission, validate the form, and update the role.
   */
  onSubmit() {
    this.showErrors = true;
    if (this.roleForm.valid) {
      const formValue = this.roleForm.value;
      this.xappsAdminGlobalDataService
        .updateRole({
          id: this.roleId,
          roleName: formValue.name,
          application: formValue.application,
          isActive: formValue.isActive,
        })
        .then((res: any) => {
          this.showErrors = false;
          this.navigateToRoles();
          this.roleForm.reset();
        });
    }
  }
  /**
   * Navigate to the roles list page.
   */
  navigateToRoles() {
    this.uiService.goBack();
  }
  /**
   * Clean up subscriptions on component destroy.
   */
  ngOnDestroy(): void {
    if (this.getRolesDetailsSubscription) {
      this.getRolesDetailsSubscription.unsubscribe();
    }
  }
}
