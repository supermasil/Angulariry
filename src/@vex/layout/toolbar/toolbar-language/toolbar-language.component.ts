import { Component, OnInit } from '@angular/core';
import emojioneUS from '@iconify/icons-emojione/flag-for-flag-united-states';
import emojioneVN from '@iconify/icons-emojione/flag-for-vietnam';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'toolbar-language',
  templateUrl: './toolbar-language.component.html',
  styleUrls: []
})
export class ToolbarLanguageComponent implements OnInit {
  emojioneUS = emojioneUS;
  emojioneVN = emojioneVN;
	localStorage = localStorage;

  constructor(private translateService: TranslateService) {}

  ngOnInit() {}

  languageChange(language: string) {
    this.translateService.setDefaultLang(language);
    this.translateService.use(language);
    localStorage.setItem("weshippee_language", language);
  } 
}