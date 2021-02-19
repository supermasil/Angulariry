import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReplaySubject } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';
import{ GlobalConstants } from '../global-constants';
import { AlertService } from '../custom-components/alert-message';
import { UserModel } from '../models/user.model';
import { OrganizationModel } from '../models/organization.model';

const USER_BACKEND_URL = environment.apiURL + "/users/"
const ORGANIZATION_BACKEND_URL = environment.apiURL + "/organizations/"

@Injectable({ providedIn: 'root'})
export class AuthService {
  private authStatusListener = new ReplaySubject<boolean>();
  private firebaseUserSubject = new ReplaySubject<firebase.User>();
  private mongoDbUserSubject = new ReplaySubject<UserModel>();
  private userOrgSubject = new ReplaySubject<OrganizationModel>();
  private firebaseUser: firebase.User;
  private mongoDbUser: UserModel;
  private userOrg: OrganizationModel;
  public redirectUrl: string;
  public redirectData = {};
  private loginMode = false;

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private firebaseAuth: AngularFireAuth,
    private alertService: AlertService,
    private zone: NgZone) {
    this.firebaseAuth.onAuthStateChanged(async firebaseUser => {
      await this.refreshAuthentication(firebaseUser);
    });
  }

  async refreshAuthentication(firebaseUser: firebase.User) {
    if (firebaseUser) {
      await this.setupSessionUToken(firebaseUser); // Has to await here. SET THIS UP RIGHT AWAY to be authenticated in the back end
      this.getUser(firebaseUser.uid).subscribe(async (user: UserModel) => {

        if (firebaseUser.uid === user._id) {
          this.getOrganization(user.organization).subscribe(async (org: OrganizationModel) => {
            this.firebaseUser = firebaseUser;
            this.mongoDbUser = user;
            this.userOrg = org;
            await this.authenticate();
          }, error => {
            console.log(error);
            this.unAuthenticate();
          })
        }
      }, error => {
        console.log(error);
        this.unAuthenticate();
        this.logout();
      });
    } else {
      this.unAuthenticate();
    }
  }

  redirecting() {
    if (this.redirectUrl && this.redirectUrl !== "/auth") {
      this.zone.run(() => {
        this.router.navigate([this.redirectUrl], this.redirectData);
      })
      this.redirectUrl = null;
      this.redirectData = {};
    } else {
      this.zone.run(() => {
        this.router.navigate(["/"]);
      });
    }
  }


  async authenticate() {
    await this.setupSessionBackEndInfo();
    await this.firebaseUser.getIdTokenResult().then(idTokenResult => {
      const authTime = idTokenResult.claims.auth_time * 1000;
      const sessionDuration = 8 * 60 * 60 * 1000; // 8 hours in miliseconds
      const millisecondsUntilExpiration = sessionDuration - (Date.now() - authTime);
      setTimeout(() => {this.logout();}, millisecondsUntilExpiration);
      this.refreshUsers();
      this.authStatusListener.next(true);
      // console.log("User authenticated");
      this.redirecting();
      if (this.loginMode) {
        this.alertService.success("Welcome back", GlobalConstants.flashMessageOptions);
        this.loginMode = false;
      }
    });
  }

  unAuthenticate() {
    this.firebaseUser = null;
    this.mongoDbUser = null;
    this.clearSessionStorage();
    this.authStatusListener.next(false);
    // console.log("User unauthenticated");
  }

  refreshUsers() {
    this.firebaseUserSubject.next(this.firebaseUser);
    this.mongoDbUserSubject.next(this.mongoDbUser);
    this.userOrgSubject.next(this.userOrg);
  }

  async login(email: string, password: string) {
    await this.firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(async () => {
      await this.firebaseAuth.signInWithEmailAndPassword(email, password)
      .then(async (userCredentials) => {
        this.loginMode = true;
        await this.refreshAuthentication(userCredentials.user);
      }).catch(error => {
        this.alertService.error(error.message, GlobalConstants.flashMessageOptions);
      })
    })
    .catch(error => {
      this.alertService.error(error.message, GlobalConstants.flashMessageOptions);
    });

  }

  async logout() {
    this.redirectUrl = null;
    this.redirectData = {};
    await this.firebaseAuth.signOut().then(() => {
      this.zone.run(() => {
        this.router.navigate(["/auth"]);
        window.location.reload();
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

  async createUpdateUser(formData: any) {
    if (!formData._id) { // create case
      // delete formData["password"]; // Remove password from the object
      this.httpClient.post<{message: string, user: UserModel}>(USER_BACKEND_URL, formData)
        .subscribe((responseData) => {
          // this.refreshAuthentication(firebase.auth().currentUser); // Only logged in user can create user
          this.zone.run(() => {
            this.router.navigate(["/"]);
          });
        });
    } else { // edit case
      this.httpClient.post<{message: string, user: UserModel}>(USER_BACKEND_URL, formData)
        .subscribe((responseData) => {
          this.zone.run(() => {
            this.router.navigate(["/"]);
          });
        });
    }
  }

  getUser(id: string | UserModel) {
    return this.httpClient.get<UserModel>(USER_BACKEND_URL + id);
  }

  getUsers() {
    return this.httpClient.get<{users: UserModel[], count: number}>(USER_BACKEND_URL);
  }

  deleteUser(id: string) {
    return this.httpClient.delete<{message: string}>(USER_BACKEND_URL + id);
  }

  createUpdateOrganization(formData: any) {
    this.httpClient
      .post<{message: string, organization: OrganizationModel}>(ORGANIZATION_BACKEND_URL, formData)
      .subscribe((responseData) => {});
  }

  getOrganization(id: string) {
    return this.httpClient.get<OrganizationModel>(ORGANIZATION_BACKEND_URL + id);
  }

  getOrganizations() {
    return this.httpClient.get<{organizations: OrganizationModel[], count: number}>(ORGANIZATION_BACKEND_URL);
  }

  deleteOrganization(id: string) {
    return this.httpClient.delete<{message: string}>(ORGANIZATION_BACKEND_URL + id);
  }

  async setupSessionUToken(user) { // Has to be async to be done before any auth can be effective
    await user.getIdToken(true).then(idToken => {
      sessionStorage.setItem('utoken', idToken);
    }).catch((error) => {
      console.log(error);
    });

  }

  async setupSessionBackEndInfo() {
    sessionStorage.setItem("uid", this.firebaseUser.uid);
    sessionStorage.setItem("isAuthenticated", "true");
    sessionStorage.setItem("mongoDBUser", JSON.stringify(this.mongoDbUser));
    sessionStorage.setItem("userOrg", JSON.stringify(this.userOrg));
  }

  clearSessionStorage() {
    sessionStorage.clear();
  }

  getFirebaseUserListener() {
    return this.firebaseUserSubject.asObservable();
  }

  getMongoDbUserListener() {
    return this.mongoDbUserSubject.asObservable();
  }

  getMongoDbUser() {
    return JSON.parse(sessionStorage.getItem("mongoDBUser")) as UserModel;
  }

  getUserOrg() {
    return JSON.parse(sessionStorage.getItem("userOrg")) as OrganizationModel;
  }

  getUserOrgListener() {
    return this.userOrgSubject.asObservable();
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

  redirectToMainPageWithMessage(message: string) {
    this.alertService.error(message, GlobalConstants.flashMessageOptions);
      this.zone.run(() => {
        this.router.navigate(["/"]);
      });
  }

  redirect404() {
    this.zone.run(() => {
      this.router.navigate(["/404"]);
    });
  }
}
