import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthData } from './auth-data.model';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

const BACKEND_URL = environment.apiURL + "/users/"

@Injectable({ providedIn: 'root'} )
export class AuthService {
  private isAuthenticated = false;
  private token: string;
  private tokenTimer: NodeJS.Timer; // Or type Any is fine
  private authStatusListener = new Subject<boolean>();
  private userId: string;
  constructor(private http: HttpClient, private router: Router) {}

  getToken() {
    return this.token;
  }

  getIsAuth() {
    return this.isAuthenticated;
  }

  getAuthStatusListener() {
    return this.authStatusListener.asObservable();
  }

  getUserId (){
    return this.userId;
  }

  createUser(email: string, password: string) {
    const authData: AuthData = {email, password};
    this.http.post<{message: string}>(BACKEND_URL + "signup", authData)
      .subscribe(response => {
        console.log(response.message);
        this.router.navigate(["/"]);
      }, err => {
        console.log(err.error.message);
        this.authStatusListener.next(false);
      });
  }

  login(email: string, password: string) {
    const authData: AuthData = {email, password};
    this.http.post<{token: string, expiresIn: number, userId: string}>(BACKEND_URL + "login", authData)
      .subscribe(response => {
        this.token = response.token;
        if (this.token) {
          const expiresInDuration = response.expiresIn;
          this.setAuthTimer(expiresInDuration);
          this.isAuthenticated = true;
          this.userId = response.userId;
          this.authStatusListener.next(true); // Notify about login status
          const expiration = new Date(new Date().getTime() + expiresInDuration * 1000);
          this.saveAuthData(this.token, expiration, this.userId);
          this.router.navigate(["/"]);
        }
      },
      error => {
        this.authStatusListener.next(false);

      }
    );
  }

  logout() {
    this.token = null;
    this.isAuthenticated = false;
    this.authStatusListener.next(false);
    clearTimeout(this.tokenTimer);
    this.clearAuthData();
    this.userId = null;
    this.router.navigate(["/"]);
  }

  autoAuthUser() {
    const authInformation = this.getAuthData();
    if (!authInformation) {
      return;
    }
    const now = new Date();
    const expiresIn = new Date(authInformation.expiration).getTime() - now.getTime();
    if (expiresIn > 0) {
      this.token = authInformation.token;
      this.isAuthenticated = true;
      this.userId = authInformation.userId;
      this.authStatusListener.next(true);
      this.setAuthTimer(expiresIn / 1000);
    }
  }

  private setAuthTimer(duration: number) {
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, duration * 1000)
  }
  private saveAuthData(token: string, expirationDate: Date, userId: string) {
    localStorage.setItem("token", token);
    localStorage.setItem("expiration", expirationDate.toISOString());
    localStorage.setItem("userId", userId);
  }

  private clearAuthData() {
    localStorage.removeItem("token");
    localStorage.removeItem("expiration");
    localStorage.removeItem("userId");
  }

  private getAuthData() {
    const token = localStorage.getItem("token");
    const expiration = localStorage.getItem("expiration");
    const userId = localStorage.getItem("userId");
    if (!token || !expiration) {
      return;
    }

    return {
      token: token,
      expiration: expiration,
      userId: userId
    };
  }
}
