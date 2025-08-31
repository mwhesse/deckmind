// Agent templates and presets for common development tasks

export const AGENT_TEMPLATES = {
  // Web Development Templates
  'react-app': {
    name: 'React Application',
    description: 'Create a modern React application with best practices',
    category: 'Frontend',
    instructions: `Create a modern React application with the following structure and features:

1. Set up project structure with components, hooks, and utilities
2. Implement routing with React Router
3. Add state management (Context API or Redux Toolkit)
4. Create reusable components (Button, Input, Modal, etc.)
5. Implement responsive design with CSS modules or styled-components
6. Add form validation and error handling
7. Set up testing with Jest and React Testing Library
8. Configure build tools (Webpack/Vite) and deployment
9. Add TypeScript support for better development experience
10. Implement proper error boundaries and loading states

Focus on:
- Clean, maintainable code structure
- Performance optimizations
- Accessibility (WCAG 2.1 compliance)
- Mobile-first responsive design
- SEO best practices
- Code splitting and lazy loading

Start by creating the basic project structure and then implement each feature incrementally.`,
    estimatedTime: '4-6 hours',
    difficulty: 'Intermediate',
    tags: ['react', 'frontend', 'typescript', 'responsive']
  },

  'nextjs-app': {
    name: 'Next.js Full-Stack App',
    description: 'Build a full-stack application with Next.js',
    category: 'Full-Stack',
    instructions: `Create a full-stack application using Next.js 13+ with the following features:

1. Set up Next.js project with TypeScript and Tailwind CSS
2. Implement App Router for modern routing
3. Create API routes for backend functionality
4. Add database integration (Prisma + PostgreSQL/SQLite)
5. Implement authentication with NextAuth.js
6. Create protected routes and middleware
7. Add form handling with React Hook Form
8. Implement real-time features with WebSockets
9. Add image optimization and CDN integration
10. Set up deployment pipeline (Vercel/Netlify)

Architecture requirements:
- Server Components for performance
- Client Components where interactivity is needed
- Proper data fetching patterns (SSR, SSG, ISR)
- Error handling and loading states
- Security best practices
- Performance monitoring

Start with the basic setup and build features incrementally, ensuring each component is properly tested and documented.`,
    estimatedTime: '6-8 hours',
    difficulty: 'Advanced',
    tags: ['nextjs', 'fullstack', 'typescript', 'tailwind']
  },

  'vue-app': {
    name: 'Vue.js Application',
    description: 'Build a Vue.js application with Composition API',
    category: 'Frontend',
    instructions: `Create a modern Vue.js application using Vue 3 Composition API:

1. Set up Vue 3 project with Vite
2. Implement Composition API patterns
3. Create reusable components with TypeScript
4. Add Vue Router for navigation
5. Implement Pinia for state management
6. Add form validation with Vuelidate
7. Create custom composables for reusable logic
8. Implement responsive design with Tailwind CSS
9. Add unit and E2E testing
10. Configure build optimization and deployment

Focus on:
- Vue 3 Composition API best practices
- TypeScript integration
- Component communication patterns
- Performance optimization
- Testing strategies
- Code organization and maintainability

Start with the project setup and build features systematically.`,
    estimatedTime: '3-5 hours',
    difficulty: 'Intermediate',
    tags: ['vue', 'frontend', 'typescript', 'composition-api']
  },

  // Backend Development Templates
  'express-api': {
    name: 'Express.js REST API',
    description: 'Build a robust REST API with Express.js',
    category: 'Backend',
    instructions: `Create a production-ready REST API using Express.js:

1. Set up Express.js project with TypeScript
2. Implement proper project structure (routes, controllers, services, models)
3. Add input validation with Joi or Yup
4. Implement authentication and authorization (JWT)
5. Add database integration (MongoDB/PostgreSQL with Prisma)
6. Create comprehensive error handling middleware
7. Add request logging and monitoring
8. Implement rate limiting and security middleware
9. Add API documentation with Swagger/OpenAPI
10. Set up testing with Jest and Supertest
11. Configure deployment and environment management

API requirements:
- RESTful design principles
- Proper HTTP status codes
- JSON API specification compliance
- Pagination and filtering
- Caching strategies
- Background job processing
- API versioning strategy

Start with basic CRUD operations and expand to advanced features.`,
    estimatedTime: '4-6 hours',
    difficulty: 'Intermediate',
    tags: ['express', 'backend', 'rest-api', 'typescript']
  },

  'fastapi-app': {
    name: 'FastAPI Application',
    description: 'Build a high-performance API with FastAPI',
    category: 'Backend',
    instructions: `Create a high-performance API using FastAPI with Python:

1. Set up FastAPI project with proper structure
2. Implement Pydantic models for data validation
3. Add SQLAlchemy for database operations
4. Implement authentication with OAuth2/JWT
5. Create dependency injection system
6. Add background tasks and WebSocket support
7. Implement proper error handling and logging
8. Add API documentation with automatic OpenAPI generation
9. Set up testing with pytest
10. Configure deployment with Docker and CI/CD

Focus on:
- Async/await patterns for performance
- Type hints and data validation
- Dependency injection
- Middleware and CORS handling
- Database optimization
- API documentation
- Testing and code quality

Start with basic endpoints and build advanced features incrementally.`,
    estimatedTime: '3-5 hours',
    difficulty: 'Intermediate',
    tags: ['fastapi', 'python', 'backend', 'async']
  },

  // Mobile Development Templates
  'react-native-app': {
    name: 'React Native Mobile App',
    description: 'Build a cross-platform mobile app',
    category: 'Mobile',
    instructions: `Create a cross-platform mobile application using React Native:

1. Set up React Native project with Expo or CLI
2. Implement navigation with React Navigation
3. Create reusable components and screens
4. Add state management with Redux Toolkit or Context API
5. Implement data persistence (AsyncStorage/SQLite)
6. Add form validation and error handling
7. Implement push notifications
8. Add camera and media handling
9. Implement offline functionality
10. Set up testing and CI/CD for mobile

Mobile-specific considerations:
- Platform-specific code and styling
- Performance optimization for mobile
- Battery and memory management
- Offline data synchronization
- App store deployment preparation

Start with basic screens and navigation, then add advanced features.`,
    estimatedTime: '5-7 hours',
    difficulty: 'Advanced',
    tags: ['react-native', 'mobile', 'cross-platform', 'expo']
  },

  // DevOps & Infrastructure Templates
  'docker-setup': {
    name: 'Docker Development Environment',
    description: 'Set up a complete Docker development environment',
    category: 'DevOps',
    instructions: `Create a comprehensive Docker development environment:

1. Design multi-service architecture (app, database, cache, etc.)
2. Write optimized Dockerfiles for each service
3. Create docker-compose.yml for local development
4. Implement environment-specific configurations
5. Add volume management for data persistence
6. Set up networking between services
7. Implement health checks and restart policies
8. Add logging and monitoring
9. Create development and production variants
10. Set up CI/CD pipeline with Docker

DevOps best practices:
- Multi-stage Docker builds for optimization
- Security scanning and vulnerability management
- Environment variable management
- Secret management
- Backup and recovery strategies
- Performance monitoring and optimization

Start with a simple setup and scale to production requirements.`,
    estimatedTime: '3-4 hours',
    difficulty: 'Intermediate',
    tags: ['docker', 'devops', 'infrastructure', 'ci-cd']
  },

  // Data Science & ML Templates
  'ml-pipeline': {
    name: 'Machine Learning Pipeline',
    description: 'Build an end-to-end ML pipeline',
    category: 'Data Science',
    instructions: `Create an end-to-end machine learning pipeline:

1. Set up Python environment with required libraries
2. Implement data ingestion and preprocessing
3. Create feature engineering pipeline
4. Build and train machine learning models
5. Implement model evaluation and validation
6. Create model deployment infrastructure
7. Add monitoring and performance tracking
8. Implement A/B testing framework
9. Create automated retraining pipeline
10. Set up model versioning and rollback

ML pipeline components:
- Data validation and quality checks
- Feature store implementation
- Model registry and versioning
- Automated testing for ML models
- Performance monitoring and alerting
- Bias detection and fairness assessment
- Explainability and interpretability

Start with data exploration and build the pipeline incrementally.`,
    estimatedTime: '6-8 hours',
    difficulty: 'Advanced',
    tags: ['machine-learning', 'python', 'data-science', 'mlops']
  },

  // Testing & Quality Assurance Templates
  'testing-suite': {
    name: 'Comprehensive Testing Suite',
    description: 'Implement a complete testing strategy',
    category: 'Quality Assurance',
    instructions: `Create a comprehensive testing suite for a software project:

1. Set up testing framework and tools
2. Implement unit tests for all functions and methods
3. Create integration tests for API endpoints
4. Add end-to-end tests for critical user flows
5. Implement performance and load testing
6. Add security testing and vulnerability scanning
7. Create automated testing pipeline
8. Implement test data management
9. Add code coverage reporting and analysis
10. Set up test environment management

Testing strategy should include:
- Test-driven development (TDD) approach
- Behavior-driven development (BDD) for acceptance tests
- Property-based testing for edge cases
- Visual regression testing for UI components
- Accessibility testing
- Cross-browser compatibility testing

Start with unit tests and expand to comprehensive test coverage.`,
    estimatedTime: '4-5 hours',
    difficulty: 'Intermediate',
    tags: ['testing', 'quality-assurance', 'tdd', 'automation']
  }
};

