export class GeneralMethods {
  // Methods in html will be invoked every time there's change detected
  public static capitalizeFirstLetter(text) {
    if (!text) {
      return text
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
