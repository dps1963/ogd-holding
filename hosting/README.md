# ogd public website release

Source: this repository only. Product application deployment is separate.

1. From a clean checkout run `python3 hosting/build.py`.
2. Build `docker build --network=none -t <immutable-release-tag> .`.
3. Configure FORMS_ENDPOINT for the selected environment and ROBOTS_HEADER (`noindex, nofollow` on staging).
4. Deploy only this website's `web` service, with its own Compose project and immutable image. Never run a whole-estate deploy.
5. Verify `/health`, HTTPS, homepage/contact/privacy, assets, donation links, canonical URLs and noindex/indexing policy.
6. Roll back only this service to the prior immutable image/configuration. Keep prior images and Pages source available.

Forms uses `/api/v1/forms`; contact-v1.js and CSS are vendored version 1.0.0. No runtime shared source. This website never reads a product or platform database. Its outage does not restart Forms, CRM, Email or another website. HTML cache is five minutes; contact configuration is never cached. Source changes do not alter DNS automatically. Current staging URL: https://ogd-public.stg.bringmesunshinegroup.com/ . Production cutover remains blocked by the migration acceptance gates.
