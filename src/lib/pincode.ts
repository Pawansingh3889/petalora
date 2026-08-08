/**
 * Maps an Indian PIN code to a state, using the postal circle prefixes.
 *
 * This is an approximation. The first two digits identify a postal circle
 * cleanly for most of the country, but several circles straddle two states
 * (UP/Uttarakhand, Bihar/Jharkhand, Maharashtra/Goa, WB/Sikkim, Kerala/
 * Lakshadweep), so those are overridden on the three-digit prefix.
 *
 * The result is used for two things: pre-filling the state field, and picking
 * a shipping zone. The customer can always override the state, and the zone
 * only ever moves the shipping fee between three published tiers, so a wrong
 * guess is visible and correctable rather than silent.
 */

export type StateInfo = { state: string; zone: ShippingZone };

export type ShippingZone =
  /** Delhi NCR, same-city courier rates. */
  | "NCR"
  /** Mainland India on a standard surface network. */
  | "NATIONAL"
  /** Northeast, J&K, Ladakh, Himachal hills, island territories. */
  | "REMOTE";

// Three-digit prefixes take priority over the two-digit table below.
const THREE_DIGIT: Record<string, StateInfo> = {
  // Chandigarh sits inside the Punjab circle.
  "160": { state: "Chandigarh", zone: "NATIONAL" },
  "140": { state: "Punjab", zone: "NATIONAL" },
  // Ladakh split out of the J&K circle.
  "194": { state: "Ladakh", zone: "REMOTE" },
  // Uttarakhand inside the UP circle.
  "246": { state: "Uttarakhand", zone: "NATIONAL" },
  "248": { state: "Uttarakhand", zone: "NATIONAL" },
  "249": { state: "Uttarakhand", zone: "NATIONAL" },
  "262": { state: "Uttar Pradesh", zone: "NATIONAL" },
  "263": { state: "Uttarakhand", zone: "NATIONAL" },
  // Goa inside the Maharashtra circle.
  "403": { state: "Goa", zone: "NATIONAL" },
  // Dadra & Nagar Haveli and Daman & Diu inside the Gujarat circle.
  "396": { state: "Dadra & Nagar Haveli and Daman & Diu", zone: "NATIONAL" },
  // Puducherry inside the Tamil Nadu circle.
  "605": { state: "Puducherry", zone: "NATIONAL" },
  "533": { state: "Andhra Pradesh", zone: "NATIONAL" },
  // Telangana districts that kept 50x/508/509.
  "508": { state: "Telangana", zone: "NATIONAL" },
  "509": { state: "Telangana", zone: "NATIONAL" },
  // Sikkim inside the West Bengal circle.
  "737": { state: "Sikkim", zone: "REMOTE" },
  // Andaman & Nicobar inside the WB circle.
  "744": { state: "Andaman & Nicobar Islands", zone: "REMOTE" },
  // Lakshadweep inside the Kerala circle.
  "682": { state: "Kerala", zone: "NATIONAL" },
  // Jharkhand districts inside the Bihar circle.
  "813": { state: "Jharkhand", zone: "NATIONAL" },
  "814": { state: "Jharkhand", zone: "NATIONAL" },
  "815": { state: "Jharkhand", zone: "NATIONAL" },
  "825": { state: "Jharkhand", zone: "NATIONAL" },
  "826": { state: "Jharkhand", zone: "NATIONAL" },
  "827": { state: "Jharkhand", zone: "NATIONAL" },
  "828": { state: "Jharkhand", zone: "NATIONAL" },
  "829": { state: "Jharkhand", zone: "NATIONAL" },
  "831": { state: "Jharkhand", zone: "NATIONAL" },
  "832": { state: "Jharkhand", zone: "NATIONAL" },
  "833": { state: "Jharkhand", zone: "NATIONAL" },
  "834": { state: "Jharkhand", zone: "NATIONAL" },
  "835": { state: "Jharkhand", zone: "NATIONAL" },
  // Arunachal, Nagaland, Manipur, Mizoram, Tripura share the 79x block.
  "790": { state: "Arunachal Pradesh", zone: "REMOTE" },
  "791": { state: "Arunachal Pradesh", zone: "REMOTE" },
  "792": { state: "Arunachal Pradesh", zone: "REMOTE" },
  "793": { state: "Meghalaya", zone: "REMOTE" },
  "794": { state: "Meghalaya", zone: "REMOTE" },
  "795": { state: "Manipur", zone: "REMOTE" },
  "796": { state: "Mizoram", zone: "REMOTE" },
  "797": { state: "Nagaland", zone: "REMOTE" },
  "798": { state: "Nagaland", zone: "REMOTE" },
  "799": { state: "Tripura", zone: "REMOTE" },
};

