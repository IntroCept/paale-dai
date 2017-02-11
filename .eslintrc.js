module.exports = {
  "env": {
    "browser": false,
    "es6": true
  },
  "extends": "airbnb-base",
  "parserOptions": {
    "sourceType": "module"
  },
  "rules": {
    "consistent-return": 0,
    "no-param-reassign": 0,
    "import/no-extraneous-dependencies": [2, {"devDependencies": ["**/tests/**/*.js", "**/demo/**/*.js"]}]
  }
};
