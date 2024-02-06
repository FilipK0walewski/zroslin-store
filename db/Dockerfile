FROM postgres:alpine

# Set environment variables
ENV POSTGRES_USER=zroslin
ENV POSTGRES_PASSWORD=zroslin
ENV POSTGRES_DB=zroslin

# Copy initialization SQL script
COPY init.sql /docker-entrypoint-initdb.d/