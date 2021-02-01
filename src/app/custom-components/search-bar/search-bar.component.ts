import { Component, EventEmitter, OnInit, Output, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";


@Component({
  selector: 'search-bar',
  templateUrl: 'search-bar.component.html',
  styleUrls: ['search-bar.component.css']
})
export class SearchBarComponent implements OnInit {

  searchForm: FormGroup;
  scannerOpened = false;
  @Output() onSearchEvent = new EventEmitter<string>();


  ngOnInit() {
    this.searchForm = new FormGroup({
      searchTerm: new FormControl("")
    })
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
}
