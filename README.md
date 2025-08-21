# Developer Assistant AI

This is a Developer Assistant AI with a Next.js frontend and an Express.js backend that uses the Google Generative AI API.

## Project Structure

- `dev-assistant` (root): The Next.js frontend application.
- `mcp-server`: The Express.js backend server.

## Getting Started

### Prerequisites

- Node.js and npm installed.
- A Google Generative AI API key.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd dev-assistant
    ```

2.  **Install dependencies for the frontend:**

    ```bash
    npm install
    ```

3.  **Install dependencies for the backend:**

    ```bash
    npm install --prefix mcp-server
    ```

4.  **Create a `.env` file in the `mcp-server` directory and add your Gemini API key:**

    ```
    GEMINI_API_KEY=your-api-key
    ```

### Running the Application

1.  **Start the backend server:**

    ```bash
    npm run dev:mcp
    ```

    The server will be running on `http://localhost:3001`.

2.  **Start the frontend application:**

    ```bash
    npm run dev
    ```

    The application will be running on `http://localhost:3000`.

## Available Scripts

### Frontend (`dev-assistant`)

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Builds the Next.js application for production.
- `npm run start`: Starts the Next.js production server.
- `npm run lint`: Lints the Next.js application.

### Backend (`mcp-server`)

- `npm run dev --prefix mcp-server`: Starts the Express.js development server.
- `npm run build --prefix mcp-server`: Compiles the TypeScript code to JavaScript.
