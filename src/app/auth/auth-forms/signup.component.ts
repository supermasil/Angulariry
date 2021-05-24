import { Component, NgZone, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { AbstractControl, FormArray, FormControl, FormGroup, ValidatorFn, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { phoneNumberValidator } from "lac-mat-tel-input";
import { Address } from "ngx-google-places-autocomplete/objects/address";
import { UserModel } from "src/app/models/user.model";
import { ValidatorsService } from "src/app/validators.service";
import { AuthService } from "../auth.service";
import { AuthGlobals } from "../auth-globals";
import { fadeInUp400ms } from "src/@vex/animations/fade-in-up.animation";
import icDoneAll from '@iconify/icons-ic/twotone-done-all';
import { StepperOrientation } from "@angular/cdk/stepper";
import { Observable } from "rxjs";
import { BreakpointObserver } from "@angular/cdk/layout";
import { map } from "rxjs/operators";

@Component({
  selector: 'signup-form',
  templateUrl: './signup.component.html',
  styleUrls: ['../auth.component.css'],
  animations: [
    fadeInUp400ms,
  ]
})
export class SignUpFormComponent implements OnInit, OnDestroy {
  signupForm1: FormGroup;
  signupForm2: FormGroup;
  signupForm3: FormGroup;
  isLoading = false;
  mode = "create";
  stepperOrientation: Observable<StepperOrientation>;

  roles = AuthGlobals.everyone;
  authGlobals = AuthGlobals;

  // mongoDbUserSubscription: Subscription;
  currentUser: UserModel;
  editUser: UserModel;

  icDoneAll = icDoneAll;
  
  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private validatorsService: ValidatorsService,
    private breakpointObserver: BreakpointObserver,
    private zone: NgZone
  ) {
    this.stepperOrientation = breakpointObserver.observe('(min-width: 800px)')
      .pipe(map(({matches}) => matches ? 'horizontal' : 'vertical'));
  }

  ngOnInit() {
    this.currentUser = this.authService.getMongoDbUser();
    this.route.paramMap.subscribe((paramMap) => {
      if (paramMap.has("userId")) { // Edit case
        this.mode = 'edit';
        this.authService.getUser(paramMap.get("userId"), this.authService.userTypes.MONGO).subscribe((user: UserModel) => {
          this.editUser = user;
          this.checkAuthorization();
            this.zone.run(() => {
              this.createSignUpForm(user);
              this.createSenderForm(user);
              this.createRecipientForm(user);
            })
          });
      } else { // Create case
        this.zone.run(() => {
          this.createSignUpForm(null);
          this.createSenderForm(null);
          this.createRecipientForm(null);
        });
      }
    });
  }

  ngOnDestroy() {
    // this.mongoDbUserSubscription.unsubscribe();
  }

  recipientNamesValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!this.signupForm3) {
        return null;
      }
      if ((control && control.value)) {
        let currentFormItems = this.signupForm3.get('recipients')['controls'].map(item => item['controls'].name.value.toLowerCase());// Tricky as fuck, can't use .value because the value is not updated
        this.signupForm3.get('recipients')['controls'].forEach(element => {
          if (currentFormItems.filter(item => item === element['controls'].name.value.toLowerCase()).length > 1) {
            element['controls'].name.setErrors({error: "Duplicate item name"});
          } else {
            element['controls'].name.setErrors(null);
            return null;
          }
        });
        // This block is needed for the current field
        if (currentFormItems.filter(item => item ===  control.value.toLowerCase()).length > 1) {
          return {error: "Duplicate name"};
        }
        return null;
      } else {
        return {error: "Please enter an item name"};
      }
    };
  }

  createSignUpForm(formData: any) {
    this.signupForm1 = new FormGroup({
      _id: new FormControl(formData?._id? formData._id : null),
      name: new FormControl(formData?.name? formData.name : "", {validators: [Validators.required]}),
      email: new FormControl({value: formData?.email? formData.email : "", disabled: formData?._id? true : false}, {validators: [Validators.required, Validators.email]}),
      password: new FormControl({value: "", disabled: formData?._id? true : false}, {validators: [Validators.required, Validators.minLength(6)]}),
      phoneNumber: new FormControl(formData?.phoneNumber? formData.phoneNumber : "", {validators: [phoneNumberValidator, Validators.required]}),
      role: new FormControl(formData?.role? formData.role : null),
    });
    this.validateRoles();
  }

  createSenderForm(formData: any) {
    this.signupForm2 = new FormGroup({
      addresses: new FormArray(formData?.addresses && formData.addresses.length > 0 ? this.createAddresses(formData.addresses) : this.createAddresses([null]))
    })
  }

  createRecipientForm(formData: any) {
    this.signupForm3 = new FormGroup({
      recipients: new FormArray(formData?.recipients && formData.recipients.length > 0 ? this.createRecipients(formData.recipients): this.createRecipients([]))
    })
  }

  checkAuthorization() {
    if (this.currentUser._id == this.editUser._id) {
      return true;
    } else {
      if (this.currentUser.role == AuthGlobals.roles.SuperAdmin
        || (this.currentUser.role == AuthGlobals.roles.Admin && AuthGlobals.nonAdmin.includes(this.editUser.role))
        || (AuthGlobals.officers.includes(this.currentUser.role) && this.editUser.role == AuthGlobals.roles.Customer)) {
        return true;
      }
      this.authService.redirectToMainPageWithMessage("not-authorized", 400);
      return false;
    }
  }

  validateRoles() {
    if (this.mode == "create" || AuthGlobals.nonAdmin.includes(this.currentUser.role) || this.currentUser._id == this.editUser._id) {
      this.signupForm1.get("role").disable();
    } else if (this.currentUser.role == AuthGlobals.roles.Admin) {
      this.roles = AuthGlobals.nonAdmin;
    } else {
      this.roles == [];
    }
  }

  createAddresses(addresses: any) {
    let results: FormGroup[] = [];
    addresses.forEach(address => {
      let form = new FormGroup({
        address: new FormControl({value: address?.address? address.address : "", disabled: address?.address? true : false}, {validators: [Validators.required, this.validatorsService.addressValidator()]}),
        addressLineTwo: new FormControl(address?.addressLineTwo? address.addressLineTwo : ""),
        addressUrl: new FormControl(address?.addressUrl? address.addressUrl : "", {validators: [Validators.required]})
      });

      results.push(form);
    });
    return results;
  }

  createRecipients(recipients: any) {
    let results: FormGroup[] = [];
    recipients.forEach(recipient => {
      let form = new FormGroup({
        name: new FormControl(recipient?.name? recipient.name : "", {validators: [Validators.required, this.recipientNamesValidator()]}),
        email: new FormControl(recipient?.email? recipient.email : "", {validators: [Validators.email]}),
        phoneNumber: new FormControl(recipient?.phoneNumber? recipient.phoneNumber : "", {validators: [phoneNumberValidator, Validators.required]}),
        address: new FormControl({value: recipient?.address?.address? recipient.address.address : "", disabled: recipient?.address?.address? true : false}, {validators: [Validators.required, this.validatorsService.addressValidator()]}),
        addressLineTwo: new FormControl(recipient?.address?.addressLineTwo? recipient.address.addressLineTwo : ""),
        addressUrl: new FormControl(recipient?.address?.addressUrl? recipient.address.addressUrl : "", {validators: [Validators.required]})
      });
      results.push(form);
    });

    return results;
  }

  onAddressChange(address: Address, field: string, index: number) {
    if (!address.formatted_address) {
      return;
    }

    let form: FormGroup;

    if (field == "addresses") {
      form = this.signupForm2;
    } else if (field == "recipients") {
      form = this.signupForm3;
    }
    form.get(field)['controls'][index].controls['address'].setValue(address.formatted_address);
    form.get(field)['controls'][index].controls['address'].disable();
    form.get(field)['controls'][index].controls['addressUrl'].setValue(address.url);
  }

  onAddressCancel(field: string, index: number) {
    let form: FormGroup;

    if (field == "addresses") {
      form = this.signupForm2;
    } else if (field == "recipients") {
      form = this.signupForm3;
    }

    form.get(field)['controls'][index].controls['address'].setValue('');
    form.get(field)['controls'][index].controls['addressUrl'].setValue('');
    form.get(field)['controls'][index].controls['address'].enable();
  }

  addAddressOrRecipient(field: string) {
    if (field === 'addresses') {
      (this.signupForm2.get(field) as FormArray).push(this.createAddresses([null])[0]);
    } else if (field === 'recipients') {
      (this.signupForm3.get(field) as FormArray).push(this.createRecipients([null])[0]);
    }
  }

  removeAddressOrRecipient(field: string, i: number) {
    if(field == 'addresses' && (this.signupForm2.get(field) as FormArray).length == 1) {
      return;
    } else if (field === 'recipients') {
      (this.signupForm3.get(field) as FormArray).removeAt(i);
      this.recipientNamesValidator()(new FormControl(" ")); // Trigger validation when removing a recipient
    }
  }

  setButtonTimeOut() {
    this.isLoading = true;
    setTimeout(() => this.isLoading = false, 3000);
  }

  async onSignup() {
  
    this.signupForm1.markAllAsTouched(); // deal with phone number validator empty issue

    if (this.signupForm1.invalid || this.signupForm2.invalid || this.signupForm3.invalid) {
      return;
    }
    this.setButtonTimeOut();
    let andLogin = this.currentUser? false : true; // Login after sign up if a new user

    let finalForm = this.signupForm1.getRawValue();
    finalForm['addresses'] = this.signupForm2.getRawValue()['addresses'];
    finalForm['recipients'] = this.signupForm3.getRawValue()['recipients'];

    console.log(finalForm);

    await this.authService.createUpdateUser(finalForm, andLogin);
  }
}
