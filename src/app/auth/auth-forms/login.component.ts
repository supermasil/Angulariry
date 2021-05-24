import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { fadeInUp400ms } from "src/@vex/animations/fade-in-up.animation";
import { AuthService } from "../auth.service";
import emojioneUS from '@iconify/icons-emojione/flag-for-flag-united-states';
import emojioneVN from '@iconify/icons-emojione/flag-for-vietnam';

@Component({
  selector: 'login-form',
  templateUrl: './login.component.html',
  styleUrls: ['../auth.component.css'],
  animations: [
    fadeInUp400ms
  ]
})
export class LoginFormComponent implements OnInit{

  loginForm: FormGroup = null;
  buttonIsLoading = false;
  localStorage = localStorage;
  emojioneUS = emojioneUS;
  emojioneVN = emojioneVN;

  constructor(
    public authService: AuthService,
    public route: ActivatedRoute,
    public router: Router,
    private translateService: TranslateService,
  ) {}

  ngOnInit() {
    this.authService.getIsAuthLoading().subscribe(loading => {
      if (!loading) {
        if (this.authService.isAuth() && this.router.url == "/auth") {
          this.router.navigate(["/"]);
        }
        this.loginForm = new FormGroup({
          email: new FormControl(null, {validators: [Validators.required, Validators.email]}),
          password: new FormControl(null, {validators: [Validators.required, Validators.minLength(6)]})
        });
      }
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
    this.buttonIsLoading = true;
    setTimeout(() => this.buttonIsLoading = false, 3000);
  }

  languageChange(language: string) {
    this.translateService.setDefaultLang(language);
    this.translateService.use(language);
    localStorage.setItem("weshippee_language", language);
  }
}
