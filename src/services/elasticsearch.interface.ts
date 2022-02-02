import { Customer } from "../models/customer.model";
import { PaginatedSearch } from "../models/search.model";

export interface OpenSearchService {
  search(paginatedSearch:PaginatedSearch): Promise<Array<Customer>>
  processRecord(customer: Customer, action: string): Promise<void>
  list(): Promise<Array<Customer>>
}