const TWO_DIGIT: Record<string, StateInfo> = {
  "11": { state: "Delhi", zone: "NCR" },
  "12": { state: "Haryana", zone: "NCR" },
  "13": { state: "Haryana", zone: "NATIONAL" },
  "14": { state: "Punjab", zone: "NATIONAL" },
  "15": { state: "Punjab", zone: "NATIONAL" },
  "16": { state: "Punjab", zone: "NATIONAL" },
  "17": { state: "Himachal Pradesh", zone: "REMOTE" },
  "18": { state: "Jammu & Kashmir", zone: "REMOTE" },
  "19": { state: "Jammu & Kashmir", zone: "REMOTE" },
  "20": { state: "Uttar Pradesh", zone: "NCR" },
  "21": { state: "Uttar Pradesh", zone: "NATIONAL" },
  "22": { state: "Uttar Pradesh", zone: "NATIONAL" },
  "23": { state: "Uttar Pradesh", zone: "NATIONAL" },
  "24": { state: "Uttar Pradesh", zone: "NATIONAL" },
  "25": { state: "Uttar Pradesh", zone: "NATIONAL" },
  "26": { state: "Uttar Pradesh", zone: "NATIONAL" },
  "27": { state: "Uttar Pradesh", zone: "NATIONAL" },
  "28": { state: "Uttar Pradesh", zone: "NATIONAL" },
  "30": { state: "Rajasthan", zone: "NATIONAL" },
  "31": { state: "Rajasthan", zone: "NATIONAL" },
  "32": { state: "Rajasthan", zone: "NATIONAL" },
  "33": { state: "Rajasthan", zone: "NATIONAL" },
  "34": { state: "Rajasthan", zone: "NATIONAL" },
  "36": { state: "Gujarat", zone: "NATIONAL" },
  "37": { state: "Gujarat", zone: "NATIONAL" },
  "38": { state: "Gujarat", zone: "NATIONAL" },
  "39": { state: "Gujarat", zone: "NATIONAL" },
  "40": { state: "Maharashtra", zone: "NATIONAL" },
  "41": { state: "Maharashtra", zone: "NATIONAL" },
  "42": { state: "Maharashtra", zone: "NATIONAL" },
  "43": { state: "Maharashtra", zone: "NATIONAL" },
  "44": { state: "Maharashtra", zone: "NATIONAL" },
  "45": { state: "Madhya Pradesh", zone: "NATIONAL" },
  "46": { state: "Madhya Pradesh", zone: "NATIONAL" },
  "47": { state: "Madhya Pradesh", zone: "NATIONAL" },
  "48": { state: "Madhya Pradesh", zone: "NATIONAL" },
  "49": { state: "Chhattisgarh", zone: "NATIONAL" },
  "50": { state: "Telangana", zone: "NATIONAL" },
  "51": { state: "Andhra Pradesh", zone: "NATIONAL" },
  "52": { state: "Andhra Pradesh", zone: "NATIONAL" },
  "53": { state: "Andhra Pradesh", zone: "NATIONAL" },
  "56": { state: "Karnataka", zone: "NATIONAL" },
  "57": { state: "Karnataka", zone: "NATIONAL" },
  "58": { state: "Karnataka", zone: "NATIONAL" },
  "59": { state: "Karnataka", zone: "NATIONAL" },
  "60": { state: "Tamil Nadu", zone: "NATIONAL" },
  "61": { state: "Tamil Nadu", zone: "NATIONAL" },
  "62": { state: "Tamil Nadu", zone: "NATIONAL" },
  "63": { state: "Tamil Nadu", zone: "NATIONAL" },
  "64": { state: "Tamil Nadu", zone: "NATIONAL" },
  "67": { state: "Kerala", zone: "NATIONAL" },
  "68": { state: "Kerala", zone: "NATIONAL" },
  "69": { state: "Kerala", zone: "NATIONAL" },
  "70": { state: "West Bengal", zone: "NATIONAL" },
  "71": { state: "West Bengal", zone: "NATIONAL" },
  "72": { state: "West Bengal", zone: "NATIONAL" },
  "73": { state: "West Bengal", zone: "NATIONAL" },
  "74": { state: "West Bengal", zone: "NATIONAL" },
  "75": { state: "Odisha", zone: "NATIONAL" },
  "76": { state: "Odisha", zone: "NATIONAL" },
  "77": { state: "Odisha", zone: "NATIONAL" },
  "78": { state: "Assam", zone: "REMOTE" },
  "79": { state: "Arunachal Pradesh", zone: "REMOTE" },
  "80": { state: "Bihar", zone: "NATIONAL" },
  "81": { state: "Bihar", zone: "NATIONAL" },
  "82": { state: "Bihar", zone: "NATIONAL" },
  "83": { state: "Jharkhand", zone: "NATIONAL" },
  "84": { state: "Bihar", zone: "NATIONAL" },
  "85": { state: "Bihar", zone: "NATIONAL" },
};

/** The full list, for the state dropdown on the address form. */
export const INDIAN_STATES = [
  "Andaman & Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export function isValidPincode(pincode: string): boolean {
  // Six digits, and the first cannot be 0: no Indian PIN starts with zero.
  return /^[1-9][0-9]{5}$/.test(pincode);
}

export function lookupPincode(pincode: string): StateInfo | undefined {
  if (!isValidPincode(pincode)) return undefined;
  return THREE_DIGIT[pincode.slice(0, 3)] ?? TWO_DIGIT[pincode.slice(0, 2)];
}

/**
 * Zone for a delivery. Falls back to NATIONAL for prefixes we do not have in
 * the table, which is the middle rate: never the cheapest, so an unmapped PIN
 * cannot be used to underpay for a remote delivery.
 */
export function zoneForPincode(pincode: string): ShippingZone {
  return lookupPincode(pincode)?.zone ?? "NATIONAL";
}
