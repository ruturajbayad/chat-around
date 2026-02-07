# Chat Around

`Chat Around is a modern, secure, and ephemeral chat application designed for instant, anonymous communication. Create temporary chat rooms with end-to-end encryption features and invite friends simply by sharing a link. No sign-ups, no tracking—just chat.

## Features

### 🔒 Secure & Private
- **Client-Side Encryption**: Messages are encrypted in the browser using AES-GCM. The decryption key is part of the URL hash and is never sent to the server in plain text.
- **Anonymous Access**: No login or registration required. Simply choose a temporary username to join.
- **No History**: Server only relays encrypted messages.

### ⚡ Ephemeral Groups
- **Auto-Deletion**: Groups are automatically deleted from the database immediately after the last participant leaves.
- **Heartbeat System**: Active groups are maintained via a heartbeat mechanism; inactive groups are cleaned up automatically.

### 💬 Rich Chat Experience
- **Real-time Messaging**: Instant message delivery and typing indicators powered by Supabase Realtime.
- **Modern UI**:
  - **Message Grouping**: Consecutive messages from the same sender are visually grouped.
  - **Replies & Mentions**: Reply to specific messages and mention users with `@username`.
  - **Fluid Animations**: Smooth entry animations for messages and UI elements using Framer Motion.
  - **Dark/Light Mode**: Fully supported theme toggling.
- **Responsive Design**: Optimized for both desktop and mobile, featuring a collapsible participant drawer on smaller screens.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Backend & Realtime**: [Supabase](https://supabase.com/) (PostgreSQL + Realtime)

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chat-around.git
   cd chat-around
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to start chatting.

## License

MIT
