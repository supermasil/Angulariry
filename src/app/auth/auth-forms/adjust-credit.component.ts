import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import * as moment from "moment";
import { ReplaySubject } from "rxjs";
import { HistoryModel } from "src/app/models/history.model";
import { OrganizationModel } from "src/app/models/organization.model";
import { UserModel } from "src/app/models/user.model";
import { AuthGlobals } from "../auth-globals";
import { AuthService } from "../auth.service";


@Component({
  selector: 'adjust-credit-form',
  templateUrl: './adjust-credit.component.html',
  styleUrls: ['./adjust-credit.component.css', '../auth.component.css']
})
export class AdjustCreditFormComponent implements OnInit{

  usersSubject = new ReplaySubject<any[]>();
  users: UserModel[];
  currentOrg: OrganizationModel;
  currentUser: UserModel;
  editUser: UserModel;
  creditForm: FormGroup;
  creditHistory: HistoryModel[];
  userFields = ["name", "userCode", "role", "email"];

  constructor(
    private authService: AuthService) {}

  ngOnInit() {
    this.currentUser = this.authService.getMongoDbUser();
      this.currentOrg = this.authService.getUserOrg();
      this.authService.getUsers().subscribe((response: {users: UserModel[], count: number}) => {
        this.users = response.users;
        this.users = this.users.filter(u => u.role == AuthGlobals.roles.Customer);
        this.usersSubject.next(this.users);
      });
  }

  createForm() {
    this.creditForm = new FormGroup({
      _id: new FormControl(null, {validators: [Validators.required]}),
      amount: new FormControl(0, {validators: [Validators.required]}),
      content: new FormControl("")
    });
  }

  userSelected(user: UserModel) {
    this.editUser = user;
    this.authService.getUser(this.editUser._id, this.authService.userTypes.MONGO).subscribe(user => {
      this.authService.getHistories(user.creditHistory).subscribe(histories => {
        this.creditHistory = histories;
        this.editUser = user;
      })
    });
    this.createForm();
    this.creditForm.get('_id').setValue(this.editUser._id);
  }

  userCancelled() {
    this.creditForm.reset();
    this.creditForm = null;
    this.editUser = null;
    this.creditHistory = [];
  }

  formatDateTime(date: Date) {
    return moment(moment.utc(date).toDate()).local().format("MM-DD-YY hh:mm:ss")
  }

  onSubmit() {
    if (this.creditForm.invalid) {
      return;
    }
    this.authService.updateCredit(this.creditForm.getRawValue()).subscribe(() => {
      this.authService.getUser(this.editUser._id, this.authService.userTypes.MONGO).subscribe(user => {
        this.authService.getHistories(user.creditHistory).subscribe(histories => {
          this.creditHistory = histories;
          this.editUser = user;
        });
      });
    });
  }
}
