/*
   App-Wide Performance Budget
   ========================================================================== */
   /* This config will set the default perf budgets for:
      Baseline: a stack page, with global theme, but no content,
                for measuring your stack and theme speed
      Landing: your app's landing/home pages should be measured against these metrics.
               These should have agressive perf goals, as they are high-traffic user entry points
      Apps: Your app's other content and interactive pages should be measured against these metrics
   */


// my site's performance budget

// values available:
var defaults = {
  baseline: {
    metrics: {
      requests: 10,
      cssCount: 1,
      jsCount: 1,
      imageCount: 0,
      cssSize: 50000,
      imageSize: 5000,
      oldCachingHeaders: 0,
      cachingDisabled: 1,
      cachingNotSpecified: 0
    }
  },
  landing: {
    metrics: {
      requests: 50,
      cssCount: 10,
      jsCount: 20,
      imageCount: 4,
      cssSize: 50000,
      imageSize: 10000,
      oldCachingHeaders: 0,
      cachingDisabled: 1,
      cachingNotSpecified: 0
    }
  },
  apps: {
    metrics: {
      requests: 100,
      cssCount: 10,
      jsCount: 20,
      imageCount: 4,
      cssSize: 50000,
      imageSize: 10000,
      oldCachingHeaders: 0,
      cachingDisabled: 1,
      cachingNotSpecified: 0
    }
  }
};

module.exports = {
  defaults: defaults
};