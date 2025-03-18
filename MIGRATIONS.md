# Database Migration Guide

This document explains how to apply database changes and deploy SQL functions to your Supabase project.

## Prerequisites

1. Make sure you have the Supabase CLI installed as a dev dependency:
   ```
   npm install --save-dev @supabase/cli
   ```

2. Log in to Supabase CLI:
   ```
   npx supabase login
   ```

3. Link your local project to your Supabase project:
   ```
   npx supabase link --project-ref your-project-ref
   ```
   Replace `your-project-ref` with your Supabase project reference ID.

## Available Commands

The following commands are available in `package.json`:

### `npm run db:migrate`

This command applies the database schema changes defined in `supabase/migrations/` to your Supabase project. It creates or updates tables, indexes, and policies.

```
npm run db:migrate
```

### `npm run db:functions`

This command deploys SQL functions defined in `lib/check-in-functions.sql` to your Supabase project. These functions are used for check-in related operations.

```
npm run db:functions
```

### `npm run db:deploy`

This is a convenience command that runs both `db:migrate` and `db:functions` in sequence, ensuring that your database schema and functions are all up to date.

```
npm run db:deploy
```

## Database Schema

The current schema includes the following tables related to check-ins:

- `check_ins`: Stores team member check-in data
  - `id`: UUID primary key
  - `team_id`: References teams table
  - `user_id`: References users table
  - `check_in_date`: Date of check-in
  - `checked_in_at`: Timestamp when check-in occurred
  - `notes`: Optional notes for the check-in

## SQL Functions

The check-in system includes these functions:

1. `get_daily_check_in_counts`: Returns the number of check-ins for each day in a given time period
2. `is_user_checked_in`: Checks if a user is checked in for a specific date

## Adding New Migrations

To add new database changes:

1. Create a new migration file in `supabase/migrations/` with a timestamp prefix
2. Run `npm run db:migrate` to apply the changes

For functions, you can:
- Add or update functions in the `lib/check-in-functions.sql` file
- Run `npm run db:functions` to deploy them

## How It Works

- The `db:migrate` command uses the Supabase CLI to push migrations
- The `db:functions` command uses a Node.js script that:
  1. Reads the SQL file content
  2. Creates a temporary file 
  3. Runs the Supabase CLI to apply it
  4. Cleans up the temporary file

## Troubleshooting

If you encounter issues with migrations:

1. Check the console output for specific error messages
2. Verify that you've successfully logged in with `npx supabase login`
3. Make sure your project is linked correctly with `npx supabase link`
4. For development, you may need to reset your local database with `npx supabase db reset`
5. For production issues, check the Supabase dashboard for database logs 