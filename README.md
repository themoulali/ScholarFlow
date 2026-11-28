# ScholarFlow â€“ AI-Assisted Learning Management System

ScholarFlow is a full-stack, AI-assisted Learning Management System (LMS) designed to provide a unified learning platform for students, instructors, and administrators.

The platform supports course creation, lesson management, quizzes, student enrollment, learning progress tracking, assignment submissions, grading, and an AI-powered learning assistant.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [File Storage](#file-storage)
- [Deployment](#deployment)
- [Database Models](#database-models)
- [Security](#security)
- [GitHub Repository](#github-repository)

## Project Overview

ScholarFlow provides three role-based experiences.

### Student Portal
Students can discover courses, enroll in courses, access lessons, complete learning sections, monitor progress, submit assignments, and interact with the AI learning assistant.

### Instructor Portal
Instructors can create and manage courses, organize sections and lessons, create quizzes, publish courses, create assignments, review submissions, and grade student work.

### Administrator Portal
Administrators can access platform statistics and manage user information.

## Features

### Authentication and Authorization
- User registration and login.
- Secure authentication using NextAuth.js.
- Role-based access control.
- Student, instructor, and administrator roles.
- Password hashing using bcryptjs.

### Course Management
- Create, view, update, and delete courses.
- Organize courses into sections.
- Create and manage lessons.
- Publish courses.
- Browse published courses.
- Enroll students in courses.

### Lesson and Quiz Management
- Rich lesson content editor using TipTap.
- Store structured lesson content.
- Organize lessons within course sections.
- Create lesson quizzes.
- Support multiple-choice and true/false question types.

### Student Learning and Progress
- Browse and search published courses.
- Filter courses by category.
- Enroll in courses.
- View enrolled courses.
- Track completed sections.
- Calculate course progress.
- Monitor enrollment status.

### Assignment Management
- Create and manage assignments.
- Configure assignment deadlines and maximum marks.
- Support text-based submissions.
- Support assignment file uploads.
- Review student submissions.
- Grade assignments and provide feedback.
- Handle late-submission rules.

### AI Learning Assistant
- AI-powered question and answer functionality.
- Google Gemini API integration.
- Server-side API handling for AI requests.

### File Storage
- Supabase Storage integration.
- Private assignment file storage.
- Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG, and JPEG.
- Maximum upload size: 10 MB.
- Authorized temporary signed download URLs.

### Admin Dashboard
- View platform statistics.
- Retrieve user information.
- Update user information.

## Technology Stack

| Category | Technology |
|---|---|
| Frontend Framework | Next.js 14 |
| UI Library | React 18 |
| Programming Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | Radix UI |
| Icons | Lucide React |
| Authentication | NextAuth.js |
| Password Hashing | bcryptjs |
| Database | PostgreSQL |
| ORM | Prisma |
| AI Integration | Google Gemini API |
| File Storage | Supabase Storage |
| Rich Text Editor | TipTap |
| Unit Testing | Jest |
| Component Testing | React Testing Library |
| End-to-End Testing | Playwright |
| Deployment | Vercel |

## Project Structure

 text
ScholarFlow/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ admin/
â”‚   â”œâ”€â”€ instructor/
â”‚   â”œâ”€â”€ student/
â”‚   â””â”€â”€ api/
â”‚       â”œâ”€â”€ admin/
â”‚       â”œâ”€â”€ ai/
â”‚       â”œâ”€â”€ assignments/
â”‚       â”œâ”€â”€ auth/
â”‚       â”œâ”€â”€ courses/
â”‚       â”œâ”€â”€ lessons/
â”‚       â”œâ”€â”€ register/
â”‚       â”œâ”€â”€ sections/
â”‚       â””â”€â”€ student/
â”œâ”€â”€ components/
â”œâ”€â”€ docs/
â”‚   â””â”€â”€ API_DOCUMENTATION.md
â”œâ”€â”€ e2e/
â”œâ”€â”€ prisma/
â”‚   â”œâ”€â”€ migrations/
â”‚   â””â”€â”€ schema.prisma
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ lib/
â”‚   â””â”€â”€ types/
â”œâ”€â”€ .env.example
â”œâ”€â”€ jest.config.js
â”œâ”€â”€ jest.setup.ts
â”œâ”€â”€ playwright.config.ts
â”œâ”€â”€ package.json
â””â”€â”€ README.md

## Prerequisites

Before installing ScholarFlow, make sure you have:

- Node.js installed.
- npm installed.
- A PostgreSQL database or Supabase PostgreSQL project.
- A Supabase project with Storage enabled.
- A Google Gemini API key.

## Installation

### 1. Clone the repository

 bash
git clone https://github.com/themoulali/ScholarFlow.git

### 2. Navigate to the project

 bash
cd ScholarFlow

### 3. Install dependencies

 bash
npm install

## Environment Configuration

Create a `.env` file in the project root.

Configure the following environment variables using your own service credentials.

| Variable | Description |
|---|---|
| DATABASE_URL | PostgreSQL connection URL |
| DIRECT_URL | Direct PostgreSQL connection URL |
| NEXTAUTH_SECRET | NextAuth authentication secret |
| NEXTAUTH_URL | Application base URL |
| SUPABASE_URL | Supabase project URL |
| SUPABASE_SECRET_KEY | Server-side Supabase secret key |
| GEMINI_API_KEY | Google Gemini API key |
| GEMINI_MODEL | Gemini model identifier |

Use `.env.example` as a reference for the required variable names.

 Important:  Never upload your `.env` file, database passwords, API keys, or authentication secrets to GitHub.

## Database Setup

ScholarFlow uses PostgreSQL with Prisma ORM.

Generate the Prisma client:

 bash
npx prisma generate

Apply existing database migrations:

 bash
 npx prisma migrate deploy

Check migration status:

 bash
npx prisma migrate status

## Running the Application

Start the development server:

 bash
npm run dev

Open your browser and navigate to:

http://localhost:3000

To create a production build:

 bash
npm run build

To run the production application:

 bash
npm run start

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run build` | Creates the production build |
| `npm run start` | Starts the production server |
| `npm run test` | Runs Jest tests |
| `npm run lint` | Runs the configured lint command |

Additional verification commands:

 bash
npx tsc --noEmit
npm test -- --runInBand
npx playwright test

## Testing

ScholarFlow includes unit, integration, and end-to-end tests.

### Jest Testing

Run:

 bash
npm test -- --runInBand

The existing test suites cover utility functions, authentication configuration, and the AI API route.

### Playwright Testing

Install Chromium if required:

 bash
npx playwright install chromium

Run end-to-end tests:

 bash
npx playwright test

### TypeScript Verification

bash
npx tsc --noEmit

### Production Build Verification

 bash
npm run build

The project was previously verified with:
- 19 Jest tests passing.
- 14 Playwright tests passing.
- TypeScript check passing.
- Next.js production build successful.

Run the commands again after making changes to verify the current version.

## API Documentation

ScholarFlow uses Next.js App Router API routes.

Local API base URL:

 text
http://localhost:3000

The application provides the following API groups:

| API Group | Purpose |
|---|---|
| `/api/auth` | Authentication |
| `/api/register` | User registration |
| `/api/admin` | Administrator statistics and user management |
| `/api/ai` | AI learning assistant |
| `/api/courses` | Course management, enrollment, publishing, and sections |
| `/api/sections` | Section lesson management |
| `/api/lessons` | Lesson content and quiz management |
| `/api/assignments` | Instructor assignment management and submission review |
| `/api/student/assignments` | Student assignment operations and submissions |
| `/api/student/courses` | Published course catalog |
| `/api/student/enrollments` | Student enrollments and learning progress |

For the complete endpoint and HTTP method reference, see:

`docs/API_DOCUMENTATION.md`

The individual route handlers are the authoritative source for exact request fields, validation rules, authorization requirements, and response structures.

## File Storage

ScholarFlow uses Supabase Storage for assignment attachments.

Storage bucket:

 text
scholarflow-submissions


The bucket is private. The application checks permissions before generating temporary signed download URLs.

## Deployment

ScholarFlow is designed for deployment using Vercel.

Deployment steps:

1. Push the source code to GitHub.
2. Import the ScholarFlow repository into Vercel.
3. Select the repository root as the project root.
4. Configure the required environment variables in Vercel.
5. Verify the PostgreSQL database connection.
6. Ensure the Supabase Storage bucket exists and is private.
7. Set `NEXTAUTH_URL` to the production application URL.
8. Deploy the application.
9. Verify login, registration, dashboards, course management, assignment workflows, file storage, and AI functionality.

Do not commit production credentials to the repository.

## Database Models

The Prisma schema contains the following main models:

- User
- Course
- Enrollment
- CourseSection
- SectionProgress
- Lesson
- LessonContent
- VideoResource
- Quiz
- QuizQuestion
- QuizOption
- Assignment
- Submission

The database also defines enums for user roles, course status, enrollment status, quiz question types, assignment status, and submission status.

## Security

- NextAuth.js authentication.
- Role-based authorization.
- Password hashing with bcryptjs.
- Prisma-based database access.
- Server-side handling of AI API credentials.
- Private Supabase Storage.
- Ownership and enrollment checks for protected assignment operations.
- Environment-based configuration for sensitive credentials.

## GitHub Repository

 Project Name:  ScholarFlow

 Project Type:  AI-Assisted Learning Management System

 Repository:
https://github.com/themoulali/ScholarFlow

Framework: Next.js 14 with TypeScript

---

Developed as a full-stack learning platform for students, instructors, and administrators.
