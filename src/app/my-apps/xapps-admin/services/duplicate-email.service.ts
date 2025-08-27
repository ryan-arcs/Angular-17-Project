import { Injectable } from '@angular/core';
import { defer, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GlobalDataService as GS } from 'src/app/common/services/global-data.service';
@Injectable({
  providedIn: 'root',
})
export class DuplicateEmailService {
  constructor(private gs: GS) {}

  checkEmailNotTaken(email: string, userId?: string): Observable<boolean> {
    return defer(async () => {
      return false;
    }).pipe(
      catchError((err) => {
        // Handle error and return a fallback value or rethrow
        throw err; // Or return `of(false)` if you want to handle the error more gracefully
      }),
    );
  }
}
