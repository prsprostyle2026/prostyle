// Public contact details, shown in the footer and the "Contact us" section of the home page.
export const CONTACT_EMAIL = "prsprostylesportswear@gmail.com";

// 10-digit Indian mobile numbers.
export const CONTACT_PHONES = ["8919305409", "9901427375", "8123277797"];

// "89193 05409" for display, "tel:+918919305409" for links.
export const displayPhone = (n: string) => `${n.slice(0, 5)} ${n.slice(5)}`;
export const telHref = (n: string) => `tel:+91${n}`;
