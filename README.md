

## New in this release - Multi-Family

ForTe Fam is now multi-family. Any family can create their own account with all the same amenities - chats, events, goals, diagnostics, Life Hacks, Prayer Journal, Notepads, and the MaD marketplace - fully isolated from every other family.

- Create a family: the family gate offers "Create a new family." A 3-step wizard collects the Family name, the admin's username + password, and the family's Mission, Values, and Goals. Those three propagate to every member account and show in the vision panels across the app.
- Admin adds up to 7 members: Settings > "Manage family members." Each member gets their own username + password/PIN. The admin can reset a PIN or remove a member.
- Data isolation & headroom: each family's data lives in its own set of tabs in the Google Sheet (namespaced by familyId), so families never see each other's data and each gets a generous slice of the spreadsheet's capacity. All records map to the team21online Apps Script account.
- General Admin dashboard (inno only): Settings > "General Admin - all families" shows every family created, with their mission/values/goals, member counts, and activity. Visible only to inno on the Forteh family.
- The original Forteh family keeps all its existing data (migrated automatically) and inno remains both its admin and the global super-admin.
- Every page still shows: ForTe Fam (c) Innocent Forteh - Created for Families. A Distraction-Free Zone.

Deploy: paste the new Code.gs, then Deploy > Manage deployments > Edit > New version (keeps the same /exec URL). Per-family tabs are created automatically as families sign up. Replace index.html on your host.

