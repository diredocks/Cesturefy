# Execute user script

See also [Gesturefy/wiki/Execute-user-script](https://github.com/Robbendebiene/Gesturefy/wiki/Execute-user-script)

You also have to turn on **Allow User Scripts** in extension detail page, check out [Enabling chrome.userScripts in Chrome Extensions is changing](https://developer.chrome.com/blog/chrome-userscript)

## User script API

Notice that none of Gesturefy’s functions are exposed in Cesturefy. Instead, user scripts in Cesturefy can only access a limited context through the `CTX` variable.

## Examples

### Copy Link Text

```js
if (CTX.link) {
  navigator.clipboard.writeText(CTX.link.textContent);
}
```
