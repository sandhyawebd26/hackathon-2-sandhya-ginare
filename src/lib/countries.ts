export const COUNTRIES: { code: string; name: string; currency: string }[] = [
  { code: "AU", name: "Australia", currency: "AUD" },
  { code: "AT", name: "Austria", currency: "EUR" },
  { code: "BE", name: "Belgium", currency: "EUR" },
  { code: "BR", name: "Brazil", currency: "BRL" },
  { code: "CA", name: "Canada", currency: "CAD" },
  { code: "DK", name: "Denmark", currency: "DKK" },
  { code: "FI", name: "Finland", currency: "EUR" },
  { code: "FR", name: "France", currency: "EUR" },
  { code: "DE", name: "Germany", currency: "EUR" },
  { code: "GR", name: "Greece", currency: "EUR" },
  { code: "IN", name: "India", currency: "INR" },
  { code: "IE", name: "Ireland", currency: "EUR" },
  { code: "IT", name: "Italy", currency: "EUR" },
  { code: "JP", name: "Japan", currency: "JPY" },
  { code: "MX", name: "Mexico", currency: "MXN" },
  { code: "NL", name: "Netherlands", currency: "EUR" },
  { code: "NZ", name: "New Zealand", currency: "NZD" },
  { code: "NO", name: "Norway", currency: "NOK" },
  { code: "PL", name: "Poland", currency: "PLN" },
  { code: "PT", name: "Portugal", currency: "EUR" },
  { code: "SG", name: "Singapore", currency: "SGD" },
  { code: "ZA", name: "South Africa", currency: "ZAR" },
  { code: "ES", name: "Spain", currency: "EUR" },
  { code: "SE", name: "Sweden", currency: "SEK" },
  { code: "CH", name: "Switzerland", currency: "CHF" },
  { code: "AE", name: "United Arab Emirates", currency: "AED" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "US", name: "United States", currency: "USD" },
];

export function countryByCode(code: string) {
  return COUNTRIES.find((country) => country.code === code) ?? null;
}
