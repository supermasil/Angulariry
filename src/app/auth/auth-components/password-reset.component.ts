import { Component, NgZone, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AlertService } from "src/app/custom-components/alert-message";
import { AuthService } from "../auth.service";


@Component({
  selector: 'password-reset-form',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.css']
})
export class PasswordResetFormComponent implements OnInit {
  passwordResetForm: FormGroup;
  isLoading = false; // To prevent fast button clicking

  constructor(
    private authService: AuthService,
    public route: ActivatedRoute,
    private zone: NgZone,
    public router: Router,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.passwordResetForm = new FormGroup({
      email: new FormControl(null, {validators: [Validators.required, Validators.email]})
    });
  }

  onPasswordReset() {
    if (this.passwordResetForm.invalid) {
      return;
    }
    this.setButtonTimeOut();
    this.authService.resetPassword(this.passwordResetForm.get("email").value);
  }

  setButtonTimeOut() {
    this.isLoading = true;
    setTimeout(() => this.isLoading = false, 3000);
  }
}
