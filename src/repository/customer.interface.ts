import { Customer } from "../models/customer.model";

export interface CustomerRepository {
  get(email: string): Promise<Customer>
  delete(email: string): Promise<void>
  update(customer: Customer): Promise<void>
  create(customer: Customer): Promise<void>
}