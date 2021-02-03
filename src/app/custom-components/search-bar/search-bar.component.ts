import { Component, EventEmitter, NgZone, OnInit, Output } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { CodeScannerService } from "../code-scanner/code-scanner.service";


@Component({
  selector: 'search-bar',
  templateUrl: 'search-bar.component.html',
  styleUrls: ['search-bar.component.css']
})
export class SearchBarComponent implements OnInit {

  searchForm: FormGroup;
  scannerOpened = false;
  @Output() onSearchEvent = new EventEmitter<string>();

  constructor(
    private zone: NgZone,
    private codeScannerService: CodeScannerService) {}

  ngOnInit() {
    this.searchForm = new FormGroup({
      searchTerm: new FormControl("")
    });

    this.codeScannerService.getCodeScannerUpdateListener()
      .subscribe(code => {
        this.searchForm.get('searchTerm').setValue(code);
      });
  }

  onSearch() {
    // if (!this.searchForm.get('searchTerm').value) {
    //   return;
    // }
    this.onSearchEvent.emit(this.searchForm.get('searchTerm').value);
  }

  clearContent() {
    this.onSearchEvent.emit("");
    this.searchForm.reset();
  }

  openScanner() {
    this.zone.run(() => {
      this.scannerOpened = !this.scannerOpened;
    })
  }
}
