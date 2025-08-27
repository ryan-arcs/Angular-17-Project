import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UIService } from '@app/common/services/ui.service';
import { signInWithRedirect } from '@app/common/utils/custom-session';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.scss',
})
export class LogoutComponent{

  constructor(
    private router: Router
  ) {}

  signIn(){
    this.router.navigate(['/login']);
  }

}
