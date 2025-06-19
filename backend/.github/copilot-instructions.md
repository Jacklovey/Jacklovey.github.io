<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Solana Earphone Backend - Copilot Instructions

## Project Overview
This is a FastAPI backend service for the Solana Earphone voice assistant application. The backend provides APIs for user authentication, voice interpretation, blockchain operations, and tool management.

## Architecture & Patterns
- Use FastAPI for REST API development
- Follow async/await patterns for all route handlers
- Use Pydantic models for request/response validation
- Implement dependency injection for security and database access
- Follow the repository pattern for data access
- Use proper HTTP status codes and error handling

## Security Guidelines
- All protected routes must use JWT token authentication
- Use HTTPBearer security scheme for token validation
- Hash passwords using bcrypt through passlib
- Validate all input data using Pydantic schemas
- Implement proper CORS configuration

## Code Style
- Follow PEP 8 Python style guidelines
- Use type hints for all function parameters and return values
- Write descriptive docstrings for all functions and classes
- Use meaningful variable and function names
- Keep functions focused and single-purpose

## API Design
- Use RESTful conventions for endpoint design
- Group related endpoints using APIRouter
- Provide clear error messages with appropriate status codes
- Include request/response models for all endpoints
- Follow consistent naming conventions (snake_case)

## Blockchain Integration
- Use the Solana Python SDK for blockchain operations
- Implement proper error handling for blockchain transactions
- Provide mock implementations for development/testing
- Handle different Solana networks (devnet, testnet, mainnet)

## Voice Processing
- Parse natural language intents using regex patterns
- Support multiple languages (primarily Chinese and English)
- Implement confidence scoring for intent recognition
- Provide structured responses with tool calls

## Testing
- Write unit tests for all business logic
- Use pytest for testing framework
- Mock external dependencies (blockchain, AI services)
- Implement integration tests for API endpoints

## Database
- Use SQLAlchemy for ORM operations
- Implement proper database migrations with Alembic
- Use async database drivers (asyncpg for PostgreSQL)
- Follow database naming conventions

## Environment & Configuration
- Use environment variables for all configuration
- Provide .env.example with all required variables
- Use Pydantic Settings for configuration management
- Support different environments (dev, staging, prod)
