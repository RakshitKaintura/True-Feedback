# True Feedback

> **Dive into the World of True Feedback - Where your identity remains a secret.**

True Feedback is a modern web application that allows users to receive anonymous messages and feedback from others. Built with privacy and ease-of-use in mind, it provides a secure platform to hear what people really think.

## 🚀 Features

- **Anonymous Messaging**: Receive honest, unfiltered feedback through your unique public profile link.
- **AI-Powered**: Integrates Google AI SDK to intelligently process or suggest responses.
- **Secure Authentication**: Robust user authentication powered by NextAuth.js.
- **Email Notifications**: Seamless email delivery using Resend and React Email.
- **Modern UI/UX**: Designed with Tailwind CSS and Shadcn UI for a beautiful, responsive, and accessible user interface.
- **Dark Mode**: Fully supports light and dark themes using `next-themes`.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (via [Mongoose](https://mongoosejs.com/))
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Email**: [Resend](https://resend.com/) & [React Email](https://react.email/)
- **AI Integration**: [Google AI SDK](https://sdk.vercel.ai/docs/providers/google)
- **Validation**: [Zod](https://zod.dev/) & [React Hook Form](https://react-hook-form.com/)

## 💻 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) and npm (or pnpm/yarn) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd anonymous_feedback
   ```

2. Install the dependencies:
   ```bash
   npm install
   # or yarn / pnpm install
   ```

3. Set up the environment variables:
   Create a `.env` file in the root directory and add the necessary variables (e.g., MongoDB URI, NextAuth secret, Resend API key, Google AI keys).

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

- `src/app`: Contains the Next.js App Router pages and API routes.
  - `(app)`: Main application pages (dashboard, etc.).
  - `(auth)`: Authentication pages (sign-in, sign-up).
  - `u/[username]`: Public profile pages for receiving feedback.
  - `api`: Backend API endpoints.
- `src/components`: Reusable UI components (including Shadcn UI).
- `src/schemas`: Zod schemas for form and API validation.
- `emails`: React Email templates.

## 📜 License

© 2023 True Feedback. All rights reserved.
