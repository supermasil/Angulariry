import { AfterViewChecked, ChangeDetectorRef, Component, OnInit, QueryList, ViewChild, ViewChildren } from "@angular/core";
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from "@angular/router";
import { ReplaySubject } from 'rxjs';
import { AuthService } from "src/app/auth/auth.service";
import { FileUploaderComponent } from "src/app/custom-components/file-uploader/file-uploader.component";
import { OrganizationModel } from "src/app/models/organization.model";
import { PricingModel } from "src/app/models/pricing.model";
import { GeneralInfoModel } from "src/app/models/tracking-models/general-info.model";
import { InPersonSubTrackingModel, InPersonTrackingModel } from "src/app/models/tracking-models/in-person-tracking.model";
import { ListItemModel } from "src/app/models/tracking-models/list-item.model";
import { UserModel } from "src/app/models/user.model";
import { PricingService } from "src/app/custom-components/pricings/pricing.service";
import { TrackingService } from "../../tracking.service";
import { FinalizedInfoComponent } from "../finalized-info/finalized-info.component";
import { GeneralInfoComponent } from "../general-info/general-info.component";
import { ItemsListComponent } from "../items-list/items-list.component";
import { AuthGlobals } from "src/app/auth/auth-globals";
import { TrackingGlobals } from "../../tracking-globals";
import { ToastrService } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";


@Component({
  selector: 'in-person-tracking-form',
  templateUrl: './in-person-form.component.html',
  styleUrls: ['./in-person-form.component.css', '../tracking-create-edit.component.css']
})
export class InPersonTrackingFormComponent implements OnInit, AfterViewChecked {
  inPersonForm: FormGroup;
  subTrackingsForm: FormGroup;

  @ViewChildren('itemsList') itemsListRef: QueryList<ItemsListComponent>;
  @ViewChildren('finalizedInfo') finalizedInfoRef: QueryList<FinalizedInfoComponent>;

  @ViewChild('fileUploader') fileUploader: FileUploaderComponent;
  @ViewChild('generalInfo', {static: false}) generalInfo: GeneralInfoComponent;


  currentUser: UserModel;
  selectedUser: UserModel;
  organization: OrganizationModel;
  users: UserModel[];
  defaultPricing: PricingModel;

  defaultLocationsSubject = new ReplaySubject<string[]>();
  defaultPricingSubject = new ReplaySubject<PricingModel>();
  defaultContentSubject = new ReplaySubject<string>();

  usersSubject = new ReplaySubject<UserModel[]>();
  pricingUpdatedSubject = new ReplaySubject<{sender: string, origin: string, destination: string}>();
  generalInfoSubject = new ReplaySubject<GeneralInfoModel>();

  trackingNumberSubject = new ReplaySubject<string>(); // Main tracking number

  updateExistingItemsSubjects: ReplaySubject<ListItemModel[]>[] = [];
  itemsListSubjects: ReplaySubject<any>[] = [];
  costAdjustmentSubjects: ReplaySubject<number>[] = [];
  exchangeSubject: ReplaySubject<number>[] = [];


  updateExistingImagesSubject = new ReplaySubject<string[]>();

  showFinalizedInfo = [];

  showTotalFinalizedInfo = false;
  totalWeightCharge = 0;
  totalExtraCharge = 0;
  totalInsurance = 0;
  totalWeight = 0;
  totalSaving = 0;
  totalFinalCost = 0;
  totalFinalCostVND = 0;
  currentTracking: InPersonTrackingModel; // edit case
  mode = "create";
  trackingNumber = "";
  removedTrackingIds = [];
  generalInfoDisabledFields = [true, true, true, false, false, false, false];
  canView = this.authService.canView;
  isAuth = this.authService.isAuth;

  constructor(
    private trackingService: TrackingService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private pricingService: PricingService,
    private cd: ChangeDetectorRef,
    private toastr: ToastrService,
    private translateService: TranslateService
  ) {}

  ngOnInit() {
    this.trackingNumber = "inp-" + Date.now() + Math.floor(Math.random() * 10000);
    this.trackingNumberSubject.next(this.trackingNumber);
    this.currentUser = this.authService.getMongoDbUser();
      this.organization = this.authService.getUserOrg();
      this.defaultLocationsSubject.next(this.organization.locations.map(item => item.name));
      this.authService.getUsers().subscribe((response: {users: UserModel[], count: number}) => {
        this.users = response.users;
        this.usersSubject.next(response.users.filter(u => u.role === AuthGlobals.roles.Customer));
        this.pricingService.getPricing(this.organization.pricings).subscribe((pricing: PricingModel) => {
          this.defaultPricing = pricing;
          this.defaultPricingSubject.next(pricing);

          this.route.paramMap.subscribe((paramMap) => {
            if (paramMap.has('trackingId')) {
              this.trackingService.getTracking(paramMap.get('trackingId'), TrackingGlobals.trackingTypes.INPERSON).subscribe((response: InPersonTrackingModel) => {
                this.currentTracking = response;
                this.mode = "edit"
                this.createInPersonForm(response);
                this.createSubTrackingsForm(response);
                this.emitChanges();
              }, error => {
                this.authService.redirect404();
              });
            } else {
              this.createInPersonForm(null);
              this.createSubTrackingsForm(null);
            }
          }, error => {
            this.authService.redirect404();
          });
        }, error => {
          this.authService.redirectToMainPageWithoutMessage();
        });
      }, error => {
        this.authService.redirectToMainPageWithoutMessage();
      });
  }

