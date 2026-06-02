import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { GHLApiClient } from '../clients/ghl-api-client.js';
import {
  MCPCreateBrandBoardParams,
  MCPListBrandBoardsParams,
  MCPGetBrandBoardParams,
  MCPUpdateBrandBoardParams,
  MCPDeleteBrandBoardParams
} from '../types/ghl-types.js';

/**
 * Brand Boards MCP Tools
 *
 * Brand Boards are sub-account-level design kits (logos + colors + fonts) that
 * make brand assets available for one-click selection across emails, funnels,
 * websites, forms, and payment links inside GoHighLevel.
 *
 * Mechanics:
 * - 2 logos max (primary + secondary)
 * - 2-10 colors in HEX
 * - 1-5 fonts
 * - Updates do NOT propagate retroactively to surfaces that already applied the
 *   Board (same limitation as Saved Elements — see ghl skill canon
 *   infrastructure-traps.md trap #27)
 *
 * Reference: https://marketplace.gohighlevel.com/docs/2023-02-21/ghl/brand-boards/
 */
export class BrandBoardTools {
  constructor(private apiClient: GHLApiClient) {}

  getTools(): Tool[] {
    return [
      {
        name: 'ghl_create_brand_board',
        description:
          'Create a new Brand Board in the specified GHL sub-account. A Brand Board bundles logos (up to 2), colors (2-10 in HEX), and fonts (1-5) for one-click application across emails, funnels, websites, forms, and payment links. Use this to programmatically deploy brand assets from a brand.yaml or similar source-of-truth into a client sub-account during onboarding.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Sub-account location ID. If omitted, uses the default location from configuration.'
            },
            name: {
              type: 'string',
              description: 'Human-readable name for the Brand Board (e.g., "MYTHIFI Brand 2026", "Acme Co Primary").'
            },
            logos: {
              type: 'array',
              description: 'Up to 2 logo entries. Each has a url (required) and optional name/role label.',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string', description: 'Logo image URL (must be publicly accessible).' },
                  name: { type: 'string', description: 'Optional role label (e.g., "primary", "secondary").' }
                },
                required: ['url']
              },
              maxItems: 2
            },
            colors: {
              type: 'array',
              description: '2-10 color entries. HEX format (e.g., "#5B21B6"). Each has an optional name label.',
              items: {
                type: 'object',
                properties: {
                  hex: { type: 'string', description: 'HEX color code, e.g., "#5B21B6".' },
                  name: { type: 'string', description: 'Optional role label (e.g., "primary", "accent").' }
                },
                required: ['hex']
              },
              minItems: 2,
              maxItems: 10
            },
            fonts: {
              type: 'array',
              description: '1-5 font entries. fontFamily as recognized by GHL\'s font picker.',
              items: {
                type: 'object',
                properties: {
                  fontFamily: { type: 'string', description: 'Font family name (e.g., "Audiowide", "Inter").' },
                  name: { type: 'string', description: 'Optional role label (e.g., "display", "body").' }
                },
                required: ['fontFamily']
              },
              minItems: 1,
              maxItems: 5
            }
          },
          required: ['name'],
          additionalProperties: false
        }
      },
      {
        name: 'ghl_list_brand_boards',
        description:
          'List all Brand Boards for a sub-account. Returns each board with its id, name, logos, colors, and fonts. Use to inspect existing Brand Boards before creating or updating.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Sub-account location ID. If omitted, uses the default location from configuration.'
            }
          },
          additionalProperties: false
        }
      },
      {
        name: 'ghl_get_brand_board',
        description:
          'Retrieve a single Brand Board by its ID. Returns the complete board with logos, colors, fonts, and metadata.',
        inputSchema: {
          type: 'object',
          properties: {
            brandBoardId: {
              type: 'string',
              description: 'The ID of the Brand Board to retrieve.'
            }
          },
          required: ['brandBoardId'],
          additionalProperties: false
        }
      },
      {
        name: 'ghl_update_brand_board',
        description:
          'Update an existing Brand Board. Supports partial updates (any subset of name, logos, colors, fonts). Critical caveat: updating a Brand Board does NOT retroactively change surfaces (emails, funnels, etc.) that already applied the previous version of the Board. The update only affects fresh applications going forward.',
        inputSchema: {
          type: 'object',
          properties: {
            brandBoardId: {
              type: 'string',
              description: 'The ID of the Brand Board to update.'
            },
            name: {
              type: 'string',
              description: 'New name for the Brand Board (optional).'
            },
            logos: {
              type: 'array',
              description: 'Replacement set of up to 2 logos (optional). Pass empty array to clear, omit to preserve.',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  name: { type: 'string' }
                },
                required: ['url']
              },
              maxItems: 2
            },
            colors: {
              type: 'array',
              description: 'Replacement set of 2-10 colors in HEX (optional). Omit to preserve.',
              items: {
                type: 'object',
                properties: {
                  hex: { type: 'string' },
                  name: { type: 'string' }
                },
                required: ['hex']
              },
              minItems: 2,
              maxItems: 10
            },
            fonts: {
              type: 'array',
              description: 'Replacement set of 1-5 fonts (optional). Omit to preserve.',
              items: {
                type: 'object',
                properties: {
                  fontFamily: { type: 'string' },
                  name: { type: 'string' }
                },
                required: ['fontFamily']
              },
              minItems: 1,
              maxItems: 5
            }
          },
          required: ['brandBoardId'],
          additionalProperties: false
        }
      },
      {
        name: 'ghl_delete_brand_board',
        description:
          'Delete a Brand Board by ID. Does not affect surfaces (emails, funnels, etc.) that already applied the Board — those retain their static styling. Used for cleanup or removing test Brand Boards.',
        inputSchema: {
          type: 'object',
          properties: {
            brandBoardId: {
              type: 'string',
              description: 'The ID of the Brand Board to delete.'
            }
          },
          required: ['brandBoardId'],
          additionalProperties: false
        }
      }
    ];
  }

  async executeBrandBoardTool(name: string, params: any): Promise<any> {
    try {
      switch (name) {
        case 'ghl_create_brand_board':
          return await this.createBrandBoard(params as MCPCreateBrandBoardParams);
        case 'ghl_list_brand_boards':
          return await this.listBrandBoards(params as MCPListBrandBoardsParams);
        case 'ghl_get_brand_board':
          return await this.getBrandBoard(params as MCPGetBrandBoardParams);
        case 'ghl_update_brand_board':
          return await this.updateBrandBoard(params as MCPUpdateBrandBoardParams);
        case 'ghl_delete_brand_board':
          return await this.deleteBrandBoard(params as MCPDeleteBrandBoardParams);

        default:
          throw new Error(`Unknown brand board tool: ${name}`);
      }
    } catch (error) {
      console.error(`Error executing brand board tool ${name}:`, error);
      throw error;
    }
  }

  // ===== BRAND BOARD MANAGEMENT =====

  private async createBrandBoard(params: MCPCreateBrandBoardParams): Promise<any> {
    const result = await this.apiClient.createBrandBoard({
      locationId: params.locationId || '',
      name: params.name,
      logos: params.logos,
      colors: params.colors,
      fonts: params.fonts
    });

    if (!result.success || !result.data) {
      throw new Error(`Failed to create brand board: ${result.error?.message || 'Unknown error'}`);
    }

    return {
      success: true,
      brandBoard: result.data,
      message: `Successfully created Brand Board "${result.data.name}" (id: ${result.data.id})`,
      metadata: {
        logoCount: result.data.logos?.length || 0,
        colorCount: result.data.colors?.length || 0,
        fontCount: result.data.fonts?.length || 0
      }
    };
  }

  private async listBrandBoards(params: MCPListBrandBoardsParams): Promise<any> {
    const result = await this.apiClient.listBrandBoards(params.locationId);

    if (!result.success || !result.data) {
      throw new Error(`Failed to list brand boards: ${result.error?.message || 'Unknown error'}`);
    }

    return {
      success: true,
      brandBoards: result.data.brandBoards,
      message: `Successfully retrieved ${result.data.brandBoards.length} Brand Board(s)`,
      metadata: {
        totalBrandBoards: result.data.brandBoards.length
      }
    };
  }

  private async getBrandBoard(params: MCPGetBrandBoardParams): Promise<any> {
    const result = await this.apiClient.getBrandBoard(params.brandBoardId);

    if (!result.success || !result.data) {
      throw new Error(`Failed to get brand board: ${result.error?.message || 'Unknown error'}`);
    }

    return {
      success: true,
      brandBoard: result.data,
      message: `Successfully retrieved Brand Board "${result.data.name}"`,
      metadata: {
        logoCount: result.data.logos?.length || 0,
        colorCount: result.data.colors?.length || 0,
        fontCount: result.data.fonts?.length || 0
      }
    };
  }

  private async updateBrandBoard(params: MCPUpdateBrandBoardParams): Promise<any> {
    const updates: any = {};
    if (params.name !== undefined) updates.name = params.name;
    if (params.logos !== undefined) updates.logos = params.logos;
    if (params.colors !== undefined) updates.colors = params.colors;
    if (params.fonts !== undefined) updates.fonts = params.fonts;

    const result = await this.apiClient.updateBrandBoard(params.brandBoardId, updates);

    if (!result.success || !result.data) {
      throw new Error(`Failed to update brand board: ${result.error?.message || 'Unknown error'}`);
    }

    return {
      success: true,
      brandBoard: result.data,
      message: `Successfully updated Brand Board "${result.data.name}"`,
      metadata: {
        fieldsUpdated: Object.keys(updates),
        note: 'Per GHL infrastructure trap #27, this update does NOT propagate retroactively to surfaces (emails, funnels, etc.) that already applied the previous Brand Board version.'
      }
    };
  }

  private async deleteBrandBoard(params: MCPDeleteBrandBoardParams): Promise<any> {
    const result = await this.apiClient.deleteBrandBoard(params.brandBoardId);

    if (!result.success || !result.data) {
      throw new Error(`Failed to delete brand board: ${result.error?.message || 'Unknown error'}`);
    }

    return {
      success: true,
      message: `Successfully deleted Brand Board (id: ${params.brandBoardId})`,
      metadata: {
        note: 'Deletion does not affect surfaces that already applied the Board — they retain their static styling.'
      }
    };
  }
}

/**
 * Helper to check whether a tool name belongs to Brand Board tools.
 */
export function isBrandBoardTool(toolName: string): boolean {
  const brandBoardToolNames = [
    'ghl_create_brand_board',
    'ghl_list_brand_boards',
    'ghl_get_brand_board',
    'ghl_update_brand_board',
    'ghl_delete_brand_board'
  ];

  return brandBoardToolNames.includes(toolName);
}
