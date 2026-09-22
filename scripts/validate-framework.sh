#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "README.md"
  "README.ar.md"
  "AGENTS.md"
  "CONTRIBUTING.md"
  "SECURITY.md"
  "LICENSE"
  "docs/00-START-HERE.md"
  "docs/OPERATING-MODEL.md"
  "docs/product/PRODUCT-BRIEF.md"
  "docs/product/PRD.md"
  "docs/product/USER-FLOWS.md"
  "docs/architecture/DOMAIN.md"
  "docs/architecture/ARCHITECTURE.md"
  "docs/architecture/DATA-MODEL.md"
  "docs/architecture/adr/ADR-TEMPLATE.md"
  "docs/security/THREAT-MODEL.md"
  "docs/testing/TEST-STRATEGY.md"
  "docs/delivery/DEFINITION-OF-READY.md"
  "docs/delivery/DEFINITION-OF-DONE.md"
  "docs/delivery/TASK-TEMPLATE.md"
  "docs/delivery/RELEASE-CHECKLIST.md"
  "prompts/01-discovery.md"
  "prompts/02-plan-task.md"
  "prompts/03-implement-task.md"
  "prompts/04-code-review.md"
  "prompts/05-security-review.md"
  "prompts/06-refactor.md"
  "prompts/07-release-review.md"
)

failed=0
for file in "${required_files[@]}"; do
  if [[ ! -s "$file" ]]; then
    echo "ERROR: required file missing or empty: $file" >&2
    failed=1
  fi
done

# Guard against accidental committed secrets commonly copied into examples.
if grep -RInE --exclude-dir=.git --exclude='validate-framework.sh' \
  '(BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY|aws_secret_access_key[[:space:]]*=|ghp_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9]{30,})' .; then
  echo "ERROR: possible secret material detected." >&2
  failed=1
fi

# Ensure executable shell files parse.
while IFS= read -r -d '' script; do
  bash -n "$script"
done < <(find scripts -type f -name '*.sh' -print0)

if [[ "$failed" -ne 0 ]]; then
  exit 1
fi

echo "Framework validation passed."
