import { ViewChild } from "@angular/core";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { Observable } from "rxjs";
import { GlobalConstants } from "src/app/global-constants";
import { UserModel } from "src/app/models/user.model";
import { AuthGlobals } from "../auth-globals";
import { AuthService } from "../auth.service";


@Component({
  selector: 'user-list-common',
  templateUrl: './user-list-common.component.html',
  styleUrls: ['./user-list-common.component.css']
})
export class UserListCommonComponent implements OnInit {

  @ViewChild('paginator') paginator: MatPaginator;
  @Input() usersObservable: Observable<{users: UserModel[], count: number}> = new Observable();
  @Input() resetPaginatorObservable = new Observable()
  @Output() pageDataChangeEvent = new EventEmitter<PageEvent>();

  users: UserModel[] = [];
  totalUsers = 0;
  pageSizeOptions = GlobalConstants.defaultPageSizes;
  currentPageSize = this.pageSizeOptions[0];

  authGlobals = AuthGlobals;

  constructor (
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.usersObservable.subscribe((data: {users: UserModel[], count: number}) => {
      this.users = data.users;
      this.totalUsers = data.count;
    });

    this.resetPaginatorObservable.subscribe(() =>{
      this.paginator?.firstPage();
    });
  }

  canEdit(roles: string[]) {
    return roles?.includes(this.authService.getMongoDbUser()?.role);
  }

  // Change # of trackings per page
  pageDataChange(pageData: PageEvent) {
    this.pageDataChangeEvent.emit(pageData);
  }
}
