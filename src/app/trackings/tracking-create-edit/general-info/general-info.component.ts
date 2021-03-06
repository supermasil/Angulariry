import { AfterViewInit, Component, EventEmitter, Input, NgZone, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { AuthGlobals } from 'src/app/auth/auth-globals';
import { AuthService } from 'src/app/auth/auth.service';
import { AutoCompleteInputComponent } from 'src/app/custom-components/auto-complete-input/auto-complete-input.component';
import { GeneralInfoModel } from 'src/app/models/tracking-models/general-info.model';
import { UserModel } from 'src/app/models/user.model';
import { TrackingGlobals } from '../../tracking-globals';

@Component({
  selector: 'general-info',
  templateUrl: './general-info.component.html',
  styleUrls: ['./general-info.component.css', '../tracking-create-edit.component.css']
})
export class GeneralInfoComponent implements OnInit, AfterViewInit{

  generalInfoForm: FormGroup;

  senders: UserModel[] = [];
  sendersSubject = new BehaviorSubject<string[]>([]);


  recipientsSubject = new BehaviorSubject<string[]>([]);
  @Input() usersObservable = new Observable<UserModel[]>();
  @Input() defaultLocationsObservable = new Observable<string[]>();
  @Input() trackingNumberObservable = new Observable<string>();
  @Input() generalInfoObservable = new Observable<GeneralInfoModel>();
  @Input() disableSender = false;
  @Input() disableRecipient = false;
  generalInfo : GeneralInfoModel;

  trackingStatuses = Object.values(TrackingGlobals.trackingStatuses);
  financialStatuses =  Object.values(TrackingGlobals.financialStatuses)

  @Output() formValidityStatus = new EventEmitter<boolean>();
  @Output() generalInfoUpdated = new EventEmitter<any>();
  selectSenderSubject = new ReplaySubject<string>();
  selectRecipientSubject = new ReplaySubject<string>();

  @ViewChild('sender') sender: AutoCompleteInputComponent;
  @ViewChild('recipient') recipient: AutoCompleteInputComponent;

  selectedSender: UserModel;
  currentUser: UserModel;

  constructor(
    private zone: NgZone,
    private authService: AuthService) {
  }

  ngOnInit() {
    this.currentUser = this.authService.getMongoDbUser();
    this.generalInfoForm = this.createGeneralInfoForm();

    this.generalInfoForm.valueChanges.subscribe(result => {
      this.formValidityStatus.emit(this.generalInfoForm.valid);
      if (this.generalInfoForm.valid) {
        this.emitGeneralInfoChanges();
      }
    });

    this.trackingNumberObservable.subscribe((trackingNumber: string) => {
      this.generalInfoForm.get('trackingNumber').patchValue(trackingNumber);
    });


    this.usersObservable.subscribe((users: UserModel[]) => {
      this.senders = users;

      if (this.currentUser.role === AuthGlobals.roles.Customer) {
        this.senders = this.senders.filter(s => s.userCode == this.currentUser.userCode);
      }

      this.sendersSubject.next(this.senders.map(u => u.userCode + ' ' + u.name));

      this.generalInfoObservable.subscribe((generalInfo: GeneralInfoModel) => {
        this.patchFormValue(generalInfo);
        if (!this.disableSender && generalInfo.sender) {
            this.selectSenderSubject.next(generalInfo.sender.userCode + " " + generalInfo.sender.name)
        }

        if (!this.disableRecipient && generalInfo.recipient) {
          this.selectRecipientSubject.next(generalInfo.recipient.name + " " + generalInfo.recipient.address.address);
        }
        this.formValidityStatus.emit(this.generalInfoForm.valid);
      });
    });

  }

  createGeneralInfoForm() {
    let form = new FormGroup({
      trackingNumber: new FormControl({value: "", disabled: true}, {validators: [Validators.required]}), // Set through subscription
      // status: new FormControl({value: TrackingGlobals.trackingStatuses.Created, disabled: !AuthGlobals.managerAdmins.includes(this.currentUser.role)}, {validators: [Validators.required]}),
      trackingStatus: new FormControl({value: TrackingGlobals.trackingStatuses.Created, disabled: true}, {validators: [Validators.required]}),
      financialStatus: new FormControl({value: TrackingGlobals.financialStatuses.Unpaid, disabled: true}, {validators: [Validators.required]}),
      origin: new FormControl("", {validators: [Validators.required]}),
      destination: new FormControl("", {validators: [Validators.required]}),
    });

    if (!this.disableSender) {
      form.addControl('sender', new FormControl("", {validators: [Validators.required]}));
    }

    if (!this.disableRecipient) {
      form.addControl('recipient', new FormControl("", {validators: [Validators.required]}));
    }

    return form;
  }

  patchFormValue(formData: GeneralInfoModel) {
    console.log(formData.trackingStatus)
    this.zone.run(() => {
      this.generalInfoForm.patchValue({
        trackingStatus: formData.trackingStatus? formData.trackingStatus : this.generalInfoForm.get('trackingStatus').value,
        financialStatus: formData.financialStatus? formData.financialStatus : this.generalInfoForm.get('financialStatus').value,
        origin: formData.origin? formData.origin : this.generalInfoForm.get('origin').value,
        destination: formData.destination? formData.destination : this.generalInfoForm.get('destination').value,
      });
    });
  }

  emitGeneralInfoChanges() {
    let emitData = {
      origin: this.generalInfoForm.get('origin').value,
      destination: this.generalInfoForm.get('destination').value
    }

    if (!this.disableSender) {
      emitData['sender'] = this.generalInfoForm.get('sender').value;
    }

    this.generalInfoUpdated.emit(emitData)
  }

  ngAfterViewInit() {
  }

  senderSelected(value: string) {
    let splitValue = value.split(' ')[0];
    this.recipient?.resetForm();
    this.selectedSender = this.senders.filter(s => s.userCode == splitValue)[0];
    this.recipientsSubject.next(this.selectedSender.recipients.map(r => r.name + ' ' + r.address.address));
    this.generalInfoForm.get('sender').setValue(this.selectedSender._id);
  }

  recipientSelected(value: string) {
    let splitValue = value.split(' ')[0];
    this.generalInfoForm.get('recipient').setValue(splitValue);
  }

  getFormValidity() {
    this.generalInfoForm.markAllAsTouched();
    if (!this.disableRecipient) {
      this.recipient.getFormValidity();
    }
    if (!this.disableSender) {
      this.sender.getFormValidity();
    }

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