// Template categories for organization
export const TEMPLATE_CATEGORIES = [
  'Frontend',
  'Backend',
  'Full-Stack',
  'Mobile',
  'DevOps',
  'Data Science',
  'Quality Assurance'
];

// Helper functions
export const getTemplatesByCategory = (category) => {
  return Object.entries(AGENT_TEMPLATES)
    .filter(([_, template]) => template.category === category)
    .map(([key, template]) => ({ id: key, ...template }));
};

export const getTemplateById = (id) => {
  return AGENT_TEMPLATES[id] ? { id, ...AGENT_TEMPLATES[id] } : null;
};

export const searchTemplates = (query) => {
  const lowercaseQuery = query.toLowerCase();
  return Object.entries(AGENT_TEMPLATES)
    .filter(([_, template]) =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
    .map(([key, template]) => ({ id: key, ...template }));
};

export const getPopularTemplates = () => {
  // Return templates sorted by estimated usage/popularity
  const popularOrder = [
    'react-app',
    'express-api',
    'nextjs-app',
    'vue-app',
    'fastapi-app',
    'docker-setup',
    'react-native-app',
    'testing-suite',
    'ml-pipeline'
  ];

  return popularOrder
    .filter(id => AGENT_TEMPLATES[id])
    .map(id => ({ id, ...AGENT_TEMPLATES[id] }));
};