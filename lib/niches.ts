import { NicheInfo } from "@/types";

export const NICHES: NicheInfo[] = [
  {
    id: "restaurant",
    label: "Restaurant / Food Business",
    description:
      "Generate food safety SOPs, cleaning checklists, allergen policies, temperature logs, and staff hygiene documentation.",
    icon: "🍽️",
    color: "from-orange-500 to-amber-500",
    accent: "orange",
    documents: [
      "Binder Cover + Index + Revision History",
      "Cleaning SOP + Daily Checklist",
      "Food Storage & Temperature Log Sheet",
      "Allergen Handling 1-page SOP",
      "Incident/Complaint Report Form",
      "Staff Hygiene SOP + Training Sign-off Sheet",
      "Pest Control Record Sheet",
    ],
  },
  {
    id: "daycare",
    label: "Daycare / Childcare Centre",
    description:
      "Create child safety SOPs, daily cleaning checklists, incident reports, pickup authorization forms, and staff training sign-offs.",
    icon: "🧒",
    color: "from-sky-500 to-indigo-500",
    accent: "sky",
    documents: [
      "Binder Cover + Index + Revision History",
      "Child Safety SOP",
      "Daily Cleaning Checklist",
      "Incident Report Form",
      "Pickup Authorization Form",
      "Visitor Log Sheet",
      "Staff Training Sign-off",
      "Emergency Drill Checklist",
    ],
  },
  {
    id: "clinic",
    label: "Clinic / Dental / Physio",
    description:
      "Produce patient safety protocols, infection control checklists, consent forms, equipment sterilisation logs, and staff compliance records.",
    icon: "🏥",
    color: "from-teal-500 to-emerald-500",
    accent: "teal",
    documents: [
      "Binder Cover + Index + Revision History",
      "Infection Control & Sterilisation SOP",
      "Patient Safety Checklist",
      "Consent Form Template",
      "Equipment Maintenance Log",
      "Staff Compliance Sign-off",
      "Incident & Near-Miss Report Form",
      "Waste Disposal Protocol",
    ],
  },
];

export function getNicheById(id: string): NicheInfo | undefined {
  return NICHES.find((n) => n.id === id);
}
