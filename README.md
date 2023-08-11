# 📝 entry

Certain features of this README only work on Entry! You can view this README [here](https://www.sentrytwo.com/what)

***

Entry is a lightweight and anonymous Markdown pastebin written in TypeScript that allows for publishing Markdown documents with Markdown preview, easy editing, quick deletion, custom URLs and [many more features](#features).

Entry uses the [Bun](https://bun.sh) runtime. Pastes are stored in an SQLite database using the [Bun SQLite3 API](https://bun.sh/docs/api/sqlite).

The official Entry instance is hosted at [sentrytwo.com](https://sentrytwo.com), but any instance can interact with any other instance through the basic decentralization support provided by Entry.

***

[TOC]

***

## Install

- Make sure you have [Bun installed](https://bun.sh/docs/installation)
    - Bun only runs on unix and unix-like systems (Linux, MacOS)
    - One of these systems is required to host the server, but it can be viewed by anyone on any system
- Clone the repository and run `bun install` to install dependencies
- Start the server with `bun run start`

Entry can also be installed using Docker. Follow [these instructions](https://www.sentrytwo.com/docs/docker) to get started.

## Usage

Once installed you can start (and build) the server using `bun run start`, to just build do `bun run build`.

Manually launch once after installing to start the setup prompts. These will allow you to set an admin password and define a different port.

## Compatibility

Entry was originally written as a replacement for [Rentry](https://rentry.co). Entry supports all Rentry features with (almost) 1:1 compatibility. There are a few differences:

| Rentry                                                                                                                       | Entry                                                                                                                                                                                                       |
|------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| When deleting pastes, Rentry uses `POST /api/edit` with `{ delete: "delete" }`                                               | Entry uses `POST /api/delete`                                                                                                                                                                               |
| Rentry supports exporting pastes as a pdf, image, or Markdown file                                                           | Entry only supports exporting as a raw Markdown file or a rendered HTML file                                                                                                                                |
| Rentry uses [Python-Markdown](https://github.com/Python-Markdown/markdown) for Markdown rendering, and renders on the server | Entry uses [Marked](https://marked.js.org/) (with some changes after) and renders an initial render on the server, and then finishes on the client. Entry only renders fully on client for editing previews |

Entry supports extra features that Rentry does not support. They are detailed below.

## Features

### API

- `POST /api/new`, Create a new paste, expects FormData with the fields: `Content, CustomURL, EditPassword, ViewPassword, ExpireOn, GroupName, GroupSubmitPassword`
- `POST /api/edit`, Edit an existing paste, expects FormData with the fields: `OldContent, OldCustomURL, OldEditPassword, NewContent, NewCustomURL, NewEditPassword`
- `POST /api/delete`, Delete an existing paste, expects FormData with the fields: `CustomURL, EditPassword`
- `POST /api/decrypt`, Decrypt an encrypted paste, expects FormData with the fields: `ViewPassword, CustomURL`
- `POST /api/markdown`, Render any markdown to HTML using the Entry renderer (based on [Marked](https://marked.js.org))
- `GET  /api/get/{paste}`, Get an existing paste
- `GET  /api/raw/{paste}`, Get raw paste content
- `GET  /api/html/{paste}`, Get rendered paste content
- `GET  /api/group/{group}`, Get all pastes in specified group

#### Admin Endpoints

- `POST /admin/api/delete`, Delete paste, expects FormData with the fields: `AdminPassword, CustomURL`
- `POST /admin/api/export`, Get JSON of all pastes in server (decrypted): `AdminPassword`
- `POST /admin/api/import`, Import pastes JSON: `AdminPassword, pastes` (with `paste` being the JSON export from `/admin/api/export`)
- `POST /admin/api/mass-delete`, delete pastes by sql query: `AdminPassword, pastes`
- `POST /admin/api/sql`, directly run sql on the server: `AdminPassword, sql, get, all` (`get` and `all` represent the type of operation, `get` returns one result while `all` returns... all results)

### (very basic) Decentralization

!!! note Encryption
Decentralization does not work with encrypted pastes.

Entry supports very basic decentralization, meaning you can view and edit pastes from other servers on your server.

To view pastes from other servers, you open them the same way (`example.com/paste`) you normally do, but add an `:` symbol and then the hostname of the other server. Example: `example.com/paste:example2.com`

In this example, we are viewing the paste `paste` from the server `example2.com` on the server `example.com`. Editing and deleting pastes is also available for pastes from a different server. Decentralization **only** supports HTTPS, it is assumed that any secondary server provided is using HTTPS, and the request will fail if it is not.

Pastes cannot normally include any special characters besides `-` and `_`, meaning there should not be any URL conflicts.

Entry servers also export a [nodeinfo](http://nodeinfo.diaspora.software/) file. An example can be seen [here](https://www.sentrytwo.com/.well-known/nodeinfo/2.0). This file details information about the server to other distributed servers, such as the number of pastes created.

### Encryption

!!! note Security
Encrypted pastes are NOT fully private from the server owner, but they are from other users!

Pastes can be made "private" by encrypting them. This means that only people with your specified `ViewPassword` can decrypt and view the paste. The `ViewPassword` is also required to properly edit the paste.

Encrypted pastes cannot be decrypted from other servers, and the paste decryption form will not be shown. This is because the values for the decryption process are stored on the server (`IV`, `Key`, `AuthCode`), and it is not safe to send them back through HTTP. These values are only read when the server selects the record based on the `ViewPassword` and the `CustomURL`.

```typescript
// GetEncryptionInfo, EntryDB.ts
// get encryption values by view password and customurl
const record = (await SQL.QueryOBJ({
    db: this.db,
    query: `SELECT * FROM Encryption WHERE ViewPassword = ? AND CustomURL = ?`,
    params: [ViewPassword, CustomURL],
    get: true,
    use: "Prepare",
})) as Paste | undefined;
```

Values are regenerated when an encrypted paste is edited.

### Paste Expiration

When creating a paste, you can set to have your paste expire at a given time and date. When this time comes, your paste will automatically be deleted by Entry. This is useful if you don't set an edit password on your paste and are unable to delete it. Information about expired pastes is not kept after their deletion, and their custom URL because open again once they expire.

### Admin Panel

Entry provides an admin panel that is locked behind a set password that allows the server owner to manage pastes on their server quickly and easily. The admin password is set on initial configuration, and stored (plain text) in `data/config.json` with the key `admin`.

#### Logs

Through the admin panel, you can view certain logs that are automatically saved whenever the event occurs on the server. These logs are not sent from the client. Logs can be set to automatically be deleted when the server exists using the `log.clear_on_start` option in the server `config.json` file. No events are enabled by default.

The following options can be used as events:

- create_paste, fires when a paste is created on the server (`Content` is the paste CustomURL)
- edit_paste, fires when a paste is edited on the server (`Content` is the old CustomURL and the new CustomURL)
- delete_paste, fires when a paste is deleted on the server (`Content` is the paste CustomURL)
- generic, random events (most likely never used)

An example that doesn't clear logs on restart and has all events enabled looks like this:

```json
{
    ...
    "log": {
        "clear_on_start": false,
        "events": ["create_paste", "edit_paste", "delete_paste", "generic"]
    }
    ...
}
```

### Customization

Every color is customizable through simple CSS variables. You can customize the background using the `--base-hue`, `--base-sat` and `--base-lit` variables. The background is normally in `hsl` format, while other colors are in hex. Many of these values can be controlled using specific [Special Elements](#special-elements).

- `--base-hue`, The base hue of the background, `int`
- `--base-sat`, The base saturation of the background, `percentage`
- `--base-lit`, The base lightness of the background, `percentage`

Some examples are includes in the base stylesheet. The example below creates a purple theme.

```css
html.purple-theme {
    --base-hue: 255;
    --base-sat: 50%;
}
```

#### Special Elements

You can customize the way your pastes are displayed using some custom elements.

- `<hue>`, the hue element allows you to control the hue of the page when your paste is rendered. It expects an `integer`.
- `<sat>`, the sat element allows you to control the saturation of the page when your paste is rendered. It expects a `percentage`.
- `<lit>`, the lit element allows you to control the lightness of the page when your paste is rendered. It expects a `percentage`.
- `<theme>`, the theme element allows you to force a theme when your paste is rendered, `dark/light/blue/purple`

#### Custom Footer Links

You can added custom footer links to your server by editing the `config.json` (`{DATA_DIRECTORY}/config.json`) and adding a `footer` section. All links should have a `label` and `href` value. Links are organized in different rows. Each new entry in the "rows" array creates a new row in the footer.

Example:

```json
{
    ...
    "app": {
        ...
        "footer": {
            "rows": [
                {
                    "what": "/what:www.sentrytwo.com"
                }
            ]
        }
        ...
    }
    ...
}
```

#### Info Page

You can add an info page that is automatically rendered into a third editor tab named *info*. This tab is only shown if the `info` key exists. This page will be opened whenever the *info* tab is selected. This page is intended for server information and announcements, but it can be used for anything.

Example:

```json
{
    ...
    "app": {
        ...
        "info": "/info:www.sentrytwo.com"
        ...
    }
}
```

### Paste Groups

Groups allow users to organize their pastes into different groups that are locked by a password. Anybody can view the pastes in an existing group, but in order to add a new paste to the group you must have the correct password. A group must not already exist with the requested name to create a new group. A group will become available once all the pastes inside of it are deleted.

Adding a group name will append the group name to the beginning of your set custom URL. This means the custom URL "example" with the group "example-group" would look like "example-group/example" instead of just the custom URL. This means that, if you add a group, you can have any custom URL you want for your paste. Adding a group is not required.

### Special Markdown

Entry supports some custom Markdown features that aren't included in the Markdown specification. These allow you to create more advanced pastes much quicker. Information about these can be found [here](https://www.sentrytwo.com/pub/markdown)!

## Development

1. Make sure you have [Bun](https://bun.sh) installed
2. Clone the repository (`git clone https://codeberg.org/hkau/entry`)
3. Install all dependencies (`bun i`)
4. Run `bun run start` to start the server
5. Before committing changes you should run `bun run format` to format all files
6. You should also run `bun run test` to make sure your commit passes all tests first

### Tests

You can test your changes like you would a deployed version of Entry. You should also run the included tests before committing your changes. Run `bun test` to run the tests that are included in the repository. These tests test the memory and CPU usage of app usage. All tests should pass before you commit.

## Why

I wanted to self-host a Markdown pastebin, but I noticed every pastebin I could find had too many features or did not support Markdown viewing or custom paste URLs. I eventually found [Rentry](https://rentry.co), but was disappointed to find you could not host it yourself. It support every feature I was looking for, but was closed-source and appeared like it was going to remain that way.

I noticed that on the open-source for the Rentry CLI, there was [an issue](https://github.com/radude/rentry/issues/1) asking for Rentry to publish its source. The creator mentioned that Rentry would go open once the code was cleaned up, but that was four years ago and we haven't gotten a response about it since then.

This is a basic re-creation of Rentry that attempts to look and feel as similar to it as possible.
