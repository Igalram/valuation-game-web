import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(cleanup);

vi.stubGlobal(
  "Audio",
  class MockAudio {
    loop = false;
    muted = false;
    volume = 1;

    play() {
      return Promise.resolve();
    }
  },
);
