import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../auth.service';
import { Subscription } from 'rxjs';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { phoneNumberValidator } from 'lac-mat-tel-input';

@Component({
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})

export class AuthComponent implements OnInit, OnDestroy {
  constructor(
    public authService: AuthService) {}

  private authStatusSub: Subscription;
  roles = ["SuperAdmin", "Admin", "Manager", "Accounting", "Operation", "Receiving/Shipping", "Customer"];
  companyCodes = ["JMD"]; // Has to be unique

  loginForm: FormGroup;
  signupForm: FormGroup;
  passwordResetForm: FormGroup;

  ngOnInit() {
    this.loginForm = new FormGroup({
      email: new FormControl(null, {validators: [Validators.required, Validators.email]}),
      password: new FormControl(null, {validators: [Validators.required, Validators.minLength(6)]})
    });

    this.signupForm = new FormGroup({
      name: new FormControl(null, {validators: [Validators.required]}),
      email: new FormControl(null, {validators: [Validators.required, Validators.email]}),
      password: new FormControl(null, {validators: [Validators.required, Validators.minLength(6)]}),
      phoneNumber: new FormControl(null, {validators: [Validators.required, phoneNumberValidator]}),
      // role: new FormControl(null, {validators: [Validators.required]}),
      companyCode: new FormControl(null, {validators: [this.companyCodeValidator()]}),
      customerCode: new FormControl(null, {validators: [Validators.required]})
    });

    this.passwordResetForm = new FormGroup({
      email: new FormControl(null, {validators: [Validators.required, Validators.email]})
    });

    this.authStatusSub = this.authService.getAuthStatusListener().subscribe(
      authStatus => {

      }
    );
  }

  companyCodeValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (control && control.value && this.companyCodes.includes(control.value)) {
        return null;
      }

      return {wrongCompanyCode: control.value};
    };
  }


  onSignup() {
    let role = "Customer"
    if (this.signupForm.invalid) {
      return;
    }
    this.authService.createUser(
      this.signupForm.get("name").value,
      this.signupForm.get("email").value,
      this.signupForm.get("phoneNumber").value,
      this.signupForm.get("password").value, role,
      this.signupForm.get("companyCode").value,
      this.signupForm.get("customerCode").value
      );
  }

  onLogin() {
    if (this.loginForm.invalid) {
      return;
    }
    this.authService.login(this.loginForm.get("email").value, this.loginForm.get("password").value);
  }

  onPasswordReset() {
    if (this.passwordResetForm.invalid) {
      return;
    }
    this.authService.resetPassword(this.passwordResetForm.get("email").value);
  }

  ngOnDestroy() {
    this.authStatusSub.unsubscribe();
  }
}
