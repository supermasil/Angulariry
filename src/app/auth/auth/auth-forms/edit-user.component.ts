import { Component, NgZone, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ReplaySubject } from "rxjs";
import { OrganizationModel } from "src/app/models/organization.model";
import { UserModel } from "src/app/models/user.model";
import { AuthGlobals } from "../../auth-globals";
import { AuthService } from "../../auth.service";


@Component({
  selector: 'edit-user-form',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css', '../auth.component.css']
})
export class EditUserFormComponent implements OnInit{

  usersSubject = new ReplaySubject<string[]>();
  users: UserModel[];
  currentOrg: OrganizationModel;
  currentUser: UserModel;


  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private zone: NgZone
  ) {}

  ngOnInit() {
    this.authService.getMongoDbUserListener().subscribe((user: UserModel) => {
      this.currentUser = user;
      this.authService.getUserOrgListener().subscribe((org: OrganizationModel) => {
        this.currentOrg = org;
        this.authService.getUsers().subscribe((response: {users: UserModel[], count: number}) => {
          this.users = response.users;
          this.filterUsers();
        })
      });
    });
  }

  filterUsers() {
    if (AuthGlobals.nonAdminOfficers.includes(this.currentUser.role)) {
      this.users = this.users.filter(u => u.role === AuthGlobals.roles.Customer);
    } else if (this.currentUser.role === AuthGlobals.roles.Admin) {
      this.users = this.users.filter(u => !AuthGlobals.admins.includes(u.role));
    } else if (this.currentUser.role === AuthGlobals.roles.SuperAdmin) {
      this.users = this.users.filter(u => u.role != AuthGlobals.roles.SuperAdmin);
    }
    this.usersSubject.next(this.users.map(u => `${u.name} | ${u.userCode} | ${u.role} | ${u.email} | ${u.addresses[0].address}${u.addresses[0].addressLineTwo? " " + u.addresses[0].addressLineTwo: ""}`));
  }

  userSelected(value: string) {
    let user: UserModel = this.users.filter(u => u.userCode === value.split(" | ")[1])[0];
    this.zone.run(() => {
      this.router.navigate([`/auth/users/edit/${user._id}`]);
    })
  }
}
