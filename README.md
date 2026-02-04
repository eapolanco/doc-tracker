# DocTracker

DocTracker is a document management application designed to help you organize and track your files efficiently. It features a React-based frontend and a robust Node.js backend.

## Features

- **Document Management**: Upload, move, copy, and delete documents.
- **Search**: Quickly find documents with search functionality.
- **Categorization**: Organize documents into categories.
- **Cloud Integration**: Support for cloud storage providers (Google Drive, OneDrive).

## Security

### Data in Transit (TLS)

The "https://" at the beginning of URL indicates that all communication between your device and server is encrypted using Transport Layer Security (TLS). Microsoft uses 2048-bit keys to prevent "man-in-the-middle" attacks.

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

1. Clone the repository.
2. Install dependencies for both client and backend:
   ```bash
   cd client && npm install
   cd ../backend && npm install
   ```

### Running the App

1. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```
2. Start the client:
   ```bash
   cd client
   npm run dev
   ```
