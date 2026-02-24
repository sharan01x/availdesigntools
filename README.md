# Video Generator

A Next.js web application that generates AI videos using the Replicate API.

## Features

- **AI Video Generation**: Enter a text prompt and generate videos using Replicate's AI models
- **Video Gallery**: View all your generated videos in a gallery
- **Modern UI**: Clean, minimalist design with dark mode support
- **Serverless API Routes**: Simple deployment on Vercel

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Platform**: Vercel
- **Styling**: Tailwind CSS
- **AI API**: Replicate
- **Runtime**: Next.js Serverless Functions

## Setup

### Prerequisites

- Node.js 18+
- A Replicate account and API key

### Installation

1. Navigate to project:
```bash
cd video-generator
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Replicate API key:
```
REPLICATE_API_KEY=your_api_key_here
```

Get your API key from: https://replicate.com/account

### Development

Run the development server:
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Building for Production

Build the production bundle:
```bash
npm run build
```

### Deployment to Vercel

1. Push this repo to GitHub.

2. Import the repo at https://vercel.com/new and keep framework as **Next.js**.

3. Add this environment variable in Vercel Project Settings:
```
REPLICATE_API_KEY=your_api_key_here
```

4. Click **Deploy**.

Optional CLI deploy:
```bash
npm run deploy
```

## Usage

1. **Generate a Video**:
   - Go to the home page
   - Enter a description of the video you want
   - Click "Generate Video"
   - Wait for the AI to generate your video

2. **View Gallery**:
   - Click "View Gallery" to see all your generated videos

## Important Notes

- Update `src/app/api/generate/route.ts` to use your preferred video model
- Videos are stored in memory and will be lost on deployment
- For production, consider using a database or object storage for persistent video metadata
