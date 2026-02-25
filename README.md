# Avail Design Tools

A Next.js web application that provides a suite of AI design tools powered by the Replicate API.

## Features

- **Tool Hub**: Landing page listing all available tools
- **AI Video Generation**: Enter a text prompt and generate videos using Replicate's AI models
- **AI Image Generation**: Enter a text prompt and generate images with `black-forest-labs/flux-2-pro`
- **Shared Gallery**: View all your generated videos and images in one place
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

3. **Set up environment variables**:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Replicate API key:
```
REPLICATE_API_KEY=your_api_key_here
```

Optional (if you want to host the reference image elsewhere):
```
FLUX_REFERENCE_IMAGE_URL=https://your-domain.com/path/to/sample-image.jpg
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

1. **Pick a Tool**:
   - Go to the home page (`/`) to see all available tools

2. **Generate a Video**:
   - Open `/video-generator`
   - Enter a description of the video you want
   - Click "Generate Video"
   - Wait for the AI to generate your video

3. **Generate an Image**:
   - Open `/image-generator`
   - Enter the image intent in the **Purpose** box
   - Click **Generate Prompt** to auto-fill the **Prompt** box using Gemini
     (you can still edit the generated prompt manually)
   - Place a reference sample image at `public/reference/sample-image.jpg`
     (or set `FLUX_REFERENCE_IMAGE_URL`)
   - Choose whether **Branded** mode is on/off:
     - **On**: applies `PROMPT_STYLE_GUIDE` and sends the reference image
     - **Off**: sends only your prompt without branding additions
   - Select output size:
     - `1:1 (500x500)`
     - `1:1 (1000x1000)`
     - `HD Landscape (1920x1080)`
     - `HD Portrait (1080x1920)`
   - Click "Generate Image"

4. **View Gallery**:
   - Open `/gallery` to see all generated videos and images

## Important Notes

- Update `src/app/api/generate/route.ts` to use your preferred video model
- Update `src/app/api/generate-image/route.ts` to use your preferred image model
- Generated items are stored in memory and will be lost on deployment/restart
- For production, consider using a database or object storage for persistent media metadata
