import { Component, EventEmitter, Input, NgZone, OnInit, Output } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { fadeInUp400ms } from "src/@vex/animations/fade-in-up.animation";
import { stagger40ms } from "src/@vex/animations/stagger.animation";
import { AuthGlobals } from "src/app/auth/auth-globals";
import { AuthService } from "src/app/auth/auth.service";
import { CodeScannerService } from "../code-scanner/code-scanner.service";
import icSearch from '@iconify/icons-ic/twotone-search';


@Component({
  selector: 'search-bar',
  templateUrl: 'search-bar.component.html',
  styleUrls: ['search-bar.component.css'],
  animations: [
    fadeInUp400ms
  ]
})
export class SearchBarComponent implements OnInit {

  searchForm: FormGroup;
  scannerOpened = false;
  @Output() onSearchEvent = new EventEmitter<string>();
  @Input() description = "Search here";

  icSearch = icSearch;

  constructor(
    private zone: NgZone,
    private codeScannerService: CodeScannerService,
    private authService: AuthService) {}

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

  isCustomer() {
    return this.authService.getMongoDbUser()?.role === AuthGlobals.roles.Customer;
  }
}
