#!/bin/bash
# Wrapper script to run the Websets MCP server via Docker Compose.
# Fetches EXA_API_KEY from Google Cloud Secret Manager if not already set.

set -e

if [ -z "$EXA_API_KEY" ]; then
    PROJECT_ID="google-cloud-project-name"
    SECRET_NAME="EXA_API_KEY"

    export EXA_API_KEY=$(gcloud secrets versions access latest --secret="$SECRET_NAME" --project="$PROJECT_ID" 2>/dev/null)

    if [ -z "$EXA_API_KEY" ]; then
        echo "Error: Failed to fetch EXA_API_KEY from Secret Manager" >&2
        echo "Set EXA_API_KEY in your environment or authenticate with gcloud." >&2
        exit 1
    fi
fi

exec docker compose up --build "$@"
