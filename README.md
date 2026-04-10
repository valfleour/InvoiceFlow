# InvoiceFlow

## GitHub profile switching

Use `npm run github:profile -- list` to see which GitHub accounts Git knows about and which one this repo prefers.

Use `npm run github:profile -- login <username>` to add another GitHub account without removing the current one.

Use `npm run github:profile -- use <username>` to make this repo prefer a specific GitHub account for pushes.

Use `npm run github:profile -- clear` to remove the repo-specific preference and fall back to Git Credential Manager's default selection.
