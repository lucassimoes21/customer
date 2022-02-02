export class Customer {
  static prefix = 'CUSTOMER';
  public email: string;
  public password: string;
  public age: number;

  constructor(email: string, password: string, age: number) {
    this.email = email
    this.password = password
    this.age = age
  }

  public static fromJson(json: any): Customer {
    return new Customer(json.email, json.password, json.age)
  }

  public isAnyFieldEmpty(): boolean {
    return this.email === undefined || this.password === undefined || this.age === undefined
  }

  public toResponse() {
    return new Customer(this.email, undefined, this.age)
  }
  public getKey(): string {
    return `${Customer.prefix}#${this.email}`
  }

}