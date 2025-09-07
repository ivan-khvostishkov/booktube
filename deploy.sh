aws s3 sync --delete . s3://booktube.nosocial.net/ \
  --exclude "*" \
  --include "index.html" \
  --include "styles.css" \
  --include "favicon.ico" \
  --include "booktube.js"
