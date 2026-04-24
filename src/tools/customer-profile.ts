import { Customer } from "../types";
import { loadData } from "./data-loader";

/**
 * Retrieve a customer's profile by customer ID.
 * Returns the profile with sensitive fields redacted — only the city
 * from the address is included (not the full address).
 */
export function getCustomerProfile(customerId: string): object {
  let customers: Customer[];
  try {
    customers = loadData<Customer[]>("customers.json");
  } catch {
    return { error: "Customer database is currently unavailable." };
  }

  const customer = customers.find((c) => c.customer_id === customerId);

  if (!customer) {
    return {
      error: `No customer found with ID '${customerId}'. Please verify the customer ID and try again.`,
    };
  }

  // Return a sanitised profile — exclude full address, keep only city
  return {
    customer_id: customer.customer_id,
    first_name: customer.first_name,
    last_name: customer.last_name,
    email: customer.email,
    phone: customer.phone,
    city: customer.address?.city ?? "Unknown",
    policy_number: customer.policy_number,
    policy_type: customer.policy_type,
    policy_start_date: customer.policy_start_date,
    policy_renewal_date: customer.policy_renewal_date,
    premium_monthly: customer.premium_monthly,
    status: customer.status,
    member_since: customer.created_at,
  };
}
