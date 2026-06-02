/**
 * Unit Tests for Brand Board Tools
 * Tests all 5 Brand Board management MCP tools
 *
 * Brand Boards are sub-account-level design kits (logos + colors + fonts) that
 * GHL applies across emails, funnels, websites, forms, and payment links.
 * Updates do NOT propagate retroactively (per ghl skill canon trap #27).
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BrandBoardTools, isBrandBoardTool } from '../../src/tools/brand-board-tools.js';

// Minimal inline mock — keeps this test focused without polluting the shared mock.
const mockBrandBoard = {
  id: 'bb_test_001',
  locationId: 'loc_mythifi_001',
  name: 'MYTHIFI Brand 2026',
  logos: [
    { url: 'https://mythifi.com/logo-primary.svg', name: 'primary' },
    { url: 'https://mythifi.com/logo-wordmark.svg', name: 'wordmark' }
  ],
  colors: [
    { hex: '#5B21B6', name: 'Royal Violet' },
    { hex: '#1E1B4B', name: 'Deep Space Purple' },
    { hex: '#0F0A2E', name: 'Void Purple' }
  ],
  fonts: [
    { fontFamily: 'Audiowide', name: 'display' },
    { fontFamily: 'Inter', name: 'body' }
  ],
  isDefault: false,
  createdAt: '2026-06-02T12:00:00Z',
  updatedAt: '2026-06-02T12:00:00Z'
};

class MockApiClient {
  createBrandBoard = jest.fn<any>().mockImplementation(async (data: any) => ({
    success: true,
    data: { ...mockBrandBoard, ...data, id: 'bb_' + Date.now() }
  }));

  listBrandBoards = jest.fn<any>().mockImplementation(async () => ({
    success: true,
    data: { brandBoards: [mockBrandBoard] }
  }));

  getBrandBoard = jest.fn<any>().mockImplementation(async (id: string) => ({
    success: true,
    data: { ...mockBrandBoard, id }
  }));

  updateBrandBoard = jest.fn<any>().mockImplementation(async (id: string, updates: any) => ({
    success: true,
    data: { ...mockBrandBoard, ...updates, id }
  }));

  deleteBrandBoard = jest.fn<any>().mockImplementation(async () => ({
    success: true,
    data: { success: true }
  }));
}

describe('BrandBoardTools', () => {
  let brandBoardTools: BrandBoardTools;
  let mockClient: MockApiClient;

  beforeEach(() => {
    mockClient = new MockApiClient();
    brandBoardTools = new BrandBoardTools(mockClient as any);
  });

  describe('getTools', () => {
    it('should return 5 Brand Board tool definitions', () => {
      const tools = brandBoardTools.getTools();
      expect(tools).toHaveLength(5);
    });

    it('should expose all 5 canonical Brand Board tool names', () => {
      const tools = brandBoardTools.getTools();
      const names = tools.map(t => t.name).sort();
      expect(names).toEqual([
        'ghl_create_brand_board',
        'ghl_delete_brand_board',
        'ghl_get_brand_board',
        'ghl_list_brand_boards',
        'ghl_update_brand_board'
      ]);
    });

    it('should have well-formed inputSchema for every tool', () => {
      const tools = brandBoardTools.getTools();
      tools.forEach(tool => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it('should require name on create tool', () => {
      const createTool = brandBoardTools.getTools().find(t => t.name === 'ghl_create_brand_board');
      expect(createTool).toBeDefined();
      expect(createTool!.inputSchema.required).toContain('name');
    });

    it('should constrain colors to 2-10 entries on create tool', () => {
      const createTool = brandBoardTools.getTools().find(t => t.name === 'ghl_create_brand_board');
      const colorsSchema = (createTool!.inputSchema.properties as any).colors;
      expect(colorsSchema.minItems).toBe(2);
      expect(colorsSchema.maxItems).toBe(10);
    });

    it('should constrain fonts to 1-5 entries on create tool', () => {
      const createTool = brandBoardTools.getTools().find(t => t.name === 'ghl_create_brand_board');
      const fontsSchema = (createTool!.inputSchema.properties as any).fonts;
      expect(fontsSchema.minItems).toBe(1);
      expect(fontsSchema.maxItems).toBe(5);
    });

    it('should constrain logos to max 2 entries on create tool', () => {
      const createTool = brandBoardTools.getTools().find(t => t.name === 'ghl_create_brand_board');
      const logosSchema = (createTool!.inputSchema.properties as any).logos;
      expect(logosSchema.maxItems).toBe(2);
    });
  });

  describe('executeBrandBoardTool dispatch', () => {
    it('should call createBrandBoard for create tool', async () => {
      const result = await brandBoardTools.executeBrandBoardTool('ghl_create_brand_board', {
        name: 'Test Board',
        colors: [{ hex: '#000000' }, { hex: '#FFFFFF' }],
        fonts: [{ fontFamily: 'Inter' }]
      });
      expect(mockClient.createBrandBoard).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.brandBoard).toBeDefined();
      expect(result.metadata.colorCount).toBeGreaterThan(0);
    });

    it('should call listBrandBoards for list tool', async () => {
      const result = await brandBoardTools.executeBrandBoardTool('ghl_list_brand_boards', {});
      expect(mockClient.listBrandBoards).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.brandBoards)).toBe(true);
      expect(result.metadata.totalBrandBoards).toBe(1);
    });

    it('should call getBrandBoard for get tool', async () => {
      const result = await brandBoardTools.executeBrandBoardTool('ghl_get_brand_board', {
        brandBoardId: 'bb_test_001'
      });
      expect(mockClient.getBrandBoard).toHaveBeenCalledWith('bb_test_001');
      expect(result.success).toBe(true);
      expect(result.brandBoard.id).toBe('bb_test_001');
    });

    it('should call updateBrandBoard for update tool with only provided fields', async () => {
      const result = await brandBoardTools.executeBrandBoardTool('ghl_update_brand_board', {
        brandBoardId: 'bb_test_001',
        name: 'Renamed Board'
      });
      expect(mockClient.updateBrandBoard).toHaveBeenCalledWith('bb_test_001', { name: 'Renamed Board' });
      expect(result.success).toBe(true);
      expect(result.metadata.fieldsUpdated).toEqual(['name']);
      expect(result.metadata.note).toContain('does NOT propagate');
    });

    it('should call deleteBrandBoard for delete tool', async () => {
      const result = await brandBoardTools.executeBrandBoardTool('ghl_delete_brand_board', {
        brandBoardId: 'bb_test_001'
      });
      expect(mockClient.deleteBrandBoard).toHaveBeenCalledWith('bb_test_001');
      expect(result.success).toBe(true);
    });

    it('should throw on unknown tool name', async () => {
      await expect(
        brandBoardTools.executeBrandBoardTool('ghl_nonsense_brand_board', {})
      ).rejects.toThrow(/Unknown brand board tool/);
    });
  });

  describe('error propagation', () => {
    it('should throw a helpful error when the API client returns success: false', async () => {
      mockClient.createBrandBoard = jest.fn<any>().mockImplementation(async () => ({
        success: false,
        error: { message: 'Invalid color count' }
      }));

      await expect(
        brandBoardTools.executeBrandBoardTool('ghl_create_brand_board', { name: 'Bad Board' })
      ).rejects.toThrow(/Failed to create brand board.*Invalid color count/);
    });
  });

  describe('isBrandBoardTool helper', () => {
    it('should recognize all 5 canonical tool names', () => {
      expect(isBrandBoardTool('ghl_create_brand_board')).toBe(true);
      expect(isBrandBoardTool('ghl_list_brand_boards')).toBe(true);
      expect(isBrandBoardTool('ghl_get_brand_board')).toBe(true);
      expect(isBrandBoardTool('ghl_update_brand_board')).toBe(true);
      expect(isBrandBoardTool('ghl_delete_brand_board')).toBe(true);
    });

    it('should reject non-Brand-Board tool names', () => {
      expect(isBrandBoardTool('ghl_create_contact')).toBe(false);
      expect(isBrandBoardTool('ghl_get_brand')).toBe(false);
      expect(isBrandBoardTool('')).toBe(false);
    });
  });
});
