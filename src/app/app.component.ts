import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  constructor(private authSerice: AuthService, public router: Router) {
    this.router.routeReuseStrategy.shouldReuseRoute =  () => {
      return false;
    };
    this.router.onSameUrlNavigation = 'reload';
  }
  ngOnInit() {}
}