  emitChanges() {
    if (this.currentTracking.subTrackings.some(t => t.linkedToCsl != null || t.linkedToMst != null)) {
      this.generalInfoDisabledFields = [true, true, true, true, false, true, true];
    }
    this.trackingNumber = this.currentTracking.trackingNumber;
    this.trackingNumberSubject.next(this.currentTracking.trackingNumber);
    this.generalInfoSubject.next(this.currentTracking.generalInfo);
    this.updateExistingImagesSubject.next(this.currentTracking.generalInfo.filePaths);
    this.defaultContentSubject.next(this.inPersonForm.get("content").value);
  }

  createInPersonForm (formData: InPersonTrackingModel) {
    this.inPersonForm = new FormGroup({
      _id: new FormControl(formData?._id? formData._id : null),
      content: new FormControl(formData?.generalInfo?.content? formData.generalInfo.content : ""),
      finalCost: new FormControl(0, {validators: [Validators.required]}),
      finalCostVND: new FormControl(0, {validators: [Validators.required]}),
    });
  }

  createSubTrackingsForm (formData: InPersonTrackingModel) {
    this.subTrackingsForm = new FormGroup({
      subTrackings: new FormArray([])
    });

    if (formData?.subTrackings) {
      formData.subTrackings.forEach((s, index) => {
        this.addSubTracking(s);
        this.updateExistingItemsSubjects[index].next(s.itemsList);
        this.costAdjustmentSubjects[index].next(s.generalInfo.costAdjustment);
        this.exchangeSubject[index].next(s.generalInfo.exchange);
      });
    }
  }

  getNextIndex() {
    let subTrackingIndexes = [0];
    this.subTrackingsForm.get('subTrackings')['controls'].forEach(form => {
      subTrackingIndexes.push(parseInt(form.get('trackingNumber').value.split('-')[2]));
    });
    return Math.max(...subTrackingIndexes) + 1;
  }

  addSubTracking(formData: InPersonSubTrackingModel) {
    let form = new FormGroup({
      _id: new FormControl(formData?._id? formData._id :null),
      trackingNumber: new FormControl({value: formData?.trackingNumber? formData.trackingNumber : this.trackingNumber + '-' + this.getNextIndex(), disabled: true}),
      financialStatus: new FormControl({value: formData?.generalInfo?.financialStatus == TrackingGlobals.financialStatuses.Paid? true : false, disabled: !this.canView(AuthGlobals.internal) || formData?.linkedToCsl }, {validators: [Validators.required]}),
      trackingStatus: new FormControl({value: formData?.generalInfo?.trackingStatus? formData.generalInfo.trackingStatus: TrackingGlobals.trackingStatuses.Created, disabled: true}),
      linkedToCsl: new FormControl({value: formData?.linkedToCsl? formData.linkedToCsl.trackingNumber: null, disabled: true}),
      linkedToMst: new FormControl({value: formData?.linkedToMst? formData.linkedToMst.trackingNumber: null, disabled: true}),
      linkedToCslId: new FormControl({value: formData?.linkedToCsl? formData.linkedToCsl._id: null, disabled: true}),
      linkedToMstId: new FormControl({value: formData?.linkedToMst? formData.linkedToMst._id: null, disabled: true}),
    });

    this.updateExistingItemsSubjects.push(new ReplaySubject<ListItemModel[]>());
    this.itemsListSubjects.push(new ReplaySubject<any>());
    this.costAdjustmentSubjects.push(new ReplaySubject<number>());
    this.exchangeSubject.push(new ReplaySubject<number>());
    this.showFinalizedInfo.push(false);

    (this.subTrackingsForm.get('subTrackings') as FormArray).push(form);
  }

  deleteSubTracking(index: number, trackingId: string) {
    this.updateExistingItemsSubjects.splice(index, 1);
    this.itemsListSubjects.splice(index, 1);
    this.costAdjustmentSubjects.splice(index, 1);
    this.exchangeSubject.splice(index, 1);
    this.showFinalizedInfo.splice(index, 1);
    (this.subTrackingsForm.get('subTrackings') as FormArray).removeAt(index);
    this.cd.detectChanges();
    this.getTotalFinalizedInfo();
    if (trackingId) {
      this.removedTrackingIds.push(trackingId)
    }
  }

