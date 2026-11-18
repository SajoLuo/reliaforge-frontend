# Frontend development

[简体中文](zh/development.md)

The console manages plugins installed in a ReliaForge backend. Plugin-specific service interfaces
belong to their authors; a runbook is one possible plugin service.

## Request flow

```text
Page -> hook -> API function -> HTTP client -> backend
```

Pages render data and user actions. Hooks own loading, errors, retries, cancellation, and local
action state. API functions validate responses and return data rather than Axios objects.

Normal builds use the HTTP adapter. The online demo uses a static adapter with saved data. Pages and
hooks use the same interfaces in both builds.

## Routes and languages

The console has four routes:

- `/` — backend summary;
- `/plugins` — plugin list;
- `/plugins/{plugin_id}` — plugin details;
- `/about` — project and setup links.

English uses these routes directly. Simplified Chinese adds `/zh`, such as
`/zh/plugins/{plugin_id}`. Normal builds use `BrowserRouter`; demo builds use `HashRouter`.

`LocaleProvider` reads the language from the URL. Switching languages keeps the current page and
query string. Add every client-generated user message to both locale dictionaries. Do not translate
plugin IDs, capability names, schema keys, API values, or text returned by the backend.

## Configuration

`VITE_RELIAFORGE_API_URL` is the only supported browser build variable. Use `.env.example` for
cross-origin local development. If the variable is absent, the client calls same-origin `/api/v1`.
Browser build variables are public and must not contain secrets.

## Demo build

```bash
npm run build:demo
npm run preview:demo
npm run test:e2e:demo
```

The [online demo](https://demo.reliaforge.dev/) validates the same response shapes as a normal
build. It reads separate copies of saved `demo` and `runbook` data, offers no lifecycle actions, and
makes no API requests. Use the
[project quick start](https://reliaforge.dev/guide/getting-started.html) to run the backend locally.

## Add a UI feature

1. Add or update the type in `src/types`.
2. Add response validation and an API function in `src/api`.
3. Call it from a hook.
4. Render loading, error, empty, and success states.
5. Add a unit test and a browser test for an important operator journey.

Lifecycle buttons must come from `available_actions`; pages and hooks do not derive them from plugin
state. Async hooks cancel superseded requests and ignore results after unmount. Successful reads
and actions record when the displayed data was obtained.

If a lifecycle request loses its response or returns a server/gateway error, the console reports an
unconfirmed result and reads the plugin state once. It never retries the write automatically.
The warning remains visible across manual refreshes; a state read alone cannot identify the result
of that particular request.
The action request timeout remains 310 seconds; ordinary reads use 10 seconds.
