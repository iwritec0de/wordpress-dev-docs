/* global wp */

// wp.hooks — addAction (2 args: hookName, namespace)
wp.hooks.addAction('myplugin.init', 'my-plugin', function () {});

// wp.hooks — addAction with priority
wp.hooks.addAction('myplugin.save', 'my-plugin', function () {}, 20);

// wp.hooks — addFilter (basic)
wp.hooks.addFilter('myplugin.settings', 'my-plugin', function (v) {
  return v;
});

// wp.hooks — addFilter with priority
wp.hooks.addFilter(
  'myplugin.output',
  'my-plugin',
  function (v) {
    return v;
  },
  5
);

// wp.hooks — doAction
wp.hooks.doAction('myplugin.rendered', { key: 'value' });

// wp.hooks — applyFilters
var result = wp.hooks.applyFilters('myplugin.value', 42, extraArg);

// wp.data — select
var store = wp.data.select('core/editor');

// wp.data — dispatch
var dispatcher = wp.data.dispatch('core/notices');

// wp.data — subscribe
wp.data.subscribe(function () {
  console.log('store changed');
});

// registerBlockType
registerBlockType('my-plugin/my-block', {
  title: 'My Block',
  category: 'common',
  edit: function () {},
  save: function () {},
});

// registerBlockType — second block
registerBlockType('my-plugin/hero-block', {
  title: 'Hero Block',
});
