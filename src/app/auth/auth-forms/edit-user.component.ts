import { Component, NgZone, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ReplaySubject } from "rxjs";
import { OrganizationModel } from "src/app/models/organization.model";
import { UserModel } from "src/app/models/user.model";
import { AuthGlobals } from "../auth-globals";
import { AuthService } from "../auth.service";


@Component({
  selector: 'edit-user-form',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css']
})
export class EditUserFormComponent implements OnInit{

  usersSubject = new ReplaySubject<UserModel[]>();
  usersListSubject = new ReplaySubject<{users: UserModel[], count: number}>();
  users: UserModel[];
  currentOrg: OrganizationModel;
  currentUser: UserModel;

  userFields = ["name", "userCode", "role", "email"];

  constructor(
    private authService: AuthService,
    private router: Router,
    private zone: NgZone
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getMongoDbUser();;
      this.currentOrg = this.authService.getUserOrg();
      this.authService.getUsers().subscribe((response: {users: UserModel[], count: number}) => {
        this.users = response.users;
        this.filterUsers();
      });
  }

  filterUsers() {
    if (this.currentUser.role === AuthGlobals.roles.Admin) {
      this.users = this.users.filter(u => AuthGlobals.nonAdmin.includes(u.role));
    } else if (this.currentUser.role === AuthGlobals.roles.SuperAdmin) {
      this.users = this.users.filter(u => AuthGlobals.nonSuperAdmin.includes(u.role));
    } else if (AuthGlobals.internal.includes(this.currentUser.role)) {
      this.users = this.users.filter(u => u.role == AuthGlobals.roles.Customer);
    } else {
      this.users = [];
    }

    this.usersSubject.next(this.users);
  }

  userSelected(user: UserModel) {
    // this.zone.run(() => {
    //   this.router.navigate([`/auth/users/edit/${user._id}`]);
    // })
    this.usersListSubject.next({users: [user], count: 1});
  }
}
