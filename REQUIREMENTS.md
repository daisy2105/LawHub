# LawHub Project Dependencies
# Node.js/Express.js Application Requirements

## Core Dependencies (Production)

express: ^4.18.2
mongodb: ^6.20.0
mongoose: ^7.5.0
bcrypt: ^6.0.0
bcryptjs: ^2.4.3
jsonwebtoken: ^9.0.2
express-session: ^1.18.2
connect-mongo: ^5.1.0
cors: ^2.8.5
dotenv: ^16.3.1
express-validator: ^7.0.1

## Development Dependencies

nodemon: ^3.0.1

## System Requirements

- Node.js: >= 14.0.0
- MongoDB: >= 4.4
- npm: >= 6.0

## Installation

```bash
npm install
```

## Environment Setup

Create a `.env` file with:
```
MONGODB_URI=mongodb://localhost:27017/lawhub
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret-here
PORT=3000
NODE_ENV=development
```

## Running the Application

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```