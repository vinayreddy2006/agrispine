/**
 * Safe navigation after completing a form action or deleting an item.
 * Prevents stale form screens from remaining in the React Navigation stack history.
 *
 * @param {object} navigation - React Navigation prop
 * @param {string} targetScreen - Target screen route name to land on (e.g., 'Crops', 'MyFleet', 'Community')
 * @param {string} [fallbackRoute='MainTabs'] - Fallback route if stack cannot be inspected
 */
export const navigateAfterComplete = (navigation, targetScreen, fallbackRoute = 'MainTabs') => {
  try {
    const state = navigation.getState();
    const routes = state?.routes || [];

    // 1. If targetScreen or parent is the previous screen in the stack, pop directly to it
    if (routes.length >= 2) {
      const prevRoute = routes[routes.length - 2]?.name;
      if (
        prevRoute === targetScreen ||
        prevRoute === 'MainTabs' ||
        (targetScreen === 'Community' && (prevRoute === 'Community' || prevRoute === 'MainTabs')) ||
        (targetScreen === 'Crops' && (prevRoute === 'Crops' || prevRoute === 'MainTabs'))
      ) {
        navigation.goBack();
        return;
      }
    }

    // 2. If targetScreen exists earlier in the stack history, pop the exact number of screens
    const existingIndex = routes.findIndex((r) => r.name === targetScreen);
    if (existingIndex !== -1) {
      const countToPop = routes.length - 1 - existingIndex;
      if (countToPop > 0 && typeof navigation.pop === 'function') {
        navigation.pop(countToPop);
        return;
      }
    }

    // 3. If standard back navigation is possible, cleanly pop the completed screen
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    // 4. Otherwise, replace current form screen with targetScreen so it is never revisited via hardware back
    if (typeof navigation.replace === 'function') {
      navigation.replace(targetScreen || fallbackRoute);
    } else {
      navigation.navigate(targetScreen || fallbackRoute);
    }
  } catch (err) {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(fallbackRoute);
    }
  }
};

export default navigateAfterComplete;
