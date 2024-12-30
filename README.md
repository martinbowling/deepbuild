# DeepBuild 🚀

## Overview
DeepBuild is a modern web-based coding assistant that harnesses the power of DeepSeek-V3's language model through an intuitive, real-time interface. Built on Next.js 14, it provides a sophisticated development environment where developers can interact with DeepSeek's 671B parameter model for code generation, refactoring, and development assistance.

## Key Features

### Real-Time Code Processing
- Seamless integration with DeepSeek-V3's API for instant code generation
- Live code completion and suggestions
- Context-aware code understanding and refactoring
- Intelligent project structure analysis

### Modern Web Architecture
- **Next.js 14 Framework**: Leveraging server components and app router for optimal performance
- **TypeScript Integration**: Full type safety and enhanced developer experience
- **Tailwind CSS**: Responsive and customizable UI components
- **Real-time Updates**: WebSocket integration for live code updates

### Development Tools
- Interactive code editor with syntax highlighting
- File system navigation and management


## About DeepSeek-V3

DeepSeek-V3 represents a significant advancement in language model technology with:
- 671B MoE (Mixture of Experts) parameters
- 37B activated parameters
- Training on 14.8T high-quality tokens
- Impressive speed of 60 tokens/second (3x faster than V2)
- Full API compatibility with previous versions

## Features

- Modern Next.js-based web interface
- Tailwind CSS for sleek, responsive design
- TypeScript for enhanced type safety and developer experience
- Integration with DeepSeek-V3's powerful language model
- Environment variable configuration for secure API handling

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/martinbowling/deepbuild.git
cd deepbuild
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure Environment Variables:
You can configure the application in two ways:

a) Using environment files (`.env` or `.env.local`):
Create a `.env` or `.env.local` file in the project root with any of the following variables to override the Web GUI settings:

```bash
# Required - Choose your API provider
API_PROVIDER=deepseek           # Options: 'deepseek' or 'hyperbolic'

# DeepSeek Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_API_BASE=https://api.deepseek.com/v1  # Optional: Custom API endpoint

# Hyperbolic Configuration
HYPERBOLIC_API_KEY=your_hyperbolic_api_key_here
HYPERBOLIC_API_BASE=https://api.hyperbolic.xyz # Optional: Custom API endpoint

# Model Settings (applies to both providers)
MODEL_VERSION=deepseek-v3       # Model version
MAX_TOKENS=2048                 # Maximum tokens per request
TEMPERATURE=0.7                 # Response temperature (0-1)
TOP_P=0.95                      # Top P sampling (0-1)
FREQUENCY_PENALTY=0.0           # Frequency penalty (-2.0 to 2.0)
PRESENCE_PENALTY=0.0            # Presence penalty (-2.0 to 2.0)

# Advanced Settings
CACHE_ENABLED=true             # Enable/disable response caching
REQUEST_TIMEOUT=60000          # Request timeout in milliseconds
```

Environment variables take precedence over Web GUI settings. Any variable defined in `.env` or `.env.local` will override the corresponding setting in the Web GUI. This allows you to:
- Set default values for deployment
- Override settings for different environments
- Keep sensitive information like API keys out of the Web GUI
- Lock certain settings for production use

b) Using the Web GUI:
If no environment variables are set, or you prefer a visual interface, you can configure all settings through the web interface after starting the application. The GUI provides:
- Provider selection between DeepSeek and Hyperbolic
- API key management
- Model parameter configuration
- Advanced settings adjustment

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
deepbuild/
├── app/                # Next.js app directory
├── components/         # React components
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and shared logic
├── public/            # Static assets
└── styles/            # Global styles and Tailwind CSS configuration
```

## Contributing

We welcome contributions! This project was inspired by [@skirano](https://x.com/skirano/status/1872382787422163214)'s [deepseek-engineer](https://github.com/Doriandarko/deepseek-engineer). Special thanks to [hyperbolic.xyz](https://hyperbolic.xyz) for their work on inference implementation.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## License

This project is open-source. Please refer to the LICENSE file for details.

## Acknowledgments

- DeepSeek AI for their incredible language model
- The open-source community
- All contributors and supporters of this project

---

Built with ❤️ using DeepSeek-V3 and Next.js 