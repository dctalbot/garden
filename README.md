# garden

Hi, this is where the source code for the McCarren Park Demo Garden's website lives.

McCarren Park is a public park in North Brooklyn, New York, and the garden is a community space within the park. The garden and its website are maintained by volunteers.

## Development

There are some canonical dev commands available in the `Makefile`. You can learn about them by runnng `make help`.

### Tech stack:

- TypeScript, Node, JavaScript
- Astro build system
- Tailwind CSS

### Instagram integration

There is an hourly cron job on github actions which fetches our instagram account's media. If it finds any new images, it commits them to the repo and re-deploys the site. By persisting these images, we greatly reduce the chance that some issue with API authn/z will break the site.
