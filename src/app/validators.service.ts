import { Injectable } from "@angular/core";
import { AbstractControl, ValidatorFn } from "@angular/forms";
import { Observable } from "rxjs";


@Injectable({ providedIn: "root"})
export class ValidatorsService {

  constructor() {}

  addressValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (control.disabled == true) {
        return null;
      }

      return {invalidAddress: control.value};
    };
  }
}
