import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Custom validator to check if the trimmed value length (excluding leading and trailing spaces)
// is at least the specified minimum length, including spaces between words
export function minLengthWithoutSpacesValidator(
  minLength: number,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value || '';
    const trimmedValue = value.trim();
    const trimmedLength = trimmedValue.length;
    return trimmedLength < minLength
      ? {
          minlengthWithoutSpaces: {
            requiredLength: minLength,
            actualLength: trimmedLength,
          },
        }
      : null;
  };
}
