# NestJS Starter Kit

A comprehensive, production-ready starter kit for NestJS applications with built-in authentication, enhanced security, database integration, and industry best practices.

## Features

- **Advanced Authentication**
  - JWT-based authentication with refresh tokens
  - Two-factor authentication (2FA) with encrypted secrets
  - API key authentication
  
- **Security Enhancements**
  - AES-256-CBC encryption for sensitive data
  - Secure password handling with bcrypt
  - Protection against common web vulnerabilities
  - Rate limiting and throttling
  
- **Authorization**
  - Role-based access control
  - Public/private route decorators
  
- **Database Integration**
  - TypeORM with PostgreSQL
  - Entity inheritance with BaseEntity
  - Efficient pagination
  
- **API Documentation**
  - Swagger/OpenAPI with rich metadata
  - Detailed endpoint descriptions
  - Authentication examples
  
- **Environment Configuration**
  - Environment-specific configurations
  - Strong validation with Joi
  - Sensible defaults
  
- **Request Validation**
  - Comprehensive DTO validation with class-validator
  - Detailed error messages
  - Request transformation
  
- **Error Handling**
  - Global exception filters
  - Standardized error responses
  - JWT-specific error handling
  
- **Developer Experience**
  - Hot module replacement
  - Standardized module structure
  - SWC compiler for faster builds
  - Integration tests
  - Extensive documentation

## Security Features

### Encrypted 2FA Secrets

This starter kit implements industry-standard encryption for 2FA secrets, addressing a common security vulnerability. Features include:

- **AES-256-CBC Encryption**: Military-grade encryption for 2FA secrets
- **Unique Initialization Vectors**: Each secret gets a unique IV for enhanced security
- **Transparent Encryption/Decryption**: Handled automatically by the system
- **Error Handling**: Robust error handling for cryptographic operations

### Enhanced Authentication

- Multiple authentication strategies (JWT, API Key)
- Complete JWT authentication with access and refresh tokens
- Configurable token expiration
- Protection against common authentication attacks

### Data Protection

- All sensitive data is properly encrypted or hashed
- Passwords are hashed using bcrypt with proper salt rounds
- Personal information is protected according to best practices
- Refresh tokens are securely stored with hashing

## Prerequisites

- Node.js (>=14.x)
- PostgreSQL
- npm or yarn

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/latreon/nest-starter-kit.git
   cd nest-starter-kit
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.development`:
     ```bash
     cp .env.example .env.development
     ```
   - Update the values in `.env.development` with your configuration
   - **Important**: Replace all placeholder secrets with strong, unique values
   - Make sure to set both `JWT_SECRET` and `JWT_REFRESH_SECRET` with different values

4. Run database migrations:
   ```bash
   npm run migration:run
   ```
   This will create the initial database schema with a `users` table for authentication.

5. Start the development server:
   ```bash
   npm run start:dev
   ```

6. Access the API documentation at: `http://localhost:3000/api/docs`

## Project Structure

The project follows a standardized modular structure:

```
src/
├── app/                  # Application core
│   ├── common/           # Common utilities and helpers
│   │   ├── decorators/   # Custom decorators
│   │   ├── docs/         # API documentation
│   │   ├── entities/     # Base entities
│   │   ├── dto/          # Common DTOs
│   │   ├── services/     # Common services like encryption
│   │   └── exception/    # Exception filters
│   └── modules/          # Feature modules
│       ├── auth/         # Authentication module
│       │   ├── controllers/ # Auth controllers
│       │   ├── dto/      # Auth-specific DTOs
│       │   ├── entities/ # Auth-related entities
│       │   ├── guards/   # Auth guards
│       │   ├── services/ # Auth services
│       │   ├── strategies/ # Passport strategies
│       │   └── types/    # Auth type definitions
│       ├── user/         # User management module
│       │   ├── controllers/ # User controllers
│       │   ├── dto/      # User-specific DTOs
│       │   ├── entities/ # User entities
│       │   └── services/ # User services
│       └── shared/       # Shared services and utilities
├── config/               # Configuration settings
├── database/             # Database setup and migrations
└── main.ts               # Application entry point
```

