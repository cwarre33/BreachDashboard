# `/scripts` Directory Documentation

## Purpose
This directory contains utility scripts and CI/CD automation tools to support the Cybersecurity Breach Dashboard project.

## Directory Structure
```
/scripts
├── ci
│   ├── backend-test.sh
│   ├── frontend-build.sh
│   └── deploy-staging.sh
├── db
│   ├── backup.sh
│   └── migrate.sh
├── dev
│   ├── setup-local-env.sh
│   └── generate-mock-data.sh
└── utils
    ├── code-quality.sh
    └── dependency-audit.sh
```

## Script Categories

### CI/CD Scripts (`/scripts/ci`)
- `backend-test.sh`: Runs comprehensive backend test suite
- `frontend-build.sh`: Builds frontend application
- `deploy-staging.sh`: Deploys application to staging environment

### Database Scripts (`/scripts/db`)
- `backup.sh`: Creates database backups
- `migrate.sh`: Manages database schema migrations

### Development Utility Scripts (`/scripts/dev`)
- `setup-local-env.sh`: Configures local development environment
- `generate-mock-data.sh`: Generates sample data for testing

### Utility Scripts (`/scripts/utils`)
- `code-quality.sh`: Runs static code analysis
- `dependency-audit.sh`: Checks for security vulnerabilities in dependencies

## Usage Guidelines
1. Always make scripts executable: `chmod +x script-name.sh`
2. Add comments explaining the purpose and usage
3. Handle error cases and provide meaningful exit codes
4. Use environment variables for configuration

## Example Script Template
```bash
#!/bin/bash

# Descriptive header with script purpose
# Author: Your Name
# Date: YYYY-MM-DD

# Exit on error
set -e

# Environment configuration
PROJECT_ROOT=$(dirname "$(dirname "$(readlink -f "$0")")")
ENV_FILE="${PROJECT_ROOT}/.env"

# Load environment variables
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
fi

# Main script logic
main() {
    echo "Running script: $(basename "$0")"
    # Script implementation
}

# Error handling
error_handler() {
    echo "Error occurred in $(basename "$0")"
    exit 1
}

# Trap errors
trap error_handler ERR

# Execute main function
main "$@"
```

## Best Practices
- Keep scripts simple and focused
- Use meaningful variable and function names
- Add logging and error handling
- Make scripts idempotent when possible
- Document script dependencies
