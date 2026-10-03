import type { CourseSeed } from "../types";
import { bibleInAYear } from "./bible-in-a-year";
import { foundationsOfFaith } from "./foundations";
import { kidsVolunteerTraining } from "./kids-volunteers";
import { christCenteredMarriage } from "./marriage";
import { membershipClass } from "./membership";
import { prayerThatShapesUs } from "./prayer";
import { walkingThroughRomans } from "./romans";
import { sermonOnTheMount } from "./sermon-on-the-mount";
import { servantLeadership } from "./servant-leadership";
import { leadingASmallGroup } from "./small-groups";
import { spiritualGiftsDraft } from "./spiritual-gifts";
import { faithThatHolds } from "./youth";

export { categories } from "./categories";
export { people } from "./people";

export const courses: CourseSeed[] = [
  foundationsOfFaith,
  walkingThroughRomans,
  sermonOnTheMount,
  prayerThatShapesUs,
  servantLeadership,
  christCenteredMarriage,
  membershipClass,
  kidsVolunteerTraining,
  faithThatHolds,
  bibleInAYear,
  leadingASmallGroup,
  spiritualGiftsDraft,
];
