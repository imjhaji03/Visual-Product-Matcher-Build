// frontend/src/App.test.tsx
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

// Basic smoke test — ensures app mounts successfully
describe("Visual Product Matcher App", () => {
  it("renders without crashing", () => {
    render(<App />);
    const heading = screen.getByText(/Visual Product Matcher/i);
    expect(heading).toBeInTheDocument();
  });

  it("shows upload section or button", () => {
    render(<App />);
    const uploadText = screen.getByText(/upload/i);
    expect(uploadText).toBeVisible();
  });

  it("matches snapshot for initial UI", () => {
    const { asFragment } = render(<App />);
    expect(asFragment()).toMatchSnapshot();
  });
});
