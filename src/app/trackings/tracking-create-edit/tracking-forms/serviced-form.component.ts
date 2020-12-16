import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { Component, OnInit } from "@angular/core";
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from "@angular/material/chips";
import { carrierTracking } from "../../models/carrier-tracking.model";


@Component({
  selector: 'serviced-form-create',
  templateUrl: './serviced-form.component.html',
  styleUrls: ['./serviced-form.component.css', '../tracking-create.component.css']
})
export class ServicedFormCreateComponent implements OnInit {
  servicedForm: FormGroup;
  customerCodes = ["Alex", "John", "Kay"];
  internalStatus = ["Received at US WH", "Consolidated"];

  readonly separatorKeysCodes: number[] = [ENTER];

  carrierTrackings: carrierTracking[] = [
    {trackingNumber: 'Lemon', status: 'Unknown'},
    {trackingNumber: 'Lime', status: 'In Transit'},
    {trackingNumber: 'Apple', status: 'Delivered'},
  ];

  orderNumbers: string[] = [
    "1231431431", "4353452342", "43634542"
  ]



  ngOnInit() {
    this.servicedForm = new FormGroup({
      trackingNumber: new FormControl({value: "sev-" + Date.now() + Math.floor(Math.random() * 10000), disabled: true}),
      items: new FormArray([this.createItem()]),
      content: new FormControl(""),
      status: new FormControl(null, {validators: [Validators.required]})
    });
  }

  onSave() {

  }

  // Requested Item Row
  createItem(): FormGroup {
    return new FormGroup({
      productLink: new FormControl("", {validators: [Validators.required]}),
      productPrice: new FormControl("", {validators: [Validators.required, Validators.min(0.01)]}),
      specifications: new FormControl("", {validators: [Validators.required]}),
      quantity: new FormControl("", {validators: [Validators.required]})
    });
  }

  addItem() {
    (this.servicedForm.get('items') as FormArray).push(this.createItem());
  }

  removeItem(i: number) {
    if((this.servicedForm.get('items') as FormArray).length == 1) {
      return;
    }


    (this.servicedForm.get('items') as FormArray).removeAt(i);
  }

  // Mat chips
  addChipNumber(event: MatChipInputEvent, type: number): void {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      switch (type) {
        case 0: {// Order number
          this.orderNumbers.push(value.trim());
          break;
        }
        case 1: {// Tracking number
          this.carrierTrackings.push({trackingNumber: value.trim(), status: "Unknown"});
          break;
        }
      }
    }

    if (input) {
      input.value = '';
    }
  }

  removeChipNumber(number: string, type: number): void {
    switch (type) {
      case 0: {// Order number
        this.orderNumbers = this.orderNumbers.filter(item => !(item == number));
        break;
      }
      case 1: {// Tracking number
        this.carrierTrackings = this.carrierTrackings.filter(item => !(item.trackingNumber == number));
        break;
      }
    }
  }

  getChipColor(status: string) {
    switch (status) {
      case "Unknown": {
        return "basic"
      }
      case "In Transit": {
        return "accent"
      }
      case "Delivered": {
        return "primary"
      }
    }
  }
}
