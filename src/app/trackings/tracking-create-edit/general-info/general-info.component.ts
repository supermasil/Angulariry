import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, NgZone, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AutoCompleteInputComponent } from 'src/app/custom-components/auto-complete-input/auto-complete-input.component';
import { GeneralInfoModel } from 'src/app/models/tracking-models/general-info.model';
import { UserModel } from 'src/app/models/user.model';

@Component({
  selector: 'general-info',
  templateUrl: './general-info.component.html',
  styleUrls: ['./general-info.component.css', '../tracking-create-edit.component.css']
})
export class GeneralInfoComponent implements OnInit, AfterViewInit{

  generalInfoForm: FormGroup;

  senders: UserModel[] = [];
  sendersSubject = new BehaviorSubject<string[]>([]);
  @Input() usersObservable = new Observable<UserModel[]>();



  recipientsSubject = new BehaviorSubject<string[]>([]);

  @Input() defaultLocationsObservable = new Observable<string[]>();
  @Input() trackingNumberObservable = new Observable<string>();
  @Input() generalInfoObservable = new Observable<GeneralInfoModel>();
  generalInfo : GeneralInfoModel;

  statuses = ["Unknown", "Pending", "Created", "Received", "Ready to ship", "Shipped", "Arrived at Destination", "Delivering", "Delivered"];

  @Output() formValidityStatus = new EventEmitter<boolean>();
  @Output() pricingUpdated = new EventEmitter<{sender: string, origin: string, destination: string}>();

  // @ViewChildren('recipient') recipientQuery: QueryList<AutoCompleteInputComponent>;
  // @ViewChildren('sender') senderQuery: QueryList<AutoCompleteInputComponent>;

  @ViewChild('sender') sender: AutoCompleteInputComponent;
  @ViewChild('recipient') recipient: AutoCompleteInputComponent;

  selectedSender: UserModel;

  constructor(
    private route: ActivatedRoute,
    private zone: NgZone) {
  }

  ngOnInit() {
    this.generalInfoForm = this.createGeneralInfoForm();

    this.usersObservable.subscribe((users: UserModel[]) => {
      this.senders = users;
      this.sendersSubject.next(users.map(u => u.customerCode? u.customerCode + ' ' + u.name : "Employee"));
    });

    this.generalInfoForm.valueChanges.subscribe(result => {
      this.formValidityStatus.emit(this.generalInfoForm.valid);
    });

    this.generalInfoForm.get('sender').valueChanges.subscribe((value) => {
      this.emitPricingRelatedChanges();
    });

    this.generalInfoForm.get('origin').valueChanges.subscribe((value) => {
      this.emitPricingRelatedChanges();
    });

    this.generalInfoForm.get('destination').valueChanges.subscribe((value) => {
      this.emitPricingRelatedChanges();
    });

    this.trackingNumberObservable.subscribe((trackingNumber: string) => {
      this.generalInfoForm.get('trackingNumber').patchValue(trackingNumber);
    });

    this.generalInfoObservable.subscribe((generalInfo: GeneralInfoModel) => {
      this.patchFormValue(generalInfo);
      this.sender.selectItem(generalInfo.sender);
      this.recipient.selectItem(generalInfo.recipient.name + " " + generalInfo.recipient.address.address);

      this.formValidityStatus.emit(this.generalInfoForm.valid);
    });
  }

  createGeneralInfoForm() {
    let form = new FormGroup({
      trackingNumber: new FormControl({value: "", disabled: true}, {validators: [Validators.required]}), // Set through subscription
      status: new FormControl({value: this.statuses[0], disabled: true}, {validators: [Validators.required]}),
      sender: new FormControl("", {validators: [Validators.required]}),
      recipient: new FormControl("", {validators: [Validators.required]}),
      origin: new FormControl("", {validators: [Validators.required]}),
      destination: new FormControl("", {validators: [Validators.required]}),
    });

    return form;
  }

  patchFormValue(formData: GeneralInfoModel) {
    this.zone.run(() => {
      this.generalInfoForm.patchValue({
        status: formData.status,
        origin: formData.origin,
        destination: formData.destination
      });
    });
  }

  emitPricingRelatedChanges() {
    this.pricingUpdated.emit({
      sender: this.generalInfoForm.get('sender').value,
      origin: this.generalInfoForm.get('origin').value,
      destination: this.generalInfoForm.get('destination').value
    })
  }

  ngAfterViewInit() {
  }

  senderSelected(value: string) {
    let splitValue = value.split(' ')[0];
    this.recipient.resetForm();
    this.selectedSender = this.senders.filter(s => s.customerCode == splitValue)[0];
    this.recipientsSubject.next(this.selectedSender.recipients.map(r => r.name + ' ' + r.address.address));
    this.generalInfoForm.get('sender').setValue(splitValue);
  }

  recipientSelected(value: string) {
    let splitValue = value.split(' ')[0];
    this.generalInfoForm.get('recipient').setValue(splitValue);
  }

  getFormValidity() {
    this.generalInfoForm.markAllAsTouched();
    this.recipient.getFormValidity();
    this.sender.getFormValidity();
    return this.generalInfoForm.valid;
  }

  getRawValues() {
    return this.generalInfoForm.getRawValue();
  }

  itemCancelled() {
    this.recipientsSubject.next([]);
    this.recipient.resetForm();
  }
}
