#!/bin/bash
# Release script wrapper
#
# Usage:
#   ./release.sh patch    # 1.0.0 -> 1.0.1
#   ./release.sh minor    # 1.0.0 -> 1.1.0  
#   ./release.sh major    # 1.0.0 -> 2.0.0
#   ./release.sh 1.2.3    # Set specific version

node scripts/release.js "$@"