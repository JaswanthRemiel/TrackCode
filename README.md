# TrackCode
TrackCode organises LeetCode problems by the companies that ask them, so you can focus your interview preparation on the exact questions a target company favours. It tracks daily streaks, renders a GitHub-style contribution heatmap, and integrates with the LeetCode API for live profile statistics.

[![Demo](https://img.shields.io/badge/demo-online-brightgreen?style=flat-square)](https://leettrack.remiel.work)
[![Stars](https://img.shields.io/github/stars/jaswanthremiel/trackcode?style=flat-square)](https://github.com/jaswanthremiel/trackcode/stargazers)
[![Last Commit](https://img.shields.io/github/last-commit/jaswanthremiel/trackcode?style=flat-square)](https://github.com/jaswanthremiel/trackcode/commits/main)

https://github.com/user-attachments/assets/83d166d7-12e1-4bd9-ad4b-e2a8719fdb58

## Features

- **Company-wise problem lists** - browse and filter problems grouped by Google, Meta, Amazon, and hundreds of other organisations
- **Progress tracking** - mark problems as todo, done, or revision; progress persists across sessions via Firebase
- **Streak system** - daily streak counter with current and longest streak tracking to keep you consistent
- **Contribution graph** - a full-year activity heatmap that visualises your daily solve count
- **LeetCode integration** - connect your LeetCode username to display live stats (ranking, reputation, difficulty breakdown)
- **Dark mode** - system-aware theme toggle with smooth transitions
- **Responsive layout** - works on desktop and mobile with an adaptive dock navigation

## Tech Stack

| Layer        | Technology                                          |
| ------------ | --------------------------------------------------- |
| Framework    | [Next.js 16](https://nextjs.org) (App Router)       |
| Language     | TypeScript 5                                        |
| Styling      | Tailwind CSS 4                                      |
| UI Library   | shadcn/ui, Lucide Icons                             |
| Auth         | Firebase Authentication                             |
| Database     | Cloud Firestore (with offline persistence)          |
| Charts       | Recharts, react-activity-calendar                   |
| Deployment   | Vercel                                              |
| Analytics    | Vercel Analytics                                    |

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm (or pnpm / yarn)
- A Firebase project with Authentication and Firestore enabled

### Installation

```bash
git clone https://github.com/JaswanthRemiel/TrackCode.git
cd TrackCode
npm install
```

### Environment Variables

Create a `.env.local` file in the project root with your Firebase credentials:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
TrackCode/
├── app/
│   ├── (protected)/          # Authenticated routes
│   │   ├── dashboard/        # Main dashboard with stats and activity graph
│   │   ├── companies/        # Company listing and per-company problem views
│   │   ├── problems/         # Full problem browser
│   │   └── profile/          # User profile and settings
│   ├── api/                  # API routes (LeetCode proxy)
│   ├── login/                # Login page
│   ├── signup/               # Registration page
│   ├── forgot-password/      # Password recovery
│   ├── verify-email/         # Email verification
│   ├── layout.tsx            # Root layout with providers
│   └── page.tsx              # Landing page
├── components/
│   ├── auth/                 # AuthProvider, ProtectedRoute
│   ├── data/                 # DataProvider (problems + progress)
│   ├── ui/                   # shadcn/ui primitives
│   ├── contribution-graph.tsx
│   ├── dock.tsx              # Navigation dock
│   ├── leetcode-stats-widget.tsx
│   ├── streak-widget.tsx
│   └── airport-clock.tsx
├── hooks/                    # Custom React hooks
├── lib/                      # Firebase client, utilities
├── scripts/                  # Data seeding and upload scripts
├── types/                    # Shared TypeScript interfaces
└── public/                   # Static assets
```

## Seeding the Database

A problem set with entries for 470+ companies is included in `scripts/problems.json`. To upload it to your Firestore instance:

```bash
npx tsx scripts/upload.ts
```

Make sure your Firebase Admin credentials are configured before running the seed script.

## Deployment

The recommended deployment target is [Vercel](https://vercel.com). Connect your GitHub repository, set the environment variables listed above, and deploy. No additional configuration is required.

## Contributing

Contributions are welcome. Please open an issue first to discuss the change you would like to make, then submit a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

## License

Distributed under the terms of the license included in this repository. See the [LICENSE](LICENSE) file for details.
