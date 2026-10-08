// Build the static stylesheet that replaces the runtime Tailwind CDN script:
//   cd music && npx tailwindcss@3.4.17 -i tailwind-input.css -o tailwind.css --minify
// Re-run it after adding any new Tailwind class to a game or the arcade.
module.exports = { content: ["./*.html", "./*.js", "!./tailwind.config.js"], theme: { extend: {} }, plugins: [] };
