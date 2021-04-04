import * as moment from "moment";

export class GlobalConstants {
  constructor() {

  }
  // Alert Service
  public static flashMessageOptions = {
      timeOut: 10000,
      closeButton: true,
      enableHtml: true,
      progressBar: true,
      tapToDismiss: false
    };

  public static formatDateTime(date: Date) {
    let storedLanguage = localStorage.getItem("language");
    return moment(moment.utc(date).toDate()).locale(storedLanguage? storedLanguage : "en").fromNow()   ; //.local().format("MM-DD-YY hh:mm:ss")
  }

  public static now() {
    let storedLanguage = localStorage.getItem("language");
    return moment().locale(storedLanguage? storedLanguage : "en").format("LLLL");
  }
}
