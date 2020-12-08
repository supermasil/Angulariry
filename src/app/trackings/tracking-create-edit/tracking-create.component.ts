import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms'


@Component({
  selector: 'app-tracking-create',
  templateUrl: './tracking-create.component.html',
  styleUrls: ['./tracking-create.component.css']
})

export class TrackingCreateComponent implements OnInit {

  formModes = ["Online", "Serviced", "In-person", "Consolidated", "Master"];
  selectedIndex = 0;


  constructor(

  ) {}



  ngOnInit() {

  }
}
