import { Injectable, NgZone } from '@angular/core';
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
  private firebaseUser: firebase.User = null;
  private mongoDbUser = null;
  public redirectUrl: string;
  public redirectData = {};

  constructor(private http: HttpClient, private router: Router, private firebaseAuth: AngularFireAuth, private alertService: AlertService, private zone: NgZone) {
    this.firebaseAuth.onAuthStateChanged(async user => {
      if (user) { // Firebase User
        this.firebaseUser = user;
        await this.setupSessionStorage(user); // Has to await here. SET THIS UP RIGHT AWAY

        user.getIdTokenResult().then(idTokenResult => {
          const authTime = idTokenResult.claims.auth_time * 1000;
          const sessionDuration = 8 * 60 * 60 * 1000; // 8 hours in miliseconds
          const millisecondsUntilExpiration = sessionDuration - (Date.now() - authTime);
          setTimeout(() => {this.logout(); location.reload()}, millisecondsUntilExpiration);
        });

        // Get user from MongoDb
        const queryParams = `getuser/?uid=${this.firebaseUser.uid}`;
        this.mongoDbUser = (await this.http.get<{user: any}>(BACKEND_URL + queryParams).toPromise()).user;
        this.authStatusListener.next(true);

        console.log("User authenticated");
      } else {
        this.firebaseUser = null;
        this.mongoDbUser = null;
        this.clearSessionStorage();
        this.authStatusListener.next(false);
        console.log("User logged out");
      }
    });
  }

  async setupSessionStorage(user) { // Has to be async to be done before any auth can be effective
    sessionStorage.setItem("isAuthenticated", "true");
    sessionStorage.setItem("uid", user.uid);
    await user.getIdToken(true).then(idToken => {
        sessionStorage.setItem('utoken', idToken);
      }).catch((error) => {
        console.log(error);
      });
  }

  clearSessionStorage() {
    sessionStorage.clear();
  }

  getFirebaseUser() {
    return this.firebaseUser;
  }

  getMongoDbUser() {
    return this.mongoDbUser;
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

  createUser(name: string, email: string, phoneNumber: string, password: string, address: string, addressLineTwo: string, addressUrl: string, role: string, companyCode: string, customerCode: string) {
    this.firebaseAuth.createUserWithEmailAndPassword(email, password)
    .then((userData) => {
      const authData = {
        user: userData.user,
        name: name,
        phoneNumber: phoneNumber,
        role: role,
        companyCode: companyCode,
        customerCode: customerCode,
        address: address,
        addressLineTwo: addressLineTwo,
        addressUrl: addressUrl
      };

      this.http.post<{message: string, user: any}>(BACKEND_URL + "signup", authData)
      .subscribe(response => {
        this.authStatusListener.next(true);
        this.zone.run(() => {
          this.router.navigate(["/trackings"]);
        });
      }, error => {
        this.deleteCurrentUser();
        throw error;
      })
    })
    .catch((error) => {
      this.authStatusListener.next(false);
      this.alertService.error(error.message, GlobalConstants.flashMessageOptions);
    });
  }

  deleteCurrentUser() {
    var user = firebase.auth().currentUser;
    if (user) {
      user.delete().then(() => {
        console.log("Deleted user after failed database creation");
      }).catch(error => {
        console.log(error.message);
      });
    }
  }

  login(email: string, password: string) {
    this.firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
        this.firebaseAuth.signInWithEmailAndPassword(email, password)
        .then(async (userCredentials) => {
          this.authStatusListener.next(true);
          if (this.redirectUrl) {
            this.zone.run(() => {
              this.router.navigate([this.redirectUrl, this.redirectData]);
            });
            this.redirectUrl = null;
            this.redirectData = {};
          } else {
            this.zone.run(() => {
              this.router.navigate(["/trackings"]);
            });
          }
          this.alertService.success("Logged in successfully", GlobalConstants.flashMessageOptions);
        })
        .catch(error => {
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
      this.zone.run(() => {
        this.router.navigate(["/"]);
      });
      this.alertService.success("See you later!", GlobalConstants.flashMessageOptions);
    }).catch(error => {
      this.alertService.error(error.message, GlobalConstants.flashMessageOptions);
    });
  }

  resetPassword(email: string) {
    this.firebaseAuth.sendPasswordResetEmail(email).then(() => {
      this.alertService.success("Password reset email sent", GlobalConstants.flashMessageOptions);
    }).catch(error => {
      this.alertService.error(error.message, GlobalConstants.flashMessageOptions);
    })
  }
}
