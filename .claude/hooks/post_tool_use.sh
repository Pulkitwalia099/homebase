#!/bin/bash
# Auto-validation hook after file edits
EDITED="$CLAUDE_TOOL_INPUT_PATH"

if [[ "$EDITED" == *"packages/scoping"* ]] || [[ "$EDITED" == *"prompts/scoping"* ]]; then
  echo "Scoping file changed — running classification tests..."
  cd packages/api && python -m pytest tests/scoping_scenarios/ -x --tb=short 2>&1 | tail -20
fi

if [[ "$EDITED" == *"packages/db/models"* ]]; then
  echo "DB model changed — checking for unapplied migrations..."
  alembic check 2>&1
fi
