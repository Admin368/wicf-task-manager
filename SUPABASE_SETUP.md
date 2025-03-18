# Supabase CLI Setup for Windows

This guide will help you set up the Supabase CLI on Windows to work with the project's migration commands.

## Installation Options

### Option 1: Direct Installation (Recommended)

1. **Download the Supabase CLI**:
   - Go to [Supabase CLI Releases](https://github.com/supabase/cli/releases)
   - Download the latest Windows executable (e.g., `supabase_Windows_x86_64.exe`)
   - Rename it to `supabase.exe`

2. **Add to PATH**:
   - Create a folder for the CLI (e.g., `C:\Tools\Supabase`)
   - Move the `supabase.exe` file to this folder
   - Add this folder to your PATH:
     - Search for "Environment Variables" in Windows search
     - Click "Edit the system environment variables"
     - Click "Environment Variables"
     - Under "System variables" or "User variables", find "Path" and click "Edit"
     - Click "New" and add your folder path (e.g., `C:\Tools\Supabase`)
     - Click "OK" on all dialogs

3. **Verify Installation**:
   - Open a new Command Prompt or PowerShell window
   - Run `supabase --version`
   - If it shows the version number, the CLI is installed correctly

### Option 2: Using Scoop (Windows Package Manager)

If you have [Scoop](https://scoop.sh/) installed:

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Option 3: Using the Windows PowerShell Installer

Run this in PowerShell with administrator privileges:

```powershell
iwr -useb https://windows.supabase.com/install.ps1 | iex
```

## Linking Your Project

After installing the CLI, you need to link your local project to your Supabase project:

1. **Login to Supabase**:
   ```
   supabase login
   ```
   This will open a browser window to complete the login process.

2. **Initialize Supabase** (if not already done):
   ```
   supabase init
   ```

3. **Link your project**:
   ```
   supabase link --project-ref your-project-ref
   ```
   Replace `your-project-ref` with your Supabase project reference ID, which you can find in your Supabase dashboard URL.

## Using the Migration Commands

The project has several commands set up in package.json:

```
pnpm run db:migrate  # Apply database schema changes
pnpm run db:functions  # Deploy SQL functions
pnpm run db:deploy  # Run both commands above
```

## Troubleshooting

1. **Command not found**:
   - Make sure the Supabase CLI is properly installed and in your PATH
   - Try restarting your terminal/command prompt

2. **Authentication issues**:
   - Run `supabase login` again to refresh your token

3. **Project link issues**:
   - Verify your project reference with `supabase projects list`
   - Re-link your project with the correct reference ID

4. **Permission errors**:
   - Run Command Prompt or PowerShell as Administrator

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Supabase Migration Guide](https://supabase.com/docs/guides/cli/local-development) 