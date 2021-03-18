import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Observable } from "rxjs";


@Component({
  selector: 'notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.css']
})
export class NotesComponent implements OnInit, OnDestroy {
  @Input() defaultContentObservable = new Observable<string>();
  @Output() contentChanged = new EventEmitter();
  notesForm: FormGroup;

  constructor() {}

  ngOnInit() {
    this.notesForm = new FormGroup({
      content: new FormControl(""),
    });

    this.defaultContentObservable.subscribe((content: string) => {
      this.notesForm.get("content").setValue(content);
    });
  }

  ngOnDestroy() {
  }

  contentEmit(content: string) {
    this.contentChanged.emit(this.notesForm.get("content").value);
  }
}
