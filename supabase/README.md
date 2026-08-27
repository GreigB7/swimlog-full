# Supabase Security

Apply migrations from `supabase/migrations` to the production Supabase project after reviewing them against the live schema.

The app expects these table ownership rules:

- Swimmers can read and write only their own training, resting heart rate, body metrics, and yearly goals.
- Coaches can read swimmer logs, body metrics, goals, and technique plans.
- Coaches can create and update technique plans.
- Swimmers can update their own profile, but cannot change their own role.
- Anonymous users cannot read private tables.

Keep any future database policy changes in this folder so security can be reviewed alongside code.
