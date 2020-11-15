import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';
import{ GlobalConstants } from '../global-constants';
import { AlertService } from '../alert-message';

const BACKEND_URL = environment.apiURL + "/users/"

@Injectable({ providedIn: 'root'})
export class AuthService {
  private authStatusListener = new Subject<boolean>();
  private user: firebase.User;
  public redirectUrl: string;

  constructor(private http: HttpClient, private router: Router, private firebaseAuth: AngularFireAuth, private alertService: AlertService) {
    this.firebaseAuth.onAuthStateChanged(user => {
      if (user) {
        this.user = user;
        this.setupSessionStorage();
        user.getIdTokenResult().then(idTokenResult => {
          const authTime = idTokenResult.claims.auth_time * 1000;
          const sessionDuration = 1000 * 60 * 60 * 8;
          const millisecondsUntilExpiration = sessionDuration - (Date.now() - authTime);
          setTimeout(() => firebaseAuth.signOut(), millisecondsUntilExpiration);
        })
        this.authStatusListener.next(true);

      } else {
        this.user = null;
        this.clearSessionStorage();
        this.authStatusListener.next(false);
      }
    });
  }

  setupSessionStorage() {
    sessionStorage.setItem("isAuthenticated", "true");
    sessionStorage.setItem("uid", this.user.uid);

    this.user.getIdToken(true).then(idToken => {
        sessionStorage.setItem('utoken', idToken);
      }).catch((error) => {
        console.log(error);
      })
  }

  clearSessionStorage() {
    sessionStorage.clear();
  }

  getUser() {
    return this.user;
  }

  getIsAuth() {
    return sessionStorage.getItem("isAuthenticated") == "true" ? true : false;
  }

  getAuthStatusListener() {
    return this.authStatusListener.asObservable();
  }

  getUserId(){
    return sessionStorage.getItem("uid");
  }

  getToken() {
    return sessionStorage.getItem("utoken");
  }

  createUser(name: string, email: string, password: string) {
    this.firebaseAuth.createUserWithEmailAndPassword(email, password)
    .then((userData) => {
      const authData = {
        user: userData.user,
        name: name
      };
      this.http.post<{}>(BACKEND_URL + "signup", authData)
      .subscribe(response => {
        this.authStatusListener.next(true);
        return this.router.navigate(["/"]);
      }, error => {
        this.authStatusListener.next(false);
        this.deleteCurrentUser();
        return this.alertService.error(error.message, GlobalConstants.flashMessageOptions);
      });
    })
    .catch((error) => {
      this.authStatusListener.next(false);
      return this.alertService.error(error.message, GlobalConstants.flashMessageOptions);
    });
  }

  deleteCurrentUser() {
    var user = firebase.auth().currentUser;
    user.delete().then(() => {
      return this.alertService.error("Deleted user after failed database creation", GlobalConstants.flashMessageOptions);
    }).catch(function(error) {
      return this.alertService.error(error.message, GlobalConstants.flashMessageOptions);
    });
  }

  login(email: string, password: string) {
    this.firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
    .then(() => {
        this.firebaseAuth.signInWithEmailAndPassword(email, password)
      .then((userCredentials) => {
        this.user = userCredentials.user;
        this.authStatusListener.next(true);
        if (this.redirectUrl) {
          this.router.navigate([this.redirectUrl]);
          this.redirectUrl = null
          return;
        }
        this.router.navigate(["/"]);
      })
      .catch(error => {
        this.user = null;
        this.authStatusListener.next(false);
        this.alertService.error(error.message, GlobalConstants.flashMessageOptions);
      });
    })
    .catch(error => {
      this.alertService.error(error.message, GlobalConstants.flashMessageOptions);
    });
  }

  logout() {
    this.firebaseAuth.signOut().then(() => {
      this.router.navigate(["/"]);
    }).catch(error => {
      this.alertService.error(error.message, GlobalConstants.flashMessageOptions);
    });
  }

  resetPassword(email: string) {
    this.firebaseAuth.sendPasswordResetEmail(email).then(() => {
    }).catch(error => {
      this.alertService.error(error.message, GlobalConstants.flashMessageOptions);
    });
  }
}
