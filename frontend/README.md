# Todo App - Frontend

Next.js 16 frontend application with Better Auth authentication and task management.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.7+ (strict mode)
- **Styling**: Tailwind CSS 4+
- **UI**: React 19+
- **Authentication**: Better Auth (JWT, HTTP-only cookies)
- **State Management**: Context API

## Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database (for Better Auth)
- Backend API running on http://localhost:8000

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
bun install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Better Auth Configuration
BETTER_AUTH_SECRET=your-super-secret-key-at-least-32-characters-long
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_AUTH_URL=http://localhost:3000

# Database URL for Better Auth (same as backend)
DATABASE_URL=postgresql://user:password@localhost:5432/hackathon_todo
```

**Generate a secure secret:**
```bash
openssl rand -base64 32
```

**IMPORTANT**: Use the same `BETTER_AUTH_SECRET` in both frontend and backend.

### 3. Run Development Server

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── app/
│   ├── auth/
│   │   ├── sign-in/page.tsx    # Sign-in page
│   │   └── sign-up/page.tsx    # Sign-up page
│   ├── dashboard/
│   │   └── page.tsx             # Dashboard with tasks
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/route.ts  # Better Auth API route
│   ├── layout.tsx               # Root layout with AuthProvider
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Global styles
├── components/
│   ├── providers/
│   │   └── AuthProvider.tsx    # Auth context provider
│   ├── layout/
│   │   └── Header.tsx           # Header component
│   └── tasks/
│       ├── TaskList.tsx         # Task list container
│       ├── TaskItem.tsx         # Individual task item
│       └── TaskForm.tsx         # Create task form
├── lib/
│   ├── auth.ts                  # Better Auth server config
│   ├── auth-client.ts           # Better Auth client config
│   └── api.ts                   # API client with JWT handling
├── middleware.ts                # Route protection middleware
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Features

### Authentication
- Email/password sign-up and sign-in
- JWT tokens in HTTP-only cookies (secure)
- Automatic session management with Better Auth
- Protected routes (redirects to sign-in if not authenticated)

### Task Management
- Create tasks with title and optional description
- View all tasks, pending tasks, or completed tasks
- Toggle task completion status
- Edit task title and description
- Delete tasks
- Real-time updates after mutations

### UI/UX
- Professional minimalist design (2025 industry standards)
- Responsive layout (mobile, tablet, desktop)
- Loading states for all async operations
- Error handling with user-friendly messages
- Clean Slate + Blue color palette

## Authentication Flow

1. User visits landing page at `/`
2. User clicks "Sign In" or "Create Account"
3. After successful authentication, user is redirected to `/dashboard`
4. Better Auth stores JWT in HTTP-only cookie
5. API client automatically includes JWT in all backend requests
6. Middleware protects `/dashboard` route (requires authentication)

## API Integration

The frontend communicates with the FastAPI backend using the API client in `lib/api.ts`:

**Endpoints:**
- `GET /api/{user_id}/tasks?status={all|pending|completed}` - List tasks
- `POST /api/{user_id}/tasks` - Create task
- `GET /api/{user_id}/tasks/{task_id}` - Get task
- `PUT /api/{user_id}/tasks/{task_id}` - Update task
- `PATCH /api/{user_id}/tasks/{task_id}/complete` - Toggle completion
- `DELETE /api/{user_id}/tasks/{task_id}` - Delete task

All requests include the JWT token in the `Authorization` header.

## TypeScript

The project uses TypeScript strict mode for maximum type safety:

- 100% type coverage
- No `any` types allowed
- Explicit return types on all functions
- All props interfaces defined

## Styling

Tailwind CSS is configured with:

- Professional minimalist design
- Slate (neutral grays) color palette
- Blue-600 accent color
- Responsive breakpoints: sm, md, lg, xl
- No emojis or childish elements (user requirement)

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |
| `BETTER_AUTH_SECRET` | Secret for JWT signing (min 32 chars) | Generated with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Frontend URL for Better Auth | `http://localhost:3000` |
| `NEXT_PUBLIC_AUTH_URL` | Public frontend URL | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/hackathon_todo` |

## Security

- JWT tokens stored in HTTP-only cookies (prevents XSS attacks)
- Middleware protects routes server-side
- Better Auth handles session management securely
- No sensitive data in client-side JavaScript
- CORS configured for localhost development

## Development Guidelines

See `frontend/CLAUDE.md` for comprehensive development guidelines including:

- Component patterns
- Testing standards
- API client usage
- TypeScript conventions
- Accessibility requirements
- Performance targets

## Troubleshooting

**Issue: Authentication not working**
- Verify `BETTER_AUTH_SECRET` matches between frontend and backend
- Check that PostgreSQL database is running
- Ensure `DATABASE_URL` is correct

**Issue: API calls failing**
- Verify backend is running on `http://localhost:8000`
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Open browser console to see detailed error messages

**Issue: TypeScript errors**
- Run `npm run type-check` to see all errors
- Ensure all dependencies are installed
- Check tsconfig.json is not modified

**Issue: Styling not working**
- Run `npm run dev` to rebuild Tailwind CSS
- Check that `globals.css` is imported in layout.tsx
- Verify tailwind.config.ts content paths include your files

## Production Deployment

### Build for Production

```bash
npm run build
```

### Environment Variables for Production

Update `.env.production.local` with production values:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
BETTER_AUTH_SECRET=<production-secret>
BETTER_AUTH_URL=https://yourdomain.com
NEXT_PUBLIC_AUTH_URL=https://yourdomain.com
DATABASE_URL=<production-database-url>
```

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### Deploy to Other Platforms

Ensure the platform supports:
- Node.js 18+
- PostgreSQL database
- Environment variables

## License

MIT

## Support

For issues or questions, refer to:
- `frontend/CLAUDE.md` - Development guidelines
- Backend README - Backend setup
- Better Auth Docs: https://www.better-auth.com/docs
- Next.js 16 Docs: https://nextjs.org/docs
