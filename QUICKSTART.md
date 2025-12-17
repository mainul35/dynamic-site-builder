# Flashcard CMS - Quick Start Guide

## What This Is

This is a plugin-based CMS platform for managing flashcards, courses, and lessons. The system consists of:

- **Core Application** (`core`) - Main Spring Boot application
- **Plugin SDK** (`flashcard-cms-plugin-sdk`) - Framework for building plugins
- **Bundled Plugins** (`plugins/`) - Course, Lesson, and Flashcard management plugins

## Prerequisites

- Java 21 or higher
- Maven 3.8+
- Node.js 20.10+ (for frontend)

## Quick Start

### 1. Start the Application

```bash
cd core
mvn spring-boot:run
```

The application will:
- Build the React frontend
- Start on http://localhost:8080
- Create an H2 database at `./data/flashcarddb`
- Initialize all tables using Hibernate

### 2. Access the Application

- **Frontend**: http://localhost:8080
- **REST API**: http://localhost:8080/api/
- **H2 Console**: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:file:./data/flashcarddb`
  - Username: `sa`
  - Password: (leave empty)

## Available API Endpoints

### Courses

```bash
# Get all courses
curl http://localhost:8080/api/courses

# Create a course
curl -X POST http://localhost:8080/api/courses \
  -H "Content-Type: application/json" \
  -d '{"title":"Introduction to Java","description":"Learn Java basics","displayOrder":1}'

# Get course by ID
curl http://localhost:8080/api/courses/1

# Search courses
curl "http://localhost:8080/api/courses/search?keyword=java"
```

### Modules

```bash
# Get all modules
curl http://localhost:8080/api/modules

# Get modules by course
curl http://localhost:8080/api/modules/course/1
```

### Lessons

```bash
# Get all lessons
curl http://localhost:8080/api/lessons
```

### Flashcards

```bash
# Get all decks
curl http://localhost:8080/api/decks

# Get all flashcards
curl http://localhost:8080/api/flashcards
```

## Configuration

Located in `core/src/main/resources/application.properties`:

```properties
# Server
server.port=8080

# Database
spring.datasource.url=jdbc:h2:file:./data/flashcarddb

# JPA/Hibernate (IMPORTANT: use 'update' for auto schema management)
spring.jpa.hibernate.ddl-auto=update

# Plugin System
app.plugin.directory=plugins
app.plugin.hot-reload.enabled=true
```

## Important Notes

### Database Configuration

The application uses **`spring.jpa.hibernate.ddl-auto=update`** which automatically creates/updates database tables based on JPA entities. This was changed from `validate` to avoid schema validation errors on first startup.

### Plugin System

The Plugin Manager is initialized on startup and looks for plugins in the `plugins/` directory. Currently, the bundled plugins (course-plugin, lesson-plugin, flashcard-plugin) are compiled as separate JARs but integrated into the main application.

## Troubleshooting

### Issue: "Schema-validation: missing table" error

**Solution**: The configuration has been updated to use `spring.jpa.hibernate.ddl-auto=update` instead of `validate`. This allows Hibernate to create missing tables automatically.

### Issue: Port 8080 already in use

**Solution**: Change the port in `application.properties`:
```properties
server.port=8081
```

### Issue: Old database schema

**Solution**: Delete the database and restart:
```bash
rm -rf data/flashcarddb.mv.db
cd core
mvn spring-boot:run
```

## Development

### Building the SDK

The Plugin SDK must be built first before building plugins or the main app:

```bash
cd flashcard-cms-plugin-sdk
mvn clean install
```

### Building Everything

From the root directory:

```bash
mvn clean install
```

This builds:
1. Plugin SDK
2. All plugins (course, lesson, flashcard)
3. Main application

### Hot Reload

Spring Boot DevTools is enabled for automatic restart when code changes. The application will automatically reload when you make changes.

## Project Structure

```
core/
├── flashcard-cms-plugin-sdk/    # Plugin SDK library
├── core/                # Main Spring Boot application
├── plugins/
│   ├── course-plugin/            # Course management
│   ├── lesson-plugin/            # Lesson management
│   └── flashcard-plugin/         # Flashcard management
├── frontend/                     # React frontend
└── pom.xml                       # Parent POM
```

## Next Steps

1. ✅ **Read the Plugin SDK documentation**: [flashcard-cms-plugin-sdk/README.md](flashcard-cms-plugin-sdk/README.md)
2. ✅ **Study the example plugin**: [plugins/course-plugin/README.md](plugins/course-plugin/README.md)
3. **Explore the API**: Use the REST endpoints to interact with the system
4. **Build your own plugin**: Follow the SDK guide to create custom plugins

## Security

Currently, Spring Security is configured with a generated password shown in the logs:

```
Using generated security password: [password-here]
```

Use username `user` with the generated password for authenticated requests.

For production, update the security configuration in the main application.

## Support

- **Plugin SDK Guide**: See `flashcard-cms-plugin-sdk/README.md`
- **Plugin Example**: See `plugins/course-plugin/README.md`
- **Issues**: Check application logs for detailed error messages

---

**Status**: ✅ Application is running and ready for development!
