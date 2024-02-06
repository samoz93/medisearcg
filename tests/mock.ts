// Import this named export into your test file:
export const mockClient = jest.fn();
const mock = jest.fn().mockImplementation(() => {
  return { isReady: mockClient };
});

export default mock;
