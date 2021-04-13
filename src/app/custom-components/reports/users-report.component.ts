import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { PageEvent } from "@angular/material/paginator";
import { BehaviorSubject, ReplaySubject, Subject } from "rxjs";
import { AuthGlobals } from "src/app/auth/auth-globals";
import { AuthService } from "src/app/auth/auth.service";
import { GlobalConstants } from "src/app/global-constants";
import { UserModel } from "src/app/models/user.model";


@Component({
  selector: 'users-report-component',
  templateUrl: 'users-report.component.html',
  styleUrls: []
})
export class UsersReportComponent implements OnInit {

  searchForm: FormGroup;
  sendersSubject = new BehaviorSubject<any[]>([]);
  selectSenderSubject = new ReplaySubject<any>();
  pageData: PageEvent;
  usersSubject: ReplaySubject<{users: UserModel[], count: number}> = new ReplaySubject();
  resetPaginatorSubject = new Subject();
  currentTrackingType = null;
  authGlobals = AuthGlobals;
  users: UserModel[] = [];
  filteredUsers: UserModel[] = [];
  comparisons = [">", "<", "=", ">=", "<="];

  usersReportForm: FormGroup;

  senderFields = ['userCode', 'name', 'email', 'role'];

  constructor(
    private authService: AuthService) {}


  ngOnInit() {
    this.usersReportForm = new FormGroup({
      role: new FormControl(null),
      active: new FormControl(true),
      credit: new FormControl(null),
      creator: new FormControl(null),
      comparison: new FormControl(this.comparisons[0])
    });

    this.authService.getUsers().subscribe((response: {users: UserModel[], count: number}) => {
      this.users = response.users
      this.sendersSubject.next(response.users);
    });
  }

  creatorSelected(user: UserModel) {
    this.usersReportForm.get('creator').setValue(user._id);
  }

  creatorCancelled() {
    this.usersReportForm.get('creator').setValue(null);
  }

  pageDataChanged (pageData: PageEvent) {
    this.pageData = pageData;
    this.filterDataAndEmit();
  }

  filterDataAndEmit() {
    let slicedUsers = [];
    if (this.pageData) {
      slicedUsers =  this.filteredUsers.slice((this.pageData.pageIndex * this.pageData.pageSize), (this.pageData.pageIndex + 1) * this.pageData.pageSize);
    } else {
      slicedUsers = this.filteredUsers.slice(0, GlobalConstants.defaultPageSizes[0]);
    }
    this.usersSubject.next({users: slicedUsers, count: this.filteredUsers.length});
  }

  compare(a: number, b: number, o: string) {
    switch(o) {
      case this.comparisons[0]:
        return a > b;
      case this.comparisons[1]:
        return a < b;
      case this.comparisons[2]:
        return a == b;
      case this.comparisons[3]:
        return a >= b;
      case this.comparisons[4]:
        return a <= b;
    }
  }

  submit() {
    if (!this.usersReportForm.valid) {
      return;
    }

    this.resetPaginatorSubject.next();

    let filteredUsers = this.users.filter(u =>
      (this.usersReportForm.get("role").value? (u.role == this.usersReportForm.get("role").value) : true) &&
      (u.role != AuthGlobals.roles.SuperAdmin) &&
      (u.active == this.usersReportForm.get("active").value) &&
      (this.usersReportForm.get("credit").value != null? this.compare(u.credit, this.usersReportForm.get("credit").value, this.usersReportForm.get("comparison").value) : true) &&
      (this.usersReportForm.get("creator").value? (u.creatorId == this.usersReportForm.get("creator").value) : true)
    );

    this.filteredUsers = filteredUsers;
    this.filterDataAndEmit();
  }
}
