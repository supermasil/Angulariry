import { Component, NgZone, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AlertService } from "src/app/alert-message";
import { AuthService } from "../../auth.service";


@Component({
  selector: 'login-form',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css', '../auth.component.css']
})
export class LoginFormComponent implements OnInit{

  loginForm: FormGroup;
  isLoading = false;

  constructor(
    private authService: AuthService,
    public route: ActivatedRoute,
    private zone: NgZone,
    public router: Router,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loginForm = new FormGroup({
      email: new FormControl(null, {validators: [Validators.required, Validators.email]}),
      password: new FormControl(null, {validators: [Validators.required, Validators.minLength(6)]})
    });
  }

  onLogin() {
    if (this.loginForm.invalid) {
      return;
    }
    this.setButtonTimeOut();
    this.authService.login(this.loginForm.get("email").value, this.loginForm.get("password").value);
  }

  setButtonTimeOut() {
    this.isLoading = true;
    setTimeout(() => this.isLoading = false, 3000);
  }
}
