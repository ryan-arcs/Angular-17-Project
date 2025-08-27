import { Component } from '@angular/core';
import { TableauGlobalDataServiceNew } from '../../services/tableau-global-data.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { UserProfileService } from '@app/common/services/user-profile.service';

@Component({
  selector: 'app-select-persona',
  standalone: true,
  imports: [NgbDropdownModule],
  templateUrl: './select-persona.component.html',
  styleUrl: './select-persona.component.scss'
})
export class SelectPersonaComponent  {
  tableauPersonas : any;
  selectedTableauPersona: string = "";
  subscriptions = new Subscription();

  constructor(
    public tableauGlobalDataService: TableauGlobalDataServiceNew,
    private router: Router,
    private userProfileService: UserProfileService
    ){}

  ngOnInit(){
    this.subscriptions.add(
      this.tableauGlobalDataService.tableauPersonas$.subscribe({
        next: (tableauPersonas) => {
          this.tableauPersonas = tableauPersonas;
        },
      })
    )

    this.subscriptions.add(
      this.userProfileService.loggedInUserData$.subscribe({
        next: () => {
          this.selectedTableauPersona = this.tableauGlobalDataService.retrieveTableauPersona() as string;
        },
      })
    )
  }

  setTableauPersona(name: string){
    this.tableauGlobalDataService.setSelectedTableauPersona({
      name,
      dbSync: true
    });
    this.router.navigate(['/ubi/home']);
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions
    this.subscriptions.unsubscribe();
  }
}
