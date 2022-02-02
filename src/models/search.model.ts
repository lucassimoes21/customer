export class PaginatedSearch {
  public text?: string;
  public from: number;
  public size: number;


  constructor(text?: string, from: number = 0, size: number = 20) {
    this.text = text
    this.from = from
    this.size = size
  }

  public static fromJson(json: any): PaginatedSearch {
    return new PaginatedSearch(json.text, json.from, json.size)
  }
}