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
  private authStatusSubject = new ReplaySubject<boolean>();
  // private firebaseUserSubject = new ReplaySubject<firebase.User>();
  // private mongoDbUserSubject = new ReplaySubject<UserModel>();
  // private userOrgSubject = new ReplaySubject<OrganizationModel>();
  private firebaseUser: firebase.User;
  private mongoDbUser: UserModel;
  private userOrg: OrganizationModel = null;
  public redirectUrl: string;
  public redirectData = {};
  private loginMode = false;
  public userTypes = {
    MONGO: 'mongo',
    FIREBASE: 'firebase'
  }

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private firebaseAuth: AngularFireAuth,
    private alertService: AlertService,
    private zone: NgZone) {
    this.firebaseAuth.onAuthStateChanged(async firebaseUser => {
      this.firebaseUser = firebaseUser;
      await this.refreshAuthentication(firebaseUser);
    });
  }

  async refreshAuthentication(firebaseUser: firebase.User) {
    if (firebaseUser) {
      await this.setupSessionUToken(firebaseUser); // Has to await here. SET THIS UP RIGHT AWAY to be authenticated in the back end
      this.getUser(firebaseUser.uid, this.userTypes.FIREBASE).subscribe(async (user: UserModel) => {
        this.mongoDbUser = user;
        if (firebaseUser.uid == user.id) {
          this.userOrg = user.organization;
          return await this.authenticate();
        } else {
          console.log("Firebase and db users aren't the same")
          this.unAuthenticate();
          this.logout();
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
      setTimeout(() => {this.unAuthenticate(), this.logout();}, millisecondsUntilExpiration);
      this.refreshUsers();
      this.authStatusSubject.next(true);
      // console.log("User authenticated");
      this.redirecting();
      if (this.loginMode) {
        this.alertService.success("Welcome!", GlobalConstants.flashMessageOptions);
        this.loginMode = false;
      }
    });
  }

  unAuthenticate() {
    this.authStatusSubject.next(false);
    this.firebaseUser = null;
    this.mongoDbUser = null;
    this.clearSessionStorage();
    // console.log("User unauthenticated");
  }

  refreshUsers() {
    // this.firebaseUserSubject.next(this.firebaseUser);
    // this.mongoDbUserSubject.next(this.mongoDbUser);
    // this.userOrgSubject.next(this.userOrg);
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
      });
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

  async createUpdateUser(formData: any, andLogin: boolean) {
    if (!formData.id) { // create case
      let request = this.getIsAuth() ? this.httpClient.post<{message: string, user: UserModel}>(USER_BACKEND_URL + "internal", formData) : this.httpClient.post<{message: string, user: UserModel}>(USER_BACKEND_URL, formData);
      request.subscribe((responseData) => {
        if (andLogin) {
          this.login(formData.email, formData.password);
        } else {
          this.zone.run(() => {
            this.router.navigate(["/"]);
          });
        }
      });
    } else { // edit case
      this.httpClient.post<{message: string, user: UserModel}>(USER_BACKEND_URL + "internal", formData)
        .subscribe((responseData) => {
          if (andLogin) {
            this.login(formData.email, formData.password);
          } else {
            this.redirectToMainPageWithoutMessage();
          }
        });
    }
  }

  onboardToNewOrg(registerCode: string, referralCode: string) {
    this.httpClient.put<{organization: OrganizationModel, user: UserModel}>(USER_BACKEND_URL + `onboardToOrg/${this.mongoDbUser._id}`, {registerCode: registerCode, referralCode: referralCode})
      .subscribe(response => {
        this.userOrg = response.organization;
        sessionStorage.setItem("userOrg", JSON.stringify(this.userOrg));
        // this.userOrgSubject.next(this.userOrg);
        this.zone.run(async () => {
          await this.refreshAuthentication(this.firebaseUser);
          this.router.navigate(["/trackings"]);
          this.alertService.success(`Onboarded to ${response.organization.name}`, GlobalConstants.flashMessageOptions);
        });
      });
  }

  logInToOrg(orgId: string) {
    this.httpClient.put<{organization: OrganizationModel, user: UserModel}>(USER_BACKEND_URL + `updateOrg/${this.mongoDbUser._id}`, {orgId: orgId})
      .subscribe(response => {
        this.userOrg = response.organization;
        sessionStorage.setItem("userOrg", JSON.stringify(this.userOrg));
        // this.userOrgSubject.next(this.userOrg);
        this.zone.run(async () => {
          await this.refreshAuthentication(this.firebaseUser);
          if (response.user.active) {
            this.router.navigate(["/trackings"]);
          }
          this.alertService.success(`Logged in to ${response.organization.name}`, GlobalConstants.flashMessageOptions);
        });
      });
  }

  updateCredit(formData: any) {
    return this.httpClient.put<{message: string}>(USER_BACKEND_URL + `updateCredit/${formData._id}`, formData);
  }

  getUser(id: string | UserModel, type: string) {
    return this.httpClient.get<UserModel>(USER_BACKEND_URL + id + `?type=${type}`);
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
      .subscribe((responseData) => {
        this.zone.run(() => {
          this.router.navigate(["/"]);
        });
      });
  }

  getOrganization(id: string) {
    return this.httpClient.get<OrganizationModel>(ORGANIZATION_BACKEND_URL + id);
  }

  getOrganizations() {
    return this.httpClient.get<{organizations: OrganizationModel[], count: number}>(ORGANIZATION_BACKEND_URL);
  }

  getManyOrganizations(orgIds: string[]) {
    return this.httpClient.post<OrganizationModel[]>(ORGANIZATION_BACKEND_URL + `getMany`, {orgIds: orgIds});
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
    sessionStorage.setItem("u_id", this.mongoDbUser._id);
    sessionStorage.setItem("isAuthenticated", "true");
    sessionStorage.setItem("mongoDBUser", JSON.stringify(this.mongoDbUser));
    sessionStorage.setItem("userOrg", JSON.stringify(this.userOrg));
  }

  clearSessionStorage() {
    sessionStorage.clear();
  }

  // getFirebaseUserListener() {
  //   return this.firebaseUserSubject.asObservable();
  // }

  // getMongoDbUserListener() {
  //   return this.mongoDbUserSubject.asObservable();
  // }

  getMongoDbUser() {
    return JSON.parse(sessionStorage.getItem("mongoDBUser")) as UserModel;
  }

  getUserOrg() {
    return JSON.parse(sessionStorage.getItem("userOrg")) as OrganizationModel;
  }

  // getUserOrgListener() {
  //   return this.userOrgSubject.asObservable();
  // }

  getIsAuth() {
    return sessionStorage.getItem("isAuthenticated") == "true" ? true : false;
  }

  getAuthStatusListener() {
    return this.authStatusSubject.asObservable();
  }

  getUserId(){
    return sessionStorage.getItem("u_id");
  }

  getToken() {
    return sessionStorage.getItem("utoken");
  }

  redirectToMainPageWithMessage(message: string) {
    this.alertService.error(message, GlobalConstants.flashMessageOptions);
      this.zone.run(() => {
        this.router.navigate(["/trackings"]);
      });
  }

  redirectToMainPageWithoutMessage() {
    this.zone.run(() => {
      this.router.navigate(["/trackings"]);
    });
  }

  redirect404() {
    this.zone.run(() => {
      this.router.navigate(["/404"]);
    });
  }

  canView(roles: string[]) {
    return roles.includes(this.mongoDbUser?.role);
  }
}