  generalInfoValidity(valid: boolean) {
    // Don't change it back to false
  }

  itemsListValidity(input: any, index: number) {
    if (input.valid) {
      this.showFinalizedInfo[index] = true;
      this.itemsListSubjects[index].next(input.data.items);
      this.getTotalFinalizedInfo();
    } else {
      this.showFinalizedInfo[index] = false;
      this.itemsListSubjects[index].next(null);
      this.showTotalFinalizedInfo = false;
    }
    this.cd.detectChanges();
  }

  finalizedInfoValidty() {
    this.getTotalFinalizedInfo();
  }

  getTotalFinalizedInfo() {
    this.resetTotalFinalizedInfo();
    if (this.itemsListRef.length == 0) {
      return
    }

    let itemsListsValidity = true;
    this.itemsListRef.forEach((i, index) => {
      itemsListsValidity = i.getFormValidity() && itemsListsValidity;
    });

    if (itemsListsValidity) {
      this.finalizedInfoRef.forEach((i) => {
        this.totalWeightCharge += i.getRawValues().totalWeight;
        this.totalExtraCharge += i.getRawValues().totalExtraCharge;
        this.totalInsurance += i.getRawValues().totalInsurance;
        this.totalWeight += i.getRawValues().totalWeight;
        this.totalSaving += i.getRawValues().totalSaving;
        this.totalFinalCost += i.getRawValues().finalCost;
        this.totalFinalCostVND += i.getRawValues().finalCostVND;
      });
      this.inPersonForm?.get('finalCost').setValue(this.totalFinalCost); // Currency format requires this
      this.inPersonForm?.get('finalCostVND').setValue(this.totalFinalCostVND);
      this.showTotalFinalizedInfo = true;
    }
  }

  resetTotalFinalizedInfo() {
    this.totalWeightCharge = 0;
    this.totalExtraCharge = 0;
    this.totalInsurance = 0;
    this.totalWeight = 0;
    this.totalSaving = 0;
    this.totalFinalCost = 0;
    this.totalFinalCostVND = 0;
    this.inPersonForm?.get('finalCost').setValue(0);
    this.inPersonForm?.get('finalCostVND').setValue(0);
  }

  pricingUpdate(changes) {
    this.pricingUpdatedSubject.next(changes);
    // Error is handled in itemsListComponent
  }

  ngAfterViewChecked() {
    if (this.mode == "edit") {
      this.getTotalFinalizedInfo();
    }
    this.cd.detectChanges();
  }

  onSave() {
    this.generalInfo.getFormValidity();
    let subTrackings = this.subTrackingsForm.getRawValue().subTrackings;
    let itemsListsValidity = true;
    let finalizedInfoValidity = true;

    this.finalizedInfoRef.forEach((i, index) => {
      i.getFormValidity()
      finalizedInfoValidity = i.getFormValidity() && finalizedInfoValidity;
      subTrackings[index]['finalizedInfo'] = i.getRawValues();
    });

    for (const {i, index} of this.itemsListRef.map((i, index) => ({i, index}))) {
      i.getFormValidity()
      itemsListsValidity = i.getFormValidity() && itemsListsValidity;
      if (i.getRawValues().items.length == 0) {
        this.translateService.get(`error-messages.subtracking-with-empty-items-list`).subscribe(translatedMessage => {
          this.toastr.warning(translatedMessage);
        });
        return;
      }
      subTrackings[index]['itemsList'] = i.getRawValues().items;
    };

    if (!this.inPersonForm.valid || !this.generalInfo.getFormValidity() || !itemsListsValidity || !finalizedInfoValidity) {
      return;
    }

    let formData = this.inPersonForm.getRawValue();
    formData['generalInfo'] = this.generalInfo.getRawValues(); // Must be present
    formData['subTrackings'] = subTrackings;
    formData['removedTrackingIds'] = this.removedTrackingIds;

    formData['finalizedInfo'] = {};
    formData['finalizedInfo']['totalWeight'] = this.totalWeight;
    formData['finalizedInfo']['finalCost'] = this.totalFinalCost;

    if (this.mode === "edit") {
      formData['_id'] = this.currentTracking._id;
      formData['filesToAdd'] = JSON.stringify(this.fileUploader.getFilesToAdd());
      formData['fileNamesToAdd'] = JSON.stringify(this.fileUploader.getFileNamesToAdd());
      formData['filesToDelete'] = JSON.stringify(this.fileUploader.getFilesToDelete());
    } else {
      formData['filesToAdd'] = JSON.stringify(this.fileUploader.getFilesToAdd());
      formData['fileNamesToAdd'] = JSON.stringify(this.fileUploader.getFileNamesToAdd());
    }

    this.trackingService.createUpdateTracking(formData);
  }
}
