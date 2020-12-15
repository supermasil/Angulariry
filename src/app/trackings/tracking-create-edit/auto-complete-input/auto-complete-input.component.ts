import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from "@angular/forms";
import { MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";
import { Observable, of, Subject } from "rxjs";


@Component({
  selector: 'auto-complete-input',
  templateUrl: './auto-complete-input.component.html',
  styleUrls: ['./auto-complete-input.component.css', '../tracking-create.component.css']
})
export class AutoCompleteInput implements OnInit {

  @Input() data: string[] = [];
  @Input() matLabel = "";
  @Input() matErrorMessage = "";

  filteredData: Observable<string[]>;
  private selectedValueListener = new Subject<string>();
  inputCtrl = new FormControl();

  autoCompleteForm: FormGroup;
  @ViewChild('submitButton') submitButton: ElementRef<HTMLInputElement>;

  ngOnInit(): void {
    this.autoCompleteForm = new FormGroup({
      item: new FormControl(null, {validators:[this.companyCodeValidator()]})
    });
    this.resetFilteredData();
  }

  companyCodeValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (control && control.value && this.data.includes(control.value)) {
        return null;
      }

      return {wrongCompanyCode: control.value};
    };
  }

  getSelectedValueListener() {
    return this.selectedValueListener.asObservable();
  }

  setData(data: string[]) {
    if (!data) return;
    this.data = data;
    this.resetFilteredData();
  }

  filterItems(value: string) {
    const filterValue = value.toLowerCase();
    this.filteredData =  of(this.data.filter(option => option.toLowerCase().includes(filterValue)));
  }

  selectItem(event: MatAutocompleteSelectedEvent): void {
    this.selectedValueListener.next(event.option.viewValue);
    this.resetFilteredData(); // Reset the list
  }

  resetFilteredData() {
    this.filteredData = of(this.data);
  }

  triggerValidation() {
    this.submitButton.nativeElement.click();
    return this.autoCompleteForm.valid;
  }
}
