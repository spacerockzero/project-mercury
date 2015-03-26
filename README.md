# Project Mercury
> Perf-testing and metrics-displaying utility app

# Why?
- We need a big, coordinated push to make our site performance exceptional
- We are surrounded by excellent engineers, with a lot of knowledge and experience
- This app gives constructive and actionable feedback on specific page attributes and performance offenders

- It does synthetic performance audits of web pages
- delivers the same kind of audits I would do by hand
- Currently uses Phantomas (PhantomJS perf runner)
- Uses ExpressJS, WebComponents in Polymer, materialize.css
- I can manually trigger suites of tests
- Or it can be triggered from a webhook, such as a merge to master or deploy (in dev)
- can test auth'd pages using existing test user session on beta only

## Critical Metrics
- will be compared against a global perf budgets soon

## Offenders
- know what items to fix, to improve your page's performance

## Adding a url or app:
- if you need a page added to your app's section, submit a pull request to this file for now:
https://github.com/spacerockzero/project-mercury/blob/master/config/sites.js
- I have plans to put the site, rules, and performance budget into the db and use a UI to alter them in the future, but I also have to set up github oath for your configured github groups to do that.

# Future work:
- grade urls against perf budget
- UI for the site configs, and config saved in db instead of static file
- charts for metrics over time
- show which offenders you have fixed, instead of them disappearing
- Definitions for offenders and metrics, also instructions on fixing the issues
- run YSlow, PageSpeed, and WebpageTest runs as well
- URL details page with more data details

### Overview
To get started,
```
git clone
npm install
foreman start -f Procfile.dev
```
> This app is configured to run on Heroku servers, and uses Heroku-specific commands and config locally.
> Using the dev Procfile locally also runs the initial gulp build step, and a watcher for future changes on client-side files.

### env file:
- The .env file is not included in the repo code, because your config should be independent of your source.
- Local .env file and in heroku app config settings:

```
NODE_ENV='development'
```
**(mandatory)** tells app to run in development mode or production mode

```
MONGOLAB_URI=********
```
**(mandatory)** Full connection URL and password string of your mongodb connection. Doesn't have to be MONGOLAB service. just a valid mongo:// connection url string

```
API_EXPIRES=3600
```
**(optional, default = 0)** Number of seconds to set max-age headers on all app.get() resources, templates, and internal API route calls (should be lower than asset expires number. choose this wisely)

```
ASSET_EXPIRES=86400
```
**(optional, default = 0)** Number of seconds to set max-age headers on all client-side asset resources (again, choose wisely)

