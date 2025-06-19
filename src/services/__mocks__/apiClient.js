// Mock for apiClient
const mockApiClient = {
  login: jest.fn(),
  register: jest.fn(),
  refreshToken: jest.fn(),
  interpret: jest.fn(),
  execute: jest.fn(),
  getTools: jest.fn(),
  getUserConfig: jest.fn(),
  updateUserConfig: jest.fn(),
  getDeveloperTools: jest.fn(),
  createDeveloperTool: jest.fn(),
  updateDeveloperTool: jest.fn(),
  deleteDeveloperTool: jest.fn(),
};

// Named exports
export const {
  login,
  register,
  refreshToken,
  interpret,
  execute,
  getTools,
  getUserConfig,
  updateUserConfig,
  getDeveloperTools,
  createDeveloperTool,
  updateDeveloperTool,
  deleteDeveloperTool,
} = mockApiClient;

// Default export
export default mockApiClient;
