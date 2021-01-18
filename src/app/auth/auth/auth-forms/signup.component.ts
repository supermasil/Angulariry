import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { AbstractControl, FormArray, FormControl, FormGroup, ValidatorFn, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import * as firebase from "firebase";
import { phoneNumberValidator } from "lac-mat-tel-input";
import { Address } from "ngx-google-places-autocomplete/objects/address";
import { ReplaySubject } from "rxjs";
import { UserModel } from "src/app/models/user.model";
import { AutoCompleteInputComponent } from "src/app/custom-components/auto-complete-input/auto-complete-input.component";
import { ValidatorsService } from "src/app/validators.service";
import { AuthService } from "../../auth.service";


@Component({
  selector: 'signup-form',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css', '../auth.component.css']
})
export class SignUpFormComponent implements OnInit, OnDestroy {
  signupForm: FormGroup;
  isLoading = false;

  roles = ["SuperAdmin", "Admin", "Manager", "Sales", "Accounting", "Operation", "Receiving/Shipping", "Customer"];

  defaultLocations = [];
  organizations = [];
  companyCodes = new ReplaySubject<string[]>();
  companyCodesCopy = [];
  mode = "create";
  currentUser: UserModel;

  // mongoDbUserSubscription: Subscription;
  mongoDbUser: UserModel;

  @ViewChild("companyCode") companyCode: AutoCompleteInputComponent;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private validatorsService: ValidatorsService,
  ) {}

  ngOnInit() {
    this.signupForm = this.createSignUpForm(null);

    this.authService.getOrganizations().subscribe(orgs => {
      this.organizations = orgs.organizations;
      this.companyCodes.next(orgs.organizations.map(item => item.companyCode));
      this.companyCodesCopy = orgs.organizations.map(item => item.companyCode);
      this.route.paramMap.subscribe((paramMap) => {
        if (paramMap.has("userId")) {
          this.authService.getUser(paramMap.get("userId")).subscribe((user: UserModel) => {
            this.currentUser = user;
            this.signupForm = this.createSignUpForm(user);
            this.mode = 'edit';
          }, error => {
            this.authService.redirectOnFailedSubscription("Failed to subscribe to paramMap");
          })
        }
      });
      this.authService.getMongoDbUserListener().subscribe((user: UserModel) => {
        this.mongoDbUser = user;
        if (user && this.mode == "edit") {
          this.companyCode.selectItem(user.companyCode);
        }
      }, error => {
        this.authService.redirectOnFailedSubscription("Couldn't fetch user");
      });
    }, error => {
      this.authService.redirectOnFailedSubscription("Couldn't fetch organization");
    });
  }

  ngOnDestroy() {
    // this.mongoDbUserSubscription.unsubscribe();
  }

  recipientNamesValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
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
        console.log(control);
        return {error: "Please enter an item name"};
      }
    };
  }

  createSignUpForm(formData: any) {
    return new FormGroup({
      _id: new FormControl(formData?._id? formData._id : null),
      name: new FormControl(formData?.name? formData.name : "", {validators: [Validators.required]}),
      email: new FormControl({value: formData?.email? formData.email : "", disabled: formData?._id? true : false}, {validators: [Validators.required, Validators.email]}),
      password: new FormControl({value: "", disabled: formData?._id? true : false}, {validators: [Validators.required, Validators.minLength(6)]}),
      phoneNumber: new FormControl(formData?.phoneNumber? formData.phoneNumber : "", {validators: [phoneNumberValidator, Validators.required]}),
      role: new FormControl(formData?.role? formData.role: "", {validators: [Validators.required]}),
      defaultLocation: new FormControl({value: formData?.defaultLocation? formData.defaultLocation : ""}, {validators: [Validators.required]}),
      addresses: new FormArray(formData?.addresses && formData.addresses.length > 0 ? this.createAddresses(formData.addresses) : this.createAddresses([null])),
      recipients: new FormArray(formData?.recipients && formData.recipients.length > 0 ? this.createRecipients(formData.recipients): this.createRecipients([])),
      companyCode: new FormControl(formData?.companyCode? formData.companyCode : "", {validators: [this.validatorsService.companyCodeValidator(this.companyCodesCopy)]}),
      customerCode: new FormControl(formData?.customerCode? formData.customerCode : "", {validators: [Validators.required]}),
      organization: new FormControl(formData?.organization? formData.organization : "", {validators: [Validators.required]}),
    });
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
      console.log(form.get('name').value);
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
  }

  async onSignup() {
    this.signupForm.markAllAsTouched(); // deal with phone number validator empty issue
    if (this.signupForm.invalid) {
      return;
    }
    this.setButtonTimeOut();
    await this.authService.createUpdateUser(this.signupForm.getRawValue());
  }

  setButtonTimeOut() {
    this.isLoading = true;
    setTimeout(() => this.isLoading = false, 3000);
  }

  companyCodeSelected(code: string) {
    let selectedOrg = this.organizations.filter(item => item.companyCode == code)[0];
    if (selectedOrg) {
      this.signupForm.controls['companyCode'].setValue(selectedOrg.companyCode);
      this.signupForm.controls['organization'].setValue(selectedOrg._id);
      this.defaultLocations = selectedOrg.locations.map(item => item.name);
      this.signupForm.get('defaultLocation').enable();
    }
  }
}
