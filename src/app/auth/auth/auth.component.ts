import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})

export class AuthComponent implements OnInit {
  constructor(
    public route: ActivatedRoute
  ) {}

  selectedTabIndex = 0;

  ngOnInit() {
    this.route.paramMap.subscribe((paramMap) => {
      if (paramMap.has("orgId")) {
        this.selectedTabIndex = 3;
      } else if (paramMap.has("userId")) {
        this.selectedTabIndex = 1;
      }
    });
  }

  setTabIndex(index: number) {
    this.selectedTabIndex = index;
  }
}
