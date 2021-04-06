# Invoice Wizzard
Simple invoice manager using Svelte and Electron Forge ()

## How to use
1. Change the `public/private/invoice.json.template` to `public/private/invoice.json`
and the `public/private/content.json.template` to `public/private/content.json`.
2. Then edit the `public/private/content.json` file to add your private business info and defaults.

#### Note: Never push any files from `/public/private` folder to github (check .gitignore)

## Furthur development

This app was originally made without a framework, so most code has to be rewritten to use the advantages of Svelte and Electron. This setup has been chosen for ease of use. Svelte is a great frontend framework for readable code, offering a complete package of tools to speed up development of a great looking, ultra-fast & small-sized app. Great dev-experience. Electron offers the possibility to save pdf to disk and is easy to setup.

### To Do:
 - Cleanup
 - One-time setup wizzard for uploading logo, contact info and details
 - Embedded DB to store invoices
 - Deployment