import { Component, EventEmitter, NgZone, OnInit, Output } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { AuthGlobals } from "src/app/auth/auth-globals";
import { AuthService } from "src/app/auth/auth.service";
import { CodeScannerService } from "../code-scanner/code-scanner.service";


@Component({
  selector: 'trackings-report-component',
  templateUrl: 'trackings-report.component.html',
  styleUrls: []
})
export class TrackingsReportComponent implements OnInit {

  searchForm: FormGroup;
  scannerOpened = false;
  @Output() onSearchEvent = new EventEmitter<string>();

  constructor(
    private zone: NgZone,
    private codeScannerService: CodeScannerService,
    private authService: AuthService) {}

  ngOnInit() {
    console.log("here")
    this.searchForm = new FormGroup({
      searchTerm: new FormControl("")
    });

    this.codeScannerService.getCodeScannerUpdateListener()
      .subscribe(code => {
        this.searchForm.get('searchTerm').setValue(code);
      });
  }

  onFuzzySearch(searchTerm: string) {
    // this.currentTrackingType = this.trackingService.getTrackingTypeFromString(searchTerm);
    // this.resetPaginator();
    // this.searchTerm = searchTerm;
    // if (!searchTerm || !this.currentTrackingType) {
    //   this.showingResults = false;
    //   this.trackingsSubject.next({trackings:[], count: 0});
    //   return;
    // }
    // this.fetchTrackings(this.pageData? this.pageData?.pageSize : TrackingGlobals.defaultPageSizes[0], this.pageData? this.pageData.pageIndex + 1: 0 , this.currentTrackingType);
    // this.showingResults = true;
  }
}
