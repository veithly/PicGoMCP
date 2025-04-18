#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ErrorCode,
	ListToolsRequestSchema,
	McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// PicGo server default endpoint
const PICGO_SERVER_URL = 'http://127.0.0.1:36677/upload';

// Type guard to check if the arguments are valid
const isValidUploadArgs = (
	args: any
): args is { image_paths: string[] } =>
	typeof args === 'object' &&
	args !== null &&
	Array.isArray(args.image_paths) &&
	args.image_paths.every((p: any) => typeof p === 'string');

class PicGoUploaderServer {
	private server: Server;
	private axiosInstance;

	constructor() {
		this.server = new Server(
			{
				// Use the name provided during creation or update if needed
				name: 'picgo-uploader',
				version: '0.1.0',
				description: 'MCP server to upload images via PicGo',
			},
			{
				capabilities: {
					resources: {}, // No resources defined for this server
					tools: {},
				},
			}
		);

		this.axiosInstance = axios.create({
			baseURL: PICGO_SERVER_URL,
		});

		this.setupToolHandlers();

		// Error handling
		this.server.onerror = (error) => console.error('[MCP Error]', error);
		process.on('SIGINT', async () => {
			await this.server.close();
			process.exit(0);
		});
	}

	private setupToolHandlers() {
		// List available tools
		this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
			tools: [
				{
					name: 'upload_image_via_picgo',
					description: 'Uploads one or more images using the running PicGo server application.',
					inputSchema: {
						type: 'object',
						properties: {
							image_paths: {
								type: 'array',
								items: {
									type: 'string',
								},
								description: 'An array of absolute paths to the image files to upload.',
							},
						},
						required: ['image_paths'],
					},
				},
			],
		}));

		// Handle tool calls
		this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			if (request.params.name !== 'upload_image_via_picgo') {
				throw new McpError(
					ErrorCode.MethodNotFound,
					`Unknown tool: ${request.params.name}`
				);
			}

			if (!isValidUploadArgs(request.params.arguments)) {
				throw new McpError(
					ErrorCode.InvalidParams,
					'Invalid arguments for upload_image_via_picgo. Expected { image_paths: string[] }.'
				);
			}

			const imagePaths = request.params.arguments.image_paths;

			// Validate paths exist before sending to PicGo
			for (const imgPath of imagePaths) {
				if (!fs.existsSync(imgPath)) {
					throw new McpError(
						ErrorCode.InvalidParams,
						`Image path does not exist: ${imgPath}`
					);
				}
				// Optional: Add check for file type if needed
			}

			try {
				// PicGo expects a JSON body with a "list" key containing the array of paths
				const response = await this.axiosInstance.post('', { list: imagePaths });

				// Check PicGo's response structure (adjust based on actual PicGo API response)
				if (response.data && response.data.success) {
					return {
						content: [
							{
								type: 'text',
								// Assuming response.data.result is the array of URLs
								text: JSON.stringify(response.data.result || response.data, null, 2),
							},
						],
					};
				} else {
					// PicGo request succeeded but upload failed internally
					return {
						content: [
							{
								type: 'text',
								text: `PicGo upload failed: ${JSON.stringify(response.data, null, 2)}`,
							},
						],
						isError: true,
					};
				}
			} catch (error) {
				let errorMessage = 'Failed to send request to PicGo server.';
				if (axios.isAxiosError(error)) {
					errorMessage = `PicGo server request error: ${error.message}. Is PicGo running and its server enabled?`;
					if (error.response) {
						errorMessage += ` Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`;
					}
				} else if (error instanceof Error) {
					errorMessage = error.message;
				}

				// Return error information as tool output
				return {
					content: [
						{
							type: 'text',
							text: errorMessage,
						},
					],
					isError: true,
				};
			}
		});
	}

	async run() {
		const transport = new StdioServerTransport();
		await this.server.connect(transport);
		console.error('PicGo Uploader MCP server running on stdio');
	}
}

const server = new PicGoUploaderServer();
server.run().catch(console.error);
