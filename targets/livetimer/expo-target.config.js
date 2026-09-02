/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'widget',
  name: 'ByreLiveTimer',
  // Deliberately no app group: ActivityKit carries the countdown state to the
  // widget itself, so the extension needs no shared container — and asking for
  // one would mean registering a fifth App ID before this can sign.
};
