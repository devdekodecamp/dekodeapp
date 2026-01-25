# Dashboard App

A modern dashboard application with admin and user roles for managing course modules and progress tracking.

## Features

### Admin Features
- **Dashboard**: Overview of platform statistics
- **Create Account**: Create new user accounts that can be sent to users
- **All Users**: View all users with their information and progress bars
- **Verify Proofs**: Review and verify user-submitted proofs for completed modules

### User Features
- **My Modules**: View 6 weeks of course content
  - Each week includes:
    - Video link
    - Module link
    - Proof upload functionality
- **Progress Tracking**: Visual progress bar showing completed weeks
- **Settings**: Update email and password

## Tech Stack

- **Next.js 16**: React framework
- **React 19**: UI library
- **Tailwind CSS 4**: Styling
- **Lucide React**: Icons
- **Supabase**: Backend (to be integrated)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
dashboard-app/
├── app/
│   ├── admin/
│   │   ├── dashboard/       # Admin dashboard overview
│   │   ├── create-account/ # Create new user accounts
│   │   ├── users/          # View all users
│   │   └── verify-proofs/  # Verify user submissions
│   ├── user/
│   │   ├── dashboard/      # User modules view
│   │   └── settings/       # User settings (email/password)
│   ├── layout.js           # Root layout
│   ├── page.js             # Login page
│   └── globals.css          # Global styles
├── components/
│   ├── Sidebar.js          # Navigation sidebar
│   ├── Header.js           # Top header bar
│   ├── ProgressBar.js      # Progress indicator component
│   └── WeekCard.js         # Week module card component
└── package.json
```

## Next Steps

1. Set up Supabase project
2. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)
3. Implement authentication:
   - Replace mock login with Supabase auth
   - Add role-based access control
4. Connect to database:
   - Create tables for users, modules, proofs
   - Implement CRUD operations
5. Add file upload:
   - Configure Supabase Storage for proof images
   - Implement upload functionality

## Notes

- Currently uses mock data for demonstration
- All TODO comments indicate where Supabase integration is needed
- UI is fully responsive and supports dark mode
- Focus is on UI/UX - backend integration pending







