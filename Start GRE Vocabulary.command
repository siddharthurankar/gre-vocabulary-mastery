#!/bin/zsh
cd "${0:A:h}"
if ! command -v python3 >/dev/null; then
  print 'Install Python 3, then open this launcher again.'
  read '?Press Enter to close.'
  exit 1
fi
python3 start.py
