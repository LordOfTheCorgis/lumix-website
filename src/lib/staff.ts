// Who runs Lumix. Names, titles and portraits came over from main's
// src/data/site.ts. The old bios were "resilient, high-performance
// infrastructure" filler, so these are rewritten plainer; Evan should read
// both before launch since they're said in his and Keaghan's names.
//
// main also had two sysadmins (David Z., Zachary C.) commented out, and a
// "Teams" grid claiming 24/7 engineering, support, security and ops teams.
// Neither came across. Don't list a team that nobody can name.
import type { ImageMetadata } from "astro";
import evan from "../assets/staff/evan.png";
import keaghan from "../assets/staff/keaghan.png";

export interface StaffMember {
  name: string;
  title: string;
  photo: ImageMetadata;
  bio: string;
}

export const staff: StaffMember[] = [
  {
    name: "Evan V.",
    title: "Chief Executive Officer",
    photo: evan,
    bio: "Runs the company. Which games go on the shelf, what they cost, who we partner with, and this site.",
  },
  {
    name: "Keaghan G.",
    title: "Chief Operating Officer",
    photo: keaghan,
    bio: "Runs operations. Planning, the day-to-day, and keeping everyone pointed the same way.",
  },
];
