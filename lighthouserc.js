module.exports = {
  ci: {
    collect: {
      url: ["http://localhost:3000/"],
      startServerCommand: "pnpm start",
      numberOfRuns: 2,
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 3000 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 4000 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
}
