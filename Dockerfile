# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy parent POM and core module first for better layer caching
COPY pom.xml .
COPY core/pom.xml ./core/
COPY core/src ./core/src
COPY frontend ./frontend

# Copy all plugin modules
COPY plugins ./plugins

# Build the entire project (core + all plugins)
# Maven will: 1) Install Node/npm, 2) Build React app, 3) Copy to static/, 4) Build Spring Boot jar with plugins
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy the built jar (contains both backend and frontend)
COPY --from=build /app/core/target/*.jar app.jar

# Create directories for plugins and data
RUN mkdir -p /app/plugins /app/data

# Copy built plugin JARs to the runtime plugins directory
COPY --from=build /app/plugins/*/target/*.jar /app/plugins/

# Expose port (will be accessed via reverse proxy)
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
