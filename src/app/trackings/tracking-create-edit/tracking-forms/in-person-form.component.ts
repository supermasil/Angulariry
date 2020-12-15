import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { AutoCompleteInput } from "../auto-complete-input/auto-complete-input.component";


@Component({
  selector: 'in-person-form-create',
  templateUrl: './in-person-form.component.html',
  styleUrls: ['./in-person-form.component.css', '../tracking-create.component.css']
})
export class InPersonFormCreateComponent implements OnInit, AfterViewInit {
  inPersonForm: FormGroup;

  customerCodes = ["Alex", "John", "Kay"];
  recipients = ["Alex", "John", "Kay"];

  origins = ["California", "Oregon"];
  destinations = ["Saigon", "Hanoi"];
  insurance = ["Regular", "2%"];

  @ViewChild('sender') sender : AutoCompleteInput;
  @ViewChild('recipient') recipient : AutoCompleteInput;

  private senderSubsciption: Subscription;
  private recipientSubsciption: Subscription;


  ngOnInit() {
    this.inPersonForm = new FormGroup({
      trackingNumber: new FormControl({value: "inp-" + Date.now() + Math.floor(Math.random() * 10000), disabled: true}, {validators: [Validators.required]}),
      customerCode: new FormControl(null, {validators: [Validators.required]}),
      recipient: new FormControl(null, {validators: [Validators.required]}),
      origin: new FormControl(null, {validators: [Validators.required]}),
      destination: new FormControl(null, {validators: [Validators.required]}),
      items: new FormArray([]),
      content: new FormControl(""),
      weight: new FormControl(null, {validators: [Validators.required]}),
      payAtDestination: new FormControl(false, {validators: [Validators.required]}),
      receiveAtDestinationWH: new FormControl(false, {validators: [Validators.required]})
    });
  }

  ngAfterViewInit(): void {
    this.senderSubsciption = this.sender.getSelectedValueListener().subscribe(value => {
      this.inPersonForm.controls['customerCode'].setValue(value);
    })

    this.recipientSubsciption = this.recipient.getSelectedValueListener().subscribe(value => {
      this.inPersonForm.controls['recipient'].setValue(value);
    })
  }

  onSave() {
    console.log(this.sender.triggerValidation());
    console.log(this.recipient.triggerValidation());

    // console.log(this.inPersonForm);
  }


}
