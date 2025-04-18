# PicGo Uploader MCP Server

[![npm version](https://badge.fury.io/js/picgo-uploader.svg)](https://badge.fury.io/js/picgo-uploader)

An MCP (Model Context Protocol) server that allows interaction with a running [PicGo](https://github.com/Molunerfinn/PicGo) application to upload images.

## Overview

This server exposes PicGo's image uploading capabilities as an MCP tool. It connects to the PicGo application's built-in server (usually running on `http://127.0.0.1:36677`) and provides a tool to upload local image files.

## Prerequisites

1.  **Node.js:** Ensure you have Node.js (v18 or later recommended) installed.
2.  **PicGo Application:** You need the PicGo desktop application installed and running.
3.  **PicGo Server Enabled:** In PicGo's settings (`PicGo 设置` -> `设置Server`), enable the server. The default port is `36677`. Make sure it's running.
4.  **NPM or Yarn:** For installing the package.

## Installation

```bash
npm install -g picgo-uploader
```

or

```bash
yarn global add picgo-uploader
```

This will install the MCP server globally and make the `picgo-uploader` command available.

## Running the Server

Simply execute the command in your terminal:

```bash
picgo-uploader
```

The server will start and listen for MCP connections via stdio. You should see a message like:

```
PicGo Uploader MCP server running on stdio
```

Keep this terminal window open while you want to use the server.

## Usage (MCP Tool)

Once the server is running and connected to your MCP client (like Roo Code), you can use the provided tool:

**Tool:** `upload_image_via_picgo`

*   **Description:** Uploads one or more images using the running PicGo server application.
*   **Input Schema:**
    ```json
    {
      "type": "object",
      "properties": {
        "image_paths": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "An array of absolute paths to the image files to upload."
        }
      },
      "required": ["image_paths"]
    }
    ```
*   **Output:** On success, returns a JSON string containing the array of uploaded image URLs provided by PicGo. On failure, returns an error message.

**Example (`use_mcp_tool`):**

```xml
<use_mcp_tool>
  <server_name>picgo-uploader</server_name>
  <tool_name>upload_image_via_picgo</tool_name>
  <arguments>
  {
    "image_paths": [
      "C:\\Users\\YourUser\\Pictures\\screenshot1.png",
      "/home/user/images/diagram.jpg"
    ]
  }
  </arguments>
</use_mcp_tool>
```

**Note:** Ensure the file paths provided in `image_paths` are **absolute paths** accessible from the machine where the `picgo-uploader` server is running.

## Troubleshooting

*   **Error: "PicGo server request error: connect ECONNREFUSED 127.0.0.1:36677"**:
    *   Make sure the PicGo application is running.
    *   Verify that the PicGo server is enabled in its settings and running on the default port `36677`.
*   **Error: "Image path does not exist: <path>"**:
    *   Double-check that the provided image path is correct and absolute.
    *   Ensure the file exists at the specified location on the machine running the `picgo-uploader`.
*   **Error: "PicGo upload failed: ..."**:
    *   This indicates an error reported by PicGo itself (e.g., invalid configuration for the selected uploader, network issues). Check the PicGo application logs for more details.

## Development

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Build the code: `npm run build`
4.  Run in development: `node build/index.js`
5.  Watch for changes: `npm run watch` (in a separate terminal)
