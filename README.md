# Maravian CheckList

A real-time task tracking application for teams to manage and coordinate daily tasks with comprehensive user management and team coordination features.

## Features

- **User Management**: Registration, login, and password recovery
- **Team Coordination**: Real-time check-in/checkout system with notes and ratings
- **Task Management**: Hierarchical organization with parent/child tasks
- **Real-time Updates**: See team activity as it happens
- **Task Assignment**: Assign tasks to specific team members
- **Date Navigation**: View and manage tasks for any date
- **Admin Controls**: Team management, member banning, and access control
- **Statistics**: Track user activity and participation
- **Mobile-Friendly**: Full-width responsive design

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, React
- **API**: tRPC for end-to-end type safety
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom email-based authentication
- **Styling**: Tailwind CSS with shadcn/ui components
- **Real-time**: Server-sent events for live updates & Periodic pulling
- **Deployment**: Vercel-ready configuration

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database
- SMTP server for email functionality (optional for development)

### Environment Setup

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/maravian-checklist.git
   cd maravian-checklist
   ```

2. Install dependencies

   ```bash
   pnpm install
   ```

3. Create a `.env` file based on `.env.example`

   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your database connection and other required variables

5. Initialize the database

   ```bash
   pnpm prisma db push
   # Optional: Seed the database with initial data
   pnpm prisma db seed
   ```

6. Start the development server

   ```bash
   pnpm dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) to view the application

## Database Migration

For database changes, see [MIGRATIONS.md](MIGRATIONS.md) for detailed instructions.

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure everything works
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow the existing code style and patterns
- Tests after ne implementations, perform lint test on build before submitting pull request
- Update documentation when necessary
- Ensure all existing tests pass before submitting a PR

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Project Maintainer - https://github.com/Admin368

---

Made with ❤️ by the Maravian team
