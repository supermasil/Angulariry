import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { Component, OnInit } from "@angular/core";
import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { MatChipInputEvent } from "@angular/material/chips";
import { ActivatedRoute } from "@angular/router";
import { phoneNumberValidator } from "lac-mat-tel-input";
import { Address } from "ngx-google-places-autocomplete/objects/address";
import { ValidatorsService } from "src/app/validators.service";
import { AuthService } from "../auth.service";


@Component({
  selector: 'org-onboarding-form',
  templateUrl: './org-onboarding.component.html',
  styleUrls: ['./org-onboarding.component.css']
})
export class OrgOnboardingFormComponentForm implements OnInit {
  organizationOnboardingForm: FormGroup;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  operatingDays = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"];

  isLoading = false; // To prevent fast button clicking

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private validatorsService: ValidatorsService
  ) {}

  mode = "create"

  ngOnInit() {
    this.route.paramMap.subscribe((paramMap) => {
      if (paramMap.has("orgId")) {
        this.mode = 'edit'
        this.authService.getOrganizationsByIds([paramMap.get("orgId")]).subscribe(organization => {
          this.organizationOnboardingForm = this.createOrganizationOnboardingForm(organization[0]);
        }, error => {
          this.authService.redirectToMainPageWithoutMessage();
        });
      } else {
        this.organizationOnboardingForm = this.createOrganizationOnboardingForm(null);
      }
    }, error => {
      this.authService.redirectToMainPageWithoutMessage();
    });
  }

  createOrganizationOnboardingForm(formData: any) {
    return new FormGroup({
      _id: new FormControl(formData?._id? formData._id : null),
      name: new FormControl(formData?.name? formData.name: "", {validators: [Validators.required]}),
      email: new FormControl(formData?.email? formData.email: "", {validators: [Validators.required, Validators.email]}),
      locations: new FormArray(formData?.locations && formData.locations.length > 0 ? this.createLocationItems(formData.locations, true) : this.createLocationItems([null], false)),
      insuranceOptions: new FormControl(formData?.insuranceOptions? formData.insuranceOptions : [], {validators: [Validators.required]}),
    });
  }

  createLocationItems(locations: any, disableName?: boolean): FormGroup[] {
    let results: FormGroup[] = [];
    locations.forEach(location => {
      let form = new FormGroup({
        name: new FormControl({value: location?.name? location.name : "", disabled: disableName == true}, {validators: [Validators.required]}),
        phoneNumber: new FormControl(location?.phoneNumber? location.phoneNumber : "", {validators: [phoneNumberValidator, Validators.minLength(1)]}),
        faxNumber: new FormControl(location?.faxNumber? location.faxNumber : ""),
        address: new FormControl({value: location?.address?.address? location.address.address : "", disabled: location?.address?.address? true : false}, {validators: [Validators.required, this.validatorsService.addressValidator()]}),
        addressLineTwo: new FormControl(location?.address?.addressLineTwo? location.address.addressLineTwo : ""),
        addressUrl: new FormControl(location?.address?.addressUrl? location.address.addressUrl : "", {validators: [Validators.required]}),
        // operatingHours: new FormControl(location?.operatingHours? location.operatingHours : [], {validators: [Validators.required]}), //hh:mm:ss - hh:mm:ss, hh:mm:ss - hh:mm:ss, ...
        // operatingDays: new FormControl(location?.operatingDays? location.operatingDays.map(item => item == "true" ? true : false) : [false, false, false, false, false, false, false], {validators: [Validators.required]}), // Mon, Tues ....
      });

      results.push(form);
    });

    return results;
  }

  onLocationAddressChange(address: Address, index: number) {
    if (!address.formatted_address) {
      return;
    }
    this.organizationOnboardingForm.get('locations')['controls'][index].controls['address'].setValue(address.formatted_address);
    this.organizationOnboardingForm.get('locations')['controls'][index].controls['address'].disable();
    this.organizationOnboardingForm.get('locations')['controls'][index].controls['addressUrl'].setValue(address.url);
  }

  onLocationAddressCancel(index: number) {
    this.organizationOnboardingForm.get('locations')['controls'][index].controls['address'].setValue('');
    this.organizationOnboardingForm.get('locations')['controls'][index].controls['addressUrl'].setValue('');
    this.organizationOnboardingForm.get('locations')['controls'][index].controls['address'].enable();
  }

  // Mat chips
  addInsuranceChip(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      let insuranceOptions = this.organizationOnboardingForm.get('insuranceOptions').value;
      insuranceOptions.push(value.trim());
      this.organizationOnboardingForm.get('insuranceOptions').setValue(insuranceOptions);
    }

    if (input) {
      input.value = '';
    }
  }

  removeInsuranceChip(index: number) {
    console.log(index);
    let insuranceOptions = this.organizationOnboardingForm.get('insuranceOptions').value;
    insuranceOptions.splice(index, 1);
    this.organizationOnboardingForm.get('insuranceOptions').setValue(insuranceOptions);
  }

  addOperatingHoursChip(event: MatChipInputEvent, index: number) {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      let operatingHours = this.organizationOnboardingForm.get('locations').value[index].operatingHours;
      operatingHours.push(value.trim());
      this.organizationOnboardingForm.get('locations')["controls"][index].controls["operatingHours"].setValue(operatingHours);
    }

    if (input) {
      input.value = '';
    }
  }

  removeOperatingHoursChip(index: number) {
    let operatingHours = this.organizationOnboardingForm.get('locations').value[index].operatingHours;
    operatingHours.splice(index, 1);
    this.organizationOnboardingForm.get('locations')["controls"][index].controls["operatingHours"].setValue(operatingHours);
  }

  operatingDayChecked(locationIndex: number, dayIndex: number) {
    let operatingDays = this.organizationOnboardingForm.get('locations').value[locationIndex].operatingDays;
    operatingDays[dayIndex] = !operatingDays[dayIndex];
    this.organizationOnboardingForm.get('locations')["controls"][locationIndex].controls["operatingDays"].setValue(operatingDays);
  }

  addLocation(form: FormGroup) {
    (form.get('locations') as FormArray).push(this.createLocationItems([null], false)[0]);
  }

  removeLocation(i: number) {
    if((this.organizationOnboardingForm.get('locations') as FormArray).length == 1) {
      return;
    }
    (this.organizationOnboardingForm.get('locations') as FormArray).removeAt(i);
  }

  setButtonTimeOut() {
    this.isLoading = true;
    setTimeout(() => this.isLoading = false, 3000);
  }

  onOrganizationOnboarding() {
    this.organizationOnboardingForm.markAllAsTouched(); // deal with phone number validator empty issue
    if (this.organizationOnboardingForm.invalid) {
      return;
    }
    this.authService.createUpdateOrganization(this.organizationOnboardingForm.getRawValue());
  }
}
