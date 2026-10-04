const { withMainActivity } = require('expo/config-plugins');
module.exports = config => withMainActivity(config, config => {
  const activity = config.modResults;
  if (activity.language !== 'kt') throw new Error('Autofill configuration expects the Kotlin Expo activity');
  if (!activity.contents.includes('IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS')) {
    const anchor = 'super.onCreate(null)';
    if (!activity.contents.includes(anchor)) throw new Error('Could not configure Android autofill');
    activity.contents = activity.contents.replace(anchor, anchor + `
    // Do not expose saved-account suggestions on unrelated music screens.
    if (android.os.Build.VERSION.SDK_INT >= 26) {
      window.decorView.importantForAutofill = android.view.View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS
      getSystemService(android.view.autofill.AutofillManager::class.java)?.cancel()
    }`);
  }
  return config;
});
