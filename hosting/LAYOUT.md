# Site presentation

index.html is the authored source for this site’s existing brand styles, header and footer. hosting/contact-form.html owns the accessible Forms markup. Edit those sources, then run `python3 hosting/render-pages.py` to regenerate contact.html and the legal presentation wrappers. The script refuses changed legal article hashes. `python3 hosting/render-pages.py --check` is enforced by the isolated site build.

Policy article text remains owned by the central BMSG legal release and generator, never this presentation script. All staging consumers currently pin release 2026-09-18.1. Generate central policy changes first, then render the site wrappers and run the legal release verifier in a clean checkout. No runtime dependency on another website is introduced.
