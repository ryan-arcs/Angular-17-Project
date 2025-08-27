import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UIService } from '@app/common/services/ui.service';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.scss',
})
export class LogoutComponent implements OnInit {

  constructor(
    private router: Router,
    private uiService: UIService
  ) {}

  ngOnInit(): void {
    this.uiService.setTheme({activeTheme: 'light'});
  }

  signIn(){
    this.router.navigate(['/login']);
  }

}
