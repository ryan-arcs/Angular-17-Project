import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [],
  templateUrl: './error.component.html',
  styleUrl: './error.component.scss'
})
export class ErrorComponent {

  @Input() message: string  = 'Oops! We couldn’t find any records.'

}
