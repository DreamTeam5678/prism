type UserProfileInput = {
  currentMode: string[];
  idealSelf: string[];
  blockers: string[];
  dislikes: string[];
};

export function mapTags(profile: UserProfileInput): string[] {
  const tags: string[] = [];

  // === Role ===
  if (profile.currentMode.includes("student")) tags.push("student");
  if (profile.currentMode.includes("professional")) tags.push("professional");
  if (profile.currentMode.includes("everyday")) tags.push("everyday_mode");
  
  // === Planning Style ===
  /*
   if (profile.planningStyle.includes("frontloader")) tags.push("plan_ahead");
   if (profile.planningStyle.includes("reactive")) tags.push("reactive_planner");
   if (profile.planningStyle.includes("not_all")) tags.push("not_a_planner");
   if (profile.planningStyle.includes("just_tasks")) tags.push("task_focused");
   */

  // === Aspirations ===
  if (profile.idealSelf.includes("disciplined_structured")) tags.push("structured_planner");
  if (profile.idealSelf.includes("calm_balanced")) tags.push("calm_builder");
  if (profile.idealSelf.includes("productive_no_burnout")) tags.push("balance_seeker");
  if (profile.idealSelf.includes("creative_fulfilled")) tags.push("creative_achiever");
  if (profile.idealSelf.includes("mentally_clear")) tags.push("intentional_living");
  if (profile.idealSelf.includes("flexible_consistent")) tags.push("flexible_living");
  if (profile.idealSelf.includes("energetic_inspired")) tags.push("inspired_achiever");
  if (profile.idealSelf.includes("focused_driven")) tags.push("health_conscious");

  // === Blockers ===
  if (profile.blockers.includes("burnt_out")) tags.push("burnout_prone");
  if (profile.blockers.includes("overwhelmed")) tags.push("overwhelm_prone");
  if (profile.blockers.includes("lose_motivation")) tags.push("motivation_challenged");
  if (profile.blockers.includes("start_strong_fall_off")) tags.push("followthrough_risk");
  if (profile.blockers.includes("get_distracted")) tags.push("distractible");
  if (profile.blockers.includes("guilty_unproductive")) tags.push("guilt_prone");
  if (profile.blockers.includes("dont_know_start")) tags.push("needs_structure");
  if (profile.blockers.includes("rigid_routines")) tags.push("routine_struggler");
  if (profile.blockers.includes("distracted_much")) tags.push("easily_distracted");
  if (profile.blockers.includes("forget_important")) tags.push("forgetful");
  
  // === Dislikes ===
  if (profile.dislikes.includes("journaling")) tags.push("dislike_journaling");
  if (profile.dislikes.includes("waking_early")) tags.push("not_morning_person");
  if (profile.dislikes.includes("strict_routines")) tags.push("dislike_routines");
  if (profile.dislikes.includes("long_focus")) tags.push("prefers_short_sessions");
  if (profile.dislikes.includes("talking_people")) tags.push("low_social_battery");
  if (profile.dislikes.includes("meditation")) tags.push("dislike_meditation");
  if (profile.dislikes.includes("intense-workouts")) tags.push("dislike_intense_workouts");
  if (profile.dislikes.includes("screen_time")) tags.push("dislike_screen_time");
  if (profile.dislikes.includes("overly_scheduled")) tags.push("dislike_over_scheduling");
  if (profile.dislikes.includes("cooking")) tags.push("dislike_cooking");
  if (profile.dislikes.includes("being_outside")) tags.push("indoor_preferrer");
  // === Environment ===
  /*
  if (profile.environment.includes("urban_city")) tags.push("urban_noise_sensitive");
  if (profile.environment.includes("college_campus")) tags.push("campus_lifestyle");

  // === Climate ===
  if (profile.climate.includes("very_cold")) tags.push("climate_cold");
  if (profile.climate.includes("very_hot")) tags.push("climate_hot");
  if (profile.climate.includes("changes_lot")) tags.push("climate_variable");
  */
  return tags;
}
