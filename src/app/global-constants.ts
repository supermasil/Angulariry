import * as moment from "moment";
import { GeneralMethods } from "./shared/general-methods";

export class GlobalConstants {
  constructor() {

  }
  // Toastr Service
  public static flashMessageOptions = {
    timeOut: 10000,
    closeButton: true,
    enableHtml: true,
    progressBar: true,
    tapToDismiss: false
  };

  public static defaultPageSizes = [5, 20, 50, 100];

  public static formatDateTime(date: Date) {
    let storedLanguage = localStorage.getItem("language");
    return moment(date).locale(storedLanguage? storedLanguage : "en").local(); //.local().format("MM-DD-YY hh:mm:ss")
  }

  public static now() {
    let storedLanguage = localStorage.getItem("language");
    return GeneralMethods.capitalizeFirstLetter(moment().locale(storedLanguage? storedLanguage : "en").format("LLLL"));
  }
}
