import { Component, NgZone, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { AbstractControl, FormArray, FormControl, FormGroup, ValidatorFn, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { phoneNumberValidator } from "lac-mat-tel-input";
import { Address } from "ngx-google-places-autocomplete/objects/address";
import { ReplaySubject } from "rxjs";
import { UserModel } from "src/app/models/user.model";
import { AutoCompleteInputComponent } from "src/app/custom-components/auto-complete-input/auto-complete-input.component";
import { ValidatorsService } from "src/app/validators.service";
import { AuthService } from "../../auth.service";
import { AuthGlobals } from "../../auth-globals";


@Component({
  selector: 'signup-form',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css', '../auth.component.css']
})
export class SignUpFormComponent implements OnInit, OnDestroy {
  signupForm: FormGroup;
  isLoading = false;

  roles = [AuthGlobals.roles.Customer];

  defaultLocations = [];
  userCodes = [];
  organizations = [];
  organization = null;
  companyCodesSubject = new ReplaySubject<string[]>();
  companyCodeSubject = new ReplaySubject<string>();
  mode = "create";

  // mongoDbUserSubscription: Subscription;
  currentUser: UserModel;
  editUser: UserModel;

  @ViewChild("companyCode") companyCode: AutoCompleteInputComponent;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private validatorsService: ValidatorsService,
    private zone: NgZone
  ) {}

  ngOnInit() {
    this.authService.getMongoDbUserListener().subscribe((user: UserModel) => {
      this.currentUser = user;
      this.authService.getOrganizations().subscribe(orgsData => {
        this.organizations = orgsData.organizations;
        this.companyCodesSubject.next(orgsData.organizations.map(item => item.companyCode));
        this.authService.getUsersByOrg(this.authService.getUserOrg()._id).subscribe((users: UserModel[]) => {
          this.userCodes = users.map(u => u.userCode.toLowerCase());
          this.route.paramMap.subscribe((paramMap) => {
            if (paramMap.has("userId")) { // Edit case
              this.mode = 'edit';
              this.authService.getUser(paramMap.get("userId")).subscribe((user: UserModel) => {
                this.editUser = user;
                if (this.checkAuthorization()) {
                  this.roles = AuthGlobals.everyone;
                  this.zone.run(() => {
                    this.createSignUpForm(user);
                    this.setRoles();
                  })
                }
              }, error => {
                this.authService.redirectToMainPageWithMessage("Failed to subscribe to paramMap");
              })
            } else { // Create case
              this.zone.run(() => {
                this.createSignUpForm(null);
                this.setRoles();
              })
            }
          });
        }, error => {
          this.authService.redirectToMainPageWithMessage("Couldn't fetch users");
        });
      }, error => {
        this.authService.redirectToMainPageWithMessage("Couldn't fetch organizations");
      });
    }, error => {
      this.authService.redirectToMainPageWithMessage("Couldn't fetch user");
    });

  }

  ngOnDestroy() {
    // this.mongoDbUserSubscription.unsubscribe();
  }

  recipientNamesValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!this.signupForm) {
        return null;
      }
      if ((control && control.value)) {
        let currentFormItems = this.signupForm.get('recipients')['controls'].map(item => item['controls'].name.value.toLowerCase());// Tricky as fuck, can't use .value because the value is not updated
        this.signupForm.get('recipients')['controls'].forEach(element => {
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
    this.signupForm =  new FormGroup({
      _id: new FormControl(formData?._id? formData._id : null),
      name: new FormControl(formData?.name? formData.name : "", {validators: [Validators.required]}),
      email: new FormControl({value: formData?.email? formData.email : "", disabled: formData?._id? true : false}, {validators: [Validators.required, Validators.email]}),
      password: new FormControl({value: "", disabled: formData?._id? true : false}, {validators: [Validators.required, Validators.minLength(6)]}),
      phoneNumber: new FormControl(formData?.phoneNumber? formData.phoneNumber : "", {validators: [phoneNumberValidator, Validators.required]}),
      role: new FormControl({value: formData?.role? formData.role: "", disabled: this.mode === 'edit' && !AuthGlobals.admins.includes(this.currentUser?.role)}, {validators: [Validators.required]}),
      defaultLocation: new FormControl(formData?.defaultLocation? formData.defaultLocation : "", {validators: [Validators.required]}),
      addresses: new FormArray(formData?.addresses && formData.addresses.length > 0 ? this.createAddresses(formData.addresses) : this.createAddresses([null])),
      recipients: new FormArray(formData?.recipients && formData.recipients.length > 0 ? this.createRecipients(formData.recipients): this.createRecipients([])),
      companyCode: new FormControl({value: ""} , {validators: [Validators.required]}),
      userCode: new FormControl(formData?.userCode? formData.userCode : "", {validators: [Validators.required, this.userCodeValidator()]}),
      organization: new FormControl(formData?.organization? formData.organization : "", {validators: [Validators.required]}),
    });
  }

  setRoles() {
    if (this.mode === 'edit') { // edit case
      if (AuthGlobals.admins.includes(this.currentUser.role)) {
        this.roles = AuthGlobals.internal;
      }
      this.companyCodeSubject.next(this.editUser.companyCode);
      if (this.currentUser.role === AuthGlobals.roles.Customer) {
        this.signupForm.get('userCode').disable();
      }
      this.companyCodeSubject.next(this.editUser.companyCode);
    } else { // create case
      if (this.currentUser.role === AuthGlobals.roles.Admin) {
        this.roles = AuthGlobals.nonAdmin;
      } else if (this.currentUser.role === AuthGlobals.roles.SuperAdmin) {
        this.roles = AuthGlobals.nonSuperAdmin;
      } else {
        this.roles = [AuthGlobals.roles.Customer];
      }

      if (this.currentUser.role !== AuthGlobals.roles.SuperAdmin) {
        this.companyCodeSubject.next(this.currentUser.companyCode);
      }
    }

    if (this.currentUser.role !== AuthGlobals.roles.SuperAdmin) {
      this.signupForm.get('companyCode').disable();
    }
  }

  checkAuthorization() {
    if (this.currentUser._id !== this.editUser._id) {
      if (this.currentUser.role === AuthGlobals.roles.Admin && AuthGlobals.admins.includes(this.editUser.role) ||
        AuthGlobals.internalNonAdmin.includes(this.currentUser.role) && this.editUser.role != AuthGlobals.roles.Customer ||
        this.currentUser.role === AuthGlobals.roles.Customer) {
          this.authService.redirectToMainPageWithMessage("You're not authorized");
          return false;
      }
    }
    return true;
  }

  userCodeValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (this.mode === 'edit' && control.value === this.editUser?.userCode) {
        return null;
      } else if (control && control.value && this.userCodes.includes(control.value.toLowerCase())) {
        return {invalidUserCode: "Customer code already exists"};
      } else if (control && !control.value) {
        return {invalidUserCode: "Customer code is required"};
      }
      return null;
    };
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
    this.signupForm.get(field)['controls'][index].controls['address'].setValue(address.formatted_address);
    this.signupForm.get(field)['controls'][index].controls['address'].disable();
    this.signupForm.get(field)['controls'][index].controls['addressUrl'].setValue(address.url);
  }

  onAddressCancel(field: string, index: number) {
    this.signupForm.get(field)['controls'][index].controls['address'].setValue('');
    this.signupForm.get(field)['controls'][index].controls['addressUrl'].setValue('');
    this.signupForm.get(field)['controls'][index].controls['address'].enable();
  }

  addAddressOrRecipient(field: string) {
    if (field === 'addresses') {
      (this.signupForm.get(field) as FormArray).push(this.createAddresses([null])[0]);
    } else if (field === 'recipients') {
      (this.signupForm.get(field) as FormArray).push(this.createRecipients([null])[0]);
    }

  }

  removeAddressOrRecipient(field: string, i: number) {
    if(field == 'addresses' && (this.signupForm.get(field) as FormArray).length == 1) {
      return;
    }
    (this.signupForm.get(field) as FormArray).removeAt(i);
    this.recipientNamesValidator()(new FormControl(" ")); // Trigger validation when removing a recipient
  }

  setButtonTimeOut() {
    this.isLoading = true;
    setTimeout(() => this.isLoading = false, 3000);
  }

  companyCodeSelected(code: string) {
    let selectedOrg = this.organizations.filter(item => item.companyCode == code)[0];
    if (selectedOrg) {
      this.zone.run(() => {
        this.signupForm.controls['companyCode'].setValue(selectedOrg.companyCode);
        this.signupForm.controls['organization'].setValue(selectedOrg._id);
        this.defaultLocations = selectedOrg.locations.map(item => item.name);
        this.signupForm.get('defaultLocation').enable();
      });
    }
  }

  lockCustomerCode() {
    if (this.mode === 'create' && this.currentUser && this.currentUser.role === AuthGlobals.roles.SuperAdmin
    || (this.mode === 'edit' && this.currentUser && this.currentUser.role === AuthGlobals.roles.SuperAdmin && this.editUser && this.editUser.role === AuthGlobals.roles.SuperAdmin)) {
      return false;
    }
    return true
  }

  async onSignup() {
    this.companyCode.getFormValidity();
    this.signupForm.markAllAsTouched(); // deal with phone number validator empty issue
    if (this.signupForm.invalid) {
      return;
    }
    this.setButtonTimeOut();
    await this.authService.createUpdateUser(this.signupForm.getRawValue());
  }
}
