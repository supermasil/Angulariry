import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

@Component({
  selector: 'finalized-info',
  templateUrl: './finalized-info.component.html',
  styleUrls: ['./finalized-info.component.css', '../tracking-create-edit.component.css']
})
export class FinalizedInfoComponent implements OnInit{

  finalizedInfoForm: FormGroup;

  itemsList: any;
  @Input() itemsListObservable = new Observable<any>();
  @Input() costAdjustmentObservable = new Observable<any>();
  @Input() exchangeObservable = new Observable<any>();

  totalWeight = 0;
  totalWeightCharge = 0;
  totalExtraCharge = 0;
  totalSaving = 0;
  finalCharge = 0;
  totalInsurance = 0;

  constructor() {

  }

  ngOnInit() {
    this.finalizedInfoForm = new FormGroup({
      finalCost: new FormControl(0, {validators: [Validators.required]}),
      finalCostVND: new FormControl(0, {validators: [Validators.required]}),
      costAdjustment: new FormControl(0, {validators: [Validators.required]}),
      exchange: new FormControl(0, {validators: [Validators.required]}),
      totalWeight: new FormControl(0, {validators: [Validators.required]})
    });

    this.itemsListObservable.subscribe(itemsList => {
      if (itemsList) {
        this.itemsList = itemsList;
        this.getFinalizedInfo();
      } else { // null
        this.resetInfo()
      }
    });

    this.costAdjustmentObservable.subscribe(c => {
      this.finalizedInfoForm.get('costAdjustment').setValue(c);
      this.getFinalizedInfo();
    })

    this.exchangeObservable.subscribe(c => {
      this.finalizedInfoForm.get('exchange').setValue(c);
      this.getFinalizedInfo();
    })
  }

  resetInfo() {
    this.totalWeight = 0;
    this.totalWeightCharge = 0;
    this.totalExtraCharge = 0;
    this.totalSaving = 0;
    this.finalCharge = 0;
    this.totalInsurance = 0;
    this.finalizedInfoForm.get('totalWeight').setValue(0);
    this.finalizedInfoForm.get('finalCost').setValue(0);
    this.finalizedInfoForm.get('finalCostVND').setValue(0);
  }

  getFinalizedInfo() {
    this.resetInfo();
    this.itemsList?.forEach(item => {
      this.totalWeight += item.weight;
      this.totalWeightCharge += item.weight * item.unitCharge;
      this.totalSaving += item.weight * item.unitChargeSaving;
      this.totalInsurance += item.quantity * item.declaredValue * (item.insurance / 100);

      if (item.extraChargeUnit === "$") {
        this.totalExtraCharge += item.extraCharge * item.quantity;
        this.totalSaving += item.quantity * item.extraChargeSaving;
      } else if (item.extraChargeUnit === "%") {
        this.totalExtraCharge += item.quantity * item.declaredValue * (item.extraCharge / 100);
        this.totalSaving += item.quantity * item.declaredValue * (item.extraChargeSaving / 100);
      }
    });
    this.finalCharge = (this.totalWeightCharge + this.totalExtraCharge + this.totalInsurance + this.finalizedInfoForm.get('costAdjustment').value);
    this.finalizedInfoForm.get('totalWeight').setValue(this.totalWeight);
    this.finalizedInfoForm.get('finalCost').setValue(this.finalCharge);
    this.finalizedInfoForm.get('finalCostVND').setValue(this.finalCharge * this.finalizedInfoForm.get('exchange').value);
  }

  getFormValidity() {
    this.finalizedInfoForm.markAllAsTouched();

    return this.finalizedInfoForm.valid;
  }

  getRawValues() {
    return this.finalizedInfoForm.getRawValue();
  }
}
