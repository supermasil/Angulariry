import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { BehaviorSubject, Observable, of } from 'rxjs';

@Component({
  selector: 'general-info',
  templateUrl: './general-info.component.html',
  styleUrls: ['./general-info.component.css', '../tracking-create-edit.component.css']
})
export class GeneralInfoComponent implements OnInit, AfterViewInit{

  generalInfoForm: FormGroup;

  senders = [];
  @Input() sendersObservable: Observable<string[]>;
  recipients = [];
  @Input() recipientsObservable: Observable<string[]>;
  defaultLocations = [];
  @Input() defaultLocationsObservable: Observable<string[]>;
  trackingNumber = [];
  @Input() trackingNumberObservable: Observable<string[]>;

  statuses = ["Unknown", "Pending", "Created", "Received", "Ready to ship", "Shipped", "Arrived at Destination", "Delivering", "Delivered"];

  @Output() originSelected = new EventEmitter();
  @Output() destinationSelected = new EventEmitter();


  @ViewChild('submitButton') submitButton: ElementRef<HTMLInputElement>;

  constructor() {

  }

  ngOnInit() {
    this.generalInfoForm = new FormGroup({
      trackingNumber: new FormControl({value: "123", disabled: true}, {validators: [Validators.required]}),
      status: new FormControl({value: ""}, {validators: [Validators.required]}),
      sender: new FormControl({value: ""}, {validators: [Validators.required]}),
      recipient: new FormControl({value: ""}, {validators: [Validators.required]}),
      origin: new FormControl({value: ""}, {validators: [Validators.required]}),
      destination: new FormControl({value: ""}, {validators: [Validators.required]}),
    });
  }

  ngAfterViewInit() {
    // this.itemNamesSubject.next(this.itemNames);
  }



  getFormValidity() {
    return this.generalInfoForm.valid;
  }

  getRawValues() {
    return this.generalInfoForm.getRawValue();
  }

  triggerValidation() {
    this.submitButton.nativeElement.click();
    return this.generalInfoForm.valid;
  }
}
