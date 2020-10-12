import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthData } from './auth-data.model';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';



const BACKEND_URL = environment.apiURL + "/users/"

@Injectable({ providedIn: 'root'} )
export class AuthService {
  private authStatusListener = new Subject<boolean>();
  private user: firebase.User;
  constructor(private http: HttpClient, private router: Router, public firebaseAuth: AngularFireAuth) {
    this.firebaseAuth.onAuthStateChanged(user => {
      if (user) {
        this.user = user;
        this.setupSessionStorage();
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

  createUser(email: string, password: string) {
    // const authData: AuthData = {email, password};
    // this.http.post<{user: Object, message: string}>(BACKEND_URL + "signup", authData)
    //   .subscribe(response => {
    //     console.log(response.message);
    //     this.login(email, password);
    //     this.router.navigate(["/"]);
    //   }, error => {
    //     console.log(error.error.message);
    //     this.authStatusListener.next(false);
    //   });

    this.firebaseAuth.createUserWithEmailAndPassword(email, password)
      .then((user) => {
        console.log("User created!");
        this.login(email, password);
        this.router.navigate(["/"]);
      })
      .catch((error) => {
        console.log(error.message);
        this.authStatusListener.next(false);
    });
  }

  login(email: string, password: string) {
    this.firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch(function(error) {
      console.log(error.message);
    });

    this.firebaseAuth.signInWithEmailAndPassword(email, password)
    .then((userCredentials) => {
      this.user = userCredentials.user;
      this.authStatusListener.next(true);
      console.log('User authenticated!');
      this.router.navigate(["/"]);
    })
    .catch(function(error) {
      this.userId = null;
      this.isAuthenticated = false;
      this.authStatusListener.next(false);
      console.log(error.message);
    });
  }

  logout() {
    this.firebaseAuth.signOut().then(() => {
      console.log('User logged out!');
    }).catch(error => {
      console.log(error.message);
    });
  }
}
