#!/bin/sh
set -eu
case "$FORMS_ENDPOINT" in https://forms.stg.bringmesunshinegroup.com|https://forms.bringmesunshinegroup.com) ;; *) echo 'forms endpoint configuration required' >&2; exit 1;; esac
printf '{"forms_endpoint":"%s"}\n' "$FORMS_ENDPOINT" > /usr/share/nginx/html/contact-config.json
