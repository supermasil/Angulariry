import { Component, OnInit } from '@angular/core';
import icSearch from '@iconify/icons-ic/twotone-search';
import icBaselineHome from '@iconify/icons-ic/baseline-home';


@Component({
  selector: 'vex-error404',
  templateUrl: './error-404.component.html',
  styleUrls: ['./error-404.component.scss']
})
export class Error404Component implements OnInit {

  icSearch = icSearch;
  icBaselineHome = icBaselineHome;

  constructor() { }

  ngOnInit() {
  }

}
