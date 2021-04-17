import { Component, Input, NgZone, OnInit } from "@angular/core";
import { ConsolidatedTrackingModel } from "src/app/models/tracking-models/consolidated-tracking.model";
import { InPersonSubTrackingModel, InPersonTrackingModel } from "src/app/models/tracking-models/in-person-tracking.model";
import { ListItemModel } from "src/app/models/tracking-models/list-item.model";
import { MasterTrackingBox, MasterTrackingModel } from "src/app/models/tracking-models/master-tracking.model";
import { OnlineTrackingModel } from "src/app/models/tracking-models/online-tracking.model";
import { ServicedTrackingModel } from "src/app/models/tracking-models/serviced-tracking.model";
import { TrackingGlobals } from "../../tracking-globals";
import { TrackingService } from "../../tracking.service";

@Component({
  selector: 'tracking-list-items-common',
  templateUrl: './tracking-list-items-common.component.html',
  styleUrls: ['../tracking-list.component.css'],
})
export class TrackingListItemsCommonComponent implements OnInit {
  @Input() tracking: any;
  @Input() trackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel)[] = [];
  @Input() i: number;

  trackingGlobals = TrackingGlobals;

  onlineInPersonDisplayedColumns = ["item", "declaredValue", "quantity", "insurance", "weight", "weightUnitCharge", "extraCharge", "finalCharge"];
  consolidatedDisplayedColumns = ["trackingNumber", "payment", "weight", "cost", "trackingStatus"];
  masterDisplayedColumns = ["trackingNumber", "payment", "weight", "cost", "pallet", "box", "status"];

  getBadgeColor = TrackingGlobals.getBadgeColor;

  constructor(
    private trackingService: TrackingService,
    private zone: NgZone
  ) {};

  ngOnInit() {
  }

  getItemCharge(item: ListItemModel) {
    return item.extraChargeUnit === '%'? item.declaredValue * item.quantity * (item.extraCharge / 100) + item.weight * item.unitCharge + item.declaredValue * item.quantity * (item.insurance / 100) :
                            item.extraCharge * item.quantity + item.weight * item.unitCharge + item.declaredValue * item.quantity * (item.insurance/ 100)

  }

  combineTrackings(arr1: any[], arr2: any[], arr3: any[]) {
    return [...arr1, ...arr2, ...arr3];
  }

  childTrackingToggle(tracking: OnlineTrackingModel | InPersonSubTrackingModel | ServicedTrackingModel, status: string | boolean, parentTracking: ConsolidatedTrackingModel | MasterTrackingModel, index: number) {
    let tempStatus = status == true? this.trackingGlobals.financialStatuses.Paid : status == false? this.trackingGlobals.financialStatuses.Unpaid: status;
    this.trackingService.changeTrackingStatus(tempStatus, tracking._id, tracking.generalInfo.type, parentTracking._id).subscribe(response => {
      this.trackingService.getTracking(parentTracking.trackingNumber, parentTracking.generalInfo.type).subscribe(t => {
        this.zone.run(() => {
          this.trackings[index] = t;
        })
      })
    });
  }

  getConsolidatedTotalWeightCost(tracking: ConsolidatedTrackingModel) {
    return this.getTotalWeightCostHelper(tracking);
  }

  getMasterTotalWeightCost(boxes: MasterTrackingBox[]) {
    let totalWeight = 0;
    let totalCost = 0;
    let totalCostVND = 0;
    boxes.forEach(b => {
      let response = this.getTotalWeightCostHelper(b);
      totalWeight += response.weight;
      totalCost += response.cost;
      totalCostVND += response.costVND;
    })
    return {weight: totalWeight, cost: totalCost, costVND: totalCostVND};
  }

  getTotalWeightCostHelper(item: ConsolidatedTrackingModel | MasterTrackingBox) {
    let totalWeight = 0;
    let totalCost = 0;
    let totalCostVND = 0;
    item.onlineTrackings.forEach(t => {
      totalWeight += t.generalInfo.totalWeight;
      totalCost += t.generalInfo.finalCost;
      totalCostVND += t.generalInfo.finalCost * t.generalInfo.exchange;
    });
    item.servicedTrackings.forEach(t => {
      totalWeight += t.generalInfo.totalWeight;
      totalCost += t.generalInfo.finalCost;
      totalCostVND += t.generalInfo.finalCost * t.generalInfo.exchange;
    });
    item.inPersonSubTrackings.forEach(t => {
      totalWeight += t.generalInfo.totalWeight;
      totalCost += t.generalInfo.finalCost;
      totalCostVND += t.generalInfo.finalCost * t.generalInfo.exchange;
    });

    return {weight: totalWeight, cost: totalCost, costVND: totalCostVND};
  }

  getMasterSubTrackings(tracking: any) {
    let result = [];
    tracking.boxes.forEach((box: MasterTrackingBox) => {
      let trackings = this.combineTrackings(box.onlineTrackings, box.servicedTrackings, box.inPersonSubTrackings);
      trackings.forEach(t => {
        t.boxNumber = box.boxNumber,
        t.palletNumber = box.palletNumber
      })
      result.push(...trackings);
    });
    return result;
  }
}