Each feature module follows the same standardized structure, matching the organization of the common module.

## Authentication Flow

The starter kit provides several authentication methods:

1. **JWT Authentication with Refresh Tokens**
   - Login with email/password to receive access and refresh tokens
   - Use access token for authenticated requests
   - When access token expires, use refresh token to get a new pair of tokens
   - Logout to invalidate refresh tokens

2. **Two-Factor Authentication (2FA)**
   - Enable 2FA for enhanced security
   - 2FA secrets are securely encrypted in the database
   - TOTP-based verification (compatible with apps like Google Authenticator)

3. **API Key Authentication**
   - Alternative authentication for service-to-service communication
   - Unique per-user API keys with fine-grained permissions

## Refresh Token Implementation

This starter kit implements a secure refresh token mechanism:

1. **How it works:**
   - After successful login, both access and refresh tokens are issued
   - Access tokens have a shorter lifespan (default 15 minutes)
   - Refresh tokens have a longer lifespan (default 7 days)
   - When the access token expires, the refresh token can be used to get a new pair of tokens
   - Refresh tokens are stored securely in the database using bcrypt hashing

2. **Endpoints:**
   - `/auth/login` - Returns access and refresh tokens
   - `/auth/refresh` - Uses refresh token to issue new tokens
   - `/auth/logout` - Invalidates the refresh token

3. **Security considerations:**
   - Different secrets for access and refresh tokens
   - Refresh tokens are hashed before storage
   - One-time use - each refresh operation invalidates the old token

## SWC Compiler Support

This starter kit utilizes SWC for faster compilation:

- Significantly faster build times compared to TypeScript compiler
- Same type-checking capabilities when using `typeCheck: true`
- Compatible with all NestJS features
- Configured for optimal performance

## Testing

Run unit tests:
```bash
npm run test
```

Run end-to-end tests:
```bash
npm run test:e2e
```

Run integration tests:
```bash
npm run test:integration
```

### Integration Tests

The starter kit includes integration tests that verify the interaction between different parts of the application:

- Tests for authentication flows (login, refresh token)
- Tests for user operations
- Tests with database interactions 

Integration tests are located in the `test/integration` directory and follow the module structure.

## Customizing the Starter Kit

### Adding a New Module

1. Create a new directory in `src/app/modules/`
2. Follow the standard module structure (controllers/, services/, entities/, etc.)
3. Import the new module in `app.module.ts`

### Database Migrations

Generate a new migration:
```bash
npm run migration:generate -- -n MigrationName
```

Run migrations:
```bash
npm run migration:run
```

Revert the latest migration:
```bash
npm run migration:revert
```

## Security Best Practices

This starter kit follows these security best practices:

1. **No Sensitive Data in Plain Text**: All sensitive data is encrypted or hashed
2. **Properly Configured JWT**: Secure signing, appropriate expiration
3. **Rate Limiting**: Protection against brute force attacks
4. **Input Validation**: All input is validated before processing
5. **Content Security**: Headers are properly set for security
6. **Error Handling**: No sensitive information in error messages
7. **Database Security**: Parameterized queries to prevent SQL injection
8. **Token Security**: Separate secrets for access and refresh tokens

## Production Deployment

Before deploying to production:

1. Create a `.env.production` file with secure settings
2. Generate strong, unique secrets for JWT, refresh tokens, and encryption
3. Set appropriate rate limiting and security settings
4. Disable Swagger in production (`SWAGGER_ENABLED=false`)
5. Set up proper SSL/TLS for all communications

Build the application:
```bash
npm run build
```

Start in production mode:
```bash
npm run start:prod
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)

**Nest.js Starter Kit** - Created by [Karimov Farda](https://github.com/latreon)