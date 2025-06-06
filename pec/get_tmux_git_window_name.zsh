#!/bin/bash

# Check if the current directory is inside a git repository
if git rev-parse --is-inside-work-tree &>/dev/null; then
  # Get the git repository name
  repo_name=$(basename "$(git rev-parse --show-toplevel)")
  # Get the current branch name
  branch_name=$(git symbolic-ref --short HEAD 2>/dev/null || echo "(detached)")
  echo "$repo_name:$branch_name"
fi
