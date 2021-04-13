import { AfterViewInit, Component, EventEmitter, Input, NgZone, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { AuthGlobals } from 'src/app/auth/auth-globals';
import { AuthService } from 'src/app/auth/auth.service';
import { AutoCompleteInputComponent } from 'src/app/custom-components/auto-complete-input/auto-complete-input.component';
import { RecipientModel } from 'src/app/models/recipient.model';
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
  sendersSubject = new BehaviorSubject<UserModel[]>([]);
  recipientsSubject = new BehaviorSubject<RecipientModel[]>([]);
  @Input() usersObservable = new Observable<UserModel[]>();
  @Input() defaultLocationsObservable = new Observable<string[]>();
  @Input() trackingNumberObservable = new Observable<string>();
  @Input() generalInfoObservable = new Observable<GeneralInfoModel>();
  @Input() disabledFields = [true, true, true, false, false, false, false]; // True is disabled
  @Input() disableSender = false;
  @Input() disableRecipient = false;
  generalInfo : GeneralInfoModel;

  trackingStatuses = Object.values(TrackingGlobals.trackingStatuses);
  financialStatuses =  Object.values(TrackingGlobals.financialStatuses)

  @Output() formValidityStatus = new EventEmitter<boolean>();
  @Output() generalInfoUpdated = new EventEmitter<any>();
  selectSenderSubject = new ReplaySubject<UserModel>();
  selectRecipientSubject = new ReplaySubject<RecipientModel>();

  @ViewChild('sender') sender: AutoCompleteInputComponent;
  @ViewChild('recipient') recipient: AutoCompleteInputComponent;

  senderFields = ["name", "userCode"];
  recipientFields = ["name", "email", "phoneNumber"];

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
      this.formValidityStatus.emit(!this.generalInfoForm.invalid); // Has to use invalid for the master edit case in which the whole form is disabled
      if (!this.generalInfoForm.invalid) {
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

      this.sendersSubject.next(this.senders);

      this.generalInfoObservable.subscribe((generalInfo: GeneralInfoModel) => {
        this.patchFormValue(generalInfo);
        if (!this.disableSender && generalInfo.sender) {
            this.selectSenderSubject.next(generalInfo.sender)
        }

        if (!this.disableRecipient && generalInfo.recipient) {
          this.selectRecipientSubject.next(generalInfo.recipient);
        }
        this.formValidityStatus.emit(this.generalInfoForm.valid);
      });
    });

  }

  createGeneralInfoForm() {
    let form = new FormGroup({
      trackingNumber: new FormControl({value: "", disabled: this.disabledFields[0]}, {validators: [Validators.required]}), // Set through subscription
      trackingStatus: new FormControl({value: TrackingGlobals.trackingStatuses.Created, disabled: this.disabledFields[1]}, {validators: [Validators.required]}),
      financialStatus: new FormControl({value: TrackingGlobals.financialStatuses.Unpaid, disabled: this.disabledFields[2]}, {validators: [Validators.required]}),
      origin: new FormControl({value: "", disabled: this.disabledFields[5]}, {validators: [Validators.required]}),
      destination: new FormControl({value: "", disabled: this.disabledFields[6]}, {validators: [Validators.required]}),
    });

    // Need to create this way so that Master general info validity can be emitted properly
    if (!this.disableSender) {
      form.addControl('sender', new FormControl({value: "", disabled: this.disabledFields[3]}, {validators: [Validators.required]}));
    }
    if (!this.disableRecipient) {
      form.addControl('recipient', new FormControl({value: "", disabled: this.disabledFields[4]}, {validators: [Validators.required]}));
    }

    return form;
  }

  patchFormValue(formData: GeneralInfoModel) {
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

  senderSelected(sender: UserModel) {
    this.recipient?.resetForm();
    this.selectedSender = sender;
    this.recipientsSubject.next(this.selectedSender.recipients);
    this.generalInfoForm.get('sender').setValue(this.selectedSender._id);
  }

  recipientSelected(recipient: RecipientModel) {
    this.generalInfoForm.get('recipient').setValue(recipient);
  }

  getFormValidity() {
    this.generalInfoForm.markAllAsTouched();

    if (!this.disableSender) {
      this.sender.getFormValidity();
    }

    if (!this.disableRecipient) {
      this.recipient.getFormValidity();
    }

    return !this.generalInfoForm.invalid;
  }

  getRawValues() {
    return this.generalInfoForm.getRawValue();
  }

  itemCancelled() {
    this.recipientsSubject.next([]);
    this.recipient.resetForm();
  }
}
