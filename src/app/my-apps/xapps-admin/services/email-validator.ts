import {
  AbstractControl,
} from '@angular/forms';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { DuplicateEmailService } from './duplicate-email.service';

export function emailAsyncValidator(
  duplicateEmailService: DuplicateEmailService,
  userId?: string,
) {
  return (control: AbstractControl) => {
    return duplicateEmailService.checkEmailNotTaken(control.value, userId).pipe(
      map((isTaken) => (isTaken ? { emailTaken: true } : null)),
      catchError(() => of(null)),
    );
  };
}
