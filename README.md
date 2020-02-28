# 70015
A set of small utility functions often useful in development, with focus on clean interface and smooth user experience. We, developers, love & deserve good UX too.

# Features
### Data reuse
Allows you to reuse the data across tools and make sort of "pipelines" of various tools.

### Sharing
Allows you to share a link which opens a tool with data already loaded. Since sharing is done by base64-encoding data from a tool, it is limited by a URL length, which differs across browsers & servers.

### Hotkeys
All the control on the tips of your fingers.

|Key|Operation|
|-|-|
|Esc|Closes the currently open tool and brings the previous one in stack.|
|Esc Esc|Closes all the tools in the stack.|
|Ctr+Shift+#|Opens the sharing dialog.|

### Easy copying
Most of output can be copied by clicking on it.

# Tools

### Base64 Transcoder [[link]](https://x1n13y84issmd42.github.io/70015/#base64)
Encodes & decodes base64 content, including files (drag-n-drop them into the ASCII field).

### URL Transcoder [[link]](https://x1n13y84issmd42.github.io/70015/#urldecode)
Transcodes URL query values. Basically a UI for the `encode/decodeURIComponent()` functions.

### URL Parser [[example]](https://x1n13y84issmd42.github.io/70015/#urlparse@eyJVUkwiOiJodHRwczovL3d3dy5hbWF6b24uY29tL2IvcmVmPUFFX0hQX2xlZnRuYXZfbXVzaWM/X2VuY29kaW5nPVVURjgmaWU9VVRGOCZub2RlPTUxNzQmcGZfcmRfbT1BVFZQREtJS1gwREVSJnBmX3JkX3M9bWVyY2hhbmRpc2VkLXNlYXJjaC1sZWZ0bmF2JnBmX3JkX3I9S1ZESkEzMUtZS0tWMUdWME1XOVAmcGZfcmRfcj1LVkRKQTMxS1lLS1YxR1YwTVc5UCZwZl9yZF90PTEwMSZwZl9yZF9wPTdhZjE5NTNkLThmZDYtNDc1YS05ZjRlLWI2ZmE5ZmNlMTM2YSZwZl9yZF9wPTdhZjE5NTNkLThmZDYtNDc1YS05ZjRlLWI2ZmE5ZmNlMTM2YSZwZl9yZF9pPTE4NjM3NTc1MDExIn0=)
A tool to make sense of URLs heavily ridden with query string parameters.

### JSON Formatter [[link]](https://x1n13y84issmd42.github.io/70015/#json)
Formats JSON data in various ways. Pretty printed or one-liner, with or without quotes, with escaping & indentation control.

### JSON-YAML Converter [[link]](https://x1n13y84issmd42.github.io/70015/#jsonyaml)
Converts between JSON & YAML structured data representations.

### XML & XPath Playground [[example]](https://x1n13y84issmd42.github.io/70015/#xml@eyJ4bWwiOiI8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJJU084ODU5LTFcIiA/PlxuPHBvcnRmb2xpbz5cbiAgPHN0b2NrIGV4Y2hhbmdlPVwibnlzZVwiPlxuICAgIDxuYW1lPnphY3ggY29ycDwvbmFtZT5cbiAgICA8c3ltYm9sPlpDWE08L3N5bWJvbD5cbiAgICA8cHJpY2U+MjguODc1PC9wcmljZT5cbiAgPC9zdG9jaz5cbiAgPHN0b2NrIGV4Y2hhbmdlPVwibmFzZGFxXCI+XG4gICAgPG5hbWU+emFmZnltYXQgaW5jPC9uYW1lPlxuICAgIDxzeW1ib2w+WkZGWDwvc3ltYm9sPlxuICAgIDxwcmljZT45Mi4yNTA8L3ByaWNlPlxuICA8L3N0b2NrPlxuPC9wb3J0Zm9saW8+IiwieHBhdGgiOiIvL3N0b2NrW0BleGNoYW5nZT1cIm55c2VcIl0vc3ltYm9sIn0=)
Allows to preview an XML document and run XPath queries on it with live preview of matched nodes.

### Unixtime Converter [[link]](https://x1n13y84issmd42.github.io/70015/#unixtime)
Converts Unix time stamps to human-readable formats.

### Hasher [[link]](https://x1n13y84issmd42.github.io/70015/#hasher)
Computes few kinds of checksums & cryptographic message digests.
