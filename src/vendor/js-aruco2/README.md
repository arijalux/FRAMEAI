Vendored from js-aruco2 2.0.0 (MIT, see LICENSE.txt): cv.js, aruco.js, posit1.js, svd.js.

The package is a classic script that publishes its namespaces through `this` and
`require`, which bundlers don't handle consistently, so the module glue lines were
replaced with ES `import`/`export`. The algorithms are unchanged.
