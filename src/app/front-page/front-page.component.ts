import { Component, OnInit } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { OrganizationModel } from '../models/organization.model';
import { UserModel } from '../models/user.model';

@Component({
  selector: 'app-front-page',
  templateUrl: 'front-page.component.html',
  styleUrls: ['front-page.component.css']
})
export class FrontPageComponent implements OnInit{
  organizations : OrganizationModel[] = [];
  companiesSubject = new ReplaySubject<string[]>();

  constructor(
    private authService: AuthService
  ) {}

  ngOnInit() {}
}
