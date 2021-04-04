import { Component, Input } from "@angular/core";
import { GlobalConstants } from "src/app/global-constants";
import { OrganizationModel } from "src/app/models/organization.model";
import { RecipientModel } from "src/app/models/recipient.model";
import { UserModel } from "src/app/models/user.model";

@Component({
  selector: 'general-info-print',
  templateUrl: './general-info-print.component.html',
  styleUrls: ['./printing-forms.component.css'],
})
export class GeneralInfoPrintComponent {
  @Input() currentOrg: OrganizationModel;
  @Input() trackingNumber: string;
  @Input() sender: UserModel;
  @Input() recipient: RecipientModel;

  globalConstants = GlobalConstants;
}
