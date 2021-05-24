import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { fadeInUp400ms } from "src/@vex/animations/fade-in-up.animation";
import { AuthService } from "../auth.service";


@Component({
  selector: 'password-reset-form',
  templateUrl: './password-reset.component.html',
  styleUrls: ['../auth.component.css'],
  animations: [
    fadeInUp400ms
  ]
})
export class PasswordResetFormComponent implements OnInit {
  passwordResetForm: FormGroup;
  isLoading = false; // To prevent fast button clicking

  constructor(
    private authService: AuthService,
    public route: ActivatedRoute,
    public router: Router
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
