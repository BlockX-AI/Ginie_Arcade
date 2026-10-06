#!/bin/bash

echo "Setting up Ginix Arcade Database..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Please install Docker first."
    echo "   Visit: https://www.docker.com/get-started"
    exit 1
fi

# Check if PostgreSQL container already exists
if docker ps -a | grep -q ginix-postgres; then
    echo "Found existing ginix-postgres container"
    
    # Check if it's running
    if docker ps | grep -q ginix-postgres; then
        echo "PostgreSQL is already running"
    else
        echo "Starting PostgreSQL container..."
        docker start ginix-postgres
        sleep 2
        echo "PostgreSQL started"
    fi
else
    echo "Creating new PostgreSQL container..."
    docker run --name ginix-postgres \
        -e POSTGRES_PASSWORD=ginix123 \
        -e POSTGRES_DB=ginix_arcade \
        -p 5432:5432 \
        -d postgres:14
    
    echo "Waiting for PostgreSQL to start..."
    sleep 5
    echo "PostgreSQL container created and running"
fi

echo ""
echo "Database Configuration:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: ginix_arcade"
echo "   Username: postgres"
echo "   Password: ginix123"
echo ""
echo "Connection String:"
echo "   postgresql://postgres:ginix123@localhost:5432/ginix_arcade"
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo ".env file already exists"
    echo "   Make sure DATABASE_URL is set to:"
    echo "   DATABASE_URL=\"postgresql://postgres:ginix123@localhost:5432/ginix_arcade\""
else
    echo "Creating .env file from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        sed -i 's|postgresql://user:password@localhost:5432/ginix_arcade|postgresql://postgres:ginix123@localhost:5432/ginix_arcade|' .env
        echo ".env file created from .env.example"
    else
        echo "No .env.example found. Please create .env manually."
    fi
fi

echo ""
echo "Setting up Prisma..."
npx prisma generate
echo "Prisma client generated"
echo ""

echo "Pushing database schema..."
npx prisma db push
echo "Database schema created"
echo ""

echo "Seeding database..."
npm run db:seed
echo "Database seeded"
echo ""

echo "Database setup complete!"
echo ""
echo "Next steps:"
echo "   1. Update contract addresses in .env (if not already set)"
echo "   2. Set BACKEND_SIGNER_KEY in .env"
echo "   3. Run: npm run dev"
echo "   4. Visit: http://localhost:3000"
echo ""
